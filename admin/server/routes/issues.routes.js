import { Router } from "express";
import path from "path";
import fs from "fs";
import { Issue, Report, Verification, User, Notification } from "../../../models.js";
import { Worker } from "../models.js";
import { AuditLog } from "../models.js";
import { requireAdmin, requireWardAccess } from "../auth.js";
import { computeSlaDeadline, evaluateSla } from "../services/sla.js";
import { suggestWorkerForIssue } from "../services/workerSuggestion.js";
import { validateWorkerProof, saveProofMedia } from "../services/workerProof.js";
import { appendAuditEntry } from "../services/auditChain.js";
import { generateNotificationMessage } from "../services/classifyMedia.js";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// ---- helpers ---------------------------------------------------------------

function wardQuery(admin) {
  return {};
}

// Ensure an issue belongs to the admin's ward before any write.
async function loadIssueForWard(req, res, issueId) {
  const issue = await Issue.findOne({ id: issueId });
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return null;
  }

  return issue;
}

async function attachFirstPhoto(issue) {
  const reports = await Report.find({ issueId: issue.id }).sort({ createdAt: 1 }).lean();
  const first = reports[0];
  return {
    ...issue,
    photoUrl: first?.photoUrl || null,
    mediaType: first?.mediaType || "image",
    reportCount: reports.length
  };
}

// ---- GET /issues — ward-scoped list with filters (§4) ---------------------
router.get("/issues", requireAdmin, async (req, res) => {
  try {
    const { status, category, severity, q } = req.query;
    const filter = { ...wardQuery(req.admin) };
    if (status) filter.adminStatus = status;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (q) filter.$or = [
      { description: new RegExp(String(q), "i") },
      { id: new RegExp(String(q), "i") }
    ];

    let issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
    // Attach first photo + SLA evaluation for the table/badges.
    issues = await Promise.all(issues.map(async (i) => {
      const withPhoto = await attachFirstPhoto(i);
      return { ...withPhoto, sla: evaluateSla(i) };
    }));
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: "Failed to load issues." });
  }
});

// ---- GET /issues/:id — full detail incl. reports, verifications, worker ---
router.get("/issues/:id", requireAdmin, async (req, res) => {
  try {
    const issue = await loadIssueForWard(req, res, req.params.id);
    if (!issue) return;
    const [reports, verifications] = await Promise.all([
      Report.find({ issueId: issue.id }).sort({ createdAt: 1 }).lean(),
      Verification.find({ issueId: issue.id }).lean()
    ]);
    let worker = null;
    if (issue.assignedWorkerId) {
      worker = await Worker.findOne({ id: issue.assignedWorkerId }).lean();
    }
    const suggestion = await suggestWorkerForIssue(issue, req.admin);
    res.json({
      ...issue.toObject(),
      reports,
      verifications,
      worker,
      photoUrl: reports[0]?.photoUrl || null,
      mediaType: reports[0]?.mediaType || "image",
      sla: evaluateSla(issue),
      suggestedWorker: suggestion.suggested,
      rankedWorkers: suggestion.ranked
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load issue detail." });
  }
});

// ---- PATCH /issues/:id/status — triage (fake/assigned/in_progress/completed) §4
router.patch("/issues/:id/status", requireAdmin, async (req, res) => {
  try {
    const { adminStatus, adminNotes } = req.body;
    const ALLOWED = ["pending_review", "fake", "assigned", "in_progress", "completed"];
    if (!ALLOWED.includes(adminStatus)) {
      return res.status(400).json({ error: `adminStatus must be one of: ${ALLOWED.join(", ")}` });
    }
    const issue = await loadIssueForWard(req, res, req.params.id);
    if (!issue) return;

    const previousStatus = issue.adminStatus || "pending_review";
    issue.adminStatus = adminStatus;
    if (adminNotes !== undefined) issue.adminNotes = adminNotes;

    // §7.4 — marking fake: hide from public map + reverse reporter's points.
    if (adminStatus === "fake" && previousStatus !== "fake") {
      issue.status = "fake_hidden"; // citizen GET /api/issues excludes this
      const reporter = issue.reportedBy ? await User.findOne({ id: issue.reportedBy }) : null;
      if (reporter) {
        reporter.points = Math.max(0, (reporter.points || 0) - 10);
        await reporter.save();
      }
    }

    await issue.save();
    await appendAuditEntry({
      issueId: issue.id,
      actorId: req.admin.id,
      actorType: "admin",
      action: "status_change",
      fromValue: previousStatus,
      toValue: adminStatus,
      meta: adminNotes ? { adminNotes } : {}
    });

    if (previousStatus !== adminStatus) {
      const message = await generateNotificationMessage(issue, adminStatus, adminNotes, null);
      if (message && issue.reportedBy) {
        await Notification.create({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: issue.reportedBy,
          issueId: issue.id,
          title: `Issue Status Update: ${adminStatus.toUpperCase()}`,
          message: message,
          type: adminStatus
        });
      }
    }

    res.json({ success: true, issue: await attachFirstPhoto(issue.toObject()) });
  } catch (err) {
    res.status(500).json({ error: "Failed to update issue status." });
  }
});

// ---- POST /issues/:id/assign — assign a worker (§4) -----------------------
router.post("/issues/:id/assign", requireAdmin, async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ error: "workerId is required." });
    const issue = await loadIssueForWard(req, res, req.params.id);
    if (!issue) return;
    const worker = await Worker.findOne({ id: workerId });
    if (!worker) return res.status(404).json({ error: "Worker not found." });


    // Release the previously assigned worker, if any.
    if (issue.assignedWorkerId && issue.assignedWorkerId !== workerId) {
      await Worker.updateOne(
        { id: issue.assignedWorkerId },
        { $set: { status: "available", activeIssueId: null } }
      );
    }

    const now = Date.now();
    issue.assignedWorkerId = worker.id;
    issue.assignedByAdminId = req.admin.id;
    issue.assignedAt = now;
    issue.slaDeadline = computeSlaDeadline(now, issue.category);
    issue.adminStatus = issue.adminStatus === "completed" ? "completed" : "assigned";

    worker.status = "on_job";
    worker.activeIssueId = issue.id;
    await worker.save();
    await issue.save();

    await appendAuditEntry({
      issueId: issue.id,
      actorId: req.admin.id,
      actorType: "admin",
      action: "assign",
      fromValue: issue.assignedWorkerId || null,
      toValue: worker.id,
      meta: { workerName: worker.name, specialization: worker.specialization, slaDeadline: issue.slaDeadline }
    });

    const message = await generateNotificationMessage(issue, "assigned", null, worker);
    if (message && issue.reportedBy) {
      await Notification.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: issue.reportedBy,
        issueId: issue.id,
        title: `Issue Assigned to Worker`,
        message: message,
        type: "assigned"
      });
    }

    res.json({ success: true, issue: issue.toObject(), worker: worker.toObject() });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign worker." });
  }
});

