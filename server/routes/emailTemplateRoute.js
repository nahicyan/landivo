// server/routes/emailTemplateRoute.js
import express from "express";
import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  previewTemplate,
  getTemplateCategories,
  getSystemTemplates
} from "../controllers/emailTemplateCntrl.js";

const router = express.Router();

// Template CRUD operations
router.post("/", createTemplate);
router.get("/", getAllTemplates);
router.get("/categories", getTemplateCategories);
router.get("/system", getSystemTemplates);
router.get("/:id", getTemplateById);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

// Template actions
router.post("/:id/duplicate", duplicateTemplate);
router.post("/:id/preview", previewTemplate);

export { router as emailTemplateRoute };