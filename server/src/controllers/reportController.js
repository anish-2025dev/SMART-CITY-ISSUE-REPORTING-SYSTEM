import fs from "fs/promises";
import path from "path";
import Report, { CATEGORIES, STATUSES } from "../models/Report.js";
import { categorize } from "../utils/categorizer.js";
import { UPLOAD_DIR } from "../middleware/upload.js";

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const removeUploadedFile = async (file) => {
  if (file?.path) await fs.unlink(file.path).catch(() => {});
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Citizens must not see who reported what; admins see everything
const PRIVATE_FIELDS = "-reporterEmail -reporterName";
const visibleFields = (req) => (req.user?.role === "admin" ? "" : PRIVATE_FIELDS);

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

    // "auto" or empty -> detect from the text. Anything else must be a valid category.
    const chosen = category && category !== "auto" ? category : null;
    if (chosen && !CATEGORIES.includes(chosen)) {
      throw badRequest(`Category must be one of: auto, ${CATEGORIES.join(", ")}`);
    }

    const report = await Report.create({
      title,
      description,
      category: chosen || categorize(title, description).category,
      categorySource: chosen ? "manual" : "auto",
      photo: `/uploads/${req.file.filename}`,
      location: { type: "Point", coordinates: [lng, lat] },
      address,
      reporterName,
      reporterEmail,
      statusHistory: [{ status: "reported", note: "Report submitted" }],
    });

    // Never echo the reporter's contact details back from a public endpoint
    const { reporterEmail: _e, reporterName: _n, ...safe } = report.toObject();
    res.status(201).json(safe);
  } catch (err) {
    await removeUploadedFile(req.file); // don't keep orphan photos when the report fails
    next(err);
  }
};

// GET /api/reports?status=&category=&search=&page=&limit=
export const getReports = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
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
    if (search?.trim()) {
      const rx = new RegExp(escapeRegex(search.trim().slice(0, 60)), "i");
      filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select(visibleFields(req))
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), limit, reports });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/stats   (admin)
export const getStats = async (req, res, next) => {
  try {
    const [byStatus, byCategory] = await Promise.all([
      Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);
    const toMap = (rows, keys) =>
      Object.fromEntries(keys.map((k) => [k, rows.find((r) => r._id === k)?.count || 0]));

    const statuses = toMap(byStatus, STATUSES);
    res.json({
      total: Object.values(statuses).reduce((a, b) => a + b, 0),
      byStatus: statuses,
      byCategory: toMap(byCategory, CATEGORIES),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/:id
export const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).select(visibleFields(req));
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reports/:id   (admin)   { status?, category?, note? }
export const updateReport = async (req, res, next) => {
  try {
    const { status, category } = req.body;
    const note = String(req.body.note || "").trim().slice(0, 500);

    if (status && !STATUSES.includes(status)) throw badRequest(`Status must be one of: ${STATUSES.join(", ")}`);
    if (category && !CATEGORIES.includes(category)) throw badRequest(`Category must be one of: ${CATEGORIES.join(", ")}`);

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (category && category !== report.category) {
      report.category = category;
      report.categorySource = "manual";
    }

    // A timeline entry is added when the status changes or the admin leaves a note
    if ((status && status !== report.status) || note) {
      report.status = status || report.status;
      report.statusHistory.push({ status: report.status, note });
    }

    await report.save();
    res.json(report);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reports/:id   (admin)
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    // basename() makes sure a bad stored value can never point outside the uploads folder
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(report.photo))).catch(() => {});
    res.json({ message: "Report deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/reports/categorize   { title, description } -> { category, confidence, matches }
export const suggestCategory = (req, res) => {
  const { title = "", description = "" } = req.body || {};
  res.json(categorize(title, description));
};
