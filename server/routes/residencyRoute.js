// server/routes/residencyRoute.js (updated)
import express from 'express';
import { 
    createResidency, 
    getAllResidencies, 
    getResidency, 
    updateResidency, 
    getResidencyImages, 
    createResidencyWithMultipleFiles,
    getCmaDocument 
} from '../controllers/residencyCntrl.js';
import { uploadWithPdf } from '../config/multerConfig.js'; // Updated import
import { jwtCheck, extractUserFromToken, checkPermissions } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/allresd", getAllResidencies);
router.get("/:id", getResidency);
router.get("/:id/image", getResidencyImages);

// Protected routes - accessible to users with specific permissions
router.post("/create", jwtCheck, extractUserFromToken, checkPermissions(['write:properties']), createResidency);
// router.post("/createWithFile", jwtCheck, extractUserFromToken, checkPermissions(['write:properties']), upload.array("images", 10), createResidencyWithMultipleFiles);
// router.put("/update/:id", jwtCheck, extractUserFromToken, checkPermissions(['write:properties']), upload.array("images", 10), updateResidency);

// Updated to use uploadWithPdf for handling both images and PDF files
router.post(
  "/createWithFile", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:properties']), 
  uploadWithPdf.fields([
    { name: 'images', maxCount: 10 },
    { name: 'cmaFile', maxCount: 1 }
  ]), 
  createResidencyWithMultipleFiles
);

// Updated to use uploadWithPdf for handling both images and PDF files
router.put(
  "/update/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:properties']), 
  uploadWithPdf.fields([
    { name: 'images', maxCount: 10 },
    { name: 'cmaFile', maxCount: 1 }
  ]), 
  updateResidency
);


export { router as residencyRoute };