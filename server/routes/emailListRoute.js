// server/routes/emailListRoute.js
import express from "express";
import {
  getAllEmailLists,
  getEmailList,
  createEmailList,
  updateEmailList,
  deleteEmailList,
  addBuyersToList,
  removeBuyersFromList,
  sendEmailToList
} from "../controllers/emailListCntrl.js";
import { 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions 
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication and appropriate permissions

// Read operations - require read:buyers permission
router.get("/", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:buyers']), 
  getAllEmailLists
);

router.get("/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['read:buyers']), 
  getEmailList
);

// Write operations - require write:buyers permission
router.post("/", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:buyers']), 
  createEmailList
);

router.put("/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:buyers']), 
  updateEmailList
);

router.post("/:id/add-buyers", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:buyers']), 
  addBuyersToList
);

router.post("/:id/remove-buyers", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:buyers']), 
  removeBuyersFromList
);

router.post("/:id/send-email", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['write:buyers']), 
  sendEmailToList
);

// Delete operations - require delete:buyers permission
router.delete("/:id", 
  jwtCheck, 
  extractUserFromToken, 
  checkPermissions(['delete:buyers']), 
  deleteEmailList
);

export { router as emailListRoute };