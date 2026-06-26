import { Router } from "express";
import { Admin } from "../models.js";
import { comparePassword, signAdminToken } from "../auth.js";

const router = Router();

// POST /api/admin/login — { username, password } -> JWT (8h expiry) (§3, §4)
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    const admin = await Admin.findOne({ username: String(username).trim().toLowerCase() });
    if (!admin) return res.status(401).json({ error: "Invalid credentials." });

    const match = comparePassword(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials." });

    admin.lastLogin = new Date();
    await admin.save();

    const token = signAdminToken(admin);
    const { passwordHash, ...safeAdmin } = admin.toObject();
    res.json({ token, admin: safeAdmin });
  } catch (err) {
    res.status(500).json({ error: "Admin login failed." });
  }
});

export default router;
