// Thin fetch wrapper for the admin API. Reads/writes the admin JWT in localStorage
// so every call is authenticated without each page repeating the boilerplate.

const TOKEN_KEY = "nagarsetu_admin_token";
const ADMIN_KEY = "nagarsetu_admin_user";

export function getAdminToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getStoredAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setAdminSession(token, admin) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  } catch { /* ignore */ }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  } catch { /* ignore */ }
}

// Throws a structured error on non-2xx so callers can switch on `status`.
export async function adminFetch(path, { body, headers, ...opts } = {}) {
  const token = getAdminToken();
  const finalHeaders = {
    "Content-Type": "application/json",
    ...(headers || {})
  };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    ...opts,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---- Convenience endpoint helpers ------------------------------------------
export const adminApi = {
  login: (username, password) => adminFetch("/api/admin/login", {
    method: "POST", body: { username, password }
  }),
  issues: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.append(k, v); });
    return adminFetch(`/api/admin/issues${qs.toString() ? `?${qs}` : ""}`);
  },
  issue: (id) => adminFetch(`/api/admin/issues/${id}`),
  setStatus: (id, adminStatus, adminNotes) => adminFetch(`/api/admin/issues/${id}/status`, {
    method: "PATCH", body: { adminStatus, adminNotes }
  }),
  assign: (id, workerId) => adminFetch(`/api/admin/issues/${id}/assign`, {
    method: "POST", body: { workerId }
  }),
  complete: (id, payload) => adminFetch(`/api/admin/issues/${id}/complete`, {
    method: "POST", body: payload
  }),
  workers: () => adminFetch("/api/admin/workers"),
  createWorker: (worker) => adminFetch("/api/admin/workers", { method: "POST", body: worker }),
  updateWorker: (id, patch) => adminFetch(`/api/admin/workers/${id}`, { method: "PATCH", body: patch }),
  suggestWorker: (issueId) => adminFetch(`/api/admin/workers/suggest?issueId=${issueId}`),
  workerLeaderboard: () => adminFetch("/api/admin/workers/leaderboard"),
  analytics: () => adminFetch("/api/admin/analytics"),
  audit: (id) => adminFetch(`/api/admin/issues/${id}/audit`),
  generateNotes: (id) => adminFetch(`/api/admin/issues/${id}/generate-notes`, { method: "POST" }),
  sendNote: (id, message) => adminFetch(`/api/admin/issues/${id}/send-note`, { method: "POST", body: { message } }),
  deleteIssue: (id) => adminFetch(`/api/admin/issues/${id}`, { method: "DELETE" })
};
