import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const STATUS_STYLES = {
  ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  breached: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  none: "bg-slate-700/30 text-slate-400 border-slate-600/40"
};

// Green/amber/red chip vs slaDeadline (§8.3).
export default function SLABadge({ sla }) {
  if (!sla || sla.state === "none") {
    return <span className={`text-[10px] px-2 py-1 rounded-full font-bold border inline-flex items-center gap-1 ${STATUS_STYLES.none}`}>
      <Clock className="h-3 w-3" /> No SLA
    </span>;
  }

  const Icon = sla.state === "breached" ? AlertTriangle : Clock;
  let label;
  if (sla.state === "breached") {
    const days = Math.floor(sla.overdueMs / (24 * 60 * 60 * 1000));
    label = days > 0 ? `${days}d overdue` : `${Math.floor(sla.overdueMs / (60 * 60 * 1000))}h overdue`;
  } else {
    const hours = sla.remainingMs / (60 * 60 * 1000);
    label = hours >= 24 ? `${Math.floor(hours / 24)}d left` : `${Math.floor(hours)}h left`;
  }

  return <span className={`text-[10px] px-2 py-1 rounded-full font-bold border inline-flex items-center gap-1 ${STATUS_STYLES[sla.state]}`}>
    <Icon className="h-3 w-3" /> {label}
  </span>;
}
