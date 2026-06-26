// Shared Gemini media classifier.
// Used by both the citizen report flow and the worker proof-of-work flow (§8.1),
// so the "report -> verify -> fix -> audit" loop uses ONE fake-detection pipeline.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const MAX_INLINE_MEDIA_BYTES = 15 * 1024 * 1024; // ~15MB, matches server.js

// These helpers are injected from server.js at mount time so we don't duplicate
// the Gemini client / retry / normalization logic that already lives there.
let deps = null;

export function configureMediaClassifier(serverDeps) {
  deps = serverDeps;
}

function getMimeFromExtension(extension) {
  return deps?.getMimeFromExtension?.(extension) || "image/jpeg";
}

// Build the inline-data part for a local file. Returns null if too big / missing.
function loadInlineMedia(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith("/uploads/") || !deps) return null;
  const localPath = path.join(process.cwd(), photoUrl);
  if (!fs.existsSync(localPath)) return null;
  const stats = fs.statSync(localPath);
  if (stats.size > MAX_INLINE_MEDIA_BYTES) return null;
  const buffer = fs.readFileSync(localPath);
  const mimeType = getMimeFromExtension(path.extname(localPath));
  return { mimeType, data: buffer.toString("base64") };
}

// The fake-detection prompt, reused verbatim across citizen + worker flows.
function buildPrompt({ isWorkerProof }) {
  if (isWorkerProof) {
    return `A municipal worker has uploaded this as PROOF that a civic issue has been fixed.
Verify whether the image/video actually shows a completed repair/cleanup of a civic issue
(filled pothole, removed garbage, repaired street light, fixed leak, etc) or whether it is
irrelevant, staged, unrelated, or fake (an X-ray, selfie, screenshot, document, stock photo,
or clearly the SAME broken issue that was reported).

If it does NOT genuinely show a completed fix, set "isFake" to true and in "description" state
what the media actually shows and why it is not a valid proof of work.

If genuine, set "isFake" to false and briefly describe the completed fix in "description".

Return ONLY structured JSON:
{
  "isFake": boolean,
  "fakeConfidence": number,
  "category": string,
  "severity": "High" | "Medium" | "Low",
  "suggested_agency": string,
  "confidence": number,
  "description": string
}`;
  }
  return deps.promptForReport();
}

/**
 * Classify a media file via the shared Gemini pipeline.
 * @param {string} photoUrl  e.g. "/uploads/report_xxx.jpg"
 * @param {object} opts      { isWorkerProof }
 * @returns {Promise<object|null>} classification or null if AI unavailable / fails.
 */
export async function classifyMedia(photoUrl, opts = {}) {
  if (!deps) return null;
  const client = deps.getGeminiClient();
  if (!client) return null;

  const inline = loadInlineMedia(photoUrl);
  if (!inline) return null;

  try {
    const response = await deps.generateGeminiContentWithRetry(client, {
      model: deps.GEMINI_MODEL,
      contents: [buildPrompt(opts), { inlineData: { mimeType: inline.mimeType, data: inline.data } }],
      config: { responseMimeType: "application/json" }
    });
    const classification = deps.normalizeClassification(
      deps.normalizeGeminiJson(deps.getGeminiText(response)),
      {
        isFake: false,
        fakeConfidence: 0,
        category: "Roads & Potholes",
        severity: "Medium",
        suggested_agency: "agency_pwd",
        confidence: 0.5,
        description: ""
      }
    );
    return classification;
  } catch (err) {
    return null;
  }
}

// Short hash helper, reused by worker proof + audit chain.
export function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function generateNotificationMessage(issue, adminStatus, adminNotes, worker) {
  if (!deps) return null;
  const client = deps.getGeminiClient();
  if (!client) return null;

  let prompt = `You are an AI assistant for the NagarSetu civic issue platform. Write a short, empathetic notification message (max 2 sentences) to be sent to a citizen who reported an issue.
The issue is currently marked as: "${adminStatus}".
Admin's note: "${adminNotes || 'None'}".`;

  if (adminStatus === 'fake') {
    prompt += `\nThe issue was flagged as fake or invalid. Inform the user politely but firmly not to spread false reports, and to ensure future reports are accurate. Use your creativity.`;
  } else if (adminStatus === 'assigned') {
    prompt += `\nThe issue has been assigned to worker ${worker ? worker.name : 'a worker'}. Thank the user for raising their voice and mention that the assigned person will complete the job soon (mention the SLA if applicable, or just "in a few working days"). Use your creativity.`;
  } else if (adminStatus === 'completed') {
    prompt += `\nThe issue has been marked as completed by the worker/admin. Thank the user for their contribution to keeping the city clean/safe, and ask them to verify the fix if they are nearby.`;
  } else {
    prompt += `\nProvide a generic, polite update that their issue status changed to ${adminStatus}.`;
  }

  try {
    const response = await deps.generateGeminiContentWithRetry(client, {
      model: deps.GEMINI_MODEL,
      contents: [prompt],
      config: { responseMimeType: "text/plain" }
    });
    return deps.getGeminiText(response);
  } catch (err) {
    console.error("Failed to generate AI notification:", err);
    return null;
  }
}
