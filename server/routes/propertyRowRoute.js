// server/routes/propertyRowRoute.js
import express from "express";
import { getPropertyRows } from "../controllers/residencyCntrl.js";
const router = express.Router();

// Get property rows - public for reading featured properties
router.get("/", getPropertyRows);

// Admin route without authentication middleware
router.get("/admin", getPropertyRows);

export { router as propertyRowRoute };