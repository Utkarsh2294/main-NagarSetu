import { Router } from "express";
import { Issue, Report, Verification } from "../../../models.js";
import { Worker } from "../models.js";
import { requireAdmin } from "../auth.js";
import { evaluateSla } from "../services/sla.js";

const router = Router();

function wardQuery(admin) {
  return {};
}

// GET /analytics — ward-scoped: open count, avg resolution, fake-flag rate, SLA breaches (§4)
router.get("/analytics", requireAdmin, async (req, res) => {
  try {
    const filter = wardQuery(req.admin);
    const issues = await Issue.find(filter).lean();
    const now = Date.now();

    const total = issues.length;
    const open = issues.filter((i) => !["resolved", "fake_hidden"].includes(i.status)).length;
    const resolved = issues.filter((i) => i.status === "resolved");
    const faked = issues.filter((i) => i.adminStatus === "fake").length;
    const inProgress = issues.filter((i) => ["assigned", "in_progress"].includes(i.adminStatus)).length;

    const resolutionTimes = resolved
      .filter((i) => i.completedAt && i.assignedAt)
      .map((i) => (i.completedAt - i.assignedAt) / (60 * 60 * 1000));
    const avgResolutionHours = resolutionTimes.length
      ? Number((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(2))
      : 0;

    const slaBreaches = issues.filter((i) => i.slaDeadline && evaluateSla(i, now).state === "breached").length;
    const fakeFlagRate = total ? Number(((faked / total) * 100).toFixed(1)) : 0;

    // Breakdown by category.
    const byCategory = {};
    for (const i of issues) {
      const key = i.category || "Unknown";
      if (!byCategory[key]) byCategory[key] = { total: 0, open: 0, resolved: 0 };
      byCategory[key].total += 1;
      if (["assigned", "in_progress", "pending_review"].includes(i.adminStatus)) byCategory[key].open += 1;
      if (i.status === "resolved") byCategory[key].resolved += 1;
    }

    const workerCount = await Worker.countDocuments(wardQuery(req.admin));

    res.json({
      ward: "All Wards",
      total,
      open,
      inProgress,
      resolved: resolved.length,
      faked,
      fakeFlagRate,
      avgResolutionHours,
      slaBreaches,
      workerCount,
      byCategory: Object.entries(byCategory).map(([category, c]) => ({ category, ...c }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

export default router;
