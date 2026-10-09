// Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env
// Usage:  npm run seed            (creates the admin if missing)
//         npm run seed -- --reset (also resets the password of an existing admin)
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const { default: User } = await import("../models/User.js");

const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || "Admin";
const reset = process.argv.includes("--reset");

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Copy .env.example to .env first.");
  process.exit(1);
}
if (!email || password.length < 8) {
  console.error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in server/.env");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email });

  if (existing && !reset) {
    console.log(`Admin ${email} already exists. Use "npm run seed -- --reset" to change the password.`);
  } else if (existing) {
    existing.passwordHash = await User.hashPassword(password);
    await existing.save();
    console.log(`Password reset for ${email}`);
  } else {
    await User.create({ name, email, passwordHash: await User.hashPassword(password), role: "admin" });
    console.log(`Admin created: ${email}`);
  }
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