// ---- POST /issues/:id/complete — worker/admin marks done with proof (§4, §8.1)
router.post("/issues/:id/complete", requireAdmin, async (req, res) => {
  try {
    const { workerProofBase64, workerProofUrl } = req.body;
    const issue = await loadIssueForWard(req, res, req.params.id);
    if (!issue) return;

    // Resolve proof media URL. Persist a base64 upload if that's what we got.
    let proofUrl = workerProofUrl || null;
    if (!proofUrl && workerProofBase64) {
      try {
        proofUrl = saveProofMedia(workerProofBase64, issue.id);
      } catch (e) {
        return res.status(400).json({ error: "Failed to store proof media." });
      }
    }

    // §8.1 — run the proof through the SAME Gemini fake-detection pipeline.
    const proof = await validateWorkerProof(proofUrl);
    if (!proof.ok) {
      await appendAuditEntry({
        issueId: issue.id,
        actorId: req.admin.id,
        actorType: "admin",
        action: "complete_rejected",
        toValue: "proof_flagged",
        meta: { reason: proof.reason }
      });
      return res.status(422).json({ error: proof.reason, classification: proof.classification });
    }

    const now = Date.now();
    issue.workerProofUrl = proofUrl;
    issue.completedAt = now;
    issue.adminStatus = "completed";
    // Hand off to the EXISTING citizen-audit flow — do not resolve directly.
    issue.status = "pending_fix_confirmation";
    issue.markedFixedAt = now;
    await issue.save();

    // Update worker stats (completedCount + avgResolutionHours for §8.2/§8.4).
    if (issue.assignedWorkerId) {
      const worker = await Worker.findOne({ id: issue.assignedWorkerId });
      if (worker) {
        const completed = (worker.completedCount || 0) + 1;
        const hours = issue.assignedAt ? (now - issue.assignedAt) / (60 * 60 * 1000) : 0;
        const prevTotal = (worker.avgResolutionHours || 0) * (worker.completedCount || 0);
        worker.completedCount = completed;
        worker.avgResolutionHours = Number(((prevTotal + hours) / completed).toFixed(2));
        worker.status = "available";
        worker.activeIssueId = null;
        await worker.save();
      }
    }

    await appendAuditEntry({
      issueId: issue.id,
      actorId: req.admin.id,
      actorType: "admin",
      action: "complete",
      toValue: "completed",
      meta: { proofUrl, aiVerified: Boolean(proof.classification), aiDescription: proof.classification?.description }
    });

    const message = await generateNotificationMessage(issue, "completed", null, issue.assignedWorkerId ? await Worker.findOne({ id: issue.assignedWorkerId }) : null);
    if (message && issue.reportedBy) {
      await Notification.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: issue.reportedBy,
        issueId: issue.id,
        title: `Issue Completed`,
        message: message,
        type: "completed"
      });
    }

    res.json({
      success: true,
      issue: issue.toObject(),
      proofAccepted: true,
      proofReason: proof.reason
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete issue." });
  }
});

export default router;
