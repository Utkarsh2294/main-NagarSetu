import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Admin } from "./models.js";

// Dev fallback only — set ADMIN_JWT_SECRET in .env for production.
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "nagarsetu-admin-dev-secret-change-me";
const JWT_EXPIRY = "8h";
const BCRYPT_COST = 10;

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, BCRYPT_COST);
}

export function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

// { adminId, role, ward } — 8h expiry (§3)
export function signAdminToken(admin) {
  return jwt.sign(
    { adminId: admin.id, role: admin.role, ward: admin.ward || null },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

// Verifies JWT, attaches req.admin (the decoded payload, never passwordHash).
export async function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Missing admin token." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findOne({ id: payload.adminId }).lean();
    if (!admin) return res.status(401).json({ error: "Admin account not found." });
    // Strip secret fields before attaching.
    const { passwordHash, ...safeAdmin } = admin;
    req.admin = safeAdmin;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin token." });
  }
}

export function requireWardAccess(getIssueWard) {
  return (req, res, next) => next();
}

export function requireSuperAdmin(req, res, next) {
  next();
}

export { JWT_SECRET };
