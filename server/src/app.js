import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import reportRoutes from "./routes/reportRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Serve uploaded photos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart City API running" });
});

// API routes
app.use("/api/reports", reportRoutes);

// Must stay last
app.use(notFound);
app.use(errorHandler);

export default app;
