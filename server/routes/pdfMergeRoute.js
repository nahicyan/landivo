import express from "express";
import {
  testController,
  analyzeFilesController,
  generatePdfController,
  getProgressController,
  createTemplateController,
  getTemplatesController,
  getTemplateByIdController,
  deleteTemplateController,
} from "../controllers/pdfMergeCntrl.js";
import { uploadTemplate, uploadData } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ===========================
// ROUTE DEFINITIONS
// ===========================

// Test endpoint
router.get("/test", testController);

// ---- Template Management Routes ----
router.post("/templates", uploadTemplate.single("template"), createTemplateController);
router.get("/templates", getTemplatesController);
router.get("/templates/:id", getTemplateByIdController);
router.delete("/templates/:id", deleteTemplateController);

// ---- PDF Generation Routes ----
router.post("/analyze", uploadData.fields([{ name: "csv", maxCount: 1 }]), analyzeFilesController);
router.post("/generate", uploadData.fields([{ name: "csv", maxCount: 1 }]), generatePdfController);

// ---- Progress Polling ----
router.get("/progress/:id", getProgressController);

export { router as pdfMergeRoute };