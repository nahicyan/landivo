// server/routes/generatedListRoute.js
import express from "express";
import { scheduleGeneratedListDelete } from "../controllers/emailListCntrl.js";

const router = express.Router();

// Schedule deletion for generated lists
router.post("/:id/schedule-delete", scheduleGeneratedListDelete);

export { router as generatedListRoute };
