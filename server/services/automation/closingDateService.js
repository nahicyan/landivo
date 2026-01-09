// server/services/automation/closingDateService.js
import asyncHandler from "express-async-handler";
import { connectMongo } from "../../config/mongoose.js";
import { Property } from "../../models/index.js";
import { getLogger } from "../../utils/logger.js";

/**
 * Get all properties with future closing dates
 * Returns only property IDs and closing dates for Mailivo automation
 */
const log = getLogger("closingDateService");

export const getPropertiesWithClosingDates = asyncHandler(async (req, res) => {
  log.info("[closingDateService:getPropertiesWithClosingDates] > [Request]: start");
  try {
    await connectMongo();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const properties = await Property.find({
      closingDate: { $gte: today },
    })
      .select("closingDate")
      .sort({ closingDate: 1 })
      .lean();

    log.info(
      `[closingDateService:getPropertiesWithClosingDates] > [Response]: count=${properties.length}`
    );
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties.map(p => ({
        propertyId: String(p._id),
        closingDate: p.closingDate,
      })),
    });

  } catch (error) {
    log.error(`[closingDateService:getPropertiesWithClosingDates] > [Error]: ${error?.message || error}`);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve properties with closing dates",
      error: error.message,
    });
  }
});
