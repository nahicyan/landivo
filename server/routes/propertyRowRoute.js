// server/routes/propertyRowRoute.js
import express from "express";
import { 
  getPropertyRows, 
  getPropertyRowById,
  createPropertyRow,
  updatePropertyRow,
  deletePropertyRow
} from "../controllers/propertyRowCntrl.js"; // Use a dedicated controller file

const router = express.Router();

// Get property rows - public for reading featured properties
router.get("/", getPropertyRows);

// Get a specific property row
router.get("/:id", getPropertyRowById);

// Admin routes - in a real app, these should have authentication
router.post("/", createPropertyRow);
router.put("/:id", updatePropertyRow);
router.delete("/:id", deletePropertyRow);

export { router as propertyRowRoute };