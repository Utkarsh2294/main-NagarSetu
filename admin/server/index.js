// Admin module entry point. Mounts all /api/admin routes onto the host app
// and exposes the public read-only audit trail (§8.5) at /api/issues/:id/audit.
//
// Keeps every admin concern in one folder so the citizen-facing server.js stays
// the source of truth and is touched only minimally.

import { Router } from "express";
import authRoutes from "./routes/auth.routes.js";
import issuesRoutes from "./routes/issues.routes.js";
import workersRoutes from "./routes/workers.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import { getIssueAuditTrail } from "./services/auditChain.js";

export function configureMediaClassifier(deps) {
  import("./services/classifyMedia.js")
    .then(({ configureMediaClassifier }) => configureMediaClassifier(deps))
    .catch(err => console.error("[admin] Failed to configure media classifier:", err.message));
}

// Public read-only audit trail — NO admin auth (§8.5 transparency feature).
function publicAuditRoute() {
  const router = Router();
  router.get("/api/issues/:id/audit", async (req, res) => {
    try {
      const { entries, verified } = await getIssueAuditTrail(req.params.id);
      res.json({ issueId: req.params.id, verified, entries });
    } catch (err) {
      res.status(500).json({ error: "Failed to load audit trail." });
    }
  });
  return router;
}

export function mountAdmin(app) {
  const admin = Router();
  admin.use("/login", authRoutes);
  admin.use("/", issuesRoutes);   // /issues, /issues/:id, /issues/:id/status ...
  admin.use("/", workersRoutes);  // /workers, /workers/suggest, /workers/leaderboard
  admin.use("/", analyticsRoutes); // /analytics
  admin.use("/", auditRoutes);    // /issues/:id/audit (admin-scoped)
  app.use("/api/admin", admin);

  // Public, unauthenticated tamper-evident trail.
  app.use(publicAuditRoute());

  console.log("[admin] mounted /api/admin routes + public audit trail");
}
