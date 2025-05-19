// server/routes/settingsRoute.js - Updated version
import express from "express";
import {
  getSettings,
  updateSettings,
  testSmtpConnection
} from "../controllers/settingsCntrl.js";
import { jwtCheck, extractUserFromToken, checkPermissions } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get settings
router.get("/", getSettings);

// Update settings
router.put("/", updateSettings);

// Test SMTP connection
router.post("/test-smtp", testSmtpConnection);

export { router as settingsRoute };