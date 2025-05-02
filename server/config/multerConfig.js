// server/config/multerConfig.js - Update to handle PDF files

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

// Export multer instance for multiple file support
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB to accommodate PDF files
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'cmaFile') {
      // For CMA files, only accept PDFs
      const allowedTypes = /pdf/;
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.test(ext.substring(1))) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for CMA documents."));
      }
    } else {
      // For image files, accept only image formats (jpg, jpeg, png, webp, gif)
      const allowedTypes = /jpeg|jpg|png|webp|gif/;
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.test(ext.substring(1))) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed (jpeg, jpg, png, webp, gif)."));
      }
    }
  },
});

// Specialized upload for handling both images and a single PDF file
export const uploadWithPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
    } else {
      cb(new Error("Unknown field name for file upload."));
    }
  },
});