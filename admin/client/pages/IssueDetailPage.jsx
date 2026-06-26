import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { adminApi } from "../api";
import StatusChangeControl from "../components/StatusChangeControl";
import SLABadge from "../components/SLABadge";
import AssignWorkerModal from "../components/AssignWorkerModal";
import WorkerProofUpload from "../components/WorkerProofUpload";
import AuditTrailView from "../components/AuditTrailView";

// Full issue detail drawer — review photo, triage, assign worker, complete with proof.
export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [address, setAddress] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.issue(id);
      setIssue(data);
      if (data.lat && data.lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lng}&zoom=18&addressdetails=1`)
          .then(res => res.json())
          .then(geo => {
            if (geo && geo.display_name) {
              const parts = geo.display_name.split(',');
              setAddress(parts.slice(0, 3).join(', '));
            } else {
              setAddress("Address not found");
            }
          })
          .catch(() => setAddress("Address not found"));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatus = async (adminStatus) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.setStatus(id, adminStatus);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (payload) => {
    await adminApi.complete(id, payload);
    await load();
  };

  const handleAssigned = async () => {
    setShowAssign(false);
    await load();
  };

  if (loading) return <div className="container mx-auto px-6 py-12 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  if (error && !issue) return <div className="container mx-auto px-6 py-12 text-rose-400">{error}</div>;
  if (!issue) return <div className="container mx-auto px-6 py-12 text-slate-400">Issue not found.</div>;

  const sevColor = issue.severity === "High" ? "text-rose-400" : issue.severity === "Medium" ? "text-amber-400" : "text-slate-400";

  return <div className="container mx-auto px-6 max-w-5xl py-8">
    {/* Header */}
    <button onClick={() => navigate("/admin/dashboard")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
      <ArrowLeft className="h-4 w-4" /> Back to Dashboard
    </button>

    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{issue.description || "Untitled Issue"}</h1>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="font-mono">{issue.id}</span>
          <span>·</span>
          <span className={sevColor}>{issue.severity} severity</span>
          <span>·</span>
          <span className="text-slate-500">{new Date(issue.createdAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SLABadge sla={issue.sla} />
        {issue.suggestedWorker && issue.adminStatus === "pending_review" && (
          <span className="flex items-center gap-1 text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-1 rounded-full font-bold border border-indigo-500/30">
            <Sparkles className="h-3 w-3" /> AI: {issue.suggestedWorker.name}
          </span>
        )}
      </div>
    </div>

    {error && <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{error}</div>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column — media + info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Photo / Video */}
        {issue.reports && issue.reports.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto whitespace-nowrap space-x-4">
            {issue.reports.flatMap(r => r.mediaList && r.mediaList.length > 0 ? r.mediaList : [{ photoUrl: r.photoUrl, mediaType: r.mediaType }]).map((media, idx) => (
              media.photoUrl && (
                <div key={idx} className="inline-block align-top w-72 h-48 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 relative">
                  {media.photoUrl.match(/\.(mp4|webm|mov|3gp)$/i) || media.mediaType === 'video' ? (
                    <video src={media.photoUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={media.photoUrl} alt={`Reported issue ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Category</div>
            <div className="text-sm font-semibold text-slate-200">{issue.category}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Reports</div>
            <div className="text-sm font-semibold text-slate-200">{issue.reportCount || 1}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ward</div>
            <div className="text-sm font-semibold text-slate-200">{issue.ward || "—"}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 md:col-span-2 flex flex-col justify-between">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Location</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">
              <div className="line-clamp-2" title={address || "Loading..."}>{address || "Loading address..."}</div>
              <a href={`https://www.google.com/maps?q=${issue.lat},${issue.lng}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium mt-1 w-max">
                <MapPin className="h-3 w-3" /> View on Map
              </a>
            </div>
          </div>
        </div>

        {/* Worker info */}
        {issue.worker && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-white mb-2">Assigned Worker</h4>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-200">{issue.worker.name}</div>
                <div className="text-xs text-slate-400">{issue.worker.specialization} · {issue.worker.phone || "No phone"} · {issue.worker.completedCount || 0} completed</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                issue.worker.status === "available" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
              }`}>
                {issue.worker.status}
              </span>
            </div>
            {issue.assignedAt && (
              <div className="text-[11px] text-slate-500 mt-2">Assigned {new Date(issue.assignedAt).toLocaleString()}</div>
            )}
          </div>
        )}

        {/* Verifications from citizens */}
        {issue.verifications && issue.verifications.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-white mb-2">Citizen Verifications</h4>
            <div className="flex items-center gap-6 mt-4 text-sm font-semibold">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Real / Fixed: {issue.verifications.filter(v => v.type === 'vote_real' || v.type === 'confirm_fixed' || v.isVerified === true).length}</span>
              </div>
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Fake / Broken: {issue.verifications.filter(v => v.type === 'vote_fake' || v.type === 'still_broken' || v.isVerified === false).length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <button onClick={() => setShowAudit(!showAudit)} className="w-full flex items-center justify-between font-bold text-white">
            <span>Audit Trail</span>
            <span className="text-xs text-slate-400">{showAudit ? "Hide" : "Show"}</span>
          </button>
          {showAudit && <div className="mt-4"><AuditTrailView issueId={issue.id} /></div>}
        </div>
      </div>

      {/* Right column — actions */}
      <div className="space-y-6">
        {/* Status change */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="font-bold text-white mb-3">Triage Status</h4>
          {saving ? (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</div>
          ) : (
            <StatusChangeControl current={issue.adminStatus} onStatus={handleStatus} />
          )}
        </div>

        {/* Admin notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="font-bold text-white mb-3">Admin Notes</h4>
          <textarea
            value={issue.adminNotes || ""}
            onChange={(e) => setIssue({ ...issue, adminNotes: e.target.value })}
            onBlur={() => adminApi.setStatus(id, issue.adminStatus, issue.adminNotes)}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 resize-none"
            placeholder="Internal notes about this issue…"
          />
        </div>

        {/* Assign worker */}
        {["pending_review", "assigned"].includes(issue.adminStatus) && (
          <button
            onClick={() => setShowAssign(true)}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            {issue.assignedWorkerId ? "Reassign Worker" : "Assign Worker"}
          </button>
        )}

        {/* Worker proof upload (complete flow §8.1) */}
        {["assigned", "in_progress"].includes(issue.adminStatus) && (
          <WorkerProofUpload onComplete={handleComplete} />
        )}

        {/* Worker proof display (if already completed) */}
        {issue.workerProofUrl && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h4 className="font-bold text-white">Worker Proof</h4>
            </div>
            {issue.workerProofUrl.match(/\.(mp4|webm|mov|3gp)$/i) ? (
              <video src={issue.workerProofUrl} controls className="rounded-lg max-h-40 w-full" />
            ) : (
              <img src={issue.workerProofUrl} alt="Worker proof" className="rounded-lg max-h-40 w-full object-cover" />
            )}
            {issue.completedAt && (
              <div className="text-xs text-slate-500 mt-2">Completed {new Date(issue.completedAt).toLocaleString()}</div>
            )}
          </div>
        )}

        {/* Hand-off indicator */}
        {issue.adminStatus === "completed" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-sm text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">Handed to Citizens</div>
              <div className="text-emerald-400/70 text-xs mt-0.5">
                Issue status is now <span className="font-mono">pending_fix_confirmation</span> — the existing citizen-audit flow takes over unmodified.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {showAssign && <AssignWorkerModal issue={issue} onClose={() => setShowAssign(false)} onAssigned={handleAssigned} />}
  </div>;
}
