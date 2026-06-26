import { Flag, UserCheck, Loader, CheckCircle2, Eye } from "lucide-react";

const OPTIONS = [
  { value: "pending_review", label: "Pending", icon: Eye, classes: "bg-slate-700 text-slate-200 border-slate-600" },
  { value: "assigned", label: "Assigned", icon: UserCheck, classes: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  { value: "in_progress", label: "In Progress", icon: Loader, classes: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { value: "completed", label: "Completed", icon: CheckCircle2, classes: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { value: "fake", label: "Fake", icon: Flag, classes: "bg-rose-500/20 text-rose-300 border-rose-500/40" }
];

export const STATUS_PILL = (value) => {
  const opt = OPTIONS.find((o) => o.value === value) || OPTIONS[0];
  return opt;
};

// fake/assigned/in_progress/completed selector (§6). Calls onStatus with the new value.
export default function StatusChangeControl({ current, onStatus, disabled }) {
  return <div className="flex flex-wrap gap-2">
    {OPTIONS.filter((o) => o.value !== "pending_review").map((opt) => {
      const active = current === opt.value;
      const Icon = opt.icon;
      return <button
        key={opt.value}
        disabled={disabled || active}
        onClick={() => onStatus(opt.value)}
        className={`text-xs px-3 py-1.5 rounded-full font-bold border inline-flex items-center gap-1.5 transition-all ${
          active ? opt.classes + " opacity-100 ring-2 ring-white/20"
                 : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Icon className="h-3.5 w-3.5" />
        {opt.label}
      </button>;
    })}
  </div>;
}
