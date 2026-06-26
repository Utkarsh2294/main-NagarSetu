# NagarSetu — Admin Module

This folder contains the **complete admin layer** for NagarSetu — a ward-level Civic Command Center where government admins log in, triage issues, and assign specialized workers.

> **Everything here is self-contained.** Editing admin features never touches citizen-facing code beyond a few lines in the root files.

## Folder Structure

```
admin/
├── README.md                  ← You are here
├── server/
│   ├── index.js               ← Mounts all /api/admin routes onto the Express app
│   ├── models.js              ← Admin, Worker, AuditLog (MongoDB schemas)
│   ├── auth.js                ← JWT sign/verify + requireAdmin/requireWardAccess middleware
│   ├── seed.js                ← Creates demo admins + workers on every boot
│   ├── routes/
│   │   ├── auth.routes.js     ← POST /login
│   │   ├── issues.routes.js   ← List / detail / status / assign / complete
│   │   ├── workers.routes.js  ← CRUD + AI suggestion + leaderboard
│   │   ├── analytics.routes.js← Ward-scoped statistics
│   │   └── audit.routes.js    ← Read-only tamper-evident trail
│   └── services/
│       ├── classifyMedia.js   ← Shared Gemini classifier (citizen + worker proof)
│       ├── sla.js             ← Per-category SLA timers
│       ├── workerSuggestion.js← AI-ranked worker assignment
│       ├── workerProof.js     ← Proof upload + Gemini re-check
│       └── auditChain.js      ← Hash-chained append-only audit log
└── client/
    ├── api.js                 ← Fetch wrapper with auto JWT injection
    ├── AdminRoute.jsx         ← Route guard (redirects to /admin/login if no session)
    ├── AdminLayout.jsx        ← Shell with AdminNavbar (no citizen Navbar/Footer)
    ├── components/
    │   ├── AdminNavbar.jsx
    │   ├── AdminIssueTable.jsx
    │   ├── AssignWorkerModal.jsx
    │   ├── StatusChangeControl.jsx
    │   ├── SLABadge.jsx
    │   ├── AuditTrailView.jsx
    │   ├── WorkerProofUpload.jsx
    │   └── AnalyticsCards.jsx
    └── pages/
        ├── AdminLoginPage.jsx
        ├── AdminDashboardPage.jsx
        ├── IssueDetailPage.jsx
        ├── WorkerManagementPage.jsx
        └── WorkerLeaderboardPage.jsx
```

## How It Wires In

Only 4 changes to the root project:

| File | Change |
|------|--------|
| `models.js` | Added `adminStatus`, `assignedWorkerId`, `assignedByAdminId`, `assignedAt`, `completedAt`, `slaDeadline`, `adminNotes`, `workerProofUrl` to the `Issue` schema. |
| `server.js` | 3 surgical edits: (1) import + `mountAdmin(app)` + `seedAdminData()`, (2) extract shared Gemini prompt into `buildCitizenReportPrompt()` and expose to worker-proof classifier, (3) `GET /api/issues` excludes `adminStatus='fake'` from public map. |
| `src/App.jsx` | Added admin `<Routes>` with `AdminLayout` + `AdminRoute` guard. Admin pages render without the citizen Navbar/Footer. |
| `.env` | Added `ADMIN_JWT_SECRET` (dev fallback is used if unset). |

## Demo Credentials

Seeded automatically on every `node server.js` boot:

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Super Admin | `superadmin` | `admin@1234` | All wards, worker CRUD |
| Ward Admin | `ward84` | `ward123` | Ward 84 - Indiranagar |
| Ward Admin | `ward85` | `ward123` | Ward 100 - Koramangala |
| Ward Admin | `ward86` | `ward123` | Ward 52 - Jayanagar |

~24 workers are also seeded (2 per category per ward).

## API Endpoints

All `/api/admin/*` require a JWT from `POST /api/admin/login`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | `{ username, password }` → JWT + admin object |
| GET | `/api/admin/issues` | Ward-scoped list; query params: `status`, `category`, `severity`, `q` |
| GET | `/api/admin/issues/:id` | Full detail + reports + verifications + worker + AI suggestion |
| PATCH | `/api/admin/issues/:id/status` | `{ adminStatus, adminNotes }` — triage |
| POST | `/api/admin/issues/:id/assign` | `{ workerId }` — assign a worker |
| POST | `/api/admin/issues/:id/complete` | `{ workerProofBase64 }` — mark done with proof |
| GET | `/api/admin/workers` | Workers in ward with availability |
| POST | `/api/admin/workers` | (super_admin) Create worker |
| PATCH | `/api/admin/workers/:id` | Update status/specialization |
| GET | `/api/admin/workers/suggest?issueId=` | AI-ranked worker suggestion |
| GET | `/api/admin/workers/leaderboard` | Worker leaderboard |
| GET | `/api/admin/analytics` | Ward stats |
| GET | `/api/admin/issues/:id/audit` | Tamper-evident trail (admin) |
| GET | `/api/issues/:id/audit` | Tamper-evident trail (public, no auth) |

## Status Workflow

```
reported → verified (citizen vote, unchanged)
              │
              ▼
       [ADMIN REVIEW]
       ├── fake → hidden from map, reporter points reversed
       └── assigned → in_progress → completed
                                       │
                                       ▼
                         pending_fix_confirmation (existing citizen flow)
                         ├── confirm_fixed → resolved
                         └── still_broken → back to "assigned"
```

`adminStatus` and the citizen-facing `status` run in parallel — never merged.

## Features

### Core (§1–7)
- **JWT auth** — separate from citizen Google OAuth
- **Ward scoping** — ward_admins only see/modify their ward
- **Triage** — fake / assigned / in_progress / completed
- **Worker assignment** — category-matched dropdown
- **Hand-off to citizen audit** — completed → `pending_fix_confirmation`

### Stretch (§8.1–8.5)
- **8.1 Worker Proof-of-Work** — must upload photo; runs through same Gemini pipeline as citizen reports
- **8.2 AI-Suggested Assignment** — scores workers by match + load + avg resolution time
- **8.3 SLA Timers** — per-category deadlines; amber/red badges; breach counts
- **8.4 Worker Leaderboard** — fastest resolution + completion counts
- **8.5 Tamper-Evident Audit Trail** — hash-chained, append-only, publicly viewable

## Modifying Admin Features

Because every admin file lives in this one folder:

- **Change a backend route?** → `admin/server/routes/`
- **Change a model?** → `admin/server/models.js`
- **Change the login logic?** → `admin/server/auth.js`
- **Change the dashboard UI?** → `admin/client/pages/AdminDashboardPage.jsx`
- **Add a new admin page?** → create in `admin/client/pages/`, then add a `<Route>` in `src/App.jsx`

No admin code is mixed into `server.js`, `models.js`, or `src/components/` (except the minimal wiring described above).
