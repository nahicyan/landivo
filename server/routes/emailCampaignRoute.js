// server/routes/emailCampaignRoute.js
import express from "express";
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  getCampaignAnalytics,
  pauseCampaign,
  cloneCampaign,
  getCampaignRecipients,
  testCampaign
} from "../controllers/emailCampaignCntrl.js";

const router = express.Router();

// Campaign CRUD operations
router.post("/", createCampaign);
router.get("/", getAllCampaigns);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

// Campaign actions
router.post("/:id/send", sendCampaign);
router.post("/:id/schedule", scheduleCampaign);
router.post("/:id/pause", pauseCampaign);
router.post("/:id/clone", cloneCampaign);
router.post("/:id/test", testCampaign);

// Campaign analytics and recipients
router.get("/:id/analytics", getCampaignAnalytics);
router.get("/:id/recipients", getCampaignRecipients);

export { router as emailCampaignRoute };