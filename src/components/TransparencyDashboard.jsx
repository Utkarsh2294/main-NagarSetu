import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ShieldCheck, CheckCircle2, AlertTriangle, Building2, TrendingUp, MapPin, Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_STYLE = {
  reported: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  verified: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  agency_fixed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pending_fix_confirmation: "bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
};

const CATEGORY_ICON = {
  "Roads & Potholes": "🛣️",
  "Garbage & Sanitation": "🗑️",
  "Street Lights": "💡",
  "Sewage & Water Leak": "💧",
  "Invalid / Non-civic": "❌"
};

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TransparencyDashboard({ metrics, issues = [], loading }) {
  if (loading || !metrics) {
    return <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-sans space-y-3">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p>Loading real-time accountability metrics...</p>
      </div>;
  }
  const resolutionRate = metrics.totalReportedIssues > 0 ? Math.round(metrics.totalResolved / metrics.totalReportedIssues * 100) : 0;
  return <div className="space-y-8 font-sans">
      {
    /* Top Banner / Concept explanation */
  }
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 scale-150 pointer-events-none">
          <ShieldCheck className="h-64 w-64 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-2 max-w-3xl">
          <span className="text-xs bg-indigo-500/25 border border-indigo-500/50 text-indigo-300 font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Game-Proof Accountability
          </span>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white md:text-3xl">
            NagarSetu Public Accountability Dashboard
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike standard civic apps where agencies self-report their fixes as complete, NagarSetu closes the loop on both ends. Tickets are resolved <strong>only</strong> when independent citizens confirm the fix.
          </p>
        </div>
      </div>

      {
    /* Grid of 4 Live Statistics cards */
  }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Reports</div>
            <div className="text-2xl font-bold font-mono text-slate-100">{metrics.totalReportedIssues}</div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Citizen Resolved</div>
            <div className="text-2xl font-bold font-mono text-slate-100">{metrics.totalResolved}</div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-rose-900/30 text-rose-400 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Discrepancies Blocked</div>
            <div className="text-2xl font-bold font-mono text-rose-400">{metrics.totalGamesBlocked}</div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-900/30 text-indigo-400 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Audit Resolution Rate</div>
            <div className="text-2xl font-bold font-mono text-indigo-400">{resolutionRate}%</div>
          </div>
        </div>
      </div>

      {
    /* Main Charts Row */
  }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {
    /* Comparison Chart: Self reported vs Citizen Confirmed */
  }
        <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              Agency Fix Claims vs. Citizen Confirmation
            </h3>
            <p className="text-xs text-slate-400">
              Discrepancy count shows issues where citizens rejected self-reported fixes as incomplete.
            </p>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
    data={metrics.agencyComparisons}
    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
  >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis
    dataKey="name"
    tickLine={false}
    axisLine={false}
    tickFormatter={(val) => {
      if (val.includes("PWD")) return "PWD";
      if (val.includes("Waste")) return "Waste";
      if (val.includes("Light")) return "Lights";
      if (val.includes("Water")) return "Sewage";
      return val;
    }}
  />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
    contentStyle={{ backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: 8 }}
    labelStyle={{ fontWeight: "bold", color: "#6366f1" }}
  />
                <Legend iconType="circle" />
                <Bar
    dataKey="selfReported"
    name="Agency Claimed Fixed"
    fill="#c084fc"
    radius={[4, 4, 0, 0]}
  />
                <Bar
    dataKey="citizenConfirmed"
    name="Citizen Confirmed"
    fill="#10b981"
    radius={[4, 4, 0, 0]}
  />
                <Bar
    dataKey="discrepancyCount"
    name="Reopened by Citizens"
    fill="#ef4444"
    radius={[4, 4, 0, 0]}
  />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {
    /* Weekly Trend Line Area Chart */
  }
        <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              Weekly Activity Trends
            </h3>
            <p className="text-xs text-slate-400">
              Live tracking of incoming civic issues versus citizen-verified resolutions over time.
            </p>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
    data={metrics.trends}
    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
  >
                <defs>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
    contentStyle={{ backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: 8 }}
  />
                <Legend iconType="circle" />
                <Area
    type="monotone"
    dataKey="Issues Opened"
    stroke="#3b82f6"
    strokeWidth={2}
    fillOpacity={1}
    fill="url(#colorOpened)"
  />
                <Area
    type="monotone"
    dataKey="Citizen Resolved"
    stroke="#10b981"
    strokeWidth={2}
    fillOpacity={1}
    fill="url(#colorResolved)"
  />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {
    /* How it works educational section */
  }
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="text-indigo-400 font-bold font-mono text-lg">01. REPORT</div>
          <h4 className="font-semibold text-white">Decentralized Intake</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Citizens report issues with real-time location and camera capture. Our server utilizes Gemini API to auto-classify and assign to correct ward agencies.
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-indigo-400 font-bold font-mono text-lg">02. VERIFY</div>
          <h4 className="font-semibold text-white">Double-Verification</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Other local citizens within 500m must tap to verify that the report is real. Duplicate reports within 50m automatically collapse into a single issue cluster.
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-indigo-400 font-bold font-mono text-lg">03. AUDIT</div>
          <h4 className="font-semibold text-white">Citizens Vote the Fix</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            When agencies mark fixed, prior citizen verifiers receive a re-vote alert. If even one citizen votes "Still Broken," the ticket reopens instantly.
          </p>
        </div>
      </div>

      {
    /* Open Issues / Community Reported Issues Table */
  }
      <div className="glass-panel rounded-2xl p-6 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100 font-display flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400" />
              Community Reported Issues
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Recently raised civic issues by citizens in your area
            </p>
          </div>
          <Link
            to="/map"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View on Map
          </Link>
        </div>

        {issues.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No issues reported yet. Be the first to raise your voice!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {issues.map((issue) => {
              const statusClass = STATUS_STYLE[issue.status] || STATUS_STYLE.reported;
              return (
                <div
                  key={issue.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 text-lg shrink-0">
                      <span>{CATEGORY_ICON[issue.category] || "📌"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {issue.category}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusClass}`}>
                          {issue.status.replace(/_/g, " ")}
                        </span>
                        {issue.severity && (
                          <span className={`text-[10px] font-bold ${
                            issue.severity === "High" ? "text-rose-400" :
                            issue.severity === "Medium" ? "text-amber-400" : "text-slate-400"
                          }`}>
                            {issue.severity} Severity
                          </span>
                        )}
                        {issue.reportCount > 1 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {issue.reportCount} reports
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">
                        "{issue.originalDescription || issue.userDescription || issue.description || "No description"}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeAgo(issue.createdAt)}</span>
                      </div>
                      {issue.lat && issue.lng && (
                        <div className="flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3" />
                          <span>{issue.lat.toFixed(3)}, {issue.lng.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>;
}
