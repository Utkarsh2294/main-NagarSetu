// Worker proof-of-work (§8.1).
// A worker cannot mark an issue "completed" without uploading a proof photo/video,
// and that media runs through the SAME Gemini fake-detection pipeline used for
// citizen reports — closing the four-sided accountability loop.

import path from "path";
import fs from "fs";
import { classifyMedia } from "./classifyMedia.js";

const UPLOADS_DIR = () => path.join(process.cwd(), "uploads");

const MEDIA_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/3gpp": "3gp"
};

function getMediaTypeFromMime(mimeType) {
  if (!mimeType) return "image";
  return mimeType.startsWith("video/") ? "video" : "image";
}

// Persist a base64 data URL to /uploads and return its public URL.
export function saveProofMedia(dataUrl, issueId) {
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const ext = MEDIA_MIME_TO_EXTENSION[mimeType] || (getMediaTypeFromMime(mimeType) === "video" ? "mp4" : "jpg");
  const cleaned = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleaned, "base64");
  const filename = `proof_${issueId}_${Date.now()}.${ext}`;
  const filepath = path.join(UPLOADS_DIR(), filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

// Validate a worker's proof via the shared Gemini pipeline.
// Returns { ok, classification } where ok === false means the proof was flagged.
export async function validateWorkerProof(photoUrl) {
  if (!photoUrl) return { ok: false, classification: null, reason: "No proof media provided." };
  const classification = await classifyMedia(photoUrl, { isWorkerProof: true });
  if (!classification) {
    // AI unavailable — allow it through but flag low confidence (don't hard-block on infra outage).
    return { ok: true, classification: null, reason: "Proof accepted; AI verification unavailable." };
  }
  if (classification.isFake) {
    return {
      ok: false,
      classification,
      reason: `Proof flagged by AI: ${classification.description || "does not show a completed fix."}`
    };
  }
  return { ok: true, classification, reason: "Proof verified by AI." };
}
