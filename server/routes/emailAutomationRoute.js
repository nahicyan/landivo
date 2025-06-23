// server/routes/emailAutomationRoute.js
import express from "express";
import {
  createAutomationRule,
  getAllAutomationRules,
  getAutomationRuleById,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  getAutomationRuleHistory,
  triggerAutomationRule,
  testAutomationRule
} from "../controllers/emailAutomationCntrl.js";

const router = express.Router();

// Automation rule CRUD operations
router.post("/", createAutomationRule);
router.get("/", getAllAutomationRules);
router.get("/:id", getAutomationRuleById);
router.put("/:id", updateAutomationRule);
router.delete("/:id", deleteAutomationRule);

// Automation rule actions
router.post("/:id/toggle", toggleAutomationRule);
router.post("/:id/trigger", triggerAutomationRule);
router.post("/:id/test", testAutomationRule);

// Automation rule analytics
router.get("/:id/history", getAutomationRuleHistory);

export { router as emailAutomationRoute };