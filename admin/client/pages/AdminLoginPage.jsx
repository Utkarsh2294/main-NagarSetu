import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2, LogIn, ArrowLeft } from "lucide-react";
import { adminApi, setAdminSession, getStoredAdmin } from "../api";

// Username/password form -> /api/admin/login -> store JWT -> redirect to dashboard (§6).
export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getStoredAdmin()) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, admin } = await adminApi.login(username, password);
      setAdminSession(token, admin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative">
    <div className="absolute top-6 left-6">
      <a href="/" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white bg-slate-900/80 backdrop-blur border border-slate-800 px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20">
        <ArrowLeft className="h-4 w-4" />
        Back to citizen portal
      </a>
    </div>
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-600/30">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
        <p className="text-slate-400 mt-2 text-sm">NagarSetu Civic Command Center — ward-level triage & worker assignment.</p>
      </div>

      <form onSubmit={submit} className="glass-panel rounded-3xl p-8 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
            placeholder="Enter username"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{error}</div>}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Sign In
        </button>

        <div className="text-[11px] text-slate-500 text-center pt-2 border-t border-slate-800">
          ✨ <span className="text-slate-400 font-medium">Quick Demo Access</span> — Username: <span className="font-mono text-indigo-400">superadmin</span> / Password: <span className="font-mono text-indigo-400">admin@1234</span>
        </div>
      </form>

    </div>
  </div>;
}
