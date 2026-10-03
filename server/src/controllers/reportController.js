import fs from "fs/promises";
import Report, { CATEGORIES, STATUSES } from "../models/Report.js";

const removeFile = async (file) => {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
};

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

// POST /api/reports   (multipart/form-data)
export const createReport = async (req, res, next) => {
  try {
    const { title, description, category, address, reporterName, reporterEmail } = req.body;
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);

    if (!req.file) throw badRequest("A photo is required");
    if (!title?.trim()) throw badRequest("Title is required");
    if (!description?.trim()) throw badRequest("Description is required");
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw badRequest("Valid latitude is required");
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw badRequest("Valid longitude is required");
    if (category && !CATEGORIES.includes(category)) {
      throw badRequest(`Category must be one of: ${CATEGORIES.join(", ")}`);
    }

    const report = await Report.create({
      title,
      description,
      category: category || "other",
      photo: `/uploads/${req.file.filename}`,
      location: { type: "Point", coordinates: [lng, lat] },
      address,
      reporterName,
      reporterEmail,
    });

    res.status(201).json(report);
  } catch (err) {
    await removeFile(req.file); // don't keep orphan photos when the report fails
    next(err);
  }
};

// GET /api/reports?status=&category=&page=&limit=
export const getReports = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 500);

    const filter = {};
    if (status) {
      if (!STATUSES.includes(status)) throw badRequest("Invalid status filter");
      filter.status = status;
    }
    if (category) {
      if (!CATEGORIES.includes(category)) throw badRequest("Invalid category filter");
      filter.category = category;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Report.countDocuments(filter),
    ]);

    res.json({ total, page, limit, reports });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/:id
export const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (err) {
    next(err);
  }
};
