// Seeds demo Admin + Worker documents per ward so the assignment flow isn't
// empty on stage (§9). Idempotent — safe to run on every boot.
// Credentials are documented in admin/README.md.

import { Admin, Worker } from "./models.js";
import { hashPassword } from "./auth.js";

const WARDS = [
  "Ward 84 - Indiranagar",
  "Ward 100 - Koramangala",
  "Ward 52 - Jayanagar"
];

const CATEGORIES = [
  "Roads & Potholes",
  "Garbage & Sanitation",
  "Street Lights",
  "Sewage & Water Leak"
];

const WORKER_NAMES = {
  "Roads & Potholes": ["Ravi Kumar", "Suresh M.", "Imran Khan"],
  "Garbage & Sanitation": ["Lakshmi Devi", "Mohan R.", "Joseph P."],
  "Street Lights": ["Anil S.", "Deepak N."],
  "Sewage & Water Leak": ["Faisal A.", "Venkatesh G."]
};

async function ensureAdmin({ id, username, name, role, ward, category, password }) {
  const existing = await Admin.findOne({ id });
  if (existing) {
    // Keep password hashes in sync with the documented defaults on each boot
    // so the README credentials always work in dev/demo.
    existing.username = username;
    existing.name = name;
    existing.role = role;
    existing.ward = ward;
    existing.category = category || null;
    existing.passwordHash = hashPassword(password);
    await existing.save();
    return;
  }
  await Admin.create({
    id, username, name, role, ward, category: category || null,
    passwordHash: hashPassword(password)
  });
}

async function ensureWorker({ id, name, phone, specialization, ward }) {
  const existing = await Worker.findOne({ id });
  if (existing) {
    existing.name = name;
    existing.phone = phone;
    existing.specialization = specialization;
    existing.ward = ward;
    await existing.save();
    return;
  }
  await Worker.create({
    id, name, phone, specialization, ward,
    status: "available",
    completedCount: Math.floor(Math.random() * 12),
    avgResolutionHours: Number((20 + Math.random() * 40).toFixed(2)),
    approvedRate: Number((0.7 + Math.random() * 0.3).toFixed(2))
  });
}

export async function seedAdminData() {
  try {
    // Super admin — full access, manages all wards.
    await ensureAdmin({
      id: "admin_super",
      username: "superadmin",
      name: "Super Admin",
      role: "super_admin",
      ward: "All Wards",
      password: "admin@1234"
    });

    // Ward admins are removed - superadmin manages all.

    // Two specialized workers per category per ward.
    let workerSeq = 0;
    for (const ward of WARDS) {
      for (const category of CATEGORIES) {
        const names = WORKER_NAMES[category] || ["Field Worker"];
        for (const name of names.slice(0, 2)) {
          workerSeq += 1;
          await ensureWorker({
            id: `worker_seed_${String(workerSeq).padStart(3, "0")}`,
            name,
            phone: `+9198${String(10000000 + workerSeq)}`,
            specialization: category,
            ward
          });
        }
      }
    }

    console.log("[admin] seed complete: super admin + ward admins + workers");
  } catch (err) {
    console.error("[admin] seed error:", err.message);
  }
}
