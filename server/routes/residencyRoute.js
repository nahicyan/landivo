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
import { requestPropertyDeletion, approvePropertyDeletion, deletePropertyDirect } from "../controllers/propertyDeletionCntrl.js";
import { 
  requestPropertyBulkDeletion, 
  deletePropertiesBulkDirect,
  approvePropertyBulkDeletion 
} from "../controllers/propertyBulkDeletionCntrl.js";


const router = express.Router();

// Public routes
router.get("/allresd", getAllResidencies);
router.get("/:id", getResidency);
router.get("/:id/image", getResidencyImages);
router.get("/:id/video", getResidencyVideos); // New endpoint for videos
router.get("/:id/cma-document", getCmaDocument);
router.post("/approve-deletion/:token", approvePropertyDeletion);

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

router.delete(
  "/delete/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['delete:properties']), 
  deletePropertyDirect
);

// Public bulk deletion approval route
router.post("/approve-bulk-deletion/:token", approvePropertyBulkDeletion);

// Protected bulk deletion routes
router.post(
  "/request-bulk-deletion", 
  jwtCheck, 
  extractUserFromToken, 
  requestPropertyBulkDeletion
);

router.post(
  "/delete-bulk", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['delete:properties']), 
  deletePropertiesBulkDirect
);

export { router as residencyRoute };