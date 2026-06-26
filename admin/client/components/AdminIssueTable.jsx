import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import SLABadge from "./SLABadge";
import { STATUS_PILL } from "./StatusChangeControl";

// Sortable table with colored status pills + SLA chips (§6).
export default function AdminIssueTable({ issues, loading, sortBy = "createdAt", sortDir = "desc", onSort }) {
  const navigate = useNavigate();
  const headers = [
    { key: "id", label: "Issue" },
    { key: "category", label: "Category" },
    { key: "severity", label: "Severity" },
    { key: "adminStatus", label: "Status" },
    { key: "slaDeadline", label: "SLA" }
  ];

  const arrow = (key) => sortBy === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
            {headers.map((h) => (
              <th key={h.key} className="p-4 cursor-pointer hover:text-white" onClick={() => onSort?.(h.key)}>
                {h.label}{arrow(h.key)}
              </th>
            ))}
            <th className="p-4 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {loading ? (
            <tr><td colSpan={6} className="p-10 text-center text-slate-400">
              <div className="inline-block animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
              <p>Loading issues…</p>
            </td></tr>
          ) : issues.length === 0 ? (
            <tr><td colSpan={6} className="p-10 text-center text-slate-400">
              No issues match these filters.
            </td></tr>
          ) : issues.map((issue) => {
            const pill = STATUS_PILL(issue.adminStatus);
            const sevColor = issue.severity === "High" ? "text-rose-400" : issue.severity === "Medium" ? "text-amber-400" : "text-slate-400";
            return (
              <tr
                key={issue.id}
                onClick={() => navigate(`/admin/issues/${issue.id}`)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <td className="p-4">
                  <div className="font-semibold text-slate-200 line-clamp-1 max-w-xs">{issue.description || issue.id}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono">{issue.lat?.toFixed(4)}, {issue.lng?.toFixed(4)}</span>
                    <span className="text-slate-600">· {issue.reportCount || 1} reports</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-300">{issue.category}</td>
                <td className={`p-4 text-sm font-bold ${sevColor}`}>{issue.severity}</td>
                <td className="p-4">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${pill.classes}`}>
                    {pill.label}
                  </span>
                </td>
                <td className="p-4"><SLABadge sla={issue.sla} /></td>
                <td className="p-4 text-slate-600"><ChevronRight className="h-4 w-4" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>;
}
