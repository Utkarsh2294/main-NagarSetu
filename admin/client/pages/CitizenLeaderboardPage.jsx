import { useState, useEffect } from "react";
import { Trophy, Star, ShieldCheck } from "lucide-react";

export default function CitizenLeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          // Adding rank manually
          const ranked = data.map((citizen, idx) => ({ ...citizen, rank: idx + 1 }));
          setLeaders(ranked);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return <div className="container mx-auto px-6 max-w-5xl py-8">
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-10 border border-indigo-900/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
        <Star className="w-64 h-64 text-indigo-400" />
      </div>
      <div className="relative z-10 space-y-4 max-w-2xl text-center md:text-left mb-6 md:mb-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3 w-3" /> Citizens
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white font-display">Citizen Leaderboard</h1>
        <p className="text-slate-300">Top citizens actively reporting and verifying issues in their ward.</p>
      </div>
      <div className="relative z-10 grid grid-cols-1 gap-3 w-full md:w-auto">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-6 shadow-inner">
          <span className="text-sm font-medium text-slate-300">Engagement</span>
          <span className="text-emerald-400 font-bold font-mono text-sm">Points earned</span>
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <th className="p-5 w-20 text-center">#</th>
              <th className="p-5">Citizen</th>
              <th className="p-5">Ward</th>
              <th className="p-5 text-right">Points</th>
              <th className="p-5 text-center">Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-400">
                <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                <p>Loading…</p>
              </td></tr>
            ) : leaders.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-slate-400">No citizens yet.</td></tr>
            ) : leaders.map((citizen) => (
              <tr key={citizen.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-5 text-center">
                  {citizen.rank === 1 ? <span className="text-2xl">🥇</span> : citizen.rank === 2 ? <span className="text-2xl">🥈</span> : citizen.rank === 3 ? <span className="text-2xl">🥉</span> : <span className="text-slate-500 font-mono font-bold text-lg">{citizen.rank}</span>}
                </td>
                <td className="p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {citizen.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-bold text-slate-200">{citizen.name}</div>
                </td>
                <td className="p-5 text-sm text-slate-300">{citizen.ward || "Unknown Ward"}</td>
                <td className="p-5 text-right">
                  <span className="text-xl font-bold font-mono text-indigo-400">{citizen.points || 0}</span>
                </td>
                <td className="p-5 text-center">
                  <div className="flex items-center justify-center">
                    <ShieldCheck className={`h-6 w-6 ${
                      citizen.badgeTier === 'gold' ? 'text-yellow-400' :
                      citizen.badgeTier === 'silver' ? 'text-slate-300' :
                      'text-amber-600'
                    }`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
