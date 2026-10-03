import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

// Routes will be added in the next steps

export default app;
