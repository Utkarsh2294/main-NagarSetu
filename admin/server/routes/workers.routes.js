import { Router } from "express";
import { Worker, AuditLog } from "../models.js";
import { Issue } from "../../../models.js";
import { requireAdmin, requireSuperAdmin } from "../auth.js";
import { suggestWorkerForIssue } from "../services/workerSuggestion.js";

const router = Router();

function wardQuery(admin) {
  return {};
}

// GET /workers — workers in ward with availability + current load (§4)
router.get("/workers", requireAdmin, async (req, res) => {
  try {
    const workers = await Worker.find(wardQuery(req.admin)).sort({ createdAt: 1 }).lean();
    // Attach current-load counts per worker.
    const withLoad = await Promise.all(workers.map(async (w) => {
      const activeCount = await Issue.countDocuments({
        assignedWorkerId: w.id,
        adminStatus: { $in: ["assigned", "in_progress"] }
      });
      return { ...w, currentLoad: activeCount };
    }));
    res.json(withLoad);
  } catch (err) {
    res.status(500).json({ error: "Failed to load workers." });
  }
});

// POST /workers — super_admin only (§4)
router.post("/workers", requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, phone, specialization, ward } = req.body;
    if (!name || !specialization || !ward) {
      return res.status(400).json({ error: "name, specialization and ward are required." });
    }
    const id = `worker_${Date.now()}`;
    const worker = new Worker({ id, name, phone, specialization, ward, status: "available" });
    await worker.save();
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: "Failed to create worker." });
  }
});

// PATCH /workers/:id — update status/specialization (§4)
router.patch("/workers/:id", requireAdmin, async (req, res) => {
  try {
    const worker = await Worker.findOne({ id: req.params.id });
    if (!worker) return res.status(404).json({ error: "Worker not found." });

    const { status, specialization, phone, name, ward } = req.body;
    if (status !== undefined) worker.status = status;
    if (specialization !== undefined) worker.specialization = specialization;
    if (phone !== undefined) worker.phone = phone;
    if (name !== undefined) worker.name = name;
    if (ward !== undefined) worker.ward = ward;
    await worker.save();
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ error: "Failed to update worker." });
  }
});

// GET /workers/suggest — AI-suggested assignment for an issue (§8.2)
router.get("/workers/suggest", requireAdmin, async (req, res) => {
  try {
    const { issueId } = req.query;
    if (!issueId) return res.status(400).json({ error: "issueId is required." });
    const issue = await Issue.findOne({ id: issueId });
    if (!issue) return res.status(404).json({ error: "Issue not found." });

    const result = await suggestWorkerForIssue(issue, req.admin);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to suggest worker." });
  }
});

// GET /workers/leaderboard — fastest resolution + approval rate (§8.4)
router.get("/workers/leaderboard", requireAdmin, async (req, res) => {
  try {
    const workers = await Worker.find(wardQuery(req.admin))
      .sort({ completedCount: -1, avgResolutionHours: 1 })
      .limit(20)
      .lean();
    res.json(workers.map((w, idx) => ({ rank: idx + 1, ...w })));
  } catch (err) {
    res.status(500).json({ error: "Failed to load worker leaderboard." });
  }
});

export default router;
