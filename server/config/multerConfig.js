// server/config/multerConfig.js - Update to handle video files
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Reconstruct __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for multiple file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be saved in the 'uploads' directory
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with the original name sanitized
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "-");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// Export multer instance with support for Media
export const uploadWithMedia = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video files
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'cmaFile') {
      // For CMA files, only accept PDFs
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for CMA documents."));
      }
    } else if (file.fieldname === 'images') {
      // For property images
      const allowedTypes = /jpeg|jpg|png|webp|gif/;
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.test(ext.substring(1))) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed for property images."));
      }
    } else if (file.fieldname === 'videos') {
      // For property videos
      const allowedTypes = /mp4|mov|avi|webm|mkv/;
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.test(ext.substring(1))) {
        cb(null, true);
      } else {
        cb(new Error("Only video files (MP4, MOV, AVI, WebM, MKV) are allowed."));
      }
    } else {
      cb(new Error("Unknown field name for file upload."));
    }
  },
});