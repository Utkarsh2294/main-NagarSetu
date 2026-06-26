import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  isAgency: Boolean,
  points: { type: Number, default: 0 },
  ward: String,
  verified: Boolean,
  avatar: String,
  isLeader: Boolean
}, { strict: false });

const AgencySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  ward: String,
  category: String,
  userId: String
}, { strict: false });

const IssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  lat: Number,
  lng: Number,
  category: String,
  severity: String,
  status: { type: String, default: 'reported' }, // reported, verified, in_progress, agency_fixed, resolved
  createdAt: { type: Number, default: Date.now },
  reportedBy: String,
  agencyId: String,
  originalDescription: String,
  confidence: Number,
  reopenedCount: { type: Number, default: 0 },
  // --- Admin layer fields (§2.3). adminStatus runs in PARALLEL to `status`
  // so MapPage.jsx / VerifyPage.jsx keep working unmodified. ---
  adminStatus: { type: String, default: 'pending_review' }, // pending_review | fake | assigned | in_progress | completed
  assignedWorkerId: { type: String, default: null },
  assignedByAdminId: { type: String, default: null },
  assignedAt: { type: Number, default: null },
  completedAt: { type: Number, default: null },
  slaDeadline: { type: Number, default: null }, // assignedAt + category SLA hours
  adminNotes: { type: String, default: null },
  workerProofUrl: { type: String, default: null } // photo/video worker uploads as proof (§8.1)
}, { strict: false });

IssueSchema.index({ adminStatus: 1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ lat: 1, lng: 1 });

const ReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  issueId: String,
  photoUrl: String,
  lat: Number,
  lng: Number,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

ReportSchema.index({ issueId: 1 });

const VerificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  issueId: String,
  isVerified: Boolean,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });
VerificationSchema.index({ issueId: 1, userId: 1 });

const WhatsappMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  from: String,
  body: String,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  issueId: { type: String, required: true },
  title: String,
  message: String,
  type: String, // 'assigned', 'completed', 'fake', etc.
  read: { type: Boolean, default: false },
  timestamp: { type: Number, default: Date.now }
}, { strict: false });
NotificationSchema.index({ userId: 1, timestamp: -1 });

export const User = mongoose.model('User', UserSchema);
export const Agency = mongoose.model('Agency', AgencySchema);
export const Issue = mongoose.model('Issue', IssueSchema);
export const Report = mongoose.model('Report', ReportSchema);
export const Verification = mongoose.model('Verification', VerificationSchema);
export const WhatsappMessage = mongoose.model('WhatsappMessage', WhatsappMessageSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
