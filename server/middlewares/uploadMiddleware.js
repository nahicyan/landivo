import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// ===========================
// ENSURE UPLOAD DIRECTORIES
// ===========================

export const ensureUploadDirectories = () => {
  const dirs = [
    path.join(ROOT_DIR, "uploads"),
    path.join(ROOT_DIR, "uploads", "templates"),
    path.join(ROOT_DIR, "uploads", "pdf-merge"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// ===========================
// MULTER CONFIGURATIONS
// ===========================

// Multer storage for PDF templates
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(ROOT_DIR, "uploads", "templates");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

export const uploadTemplate = multer({
  storage: templateStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.originalname.toLowerCase().endsWith(".docx")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only DOCX files are allowed"));
    }
  },
});

// Multer storage for CSV/XLSX data files
const dataStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(ROOT_DIR, "uploads", "pdf-merge");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

export const uploadData = multer({
  storage: dataStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});