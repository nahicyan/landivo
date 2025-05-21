import express from "express";
import { 
  trackVisit, 
  getVisitorStats, 
  getCurrentVisitors 
} from "../controllers/visitorController.js";
import { jwtCheck, extractUserFromToken, checkPermissions } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public route to track visits
router.post("/track", trackVisit);

// Protected routes for admin dashboard
router.get("/stats", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['access:admin']), 
  getVisitorStats
);

router.get("/current", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['access:admin']), 
  getCurrentVisitors
);

export { router as visitorRoute };