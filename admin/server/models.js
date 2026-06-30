import mongoose from "mongoose";

// Admin — ward-level government operator (§2.1)
const AdminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // bcrypt, cost >= 10
  name: String,
  role: { type: String, enum: ["super_admin"], default: "super_admin" },
  category: { type: String, default: null }, // optional department restriction
  lastLogin: { type: Date, default: null }
}, { strict: false, timestamps: true });

export const Admin = mongoose.model("Admin", AdminSchema);

// Worker — specialized field operator assigned to issues (§2.2)
const WorkerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: String, // for assignment alerts
  specialization: { type: String, required: true }, // matches Issue.category
  ward: { type: String, required: true },
  status: { type: String, enum: ["available", "on_job", "offline"], default: "available" },
  activeIssueId: { type: String, default: null },
  completedCount: { type: Number, default: 0 }, // worker leaderboard (§8.4)
  avgResolutionHours: { type: Number, default: 0 }, // AI assignment (§8.2)
  approvedRate: { type: Number, default: 0 } // citizen-approval rate on proof photos (§8.4)
}, { strict: false, timestamps: true });

export const Worker = mongoose.model("Worker", WorkerSchema);

// AuditLog — append-only, tamper-evident chain (§2.4, §8.5)
const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  actorId: { type: String, required: true }, // admin/worker/system id
  actorType: { type: String, enum: ["admin", "worker", "system"], required: true },
  issueId: { type: String, required: true },
  action: { type: String, required: true }, // status_change | assign | fake_flag | complete | ...
  fromValue: { type: String, default: null },
  toValue: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  prevHash: { type: String, default: null }, // hash of the previous entry for this issueId
  hash: { type: String, required: true }, // hash of this entry (tamper-evidence)
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

AuditLogSchema.index({ issueId: 1, timestamp: 1 });
export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
