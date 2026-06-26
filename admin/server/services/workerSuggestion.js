// AI-suggested assignment (§8.2).
// Score candidate workers by: specialization match + current load + avgResolutionHours,
// then pre-select the top suggestion in AssignWorkerModal.
// Pure function — no external calls, so it's trivially testable.

import { Worker } from "../models.js";

export async function loadCandidateWorkers({ category, ward, role }) {
  return Worker.find({}).lean();
}

// Lower score = better candidate.
function scoreWorker(worker, category) {
  let score = 0;

  // Specialization match dominates.
  const matches = worker.specialization === category;
  if (!matches) score += 1000;

  // Penalize non-available workers heavily (they shouldn't be pre-selected).
  if (worker.status !== "available") score += 500;

  // Penalize current load (active assignments).
  score += worker.status === "on_job" ? 50 : 0;

  // Favor faster historical resolution (avgResolutionHours).
  const avg = Number(worker.avgResolutionHours || 0);
  score += avg; // 0 for fresh workers is fine — they're a reasonable pick

  // Tiny tiebreaker so deterministic ordering stays stable.
  score += (worker.completedCount || 0) * -0.1; // slight preference for experience

  return { score, matches, worker };
}

export function rankWorkers(workers, category) {
  return workers
    .map((w) => ({ ...scoreWorker(w, category), worker: w }))
    .sort((a, b) => a.score - b.score);
}

export async function suggestWorkerForIssue(issue, admin) {
  const workers = await loadCandidateWorkers({});
  const ranked = rankWorkers(workers, issue.category);
  return {
    suggested: ranked.length ? ranked[0].worker : null,
    ranked: ranked.map((r) => ({
      worker: r.worker,
      score: Number(r.score.toFixed(2)),
      matches: r.matches,
      currentLoad: r.worker.status === "on_job" ? 1 : 0
    }))
  };
}
