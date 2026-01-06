// server/controllers/settingsCntrl.js - Updated version
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import nodemailer from "nodemailer";

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
          overrideContactPhone: null,
          systemContactPhone: null,
          smtpServer: null,
          smtpPort: null,
          smtpUser: null,
          smtpPassword: null,
          enableOfferEmails: false,
          offerEmailRecipients: [],
          enableFinancingEmails: false,
          financingEmailRecipients: [],
          displayIncomplete: false,
          displaySold: false,
          displayNotAvailable: false,
          displayNotTesting: false,
        },
      });
    }

    // Don't send the password back for security
    const { smtpPassword, ...safeSettings } = settings;

    res.status(200).json(safeSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      message: "An error occurred while fetching settings",
      error: error.message,
    });
  }
});

/**
 * Update settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const {
    overrideContactPhone,
    systemContactPhone,
    smtpServer,
    smtpPort,
    smtpUser,
    smtpPassword,
    enableOfferEmails,
    offerEmailRecipients,
    enableFinancingEmails,
    financingEmailRecipients,
    displayIncomplete,
    displaySold,
    displayNotAvailable,
    displayNotTesting,
  } = req.body;

  try {
    // Get existing settings or create if none exist
    let settings = await prisma.settings.findFirst();

    // Prepare update data
    const updateData = {
      overrideContactPhone,
      systemContactPhone,
      smtpServer,
      smtpPort,
      smtpUser,
      enableOfferEmails: enableOfferEmails || false,
      offerEmailRecipients: offerEmailRecipients || [],
      enableFinancingEmails: enableFinancingEmails || false,
      financingEmailRecipients: financingEmailRecipients || [],
      displayIncomplete: displayIncomplete || false,
      displaySold: displaySold || false,
      displayNotAvailable: displayNotAvailable || false,
      displayNotTesting: displayNotTesting || false,
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (smtpPassword) {
      updateData.smtpPassword = smtpPassword;
    }

    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      // Create new settings if none exist
      settings = await prisma.settings.create({
        data: updateData,
      });
    }

    // Don't send the password back for security
    const { smtpPassword: pass, ...safeSettings } = settings;

    res.status(200).json({
      message: "Settings updated successfully",
      settings: safeSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      message: "An error occurred while updating settings",
      error: error.message,
    });
  }
});

/**
 * Test SMTP connection by sending a test email
 * Doesn't require all fields - uses stored settings if fields are missing
 */
export const testSmtpConnection = asyncHandler(async (req, res) => {
  const { smtpServer, smtpPort, smtpUser, smtpPassword, testRecipient } = req.body;

  if (!testRecipient) {
    return res.status(400).json({ message: "Email recipient is required" });
  }

  try {
    // Get existing settings from database for any missing fields
    const dbSettings = await prisma.settings.findFirst();

    if (!dbSettings) {
      return res.status(400).json({ message: "No SMTP settings found in database" });
    }

    // Use provided values or fall back to database values
    const server = smtpServer || dbSettings.smtpServer;
    const port = smtpPort || dbSettings.smtpPort;
    const user = smtpUser || dbSettings.smtpUser;
    const password = smtpPassword || dbSettings.smtpPassword;

    // Check if we have the minimum required settings
    if (!server || !port || !user || !password) {
      return res.status(400).json({
        message: "Incomplete SMTP configuration. Please configure SMTP settings first.",
      });
    }

    // Create a test SMTP transporter
    const transporter = nodemailer.createTransport({
      host: server,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465, // true for 465, false for other ports
      auth: {
        user: user,
        pass: password,
      },
      // Connection timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    });

    // Verify the connection configuration
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: `"Landivo System" <${user}>`,
      to: testRecipient,
      subject: "Landivo SMTP Test",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3f4f24; margin-bottom: 5px;">LANDIVO</h2>
          <div style="height: 2px; background-color: #D4A017; width: 100px; margin: 0 auto;"></div>
        </div>
        <h2 style="color: #3f4f24; text-align: center;">SMTP Configuration Test Successful!</h2>
        <div style="background-color: #f4f7ee; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #324c48;">This is a test email confirming that your Landivo email notifications are working correctly.</p>
        </div>
        <div style="background-color: #FDF8F2; border-left: 4px solid #D4A017; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #324c48;">You're receiving this because you tested the SMTP configuration in the Landivo admin panel.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #3f4f24; margin-top: 0;">SMTP Settings</h3>
          <p style="margin: 5px 0; color: #324c48;"><strong>Server:</strong> ${server}</p>
          <p style="margin: 5px 0; color: #324c48;"><strong>Port:</strong> ${port}</p>
          <p style="margin: 5px 0; color: #324c48;"><strong>Username:</strong> ${user}</p>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} Landivo. All rights reserved.
        </p>
      </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: `SMTP test successful! Email sent to ${testRecipient}`,
    });
  } catch (error) {
    console.error("SMTP connection test failed:", error);

    // Provide more descriptive error messages based on common issues
    let errorMessage = "SMTP connection failed";

    if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. Check your SMTP server address and port.";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Connection timed out. Server may be down or blocked by a firewall.";
    } else if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Check your username and password.";
    } else if (error.responseCode >= 500) {
      errorMessage = `SMTP server error (${error.responseCode}): ${error.response}`;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
});
