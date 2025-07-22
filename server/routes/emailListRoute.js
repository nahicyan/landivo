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

const router = express.Router();

// Public Email List Routes

// Read all email lists
router.get("/", getAllEmailLists);

// Read a single email list by ID
router.get("/:id", getEmailList);

// Create a new email list
router.post("/", createEmailList);

// Update an existing email list by ID
router.put("/:id", updateEmailList);

// Add buyers to a list
router.post("/:id/add-buyers", addBuyersToList);

// Remove buyers from a list
router.post("/:id/remove-buyers", removeBuyersFromList);

// Send an email to all buyers in a list
router.post("/:id/send-email", sendEmailToList);

// Delete an email list
router.delete("/:id", deleteEmailList);

export { router as emailListRoute };
