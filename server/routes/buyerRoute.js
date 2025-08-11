import express from "express";
import { 
  createVipBuyer,
  createBuyer,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
  // Email-related endpoints
  getBuyersByArea,
  sendEmailToBuyers,
  importBuyersFromCsv,
  getBuyerStats,
    //Unsubscribe endpoints
  updateSubscriptionPreferences,
  completeUnsubscribe,
  getBuyerForUnsubscribe,
 // resubscribeBuyer
} from "../controllers/buyerCntrl.js";
import { getBuyerByAuth0Id } from '../controllers/buyerCntrl.js';

const router = express.Router();

// Routes to create buyers
router.post("/createVipBuyer", createVipBuyer);
router.post("/create", createBuyer);


// Buyer CRUD operations
router.get("/byAuth0Id", getBuyerByAuth0Id);
router.get("/all", getAllBuyers);
router.get("/:id", getBuyerById);
router.put("/update/:id", updateBuyer);
router.delete("/delete/:id", deleteBuyer);

// New email list management routes
router.get("/byArea/:areaId", getBuyersByArea);
router.post("/sendEmail", sendEmailToBuyers);
router.post("/import", importBuyersFromCsv);
router.get("/stats", getBuyerStats);

// Unsubscribe management routes (Public endpoints)
router.get("/unsubscribe/:id/data", getBuyerForUnsubscribe);
router.put("/unsubscribe/:id", updateSubscriptionPreferences);
router.put("/unsubscribe/:id/complete", completeUnsubscribe);
//router.put("/resubscribe/:id", resubscribeBuyer);

export { router as buyerRoute };