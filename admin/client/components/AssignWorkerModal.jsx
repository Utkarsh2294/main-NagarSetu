import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { adminApi } from "../api";

// Dropdown of available workers matching the issue's category, with current load
// per worker + an AI-suggested pre-selection (§6, §8.2).
export default function AssignWorkerModal({ issue, onClose, onAssigned }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await adminApi.suggestWorker(issue.id);
        if (!alive) return;
        setRanking(data.ranked || []);
        setSelected(data.suggested?.id || null);
      } catch (e) {
        setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [issue.id]);

  const assign = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.assign(issue.id, selected);
      onAssigned();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div className="glass-panel rounded-3xl max-w-lg w-full p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        <h3 className="text-xl font-bold text-white">Assign Worker</h3>
      </div>
      <p className="text-sm text-slate-400 mb-5">
        {issue.category} · AI ranks candidates by match, load, and resolution speed.
      </p>

      {loading ? (
        <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Scoring workers…</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          No workers available in this ward. Add one in Worker Management.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {ranking.map(({ worker, matches, score, currentLoad }, idx) => {
            const active = selected === worker.id;
            return (
              <button
                key={worker.id}
                onClick={() => setSelected(worker.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  active ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500" : "bg-slate-800/40 border-slate-700 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300"
                  }`}>
                    {idx === 0 ? "★" : idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      {worker.name}
                      {matches && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">MATCH</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {worker.specialization} · {worker.completedCount || 0} done
                      {worker.avgResolutionHours ? ` · ~${worker.avgResolutionHours}h avg` : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    worker.status === "available" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                  }`}>
                    {worker.status === "on_job" ? `${currentLoad} active` : worker.status}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-colors">
          Cancel
        </button>
        <button
          onClick={assign}
          disabled={!selected || submitting}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Assign
        </button>
      </div>
    </div>
  </div>;
}
