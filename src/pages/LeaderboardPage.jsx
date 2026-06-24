import { useState, useEffect } from "react";
import { Award, Shield, User } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
export default function LeaderboardPage({ currentUserId }) {
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setLeaders(data);
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);
  return <div className="pt-32 pb-20 min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {
    /* Banner */
  }
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-10 border border-indigo-900/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
            <Award className="w-64 h-64 text-indigo-400" />
          </div>
          
          <div className="relative z-10 space-y-4 max-w-2xl text-center md:text-left mb-6 md:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3 h-3" /> Gamification
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-display">
              {t("leaderboard.title")}
            </h1>
            <p className="text-slate-300">
              {t("leaderboard.subtitle")}
            </p>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 gap-3 w-full md:w-auto">
            <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-6 shadow-inner">
              <span className="text-sm font-medium text-slate-300">Reporting</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{t("leaderboard.points_report")}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-6 shadow-inner">
              <span className="text-sm font-medium text-slate-300">Verification</span>
              <span className="text-indigo-400 font-bold font-mono text-sm">{t("leaderboard.points_verify")}</span>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 flex items-center justify-between gap-6 shadow-inner">
              <span className="text-sm font-medium text-slate-300">Resolution Audit</span>
              <span className="text-amber-400 font-bold font-mono text-sm">{t("leaderboard.points_audit")}</span>
            </div>
          </div>
        </div>

        {
    /* Leaderboard Table */
  }
        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                  <th className="p-5 w-20 text-center">#</th>
                  <th className="p-5">{t("leaderboard.rank")}</th>
                  <th className="p-5">{t("leaderboard.ward")}</th>
                  <th className="p-5 text-right">{t("leaderboard.score")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400">
                      <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                      <p>{t("common.loading")}</p>
                    </td>
                  </tr> : leaders.map((user, idx) => {
    const isCurrentUser = user.id === currentUserId;
    let badgeColor = "bg-slate-700 text-slate-300 border-slate-600";
    if (user.badgeTier === "gold") badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
    else if (user.badgeTier === "silver") badgeColor = "bg-slate-300/20 text-slate-200 border-slate-400/40";
    else if (user.badgeTier === "bronze") badgeColor = "bg-orange-900/30 text-orange-300 border-orange-800/50";
    return <tr
      key={user.id}
      className={`group transition-colors ${isCurrentUser ? "bg-indigo-900/30 relative" : "hover:bg-slate-800/40"}`}
    >
                        <td className="p-5 text-center">
                          {idx === 0 ? <span className="text-2xl">🥇</span> : idx === 1 ? <span className="text-2xl">🥈</span> : idx === 2 ? <span className="text-2xl">🥉</span> : <span className="text-slate-500 font-mono font-bold text-lg">{idx + 1}</span>}
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            {user.picture ? <img src={user.picture} alt="" className="w-10 h-10 rounded-full border border-slate-700 shadow-md" /> : <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                <User className="w-5 h-5" />
                              </div>}
                            <div>
                              <div className="font-bold text-slate-200 flex items-center gap-2 text-base">
                                {user.name || `Citizen ${user.id.substring(0, 5)}`}
                                {isCurrentUser && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{t("leaderboard.you")}</span>}
                              </div>
                              <div className={`text-[10px] uppercase font-bold tracking-widest inline-flex items-center px-2 py-0.5 mt-1 rounded-md border ${badgeColor}`}>
                                {user.badgeTier} Shield
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-slate-400 text-sm font-medium">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 opacity-50" />
                            {user.ward}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <span className="text-xl font-bold font-mono text-indigo-400 drop-shadow-md">
                            {user.points.toLocaleString()}
                          </span>
                        </td>
                      </tr>;
  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>;
}
