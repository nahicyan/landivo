// server/services/automation/closingDateService.js
import asyncHandler from "express-async-handler";
import { connectMongo } from "../../config/mongoose.js";
import { Property } from "../../models/index.js";

/**
 * Get all properties with future closing dates
 * Returns only property IDs and closing dates for Mailivo automation
 */
export const getPropertiesWithClosingDates = asyncHandler(async (req, res) => {
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

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties.map(p => ({
        propertyId: String(p._id),
        closingDate: p.closingDate,
      })),
    });

  } catch (error) {
    console.error("Error fetching properties with closing dates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve properties with closing dates",
      error: error.message,
    });
  }
});
