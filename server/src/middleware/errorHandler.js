import multer from "multer";
import mongoose from "mongoose";

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Photo must be 5 MB or smaller" : err.message;
    return res.status(400).json({ message });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? "Server error" : err.message });
};
