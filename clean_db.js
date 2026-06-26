import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Issue, Report, Verification } from "./models.js";

dotenv.config();

async function cleanDatabase() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  
  console.log("Deleting all issues...");
  await Issue.deleteMany({});
  
  console.log("Deleting all reports...");
  await Report.deleteMany({});
  
  console.log("Deleting all verifications...");
  await Verification.deleteMany({});

  console.log("Cleaning uploads directory...");
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    for (const file of files) {
      if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png") || file.endsWith(".mp4") || file.endsWith(".webm") || file.endsWith(".mov") || file.endsWith(".3gp")) {
        fs.unlinkSync(path.join(uploadsDir, file));
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} files from uploads/`);
  }

  console.log("Database cleanup complete!");
  mongoose.connection.close();
}

cleanDatabase().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
