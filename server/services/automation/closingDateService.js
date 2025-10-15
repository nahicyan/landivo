// server/services/automation/closingDateService.js
import asyncHandler from "express-async-handler";
import { prisma } from "../../config/prismaConfig.js";

/**
 * Get all properties with future closing dates
 * Returns only property IDs and closing dates for Mailivo automation
 */
export const getPropertiesWithClosingDates = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const properties = await prisma.residency.findMany({
      where: {
        closingDate: {
          gte: today,
        },
      },
      select: {
        id: true,
        closingDate: true,
      },
      orderBy: {
        closingDate: "asc",
      },
    });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties.map(p => ({
        propertyId: p.id,
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