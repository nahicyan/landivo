// server/routes/offerRoute.js - With permissions and checks removed
import express from "express";
import { 
  makeOffer, 
  getOffersOnProperty, 
  getOffersByBuyer,
  updateOfferStatus,
  getOfferHistory,
  getAllOffers,
  getRecentOfferActivity 
} from "../controllers/offerCntrl.js";

const router = express.Router();

// Create a new offer
router.post("/makeOffer", makeOffer);

// Get offers by property
router.get("/property/:propertyId", getOffersOnProperty);

// Get offers by buyer (with query params)
router.get("/buyer", getOffersByBuyer);

// Get all offers
router.get("/all", getAllOffers);

// Get recent offer activity
router.get("/activity/recent", getRecentOfferActivity);

// Update offer status
router.put("/:id/status", updateOfferStatus);

// Get offer history
router.get("/:id/history", getOfferHistory);

export { router as offerRoute };