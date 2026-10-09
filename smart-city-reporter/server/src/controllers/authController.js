import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Compared against when the email is unknown, so response time doesn't reveal valid emails
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// POST /api/auth/login   { email, password }
export const login = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    const valid = user ? await user.verifyPassword(password) : await bcrypt.compare(password, DUMMY_HASH);
    if (!user || !valid) return res.status(401).json({ message: "Wrong email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "12h",
    });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const me = (req, res) => res.json({ user: publicUser(req.user) });
