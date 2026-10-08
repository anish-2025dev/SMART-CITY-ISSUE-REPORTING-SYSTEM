import mongoose from "mongoose";

export const CATEGORIES = ["pothole", "garbage", "streetlight", "water_leak", "other"];
export const STATUSES = ["reported", "in-progress", "resolved"];

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, enum: CATEGORIES, default: "other" },
    // "auto" = chosen by the keyword categorizer, "manual" = chosen by the reporter
    categorySource: { type: String, enum: ["auto", "manual"], default: "manual" },
    status: { type: String, enum: STATUSES, default: "reported" },

    // Timeline shown to citizens and managed by admins
    statusHistory: { type: [historySchema], default: [] },

    // Path served by express.static, e.g. /uploads/1700000000-123.jpg
    photo: { type: String, required: true },

    // GeoJSON point. NOTE: coordinates are [longitude, latitude]
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, trim: true, default: "" },

    reporterName: { type: String, trim: true, default: "" },
    reporterEmail: { type: String, trim: true, lowercase: true, default: "" },
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ status: 1, category: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
