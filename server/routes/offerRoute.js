// server/routes/offerRoute.js
import express from "express";
import { 
  makeOffer, 
  getOffersOnProperty, 
  getOffersByBuyer
} from "../controllers/offerCntrl.js";
import { jwtCheck, extractUserFromToken, checkPermissions } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new offer
// Route to create or update an offer
router.post("/makeOffer", makeOffer);

// Get offers by property - public access for property pages
router.get("/property/:propertyId", getOffersOnProperty);

// Get offers by buyer (with query params)
router.get("/buyer", getOffersByBuyer);

// Protected routes (require authentication and permissions)
// These are examples that would require auth - uncomment and adjust as needed
/*
router.delete("/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['delete:offers']), 
  deleteOffer
);
*/

export { router as offerRoute };