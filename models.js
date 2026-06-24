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
  reopenedCount: { type: Number, default: 0 }
}, { strict: false });

const ReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  issueId: String,
  photoUrl: String,
  lat: Number,
  lng: Number,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

const VerificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  issueId: String,
  isVerified: Boolean,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

const WhatsappMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  from: String,
  body: String,
  timestamp: { type: Number, default: Date.now }
}, { strict: false });

export const User = mongoose.model('User', UserSchema);
export const Agency = mongoose.model('Agency', AgencySchema);
export const Issue = mongoose.model('Issue', IssueSchema);
export const Report = mongoose.model('Report', ReportSchema);
export const Verification = mongoose.model('Verification', VerificationSchema);
export const WhatsappMessage = mongoose.model('WhatsappMessage', WhatsappMessageSchema);
