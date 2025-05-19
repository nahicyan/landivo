// server/routes/settingsRoute.js
import express from "express";
import {
  getSettings,
  updateSettings
} from "../controllers/settingsCntrl.js";

const router = express.Router();

// Get settings
router.get("/", getSettings);

// Update settings
router.put("/", updateSettings);

export { router as settingsRoute };