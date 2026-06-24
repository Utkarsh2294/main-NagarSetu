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
import { ShieldCheck, CheckCircle2, AlertTriangle, Building2, TrendingUp } from "lucide-react";
export default function TransparencyDashboard({ metrics, loading }) {
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
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="text-indigo-600 font-bold font-mono text-lg">01. REPORT</div>
          <h4 className="font-semibold text-slate-800">Decentralized Intake</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Citizens report issues with real-time location and camera capture. Our server utilizes Gemini API to auto-classify and assign to correct ward agencies.
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-indigo-600 font-bold font-mono text-lg">02. VERIFY</div>
          <h4 className="font-semibold text-slate-800">Double-Verification</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Other local citizens within 500m must tap to verify that the report is real. Duplicate reports within 50m automatically collapse into a single issue cluster.
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-indigo-600 font-bold font-mono text-lg">03. AUDIT</div>
          <h4 className="font-semibold text-slate-800">Citizens Vote the Fix</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            When agencies mark fixed, prior citizen verifiers receive a re-vote alert. If even one citizen votes "Still Broken," the ticket reopens instantly.
          </p>
        </div>
      </div>
    </div>;
}
