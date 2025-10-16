// server/routes/automationClosingDateRoute.js
import express from "express";
import { getPropertiesWithClosingDates } from "../services/automation/closingDateService.js";

const router = express.Router();

// GET /api/automation/closingDates/ - Returns property IDs with future closing dates
router.get("/", getPropertiesWithClosingDates);

export { router as automationClosingDateRoute };