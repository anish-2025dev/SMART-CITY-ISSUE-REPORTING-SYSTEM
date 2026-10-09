import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { allowedOrigins } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Needed so rate limiting sees the real client IP behind Render, Railway, Nginx, etc.
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// cross-origin resource policy: photos are loaded by the React app from a different origin
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: allowedOrigins() }));
app.use(express.json({ limit: "100kb" }));

// Serve uploaded photos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart City API running" });
});

// API routes
app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// Must stay last
app.use(notFound);
app.use(errorHandler);

export default app;
