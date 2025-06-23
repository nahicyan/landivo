// server/routes/emailTrackingRoute.js
import express from "express";
import {
  trackEmailOpen,
  trackEmailClick,
  handleWebhook,
  getEmailAnalytics,
  getCampaignAnalytics,
  getBuyerEmailHistory,
  unsubscribeBuyer,
  getUnsubscribePage
} from "../controllers/emailTrackingCntrl.js";

const router = express.Router();

// Public tracking endpoints
router.get("/pixel/:token", trackEmailOpen);
router.get("/click/:token", trackEmailClick);
router.post("/webhook", handleWebhook); // SendGrid webhook
router.get("/unsubscribe", getUnsubscribePage);
router.post("/unsubscribe", unsubscribeBuyer);

// Analytics endpoints
router.get("/analytics", getEmailAnalytics);
router.get("/campaigns/:id/analytics", getCampaignAnalytics);
router.get("/buyers/:id/history", getBuyerEmailHistory);

export { router as emailTrackingRoute };