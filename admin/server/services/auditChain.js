// Tamper-evident audit trail (§2.4, §8.5).
// Each AuditLog entry chains to the previous one for the same issueId via prevHash,
// and carries its own hash = sha256(prevHash || canonical(entry fields)).
// Append-only — entries are never edited or deleted.

import { AuditLog } from "../models.js";
import { sha256Hex } from "./classifyMedia.js";

function canonicalEntry(entry) {
  return JSON.stringify({
    id: entry.id,
    issueId: entry.issueId,
    actorId: entry.actorId,
    actorType: entry.actorType,
    action: entry.action,
    fromValue: entry.fromValue ?? null,
    toValue: entry.toValue ?? null,
    meta: entry.meta ?? {},
    timestamp: entry.timestamp,
    prevHash: entry.prevHash ?? null
  });
}

export async function appendAuditEntry({ issueId, actorId, actorType, action, fromValue = null, toValue = null, meta = {} }) {
  // Find the latest entry for this issue to chain from.
  const latest = await AuditLog.findOne({ issueId }).sort({ timestamp: -1 });
  const prevHash = latest?.hash || null;

  const id = `audit_${issueId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = Date.now();

  const entry = {
    id,
    issueId,
    actorId,
    actorType,
    action,
    fromValue,
    toValue,
    meta,
    timestamp,
    prevHash,
    hash: null // filled after canonicalization
  };
  entry.hash = sha256Hex(`${prevHash || ""}|${canonicalEntry({ ...entry, hash: null })}`);

  await AuditLog.create(entry);
  return entry;
}

// Returns the full chain for an issue, oldest first, plus a verification result.
export async function getIssueAuditTrail(issueId) {
  const entries = await AuditLog.find({ issueId }).sort({ timestamp: 1 }).lean();
  let verified = true;
  let expectedPrev = null;
  for (const entry of entries) {
    if (entry.prevHash !== expectedPrev) verified = false;
    const recomputed = sha256Hex(`${entry.prevHash || ""}|${canonicalEntry({ ...entry, hash: null })}`);
    if (recomputed !== entry.hash) verified = false;
    expectedPrev = entry.hash;
  }
  return { entries, verified };
}
