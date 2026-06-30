import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User, Agency, Issue, Report, Verification, WhatsappMessage, Notification } from "./models.js";
import { mountAdmin, configureMediaClassifier } from "./admin/server/index.js";
import { seedAdminData } from "./admin/server/seed.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function encodeGeohash(lat, lng, precision = 9) {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let geohash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;
  while (geohash.length < precision) {
    let mid;
    if (isEven) {
      mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= 1 << 4 - bit;
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= 1 << 4 - bit;
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return geohash;
}

function getBadgeTier(points) {
  if (points >= 500) return "gold";
  if (points >= 200) return "silver";
  if (points >= 50) return "bronze";
  return "bronze";
}

// ---- Media type helpers (image + video) ----------------------------------

const MEDIA_MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/3gpp": "3gp"
};

const EXTENSION_TO_MEDIA_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  "3gp": "video/3gpp"
};

// Gemini's inline-data path comfortably handles files well under this size.
// Bigger video uploads fall back to the keyword heuristic instead of erroring out.
const MAX_INLINE_MEDIA_BYTES = 15 * 1024 * 1024; // ~15MB

const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 30000);
const GEMINI_RETRY_DELAYS_MS = [2000, 4000, 8000];
const AI_UNAVAILABLE_MESSAGE = "AI analysis is temporarily unavailable. The report has been submitted successfully.";
const AI_COMPLETE_MESSAGE = "Analysis complete";

const CIVIC_CATEGORIES = new Set([
  "Roads & Potholes",
  "Garbage & Sanitation",
  "Street Lights",
  "Sewage & Water Leak",
  "Invalid / Non-civic"
]);

const AGENCY_BY_CATEGORY = {
  "Roads & Potholes": "agency_pwd",
  "Garbage & Sanitation": "agency_waste",
  "Street Lights": "agency_light",
  "Sewage & Water Leak": "agency_water",
  "Invalid / Non-civic": "agency_pwd"
};

const DEPRECATED_GEMINI_MODELS = new Map([
  ["gemini-1.5-flash", "gemini-2.5-flash"],
  ["gemini-1.5-flash-latest", "gemini-2.5-flash"],
  ["gemini-1.5-pro", "gemini-2.5-flash"],
  ["gemini-1.5-pro-latest", "gemini-2.5-flash"],
  ["gemini-pro", "gemini-2.5-flash"],
  ["gemini-pro-vision", "gemini-2.5-flash"],
  ["gemini-2.0-flash", "gemini-2.5-flash"]
]);

function normalizeGeminiModel(model) {
  const normalized = String(model || "").trim();
  return DEPRECATED_GEMINI_MODELS.get(normalized) || normalized || "gemini-2.5-flash";
}

const GEMINI_MODEL = normalizeGeminiModel(process.env.GEMINI_MODEL || process.env.GOOGLE_GENAI_MODEL || "gemini-2.5-flash");

function getMediaTypeFromMime(mimeType) {
  if (!mimeType) return "image";
  return mimeType.startsWith("video/") ? "video" : "image";
}

function getExtensionFromMime(mimeType) {
  if (MEDIA_MIME_TO_EXTENSION[mimeType]) return MEDIA_MIME_TO_EXTENSION[mimeType];
  return getMediaTypeFromMime(mimeType) === "video" ? "mp4" : "jpg";
}

function getMimeFromExtension(extension) {
  const ext = (extension || "").replace(".", "").toLowerCase();
  return EXTENSION_TO_MEDIA_MIME[ext] || "image/jpeg";
}

let aiClient = null;
let geminiStatus = {
  configured: false,
  connected: false,
  model: GEMINI_MODEL,
  lastCheckedAt: null,
  lastErrorCode: null,
  lastUserMessage: null
};

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.includes("YOUR_")) return "";
  const trimmed = key.trim();
  // Accept both classic AIza keys AND newer AQ. keys from Google AI Studio (used with @google/genai v2+)
  if (trimmed.length < 20) {
    console.error(
      `[Gemini] ⚠️  API key in .env looks too short (${trimmed.length} chars).\n` +
      `  Get a valid key at: https://aistudio.google.com/app/apikey`
    );
    return "";
  }
  return trimmed;
}

