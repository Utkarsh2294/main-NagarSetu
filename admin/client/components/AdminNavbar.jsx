import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, Users, Trophy, LogOut, Menu, X, Home, Star } from "lucide-react";
import { getStoredAdmin, clearAdminSession } from "../api";

// Separate from the citizen Navbar.jsx (§6) — shows ward + admin name + logout.
export default function AdminNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const admin = getStoredAdmin();

  const links = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Workers", path: "/admin/workers", icon: Users },
    { name: "Worker Leaderboard", path: "/admin/leaderboard", icon: Trophy },
    { name: "Citizen Leaderboard", path: "/admin/citizen-leaderboard", icon: Star }
  ];

  const isActive = (p) => location.pathname.startsWith(p);

  const logout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  return <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 py-3">
    <div className="w-full px-6 md:px-10 flex justify-between items-center">
      <Link to="/admin/dashboard" className="flex items-center gap-2 group">
        <div className="bg-indigo-600 p-2 rounded-xl group-hover:bg-indigo-500 transition-colors">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-bold text-white">NagarSetu <span className="text-indigo-400">Admin</span></div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Civic Command Center</div>
        </div>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-1">
        <a 
          href="/" 
          className="px-4 py-2 mr-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 bg-amber-600/20 text-amber-500 hover:bg-amber-600 hover:text-white border border-amber-500/30"
        >
          <Home className="h-4 w-4" />
          Back to Home Page
        </a>
        {links.map((l) => (
          <Link
            key={l.path}
            to={l.path}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              isActive(l.path)
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.name}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-4">
        {admin && (
          <div className="text-right">
            <div className="text-sm font-bold text-slate-100">{admin.name}</div>
            <div className="text-[11px] text-indigo-400">
              Super Admin
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-slate-300 hover:text-rose-400 text-sm font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Mobile toggle */}
      <button className="md:hidden text-slate-300" onClick={() => setOpen(!open)}>
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>

    {open && (
      <div className="md:hidden px-6 pt-3 pb-2 border-t border-slate-800 flex flex-col gap-1">
        <a 
          href="/"
          className="px-3 py-2 mb-2 rounded-lg text-sm font-bold bg-amber-600/20 text-amber-500 border border-amber-500/30 flex items-center gap-2 hover:bg-amber-600 hover:text-white"
        >
          <Home className="h-4 w-4" /> Back to Home Page
        </a>
        {links.map((l) => (
          <Link
            key={l.path}
            to={l.path}
            onClick={() => setOpen(false)}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              isActive(l.path) ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.name}
          </Link>
        ))}
        <button onClick={logout} className="px-3 py-2 rounded-lg text-sm font-medium text-rose-400 text-left flex items-center gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    )}
  </nav>;
}
