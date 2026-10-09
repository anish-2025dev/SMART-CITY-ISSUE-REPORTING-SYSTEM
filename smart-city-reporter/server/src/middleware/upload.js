import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

const ALLOWED = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Pick the extension from the verified mime type, not the user's filename
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + ALLOWED[file.mimetype]);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED[file.mimetype]) return cb(null, true);
  const err = new Error("Only JPG, PNG or WebP images are allowed");
  err.status = 400;
  cb(err);
};

// Field name in the form must be "photo"
export const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("photo");

export { UPLOAD_DIR };
