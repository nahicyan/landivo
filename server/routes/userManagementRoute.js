// server/routes/userManagementRoute.js
import express from "express";
import {
  getUserByAuth0Id,
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  updateUserProfiles,
  getPublicProfileById,
  getPublicProfiles,
  getProfilesForPropertyAssignment,
  getPropertiesUsingProfile,
  getPropertiesCountByProfile,
  reassignProperties
} from "../controllers/userManagementCntrl.js";
import { jwtCheck, extractUserFromToken, checkPermissions } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Routes with all auth checks removed
router.get("/byAuth0Id", getUserByAuth0Id);
router.post("/sync", createOrUpdateUser);
router.get("/public-profiles", getPublicProfiles); 
router.get("/public-profile/:id", getPublicProfileById);

// Protected routes (require authentication)
router.get("/profile", 
  jwtCheck, 
  extractUserFromToken, 
  getUserProfile
);
router.put("/profile", 
  jwtCheck,
  extractUserFromToken,
  updateUserProfile
);

// Special route for property profiles - allows either permission
router.get("/property-profiles", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:users', 'write:properties']), 
  getProfilesForPropertyAssignment
);

// Admin routes (require specific permissions)
router.get("/all", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:users']), 
  getAllUsers
);
router.get("/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:users']), 
  getUserById
);

// General user update (Admin only)
router.put("/update/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:users']), 
  updateUser
);

// User status management
router.put("/:id/status", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:users']), 
  updateUserStatus
);

// User profiles management
router.put("/:id/profiles", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:users']), 
  updateUserProfiles
);

// Property assignment routes
router.get("/:id/properties", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:users']), 
  getPropertiesUsingProfile
);

router.get("/:id/properties-count", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:users']), 
  getPropertiesCountByProfile
);

router.put("/:id/reassign-properties", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:users']), 
  reassignProperties
);

export { router as userManagementRoute };