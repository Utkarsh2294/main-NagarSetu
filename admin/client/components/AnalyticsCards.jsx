import { Inbox, CheckCircle2, Flag, Clock, AlertTriangle, Users } from "lucide-react";

const fmtHours = (h) => {
  if (!h) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${(h / 24).toFixed(1)}d`;
};

// Ward-scoped analytics cards (§4): open, resolved, fake rate, avg resolution, SLA breaches.
export default function AnalyticsCards({ analytics }) {
  const cards = [
    { label: "Open Issues", value: analytics?.open ?? "—", icon: Inbox, color: "text-indigo-400", ring: "ring-indigo-500/20" },
    { label: "Resolved", value: analytics?.resolved ?? "—", icon: CheckCircle2, color: "text-emerald-400", ring: "ring-emerald-500/20" },
    { label: "Fake-Flag Rate", value: analytics ? `${analytics.fakeFlagRate}%` : "—", icon: Flag, color: "text-rose-400", ring: "ring-rose-500/20" },
    { label: "Avg Resolution", value: analytics ? fmtHours(analytics.avgResolutionHours) : "—", icon: Clock, color: "text-amber-400", ring: "ring-amber-500/20" },
    { label: "SLA Breaches", value: analytics?.slaBreaches ?? "—", icon: AlertTriangle, color: analytics?.slaBreaches ? "text-rose-400" : "text-slate-400", ring: "ring-rose-500/20" },
    { label: "Workers", value: analytics?.workerCount ?? "—", icon: Users, color: "text-purple-400", ring: "ring-purple-500/20" }
  ];

  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {cards.map((c) => (
      <div key={c.label} className={`glass-panel rounded-2xl p-5 ring-1 ${c.ring}`}>
        <c.icon className={`h-6 w-6 ${c.color} mb-2`} />
        <div className="text-2xl font-bold text-white font-mono">{c.value}</div>
        <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">{c.label}</div>
      </div>
    ))}
  </div>;
}
