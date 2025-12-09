import express from "express";
import { getAllPropertyExtractions, getPropertyExtractionById, deletePropertyExtraction } from "../controllers/propertyExtractionCntrl.js";

const router = express.Router();

// Read all property extractions with pagination/filters
router.get("/", getAllPropertyExtractions);

// Read single property extraction by ID
router.get("/:id", getPropertyExtractionById);

// Delete property extraction
router.delete("/:id", deletePropertyExtraction);

export { router as propertyExtractionRoute };