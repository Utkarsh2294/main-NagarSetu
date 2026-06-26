// SLA timers per category (§8.3).
// Each category gets a target resolution window; breaches turn the SLA badge red
// and surface publicly / escalate to super_admin.

export const SLA_HOURS_BY_CATEGORY = {
  "Roads & Potholes": 72,
  "Garbage & Sanitation": 48,
  "Street Lights": 96,
  "Sewage & Water Leak": 60,
  "Invalid / Non-civic": 72
};

const DEFAULT_SLA_HOURS = 72;

export function slaHoursFor(category) {
  return SLA_HOURS_BY_CATEGORY[category] || DEFAULT_SLA_HOURS;
}

export function computeSlaDeadline(assignedAt, category) {
  const hours = slaHoursFor(category);
  return Number(assignedAt) + hours * 60 * 60 * 1000;
}

// { state: "ok" | "warning" | "breached", remainingMs, overdueMs, percent }
export function evaluateSla(issue, now = Date.now()) {
  if (!issue?.slaDeadline || !issue?.assignedAt) {
    return { state: "none", remainingMs: null, overdueMs: 0, percent: null };
  }
  const total = issue.slaDeadline - issue.assignedAt;
  if (now >= issue.slaDeadline) {
    return {
      state: "breached",
      remainingMs: 0,
      overdueMs: now - issue.slaDeadline,
      percent: total > 0 ? 100 : null
    };
  }
  const remaining = issue.slaDeadline - now;
  const percent = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  // Amber when under 20% of the window remains.
  const state = percent >= 80 ? "warning" : "ok";
  return { state, remainingMs: remaining, overdueMs: 0, percent };
}

export function formatHours(ms) {
  if (ms == null) return "—";
  const absMs = Math.abs(ms);
  const hours = absMs / (60 * 60 * 1000);
  if (hours < 1) return `${Math.round(absMs / 60000)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
