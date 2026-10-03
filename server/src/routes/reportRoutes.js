import { Router } from "express";
import { uploadPhoto } from "../middleware/upload.js";
import { createReport, getReports, getReportById } from "../controllers/reportController.js";

const router = Router();

router.get("/", getReports);
router.get("/:id", getReportById);
router.post("/", uploadPhoto, createReport);

export default router;
