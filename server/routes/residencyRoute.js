// server/routes/residencyRoute.js
import express from 'express';
import { 
    getAllResidencies, 
    getResidency, 
    updateResidency, 
    getResidencyImages,
    getResidencyVideos, // New function to get videos
    createResidencyWithMultipleFiles,
    getCmaDocument 
} from '../controllers/residencyCntrl.js';
import { uploadWithMedia } from '../config/multerConfig.js'; // Updated import
import { jwtCheck, extractUserFromToken, checkPermissions } from "../middlewares/authMiddleware.js";
import { requestPropertyDeletion, approvePropertyDeletion } from "../controllers/propertyDeletionCntrl.js";

const router = express.Router();

// Public routes
router.get("/allresd", getAllResidencies);
router.get("/:id", getResidency);
router.get("/:id/image", getResidencyImages);
router.get("/:id/video", getResidencyVideos); // New endpoint for videos
router.get("/:id/cma-document", getCmaDocument);
router.get("/approve-deletion/:token", approvePropertyDeletion);

// Protected routes with updated uploadWithMedia middleware
router.post(
  "/createWithFile", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:properties']), 
  uploadWithMedia.fields([
    { name: 'images', maxCount: 30 },
    { name: 'videos', maxCount: 10 }, // New field for videos
    { name: 'cmaFile', maxCount: 1 }
  ]), 
  createResidencyWithMultipleFiles
);
router.post("/request-deletion/:id", jwtCheck, extractUserFromToken, requestPropertyDeletion);
router.put(
  "/update/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:properties']), 
  uploadWithMedia.fields([
    { name: 'images', maxCount: 30 },
    { name: 'videos', maxCount: 10 }, // New field for videos
    { name: 'cmaFile', maxCount: 1 }
  ]), 
  updateResidency
);

export { router as residencyRoute };