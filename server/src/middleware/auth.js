import jwt from "jsonwebtoken";
import User from "../models/User.js";

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const loadUser = async (token) => {
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(id).select("-passwordHash");
};

// Requires a valid admin token
export const requireAdmin = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: "Login required" });
  try {
    const user = await loadUser(token);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (user.role !== "admin") return res.status(403).json({ message: "Admins only" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

// Attaches req.user when a valid token is sent, but never blocks the request
export const optionalAuth = async (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = await loadUser(token);
    } catch {
      /* ignore bad tokens on public routes */
    }
  }
  next();
};
