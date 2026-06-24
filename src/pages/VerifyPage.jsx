import { useState, useEffect } from "react";
import { MapPin, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
export default function VerifyPage({ currentUser }) {
  const { t } = useLanguage();
  const [issues, setIssues] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error(err);
          setUserCoords({ lat: 12.9716, lng: 77.5946 });
        }
      );
    } else {
      setUserCoords({ lat: 12.9716, lng: 77.5946 });
    }
  }, []);
  const fetchIssues = async () => {
    if (!userCoords) return;
    try {
      const res = await fetch("/api/issues");
      const data = await res.json();
      const verifiable = data.filter((i) => i.status === "reported" || i.status === "pending_fix_confirmation");
      const mapped = verifiable.map((i) => {
        return {
          ...i,
          distance: getDistance(userCoords.lat, userCoords.lng, i.lat, i.lng)
        };
      }).sort((a, b) => a.distance - b.distance);
      setIssues(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (userCoords) {
      fetchIssues();
    }
  }, [userCoords]);
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const handleVerify = async (issueId, type) => {
    if (!currentUser) {
      alert("Please sign in to verify issues and earn points.");
      return;
    }
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, issueId, type })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Verification successful! You earned +${data.pointsAwarded} Pts.`);
        fetchIssues();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit verification.");
    }
  };
  return <div className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-8 w-8 text-indigo-400" />
        <h1 className="text-3xl font-display font-bold text-white">Audit & Verify Nearby Issues</h1>
      </div>
      
      <p className="text-slate-400 mb-8 max-w-2xl">
        Visit these nearby civic issues in person to verify if they still exist or have been fixed. 
        You must be within <strong className="text-white">500 meters</strong> of the location to cast your vote. Accurate verifications reward you with leaderboard points!
      </p>

      {isLoading ? <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div> : issues.length === 0 ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No verifications needed!</h3>
          <p className="text-slate-400">There are currently no reported issues near you that require citizen verification.</p>
        </div> : <div className="grid gap-6">
          {issues.map((issue) => {
    const isNear = issue.distance <= 500;
    return <div key={issue.id} onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start shadow-xl shadow-black/20 hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {issue.category}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${issue.status === "pending_fix_confirmation" ? "bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}>
                      {issue.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  
                  <p className="text-slate-200 leading-relaxed mb-4">"{issue.description}"</p>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                      <MapPin className={`h-4 w-4 ${isNear ? "text-emerald-400" : "text-rose-400"}`} />
                      <span className={isNear ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {Math.round(issue.distance)} meters away
                      </span>
                    </div>
                  </div>
                  
                  {expandedId === issue.id && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <h4 className="text-sm font-bold text-indigo-400 mb-3 uppercase tracking-wide">Detailed Report</h4>
                      {issue.photoUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-slate-700 max-w-sm">
                          {issue.photoUrl.match(/\.(mp4|webm|mov|3gp)$/i) ? (
                            <video src={issue.photoUrl} controls className="w-full h-auto object-cover" />
                          ) : (
                            <img src={issue.photoUrl} alt="Reported issue" className="w-full h-auto object-cover" />
                          )}
                        </div>
                      )}
                      <div className="space-y-3 text-sm">
                        {issue.userDescription && (
                          <div><strong className="text-slate-300">User Details:</strong> <span className="text-slate-400">{issue.userDescription}</span></div>
                        )}
                        <div><strong className="text-slate-300">AI Assessment:</strong> <span className="text-slate-400">{issue.description}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 shrink-0 md:min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs text-center text-slate-500 uppercase font-bold tracking-wider mb-1">
                    {isNear ? "Available Actions" : "Too Far to Verify"}
                  </div>
                  
                  {issue.status === "reported" && (
                    <div className="flex flex-col gap-3 w-full">
                      <button
                        onClick={() => handleVerify(issue.id, "vote_real")}
                        disabled={!isNear || !currentUser}
                        className="relative overflow-hidden w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white py-3 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 border border-emerald-400/20 group"
                      >
                        <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        Confirm It's Real (+5 Pts)
                      </button>
                      <button
                        onClick={() => handleVerify(issue.id, "vote_fake")}
                        disabled={!isNear || !currentUser}
                        className="relative overflow-hidden w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white py-3 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(225,29,72,0.2)] hover:shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 border border-rose-400/20 group"
                      >
                        <AlertTriangle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        Flag as Fake (+5 Pts)
                      </button>
                    </div>
                  )}

                  {issue.status === "pending_fix_confirmation" && <>
                      <button
      onClick={() => handleVerify(issue.id, "confirm_fixed")}
      disabled={!isNear || !currentUser}
      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-transparent"
    >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Fixed (+15 Pts)
                      </button>
                      <button
      onClick={() => handleVerify(issue.id, "still_broken")}
      disabled={!isNear || !currentUser}
      className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 text-white py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-transparent"
    >
                        <AlertTriangle className="h-4 w-4" />
                        Still Broken (+5 Pts)
                      </button>
                    </>}
                </div>
              </div>;
  })}
        </div>}
    </div>;
}
