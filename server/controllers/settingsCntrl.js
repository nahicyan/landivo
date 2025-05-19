// server/controllers/settingsCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

/**
 * Get all settings or create default if none exist
 */
export const getSettings = asyncHandler(async (req, res) => {
  try {
    // Try to find settings
    let settings = await prisma.settings.findFirst();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          overrideContactPhone: null
        }
      });
    }
    
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      message: "An error occurred while fetching settings",
      error: error.message
    });
  }
});

/**
 * Update settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { overrideContactPhone } = req.body;
  
  try {
    // Get existing settings or create if none exist
    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { 
          overrideContactPhone,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new settings if none exist
      settings = await prisma.settings.create({
        data: {
          overrideContactPhone
        }
      });
    }
    
    res.status(200).json({
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      message: "An error occurred while updating settings",
      error: error.message
    });
  }
});