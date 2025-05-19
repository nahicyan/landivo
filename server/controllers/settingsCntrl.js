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
          smtpServer: null,
          smtpPort: null,
          smtpUser: null,
          smtpPassword: null,
          enableOfferEmails: false,
          offerEmailRecipients: [],
          enableFinancingEmails: false,
          financingEmailRecipients: []
        }
      });
    }
    
    // Don't send the password back for security
    const { smtpPassword, ...safeSettings } = settings;
    
    res.status(200).json(safeSettings);
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
  const { 
    overrideContactPhone, 
    smtpServer, 
    smtpPort, 
    smtpUser, 
    smtpPassword,
    enableOfferEmails,
    offerEmailRecipients,
    enableFinancingEmails,
    financingEmailRecipients
  } = req.body;
  
  try {
    // Get existing settings or create if none exist
    let settings = await prisma.settings.findFirst();
    
    // Prepare update data
    const updateData = {
      overrideContactPhone,
      smtpServer,
      smtpPort,
      smtpUser,
      enableOfferEmails: enableOfferEmails || false,
      offerEmailRecipients: offerEmailRecipients || [],
      enableFinancingEmails: enableFinancingEmails || false,
      financingEmailRecipients: financingEmailRecipients || [],
      updatedAt: new Date()
    };
    
    // Only update password if provided
    if (smtpPassword) {
      updateData.smtpPassword = smtpPassword;
    }
    
    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData
      });
    } else {
      // Create new settings if none exist
      settings = await prisma.settings.create({
        data: updateData
      });
    }
    
    // Don't send the password back for security
    const { smtpPassword: pass, ...safeSettings } = settings;
    
    res.status(200).json({
      message: "Settings updated successfully",
      settings: safeSettings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      message: "An error occurred while updating settings",
      error: error.message
    });
  }
});

/**
 * Test SMTP connection
 */
export const testSmtpConnection = asyncHandler(async (req, res) => {
  const { smtpServer, smtpPort, smtpUser, smtpPassword, testRecipient } = req.body;

  if (!smtpServer || !smtpPort || !smtpUser) {
    return res.status(400).json({ message: "SMTP server, port, and user are required" });
  }

  try {
    // If no password provided, get from database
    let password = smtpPassword;
    if (!password) {
      const settings = await prisma.settings.findFirst();
      if (settings && settings.smtpPassword) {
        password = settings.smtpPassword;
      } else {
        return res.status(400).json({ message: "SMTP password is required" });
      }
    }

    // Create a test SMTP transporter
    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: password
      },
      // Connection timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 10000,     // 10 seconds
    });
    
    // Verify the connection configuration
    await transporter.verify();
    
    // If recipient provided, send test email
    if (testRecipient) {
      await transporter.sendMail({
        from: `"Landivo System" <${smtpUser}>`,
        to: testRecipient,
        subject: "Landivo SMTP Test",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://landivo.com/logo.png" alt="Landivo Logo" style="max-width: 200px; height: auto;" />
          </div>
          <h2 style="color: #3f4f24; text-align: center;">SMTP Configuration Test Successful!</h2>
          <div style="background-color: #f4f7ee; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #324c48;">This is a test email confirming that your Landivo email notifications are working correctly.</p>
          </div>
          <div style="background-color: #FDF8F2; border-left: 4px solid #D4A017; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #324c48;">You're receiving this because you tested the SMTP configuration in the Landivo admin panel.</p>
          </div>
          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
            &copy; ${new Date().getFullYear()} Landivo. All rights reserved.
          </p>
        </div>
        `
      });
    }
    
    res.status(200).json({
      success: true,
      message: testRecipient 
        ? `SMTP connection successful! Test email sent to ${testRecipient}` 
        : "SMTP connection successful"
    });
  } catch (error) {
    console.error("SMTP connection test failed:", error);
    
    // Provide more descriptive error messages based on common issues
    let errorMessage = "SMTP connection failed";
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "Connection refused. Check your SMTP server address and port.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "Connection timed out. Server may be down or blocked by a firewall.";
    } else if (error.code === 'EAUTH') {
      errorMessage = "Authentication failed. Check your username and password.";
    } else if (error.responseCode >= 500) {
      errorMessage = `SMTP server error (${error.responseCode}): ${error.response}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});