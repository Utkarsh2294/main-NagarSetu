import { useState, useEffect, useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { adminApi, getStoredAdmin } from "../api";
import AnalyticsCards from "../components/AnalyticsCards";
import AdminIssueTable from "../components/AdminIssueTable";

const CATEGORIES = ["Roads & Potholes", "Garbage & Sanitation", "Street Lights", "Sewage & Water Leak"];
const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "fake", label: "Fake" }
];

// Protected; ward-filtered issue table with filter bar + analytics (§6).
export default function AdminDashboardPage() {
  const admin = getStoredAdmin();
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const load = async () => {
    setLoading(true);
    try {
      const [list, metrics] = await Promise.all([
        adminApi.issues({ status, category, severity, q }),
        adminApi.analytics()
      ]);
      setIssues(list);
      setAnalytics(metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, category, severity]);

  const onSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const arr = [...issues];
    arr.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === "slaDeadline") {
        av = a.slaDeadline || (sortDir === "asc" ? Infinity : 0);
        bv = b.slaDeadline || (sortDir === "asc" ? Infinity : 0);
      }
      if (av == null) av = "";
      if (bv == null) bv = "";
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [issues, sortBy, sortDir]);

  return <div className="container mx-auto px-6 max-w-7xl py-8">
    <div className="flex items-center gap-3 mb-2">
      <ShieldCheck className="h-7 w-7 text-indigo-400" />
      <h1 className="text-3xl font-bold text-white">Civic Command Center</h1>
    </div>
    <p className="text-slate-400 mb-8">
      All wards — triage issues and assign specialized workers.
    </p>

    <div className="mb-8">
      <AnalyticsCards analytics={analytics} />
    </div>

    <div className="glass-panel rounded-2xl p-4 mb-5 border border-slate-800 flex flex-wrap items-center gap-3">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
        <option value="">All Severities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && load()}
        placeholder="Search description…"
        className="flex-1 min-w-[160px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
      />
      <button onClick={load} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
        Apply
      </button>
    </div>

    <AdminIssueTable issues={sorted} loading={loading} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
  </div>;
}
