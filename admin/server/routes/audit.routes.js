import { Router } from "express";
import { getIssueAuditTrail } from "../services/auditChain.js";
import { requireAdmin } from "../auth.js";

const router = Router();

// GET /issues/:id/audit — read-only, tamper-evident trail (§8.5). Admin-scoped.
router.get("/issues/:id/audit", requireAdmin, async (req, res) => {
  try {
    const { entries, verified } = await getIssueAuditTrail(req.params.id);
    res.json({ issueId: req.params.id, verified, entries });
  } catch (err) {
    res.status(500).json({ error: "Failed to load audit trail." });
  }
});

export default router;
