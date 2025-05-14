import express from "express";
import {
  getUserByAuth0Id,
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUserStatus
} from "../controllers/userManagementCntrl.js";

const router = express.Router();

// Routes with all auth checks removed
router.get("/byAuth0Id", getUserByAuth0Id);
router.post("/sync", createOrUpdateUser);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.get("/all", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id/status", updateUserStatus);

export { router as userManagementRoute };