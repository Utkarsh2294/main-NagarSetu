import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { adminApi, getStoredAdmin } from "../api";

const CATEGORIES = ["Roads & Potholes", "Garbage & Sanitation", "Street Lights", "Sewage & Water Leak"];

// Super_admin only — CRUD for workers in their jurisdiction (§6).
export default function WorkerManagementPage() {
  const admin = getStoredAdmin();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", specialization: CATEGORIES[0], ward: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.workers();
      setWorkers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", specialization: CATEGORIES[0], ward: admin?.ward || "" });
    setShowForm(true);
    setError(null);
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, phone: w.phone || "", specialization: w.specialization, ward: w.ward });
    setShowForm(true);
    setError(null);
  };

  const save = async () => {
    if (!form.name || !form.specialization || !form.ward) {
      setError("Name, specialization, and ward are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await adminApi.updateWorker(editing.id, form);
      } else {
        await adminApi.createWorker(form);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (w) => {
    const next = w.status === "available" ? "offline" : "available";
    await adminApi.updateWorker(w.id, { status: next });
    await load();
  };

  return <div className="container mx-auto px-6 max-w-5xl py-8">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-indigo-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Worker Management</h1>
          <p className="text-slate-400 text-sm">All wards</p>
        </div>
      </div>
      <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
        <Plus className="h-4 w-4" /> Add Worker
      </button>
    </div>

    {error && <div className="mb-4 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">{error}</div>}

    {/* Create / Edit form */}
    {showForm && (
      <div className="glass-panel rounded-2xl p-6 mb-6 border border-slate-800">
        <h3 className="font-bold text-white mb-4">{editing ? "Edit Worker" : "New Worker"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" placeholder="+91…" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Specialization</label>
            <select value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ward</label>
            <input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={save} disabled={submitting} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold transition-colors flex items-center gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Save Changes" : "Create Worker"}
          </button>
        </div>
      </div>
    )}

    {/* Workers table */}
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <th className="p-4">Worker</th>
              <th className="p-4">Specialization</th>
              <th className="p-4">Ward</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Completed</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
            ) : workers.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">No workers found.</td></tr>
            ) : workers.map((w) => (
              <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-200">{w.name}</div>
                  <div className="text-xs text-slate-500">{w.phone || "—"}</div>
                </td>
                <td className="p-4 text-sm text-slate-300">{w.specialization}</td>
                <td className="p-4 text-sm text-slate-400">{w.ward}</td>
                <td className="p-4">
                  <button onClick={() => toggleStatus(w)} className={`text-[11px] px-2.5 py-1 rounded-full font-bold border cursor-pointer transition-colors ${
                    w.status === "available" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                    : w.status === "on_job" ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700"
                  }`}>
                    {w.status}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="font-mono font-bold text-indigo-400">{w.completedCount || 0}</div>
                  <div className="text-[10px] text-slate-500">~{w.avgResolutionHours || 0}h avg</div>
                </td>
                <td className="p-4">
                  <button onClick={() => openEdit(w)} className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
