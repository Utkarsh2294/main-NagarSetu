import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { adminApi } from "../api";

const ACTION_LABELS = {
  status_change: "Status",
  assign: "Assigned",
  complete: "Completed",
  complete_rejected: "Proof Rejected",
  fake_flag: "Flagged Fake"
};

// Read-only view of the hash-chained AuditLog per issue (§8.5).
export default function AuditTrailView({ issueId }) {
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await adminApi.audit(issueId);
        if (alive) setTrail(data);
      } catch { /* ignore */ } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [issueId]);

  if (loading) return <div className="py-4 flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading audit trail…</div>;

  if (!trail || trail.entries.length === 0) {
    return <div className="py-4 text-sm text-slate-500">No actions recorded yet.</div>;
  }

  return <div>
    <div className={`flex items-center gap-2 mb-3 text-sm font-semibold ${trail.verified ? "text-emerald-400" : "text-rose-400"}`}>
      {trail.verified ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
      {trail.verified ? "Chain verified — tamper-evident" : "Chain broken — investigate"}
    </div>
    <ol className="relative border-l border-slate-700 ml-2 space-y-4">
      {trail.entries.map((e) => (
        <li key={e.id} className="ml-4">
          <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -left-[5px] mt-1.5" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-200">{ACTION_LABELS[e.action] || e.action}</span>
            {e.fromValue && e.toValue && (
              <span className="text-xs text-slate-400 font-mono">{e.fromValue} → {e.toValue}</span>
            )}
            <span className="text-[10px] text-slate-500">{new Date(e.timestamp).toLocaleString()}</span>
          </div>
          {e.meta && Object.keys(e.meta).length > 0 && (
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono break-all">
              {Object.entries(e.meta).slice(0, 2).map(([k, v]) => (
                <div key={k}>{k}: {String(v).slice(0, 80)}</div>
              ))}
            </div>
          )}
          <div className="text-[9px] text-slate-600 font-mono mt-0.5">hash: {e.hash?.slice(0, 16)}…</div>
        </li>
      ))}
    </ol>
  </div>;
}
