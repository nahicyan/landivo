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

const router = express.Router();

// Public routes
router.get("/allresd", getAllResidencies);
router.get("/:id", getResidency);
router.get("/:id/image", getResidencyImages);
router.get("/:id/video", getResidencyVideos); // New endpoint for videos
router.get("/:id/cma-document", getCmaDocument);

// Protected routes with updated uploadWithMedia middleware
router.post(
  "/createWithFile", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:properties']), 
  uploadWithMedia.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }, // New field for videos
    { name: 'cmaFile', maxCount: 1 }
  ]), 
  createResidencyWithMultipleFiles
);

router.put(
  "/update/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:properties']), 
  uploadWithMedia.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }, // New field for videos
    { name: 'cmaFile', maxCount: 1 }
  ]), 
  updateResidency
);

export { router as residencyRoute };