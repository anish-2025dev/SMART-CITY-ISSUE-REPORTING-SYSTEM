import { Router } from "express";
import { uploadPhoto } from "../middleware/upload.js";
import { requireAdmin, optionalAuth } from "../middleware/auth.js";
import { createReportLimiter } from "../middleware/rateLimit.js";
import {
  createReport, getReports, getReportById, getStats,
  updateReport, deleteReport, suggestCategory,
} from "../controllers/reportController.js";

const router = Router();

// Public
router.get("/", optionalAuth, getReports);
router.post("/", createReportLimiter, uploadPhoto, createReport);
router.post("/categorize", suggestCategory);

// Admin (keep /stats above /:id so it is not read as an id)
router.get("/stats", requireAdmin, getStats);

router.get("/:id", optionalAuth, getReportById);
router.patch("/:id", requireAdmin, updateReport);
router.delete("/:id", requireAdmin, deleteReport);

export default router;