function getGeminiClient() {
  if (!aiClient) {
    const key = getGeminiApiKey();
    geminiStatus.configured = !!key;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractRetryDelaySeconds(error) {
  // Google returns retryDelay in error.errorDetails or error.response JSON
  try {
    const details = error?.errorDetails || error?.response?.data?.error?.details || [];
    for (const d of details) {
      if (d["@type"] === "type.googleapis.com/google.rpc.RetryInfo" && d.retryDelay) {
        const match = String(d.retryDelay).match(/(\d+(\.\d+)?)s/);
        if (match) return Math.ceil(Number(match[1]));
        // Fallback: parse as seconds
        const val = Number(d.retryDelay);
        if (val > 0) return Math.ceil(val);
      }
    }
  } catch (_) {}
  // Also check raw message for "retry in Xs" pattern
  try {
    const msg = String(error?.message || "");
    const match = msg.match(/retry in (\d+(\.\d+)?)s/i);
    if (match) return Math.ceil(Number(match[1]));
  } catch (_) {}
  return null;
}

function classifyGeminiError(error) {
  const status = Number(error?.status || error?.code || error?.response?.status || 0);
  const message = String(error?.message || "");
  const upperMessage = message.toUpperCase();

  if (status === 429 || upperMessage.includes("RESOURCE_EXHAUSTED") || upperMessage.includes("RATE LIMIT")) {
    const retryAfter = extractRetryDelaySeconds(error);
    return { code: 429, status: "RATE_LIMITED", retryable: true, retryAfter, userMessage: AI_UNAVAILABLE_MESSAGE };
  }
  if (status === 503 || upperMessage.includes("UNAVAILABLE") || upperMessage.includes("HIGH DEMAND")) {
    const retryAfter = extractRetryDelaySeconds(error);
    return { code: 503, status: "UNAVAILABLE", retryable: true, retryAfter, userMessage: AI_UNAVAILABLE_MESSAGE };
  }
  if (error?.name === "AbortError" || error?.code === "ETIMEDOUT" || upperMessage.includes("TIMEOUT") || upperMessage.includes("TIMED OUT")) {
    return { code: "TIMEOUT", status: "TIMEOUT", retryable: false, userMessage: AI_UNAVAILABLE_MESSAGE };
  }
  return { code: status || "UNKNOWN", status: "FAILED", retryable: false, userMessage: AI_UNAVAILABLE_MESSAGE };
}

function logGeminiEvent(event) {
  const payload = {
    timestamp: new Date().toISOString(),
    service: "gemini",
    model: GEMINI_MODEL,
    ...event
  };
  const level = event.responseStatus === "success" ? "log" : "error";
  console[level](JSON.stringify(payload));
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Gemini request timed out after ${timeoutMs}ms`);
      error.code = "ETIMEDOUT";
      reject(error);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function getGeminiText(response) {
  if (!response) throw new Error("Gemini returned no response object.");
  if (typeof response.text === "string") return response.text;
  if (typeof response.text === "function") return response.text();
  if (response.response && typeof response.response.text === "function") return response.response.text();
  if (typeof response.response?.text === "string") return response.response.text;
  throw new Error("Gemini response did not include text.");
}

async function generateGeminiContentWithRetry(client, params) {
  const startedAt = Date.now();
  let attempt = 0;
  let lastError = null;

  while (attempt <= GEMINI_RETRY_DELAYS_MS.length) {
    const attemptStartedAt = Date.now();
    try {
      const response = await withTimeout(client.models.generateContent(params), GEMINI_TIMEOUT_MS);
      const durationMs = Date.now() - attemptStartedAt;
      const totalDurationMs = Date.now() - startedAt;
      logGeminiEvent({
        responseStatus: "success",
        requestDurationMs: durationMs,
        totalDurationMs,
        attempt: attempt + 1,
        errorCode: null
      });
      return response;
    } catch (error) {
      lastError = error;
      const classified = classifyGeminiError(error);
      const durationMs = Date.now() - attemptStartedAt;
      logGeminiEvent({
        responseStatus: classified.status,
        requestDurationMs: durationMs,
        attempt: attempt + 1,
        errorCode: classified.code,
        retryable: classified.retryable,
        message: error?.message
      });

      if (!classified.retryable || attempt >= GEMINI_RETRY_DELAYS_MS.length) {
        break;
      }
      const delayMs = (classified.retryAfter ? classified.retryAfter * 1000 : GEMINI_RETRY_DELAYS_MS[attempt]);
      console.log(`Gemini ${classified.status}, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${GEMINI_RETRY_DELAYS_MS.length})`);
      await wait(delayMs);
      attempt += 1;
    }
  }

  throw lastError;
}

function normalizeGeminiJson(text) {
  if (!text) throw new Error("Gemini returned an empty response.");
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
}

function normalizeClassification(classification, fallback) {
  const normalized = { ...fallback, ...classification };
  normalized.isFake = Boolean(normalized.isFake);
  normalized.fakeConfidence = typeof normalized.fakeConfidence === "number"
    ? Math.max(0, Math.min(1, normalized.fakeConfidence))
    : (normalized.isFake ? 1 : 0);
  normalized.confidence = typeof normalized.confidence === "number"
    ? Math.max(0, Math.min(1, normalized.confidence))
    : fallback.confidence;
  normalized.category = CIVIC_CATEGORIES.has(normalized.category)
    ? normalized.category
    : (normalized.isFake ? "Invalid / Non-civic" : fallback.category);
  normalized.severity = ["High", "Medium", "Low"].includes(normalized.severity)
    ? normalized.severity
    : fallback.severity;
  normalized.suggested_agency = AGENCY_BY_CATEGORY[normalized.category] || fallback.suggested_agency;
  normalized.description = typeof normalized.description === "string" && normalized.description.trim()
    ? normalized.description.trim()
    : fallback.description;
  return normalized;
}

// Shared citizen-report prompt (also surfaced to the admin media classifier so the
// worker proof-of-work flow reuses the same fake-detection language, §8.1).
function buildCitizenReportPrompt(mediaWord, isVideo) {
  return `Analyze this citizen-reported civic issue ${mediaWord}.
            Check whether it shows a genuine civic issue (like a pothole, garbage dump, broken street light, sewage leak, etc) or whether it is irrelevant, unrelated, staged, or fake (like an X-ray, medical scan, selfie, screenshot, document, animal, person-only image, indoor object, etc).
            ${isVideo ? "This is a short video clip - base your judgment on what is shown across the whole clip, not just one frame." : ""}
            If it is completely irrelevant or fake, set "isFake" to true, set "category" to "Invalid / Non-civic", set "suggested_agency" to "agency_pwd", and in the "description" field explicitly state what the image actually is (for example, "This appears to be an X-ray image") and explain why it is not a civic issue. Set "fakeConfidence" to a number between 0 and 1.

            If genuine, classify into:
            - "Roads & Potholes"
            - "Garbage & Sanitation"
            - "Street Lights"
            - "Sewage & Water Leak"

            Assess severity (High, Medium, Low).
            Determine agency from:
            - "agency_pwd" (for Roads & Potholes)
            - "agency_waste" (for Garbage & Sanitation)
            - "agency_light" (for Street Lights)
            - "agency_water" (for Sewage & Water Leak)

            Return ONLY structured JSON adhering strictly to:
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

async function seedAgencies() {
  const agencies = [
    { id: "agency_pwd", name: "Public Works Department (PWD)", ward: "All Wards", category: "Roads & Potholes", userId: "agency_pwd_user" },
    { id: "agency_waste", name: "Municipal Solid Waste Management", ward: "All Wards", category: "Garbage & Sanitation", userId: "agency_waste_user" },
    { id: "agency_light", name: "Street Light Division", ward: "All Wards", category: "Street Lights", userId: "agency_light_user" },
    { id: "agency_water", name: "Water Supply and Sewerage Board", ward: "All Wards", category: "Sewage & Water Leak", userId: "agency_water_user" }
  ];
  try {
    for (const a of agencies) {
      const exists = await Agency.findOne({ id: a.id });
      if (!exists) {
        await Agency.create(a);
      }
    }
  } catch (error) {
    console.error("Agency seeding error:", error);
  }
}
seedAgencies();

// --- Admin module wiring -----------------------------------------------------
// Expose the existing Gemini stack to the admin worker-proof classifier (§8.1),
// mount all /api/admin routes, and seed demo admins + workers (§9).
configureMediaClassifier({
  getGeminiClient,
  GEMINI_MODEL,
  generateGeminiContentWithRetry,
  normalizeClassification,
  normalizeGeminiJson,
  getGeminiText,
  getMimeFromExtension,
  promptForReport: () => buildCitizenReportPrompt("photo", false)
});
mountAdmin(app);
seedAdminData();


// ---- Upload endpoint: accepts either a photo or a video --------------------
// Detects media type from the data URL's mime prefix (e.g. "data:video/mp4;base64,...")
// so the frontend can offer "Take/Upload Photo" and "Record/Upload Video" as two
// options that both POST here.
function uploadMediaHandler(req, res) {
  try {
    const mediaBase64 = req.body.mediaBase64 || req.body.imageBase64;
    const { uid } = req.body;
    if (!mediaBase64) {
      return res.status(400).json({ error: "Missing media data" });
    }
    const mimeMatch = mediaBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const mediaType = getMediaTypeFromMime(mimeType);
    const extension = getExtensionFromMime(mimeType);

    const cleanedBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanedBase64, "base64");
    const prefix = mediaType === "video" ? "video" : "report";
    const filename = `${prefix}_${uid || "anon"}_${Date.now()}.${extension}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, buffer);

    res.json({ photoUrl: `/uploads/${filename}`, mediaType, mimeType });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload media" });
  }
}

app.post("/api/upload-media", uploadMediaHandler);
app.post("/api/upload-photo", uploadMediaHandler); // kept for backward compatibility

// Detailed diagnostics endpoint — tells the admin exactly what is wrong with AI config.
app.get("/api/ai-diagnostics", (req, res) => {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";
  const keyPresent = !!rawKey && rawKey !== "MY_GEMINI_API_KEY" && !rawKey.includes("YOUR_");
  // Accept both classic AIza keys and newer AQ. keys (Google AI Studio v2 SDK format)
  const keyValidFormat = keyPresent && rawKey.trim().length >= 20;
  const configured = keyValidFormat;
  let issue = null;
  if (!keyPresent) {
    issue = "GEMINI_API_KEY is missing or empty in .env";
  } else if (rawKey.trim().length < 20) {
    issue = "Key is too short to be a valid Gemini API key";
  }
  res.json({
    configured,
    model: GEMINI_MODEL,
    keyPresent,
    keyValidFormat,
    keyPrefix: keyPresent ? rawKey.trim().substring(0, 8) + "..." : "(none)",
    issue,
    howToFix: issue ? "Get a free Gemini API key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY in your .env file, then restart the server." : null,
    lastErrorCode: geminiStatus.lastErrorCode,
    connected: geminiStatus.connected
  });
});

app.get("/api/ai-status", async (req, res) => {
  const client = getGeminiClient();
  if (!client) {
    return res.json({
      configured: false,
      connected: false,
      model: GEMINI_MODEL,
      message: "Gemini API key is missing. Set GEMINI_API_KEY in .env."
    });
  }

  try {
    const response = await generateGeminiContentWithRetry(client, {
      model: GEMINI_MODEL,
      contents: "Return only the word ok."
    });
    geminiStatus = {
      configured: true,
      connected: getGeminiText(response).toLowerCase().includes("ok"),
      model: GEMINI_MODEL,
      lastCheckedAt: Date.now(),
      lastErrorCode: null,
      lastUserMessage: null
    };
    res.json({ ...geminiStatus, message: "Gemini is connected." });
  } catch (error) {
    const classified = classifyGeminiError(error);
    geminiStatus = {
      configured: true,
      connected: false,
      model: GEMINI_MODEL,
      lastCheckedAt: Date.now(),
      lastErrorCode: classified.code,
      lastUserMessage: classified.userMessage
    };
    res.status(502).json({
      ...geminiStatus,
      message: classified.userMessage
    });
  }
});

app.post("/api/user", async (req, res) => {
  try {
    const { id, phone, ward, name, picture } = req.body;
    if (!id) return res.status(400).json({ error: "User ID is required" });
    
    let user = await User.findOne({ id });
    if (!user) {
      user = new User({
        id,
        name: name || `Citizen ${id.substring(0, 5)}`,
        picture: picture || "",
        phone: phone || "",
        points: 0,
        badgeTier: "bronze",
        ward: ward || "Ward 84 - Indiranagar",
        isAgency: false
      });
      await user.save();
    } else {
      let updated = false;
      if (name && name !== user.name) { user.name = name; updated = true; }
      if (picture && picture !== user.picture) { user.picture = picture; updated = true; }
      if (phone !== undefined && phone !== user.phone) { user.phone = phone; updated = true; }
      if (ward !== undefined && ward !== user.ward) { user.ward = ward; updated = true; }
      if (updated) await user.save();
    }
    res.json(user.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Missing credential token" });

    const parts = credential.split(".");
    if (parts.length < 2) return res.status(400).json({ error: "Invalid JWT format" });
    
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4 !== 0) payload += "=";
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    const { sub, name, email, picture } = decoded;
    
    if (!sub) return res.status(400).json({ error: "Invalid token payload" });
    
    const userId = `google_${sub}`;
    let user = await User.findOne({ id: userId });
    
    if (!user) {
      user = new User({
        id: userId,
        name: name || "Google User",
        email: email || "",
        picture: picture || "",
        phone: "",
        points: 0,
        badgeTier: "bronze",
        ward: "Unknown Ward",
        isAgency: false
      });
      await user.save();
    } else {
      let updated = false;
      if (name && name !== user.name) { user.name = name; updated = true; }
      if (email && email !== user.email) { user.email = email; updated = true; }
      if (picture && picture !== user.picture) { user.picture = picture; updated = true; }
      if (updated) await user.save();
    }
    res.json(user.toObject());
  } catch (error) {
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

app.get("/api/user/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/user/:uid/votes", async (req, res) => {
  try {
    const votes = await Verification.find({ userId: req.params.uid });
    const issueIds = votes.map(v => v.issueId);
    res.json({ votedIssueIds: issueIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/user/:uid/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.uid })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/user/:uid/notifications/:id/read", async (req, res) => {
  try {
    await Notification.updateOne({ id: req.params.id, userId: req.params.uid }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const citizens = await User.find({ isAgency: false }).sort({ points: -1 }).limit(10).lean();
    res.json(citizens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/issues", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500; // default limit to prevent crashing
    const issues = await Issue.find({ adminStatus: { $ne: "fake" } })
                              .sort({ createdAt: -1 })
                              .limit(limit)
                              .lean();
                              
    const issueIds = issues.map(i => i.id);
    const reports = await Report.find({ issueId: { $in: issueIds } }).lean();
    
    const enrichedIssues = issues.map(issue => {
      const issueReports = reports.filter(r => r.issueId === issue.id);
      const firstReport = issueReports.length > 0 ? issueReports[0] : null;
      const photoUrl = firstReport ? (firstReport.mediaList?.length > 0 ? firstReport.mediaList[0].photoUrl : firstReport.photoUrl) : null;
      const mediaType = firstReport ? (firstReport.mediaList?.length > 0 ? firstReport.mediaList[0].mediaType : (firstReport.mediaType || "image")) : "image";
      return {
        ...issue,
        photoUrl,
        mediaType,
        mediaList: firstReport ? firstReport.mediaList : [],
        userDescription: firstReport ? firstReport.userDescription : null
      };
    });
    
    res.json(enrichedIssues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/issues/:id", async (req, res) => {
  try {
    const issue = await Issue.findOne({ id: req.params.id }).lean();
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    
    const reports = await Report.find({ issueId: issue.id }).lean();
    const verifications = await Verification.find({ issueId: issue.id }).lean();
    const agency = await Agency.findOne({ id: issue.agencyId }).lean();
    
    res.json({
      ...issue,
      reports,
      verifications,
      agencyName: agency ? agency.name : "Unassigned Agency"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { userId, photoUrl: oldPhotoUrl, mediaType: oldMediaType, lat, lng, userCategory, userDescription, mediaList } = req.body;
    if (!userId || !lat || !lng) {
      return res.status(400).json({ error: "userId, lat, and lng are required." });
    }

    // Support both old format (single photoUrl) and new format (mediaList array)
    let finalMediaList = mediaList || [];
    if (finalMediaList.length === 0 && oldPhotoUrl) {
      finalMediaList = [{ photoUrl: oldPhotoUrl, mediaType: oldMediaType }];
    }

    const photoUrl = finalMediaList.length > 0 ? finalMediaList[0].photoUrl : "";
    const uploadedExtension = path.extname(photoUrl || "").replace(".", "").toLowerCase();
    const mediaType = finalMediaList.length > 0 && finalMediaList[0].mediaType ? finalMediaList[0].mediaType : getMediaTypeFromMime(getMimeFromExtension(uploadedExtension));
    const mediaWord = finalMediaList.some(m => m.mediaType === "video") ? "video" : "photo";

    const now = Date.now();
    let category = userCategory || "Roads & Potholes";
    let severity = "Medium";
    const citizenDescription = userDescription?.trim() || "Civic report submitted by citizen.";
    let description = citizenDescription;
    let aiAssessment = null;
    let confidence = 0.8;
    let fakeConfidence = 0;
    let aiStatus = "not_requested";
    let aiMessage = null;
    let suggestedAgency = "agency_pwd";

    const client = getGeminiClient();
    let aiAnalyzed = false;
    let isFakeReport = false;

    if (client && finalMediaList.length > 0) {
      try {
        let inlineDataParts = [];
        for (const media of finalMediaList) {
          if (media.photoUrl && media.photoUrl.startsWith("/uploads/")) {
            const localPath = path.join(process.cwd(), media.photoUrl);
            if (fs.existsSync(localPath)) {
              const stats = fs.statSync(localPath);
              if (stats.size <= MAX_INLINE_MEDIA_BYTES) {
                const mediaBuffer = fs.readFileSync(localPath);
                const mimeType = getMimeFromExtension(path.extname(localPath));
                const base64Data = mediaBuffer.toString("base64");
                inlineDataParts.push({ inlineData: { mimeType, data: base64Data } });
              } else {
                console.warn(`Media file too large for inline Gemini analysis (${stats.size} bytes)`);
              }
            }
          }
        }
        
        if (inlineDataParts.length > 0) {
          const promptText = buildCitizenReportPrompt(mediaWord, finalMediaList.some(m => m.mediaType === "video"));
          aiStatus = "analyzing";
          const response = await generateGeminiContentWithRetry(client, {
            model: GEMINI_MODEL,
            contents: [promptText, ...inlineDataParts],
            config: { responseMimeType: "application/json" }
          });
          const classification = normalizeClassification(
            normalizeGeminiJson(getGeminiText(response)),
            {
              isFake: false,
              fakeConfidence: 0,
              category,
              severity,
              suggested_agency: suggestedAgency,
              confidence,
              description
            }
          );

          if (classification.isFake) {
              console.log("AI flagged issue as fake. Saving for community verification.");
              isFakeReport = true;
              // We intentionally DO NOT reject here anymore. Let community vote.
          }
          category = classification.category;
          severity = classification.severity;
          aiAssessment = classification.description;
          description = citizenDescription;
          suggestedAgency = classification.suggested_agency;
          confidence = classification.confidence;
          fakeConfidence = classification.fakeConfidence;
          aiAnalyzed = true;
          aiStatus = "complete";
          aiMessage = AI_COMPLETE_MESSAGE;
          geminiStatus = {
            configured: true,
            connected: true,
            model: GEMINI_MODEL,
            lastCheckedAt: Date.now(),
            lastErrorCode: null,
            lastUserMessage: null
          };
        }
      } catch (e) {
        const classified = classifyGeminiError(e);
        aiStatus = classified.status === "RATE_LIMITED" ? "rate_limited" : "temporarily_unavailable";
        aiMessage = classified.userMessage;
        geminiStatus = {
          configured: true,
          connected: false,
          model: GEMINI_MODEL,
          lastCheckedAt: Date.now(),
          lastErrorCode: classified.code,
          lastUserMessage: classified.userMessage
        };
      }
    }
    
    if (!aiAnalyzed) {
      if (!aiMessage) {
        aiStatus = client ? "temporarily_unavailable" : "not_configured";
        aiMessage = AI_UNAVAILABLE_MESSAGE;
      }
      description = citizenDescription;
      const textToAnalyze = `${userCategory || ""} ${userDescription || ""}`.toLowerCase();
      if (textToAnalyze.includes("light") || textToAnalyze.includes("dark") || textToAnalyze.includes("flicker") || textToAnalyze.includes("electricity")) {
        category = "Street Lights";
        suggestedAgency = "agency_light";
      } else if (textToAnalyze.includes("garbage") || textToAnalyze.includes("dump") || textToAnalyze.includes("waste") || textToAnalyze.includes("smell") || textToAnalyze.includes("plastic") || textToAnalyze.includes("trash")) {
        category = "Garbage & Sanitation";
        suggestedAgency = "agency_waste";
      } else if (textToAnalyze.includes("water") || textToAnalyze.includes("sewer") || textToAnalyze.includes("leak") || textToAnalyze.includes("pipe") || textToAnalyze.includes("clog") || textToAnalyze.includes("flood")) {
        category = "Sewage & Water Leak";
        suggestedAgency = "agency_water";
      } else {
        category = "Roads & Potholes";
        suggestedAgency = "agency_pwd";
      }
      if (textToAnalyze.includes("dangerous") || textToAnalyze.includes("severe") || textToAnalyze.includes("accident") || textToAnalyze.includes("crashed") || textToAnalyze.includes("major")) {
        severity = "High";
      } else if (textToAnalyze.includes("minor") || textToAnalyze.includes("low") || textToAnalyze.includes("flickering")) {
        severity = "Low";
      } else {
        severity = "Medium";
      }
    }
    
    let matchedIssue = null;
    const matchRadius = 50;
    const openIssues = await Issue.find({ category, status: { $ne: "resolved" } });
    for (const issue of openIssues) {
      const dist = getDistanceInMeters(lat, lng, issue.lat, issue.lng);
      if (dist <= matchRadius) {
        matchedIssue = issue;
        break;
      }
    }
    
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newReport = new Report({
      id: reportId,
      userId,
      issueId: "",
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1599740831419-b5ce97c1b7c6?auto=format&fit=crop&w=600&q=80",
      mediaType,
      mediaList: finalMediaList,
      userDescription: citizenDescription,
      lat,
      lng,
      geohash: encodeGeohash(lat, lng),
      category,
      createdAt: now
    });
    
    let issueId = "";
    if (matchedIssue) {
      matchedIssue.reportCount = (matchedIssue.reportCount || 0) + 1;
      await matchedIssue.save();
      newReport.issueId = matchedIssue.id;
      issueId = matchedIssue.id;
    } else {
      issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newIssue = new Issue({
        id: issueId,
        category,
        severity,
        description,
        originalDescription: citizenDescription,
        aiAssessment,
        lat,
        lng,
        geohash: encodeGeohash(lat, lng),
        reportCount: 1,
        agencyId: suggestedAgency,
        status: "reported",
        createdAt: now,
        markedFixedAt: null,
        resolvedAt: null,
        StillBrokenCount: 0,
        isFake: isFakeReport,
        fakeConfidence,
        aiAnalyzed,
        aiProvider: aiAnalyzed ? "gemini" : "heuristic",
        aiStatus,
        aiMessage,
        confidence,
        reportedBy: userId || null
      });
      await newIssue.save();
      newReport.issueId = issueId;
    }
    await newReport.save();
    
    const user = await User.findOne({ id: userId });
    if (user) {
      user.points = (user.points || 0) + 10;
      user.badgeTier = getBadgeTier(user.points);
      await user.save();
    }
    
    const updatedIssue = await Issue.findOne({ id: issueId }).lean();
    res.json({
      success: true,
      report: newReport.toObject(),
      issue: updatedIssue,
      merged: !!matchedIssue,
      pointsAwarded: 10,
      aiAnalyzed,
      aiProvider: aiAnalyzed ? "gemini" : "heuristic",
      aiStatus,
      aiMessage,
      aiAssessment
    });
  } catch (err) {
    console.error("Report submission failed:", err);
    res.status(500).json({ error: "Report submission failed. Please try again." });
  }
});

app.post("/api/verify", async (req, res) => {
  try {
    const { userId, issueId, type } = req.body;
    if (!userId || !issueId || !type) {
      return res.status(400).json({ error: "Missing required parameters." });
    }
    
    const issue = await Issue.findOne({ id: issueId });
    const user = await User.findOne({ id: userId });
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    
    const existingVote = await Verification.findOne({ issueId, userId });
    if (existingVote) {
      return res.status(400).json({ error: "You have already voted on this issue." });
    }
    
    const voteId = `${issueId}_${userId}_${Date.now()}`;
    const newVerification = new Verification({
      id: voteId,
      issueId,
      userId,
      type,
      createdAt: Date.now()
    });
    await newVerification.save();
    
    const relatedVerifications = await Verification.find({ issueId, type });
    const count = relatedVerifications.length;
    let pointsAwarded = 0;
    
    if (type === "vote_real" || type === "confirm_exists") {
      pointsAwarded = 5;
      issue.severity = "High";
      if (issue.status === "reported" && count >= 2) {
        issue.status = "verified";
      }
    } else if (type === "vote_fake" || type === "confirm_fake") {
      pointsAwarded = 5;
      if (issue.isFake) {
        await Issue.deleteOne({ id: issueId });
        await Report.deleteMany({ issueId });
        await Verification.deleteMany({ issueId });
        if (user) {
          user.points = (user.points || 0) + pointsAwarded;
          user.badgeTier = getBadgeTier(user.points);
          await user.save();
        }
        return res.json({ success: true, deleted: true, pointsAwarded, updatedUser: user ? user.toObject() : null });
      }
    } else if (type === "confirm_fixed") {
      pointsAwarded = 15;
      if (issue.status === "pending_fix_confirmation" && count >= 2) {
        issue.status = "resolved";
        issue.resolvedAt = Date.now();
      }
    } else if (type === "still_broken") {
      pointsAwarded = 5;
      if (issue.status === "pending_fix_confirmation") {
        issue.status = "verified";
        issue.StillBrokenCount = (issue.StillBrokenCount || 0) + 1;
        issue.markedFixedAt = null;
        await Verification.deleteMany({ issueId, type: "confirm_fixed" });
      }
    }
    
    await issue.save();
    
    if (user) {
      user.points = (user.points || 0) + pointsAwarded;
      user.badgeTier = getBadgeTier(user.points);
      await user.save();
    }
    
    res.json({
      success: true,
      issue: issue.toObject(),
      pointsAwarded,
      updatedUser: user ? user.toObject() : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/agency/fix", async (req, res) => {
  try {
    const { issueId } = req.body;
    if (!issueId) return res.status(400).json({ error: "Missing issueId" });
    
    const issue = await Issue.findOne({ id: issueId });
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    
    issue.status = "pending_fix_confirmation";
    issue.markedFixedAt = Date.now();
    await issue.save();
    
    res.json({ success: true, issue: issue.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/transparency", async (req, res) => {
  try {
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const issues = await Issue.find().lean();
    const agencies = await Agency.find().lean();
    
    const totalReportedIssues = issues.length;
    const resolvedIssues = issues.filter(i => i.status === "resolved");
    const totalResolved = resolvedIssues.length;
    const totalGamesBlocked = issues.reduce((acc, i) => acc + (i.StillBrokenCount || 0), 0);
    
    const agencyComparisons = agencies.map(agency => {
      const agencyIssues = issues.filter(i => i.agencyId === agency.id);
      const selfMarkedFixed = agencyIssues.filter(i => i.markedFixedAt !== null).length;
      const citizenConfirmedResolved = agencyIssues.filter(i => i.status === "resolved").length;
      const stillBrokenDiscrepancy = agencyIssues.reduce((sum, i) => sum + (i.StillBrokenCount || 0), 0);
      return {
        name: agency.name,
        selfReported: selfMarkedFixed + stillBrokenDiscrepancy,
        citizenConfirmed: citizenConfirmedResolved,
        discrepancyCount: stillBrokenDiscrepancy
      };
    });
    
    const trends = Array.from({ length: 4 }).map((_, index) => {
      const weekStart = now - (4 - index) * ONE_WEEK;
      const weekEnd = weekStart + ONE_WEEK;
      const openedInWeek = issues.filter(i => i.createdAt >= weekStart && i.createdAt < weekEnd).length;
      const resolvedInWeek = issues.filter(i => i.resolvedAt && i.resolvedAt >= weekStart && i.resolvedAt < weekEnd).length;
      return {
        week: `Wk -${3 - index}`,
        "Issues Opened": openedInWeek,
        "Citizen Resolved": resolvedInWeek
      };
    });
    
    res.json({
      totalReportedIssues,
      totalResolved,
      totalGamesBlocked,
      agencyComparisons,
      trends
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/hotspots", async (req, res) => {
  try {
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const cellMap = {};
    const reports = await Report.find().lean();
    
    reports.forEach(report => {
      const rLat = Number((report.lat || 0).toFixed(3));
      const rLng = Number((report.lng || 0).toFixed(3));
      const key = `${rLat}_${rLng}`;
      if (!cellMap[key]) {
        cellMap[key] = { lat: rLat, lng: rLng, thisWeek: 0, lastWeek: 0, total: 0, issues: [] };
      }
      cellMap[key].total += 1;
      const age = now - (report.createdAt || report.timestamp || now);
      if (age <= ONE_WEEK) {
        cellMap[key].thisWeek += 1;
      } else if (age > ONE_WEEK && age <= 2 * ONE_WEEK) {
        cellMap[key].lastWeek += 1;
      }
    });
    
    const hotspots = Object.keys(cellMap).map(key => {
      const cell = cellMap[key];
      const growthRate = (cell.thisWeek - cell.lastWeek) / Math.max(cell.lastWeek, 1);
      const isWatchZone = growthRate > 0.5 && cell.total >= 3;
      return {
        cellKey: key,
        lat: cell.lat,
        lng: cell.lng,
        growthRate: Number(growthRate.toFixed(2)),
        thisWeek: cell.thisWeek,
        lastWeek: cell.lastWeek,
        totalCount: cell.total,
        isWatchZone
      };
    });
    res.json(hotspots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/authorities", (req, res) => {
  const authorities = [
    { id: "mcd", name: "Municipal Corporation of Delhi", city: "Delhi", state: "Delhi", jurisdiction: "All Delhi zones", phone: "011-23227050", website: "https://mcdonline.nic.in", categories: ["Roads", "Sanitation", "Water"] },
    { id: "ndmc", name: "New Delhi Municipal Council", city: "New Delhi", state: "Delhi", jurisdiction: "New Delhi district", phone: "011-23363740", website: "https://www.ndmc.gov.in", categories: ["Roads", "Lights", "Parks"] },
    { id: "dda", name: "Delhi Development Authority", city: "Delhi", state: "Delhi", jurisdiction: "Development areas", phone: "011-24617847", website: "https://dda.gov.in", categories: ["Housing", "Planning"] },
    { id: "bmc", name: "Brihanmumbai Municipal Corporation", city: "Mumbai", state: "Maharashtra", jurisdiction: "Greater Mumbai", phone: "022-22620251", website: "https://portal.mcgm.gov.in", categories: ["Roads", "Water", "Sanitation"] },
    { id: "bbmp", name: "Bruhat Bengaluru Mahanagara Palike", city: "Bengaluru", state: "Karnataka", jurisdiction: "Greater Bengaluru", phone: "080-22975903", website: "https://bbmp.gov.in", categories: ["Roads", "Lights", "Water", "Sanitation"] },
    { id: "gcc", name: "Greater Chennai Corporation", city: "Chennai", state: "Tamil Nadu", jurisdiction: "Chennai Metropolitan", phone: "044-25619200", website: "https://chennaicorporation.gov.in", categories: ["Roads", "Sanitation", "Water"] },
    { id: "ghmc", name: "Greater Hyderabad Municipal Corporation", city: "Hyderabad", state: "Telangana", jurisdiction: "Greater Hyderabad", phone: "040-21111111", website: "https://www.ghmc.gov.in", categories: ["Roads", "Water", "Sanitation"] },
    { id: "kmc", name: "Kolkata Municipal Corporation", city: "Kolkata", state: "West Bengal", jurisdiction: "Kolkata city", phone: "033-22861000", website: "https://www.kmcgov.in", categories: ["Roads", "Lights", "Water"] },
    { id: "pmc", name: "Pune Municipal Corporation", city: "Pune", state: "Maharashtra", jurisdiction: "Pune city", phone: "020-25501000", website: "https://www.pmc.gov.in", categories: ["Roads", "Water", "Sanitation"] },
    { id: "amc", name: "Ahmedabad Municipal Corporation", city: "Ahmedabad", state: "Gujarat", jurisdiction: "Ahmedabad city", phone: "079-25391811", website: "https://ahmedabadcity.gov.in", categories: ["Roads", "Water", "Sanitation"] },
    { id: "jmc", name: "Jaipur Municipal Corporation", city: "Jaipur", state: "Rajasthan", jurisdiction: "Jaipur city", phone: "0141-2619400", website: "https://jaipurmc.org", categories: ["Roads", "Sanitation"] },
    { id: "lmc", name: "Lucknow Municipal Corporation", city: "Lucknow", state: "Uttar Pradesh", jurisdiction: "Lucknow city", phone: "0522-2286627", website: "https://lmc.up.nic.in", categories: ["Roads", "Water", "Sanitation"] }
  ];
  const cityFilter = (req.query.city || "").toLowerCase();
  if (cityFilter) {
    return res.json(authorities.filter((a) => a.city.toLowerCase().includes(cityFilter)));
  }
  res.json(authorities);
});

app.post("/api/whatsapp/simulate", async (req, res) => {
  try {
    const { sender, message, lat, lng, imageBase64, citizenName, citizenEmail, mediaFiles } = req.body;
    if (!sender || !message) {
      return res.status(400).json({ error: "Sender and message are required" });
    }
    
    const now = Date.now();
    let photoUrl = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80";
    if (imageBase64) {
      try {
        const cleanedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(cleanedBase64, "base64");
        const filename = `wa_report_${Date.now()}.jpg`;
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, buffer);
        photoUrl = `/uploads/${filename}`;
      } catch (e) {
        console.error("WhatsApp photo conversion failed", e);
      }
    }
    
    const reportLat = lat || 12.9712 + (Math.random() - 0.5) * 0.01;
    const reportLng = lng || 77.641 + (Math.random() - 0.5) * 0.01;
    
    const waLog = new WhatsappMessage({
      id: `wa_${Date.now()}`,
      sender,
      citizenName,
      citizenEmail,
      message,
      lat: reportLat,
      lng: reportLng,
      photoUrl,
      mediaList: mediaFiles,
      createdAt: now
    });
    await waLog.save();

    // Upsert User
    const userId = `wa_user_${sender.replace(/\D/g, '')}`;
    let user = await User.findOne({ id: userId });
    if (!user && citizenName) {
      user = new User({
        id: userId,
        name: citizenName,
        phone: sender,
        email: citizenEmail,
        points: 0,
        badgeTier: "bronze",
        ward: "Unknown Ward",
        isAgency: false
      });
      await user.save();
    }
    
    let category = "Roads & Potholes";
    let suggestedAgency = "agency_pwd";
    let severity = "Medium";
    let description = `WhatsApp Bot: "${message}"`;
    let confidence = 0.5;
    let isFakeReport = false;
    let aiAnalyzed = false;

    if (imageBase64) {
      const client = getGeminiClient();
      if (client) {
        try {
          const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const cleanedBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
          
          const promptText = `Analyze this citizen-reported civic issue photo from WhatsApp.
            Check whether it shows a genuine civic issue (like a pothole, garbage dump, broken street light, sewage leak, etc) or whether it is irrelevant, unrelated, staged, or fake (like an X-ray, a selfie, a screenshot, etc).
            If it is completely irrelevant or fake, set "isFake" to true, and in the "description" field, explicitly state what the image actually is (e.g., "This appears to be an X-ray image") and explain why it's not a civic issue. Set "fakeConfidence" to a number between 0 and 1.
            
            If genuine, classify into:
            - "Roads & Potholes"
            - "Garbage & Sanitation"
            - "Street Lights"
            - "Sewage & Water Leak"
            
            Assess severity (High, Medium, Low).
            Determine agency from:
            - "agency_pwd" (for Roads & Potholes)
            - "agency_waste" (for Garbage & Sanitation)
            - "agency_light" (for Street Lights)
            - "agency_water" (for Sewage & Water Leak)

            Return ONLY structured JSON adhering strictly to:
            {
              "isFake": boolean,
              "fakeConfidence": number,
              "category": string,
              "severity": "High" | "Medium" | "Low",
              "suggested_agency": string,
              "confidence": number,
              "description": string
            }`;
          const response = await generateGeminiContentWithRetry(client, {
            model: GEMINI_MODEL,
            contents: [promptText, { inlineData: { mimeType, data: cleanedBase64 } }],
            config: { responseMimeType: "application/json" }
          });
          const classification = normalizeClassification(
            normalizeGeminiJson(getGeminiText(response)),
            {
              isFake: false,
              fakeConfidence: 0,
              category,
              severity,
              suggested_agency: suggestedAgency,
              confidence,
              description
            }
          );
          if (classification.isFake) {
              console.log("WhatsApp AI flagged issue as fake. Saving for community verification.");
              isFakeReport = true;
          }
          category = classification.category;
          severity = classification.severity;
          description = `WhatsApp Bot [AI Assessed]: ${classification.description}`;
          suggestedAgency = classification.suggested_agency;
          confidence = classification.confidence;
          aiAnalyzed = true;
        } catch (e) {
          console.error("WhatsApp Gemini classification failed:", e);
        }
      }
    }

    if (!aiAnalyzed) {
      const text = message.toLowerCase();
      if (text.includes("light") || text.includes("electricity") || text.includes("dark")) {
        category = "Street Lights";
        suggestedAgency = "agency_light";
      } else if (text.includes("garbage") || text.includes("trash") || text.includes("waste")) {
        category = "Garbage & Sanitation";
        suggestedAgency = "agency_waste";
      } else if (text.includes("water") || text.includes("sewer") || text.includes("leak") || text.includes("drain")) {
        category = "Sewage & Water Leak";
        suggestedAgency = "agency_water";
      }
      if (text.includes("dangerous") || text.includes("accident") || text.includes("huge") || text.includes("broken")) {
        severity = "High";
      }
    }
    
    let matchedIssue = null;
    const openIssues = await Issue.find({ category, status: { $ne: "resolved" } });
    for (const issue of openIssues) {
      const d = getDistanceInMeters(reportLat, reportLng, issue.lat, issue.lng);
      if (d <= 50) {
        matchedIssue = issue;
        break;
      }
    }
    
    const reportId = `report_wa_${Date.now()}`;
    const newReport = new Report({
      id: reportId,
      userId: userId,
      issueId: "",
      photoUrl,
      mediaList: mediaFiles,
      lat: reportLat,
      lng: reportLng,
      geohash: encodeGeohash(reportLat, reportLng),
      category,
      createdAt: now
    });
    
    let issueId = "";
    if (matchedIssue) {
      matchedIssue.reportCount = (matchedIssue.reportCount || 0) + 1;
      await matchedIssue.save();
      newReport.issueId = matchedIssue.id;
      issueId = matchedIssue.id;
    } else {
      issueId = `issue_wa_${Date.now()}`;
      const newIssue = new Issue({
        id: issueId,
        category,
        severity,
        description,
        lat: reportLat,
        lng: reportLng,
        geohash: encodeGeohash(reportLat, reportLng),
        reportCount: 1,
        agencyId: suggestedAgency,
        status: "reported",
        createdAt: now,
        markedFixedAt: null,
        resolvedAt: null,
        StillBrokenCount: 0,
        isFake: isFakeReport,
        reportedBy: userId
      });
      await newIssue.save();
      newReport.issueId = issueId;
    }
    await newReport.save();
    
    const updatedIssue = await Issue.findOne({ id: issueId }).lean();
    res.json({
      success: true,
      message: "WhatsApp simulated report processed successfully!",
      waLog: waLog.toObject(),
      issue: updatedIssue,
      merged: !!matchedIssue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NagarSetu full-stack server running at http://0.0.0.0:${PORT}`);
});
