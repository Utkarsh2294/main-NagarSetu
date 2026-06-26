import { useState, useEffect } from "react";
import { Trophy, Award, Clock, CheckCircle2 } from "lucide-react";
import { adminApi } from "../api";

// Worker leaderboard — fastest resolution + highest approval (§8.4).
// Mirrors the existing citizen LeaderboardPage.jsx structure almost entirely.
export default function WorkerLeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.workerLeaderboard();
        setLeaders(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return <div className="container mx-auto px-6 max-w-5xl py-8">
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-10 border border-indigo-900/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
        <Award className="w-64 h-64 text-indigo-400" />
      </div>
      <div className="relative z-10 space-y-4 max-w-2xl text-center md:text-left mb-6 md:mb-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3 w-3" /> Workers
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white font-display">Worker Leaderboard</h1>
        <p className="text-slate-300">Fastest resolution times and highest citizen-approval rates on proof photos.</p>
      </div>
      <div className="relative z-10 grid grid-cols-1 gap-3 w-full md:w-auto">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-6 shadow-inner">
          <span className="text-sm font-medium text-slate-300">Speed</span>
          <span className="text-emerald-400 font-bold font-mono text-sm">Avg hours</span>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-6 shadow-inner">
          <span className="text-sm font-medium text-slate-300">Volume</span>
          <span className="text-indigo-400 font-bold font-mono text-sm">Total done</span>
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <th className="p-5 w-20 text-center">#</th>
              <th className="p-5">Worker</th>
              <th className="p-5">Specialization</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Completed</th>
              <th className="p-5 text-right">Avg Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">
                <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                <p>Loading…</p>
              </td></tr>
            ) : leaders.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">No workers yet.</td></tr>
            ) : leaders.map((w) => (
              <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-5 text-center">
                  {w.rank === 1 ? <span className="text-2xl">🥇</span> : w.rank === 2 ? <span className="text-2xl">🥈</span> : w.rank === 3 ? <span className="text-2xl">🥉</span> : <span className="text-slate-500 font-mono font-bold text-lg">{w.rank}</span>}
                </td>
                <td className="p-5">
                  <div className="font-bold text-slate-200">{w.name}</div>
                  <div className="text-[11px] text-slate-500">{w.ward}</div>
                </td>
                <td className="p-5 text-sm text-slate-300">{w.specialization}</td>
                <td className="p-5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    w.status === "available" ? "bg-emerald-500/15 text-emerald-300" : w.status === "on_job" ? "bg-amber-500/15 text-amber-300" : "bg-slate-700/50 text-slate-400"
                  }`}>
                    {w.status}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <span className="text-xl font-bold font-mono text-indigo-400">{w.completedCount || 0}</span>
                </td>
                <td className="p-5 text-right flex items-center justify-end gap-1.5">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="font-mono text-sm text-slate-200">{w.avgResolutionHours || 0}h</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
