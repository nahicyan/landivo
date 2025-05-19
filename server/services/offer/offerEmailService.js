// server/services/offer/offerEmailService.js
import nodemailer from "nodemailer";
import { prisma } from "../../config/prismaConfig.js";

/**
 * Send offer notification email 
 * Uses system settings from database instead of env file
 */
export const sendOfferNotification = async (subject, body) => {
  try {
    // Get system settings to check if offer emails are enabled
    const settings = await prisma.settings.findFirst();
    
    // If settings don't exist or offer emails are disabled, skip sending
    if (!settings || !settings.enableOfferEmails) {
      console.log('Offer email notifications are disabled in settings');
      return;
    }
    
    // Check if we have recipients
    if (!settings.offerEmailRecipients || settings.offerEmailRecipients.length === 0) {
      console.log('No offer email recipients configured');
      return;
    }
    
    // Check if we have SMTP configuration
    if (!settings.smtpServer || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword) {
      console.log('Incomplete SMTP configuration');
      return;
    }
    
    // Create nodemailer transporter using settings from database
    const transporter = nodemailer.createTransport({
      host: settings.smtpServer,
      port: parseInt(settings.smtpPort),
      secure: parseInt(settings.smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword
      }
    });
    
    // Verify the connection before sending
    await transporter.verify();
    
    // Send email to all configured recipients
    const mailOptions = {
      from: `"Landivo Alerts" <${settings.smtpUser}>`,
      to: settings.offerEmailRecipients.join(', '),
      subject: subject,
      html: body,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Offer notification sent to ${settings.offerEmailRecipients.length} recipients: ${subject}`);
  } catch (error) {
    console.error("Error sending offer notification email:", error);
  }
};

/**
 * Template for New Offer
 *
 * @param {Object} property - Contains title, streetAddress, city, state, zip, ownerId, id, askingPrice.
 * @param {Object} buyer - Contains firstName, lastName, email, phone, buyerType.
 * @param {Number} offeredPrice
 */
export const newOfferTemplate = (property, buyer, offeredPrice) => `
  <h2 style="font-family: Arial, sans-serif;">New Offer Submitted for ${
    property.streetAddress
  }, ${property.city}, ${property.state} ${property.zip}!</h2>
  
  <h3 style="font-family: Arial, sans-serif;">Property Details:</h3>
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Property Address</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.streetAddress}, ${property.city}, ${
  property.state
} ${property.zip}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Owner ID</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.ownerId}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Asking Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${property.askingPrice.toLocaleString()}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Offered Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${offeredPrice.toLocaleString()}</td>
    </tr>
  </table>

  <h3 style="font-family: Arial, sans-serif;">Buyer Details:</h3>
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Name</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.firstName} ${buyer.lastName}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Email</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.email}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Phone</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.phone}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Buyer Type</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.buyerType}</td>
    </tr>
  </table>

  <p style="margin-top: 20px; font-family: Arial, sans-serif;">Submitted On: <strong>${new Date().toLocaleString()}</strong></p>
`;

/**
 * Template for Updated Offer
 *
 * @param {Object} property
 * @param {Object} buyer
 * @param {Number} offeredPrice
 */
export const updatedOfferTemplate = (property, buyer, offeredPrice) => `
  <h2 style="font-family: Arial, sans-serif;">Offer Updated for ${
    property.streetAddress
  }, ${property.city}, ${property.state} ${property.zip}!</h2>
  
  <h3 style="font-family: Arial, sans-serif;">Property Details:</h3>
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Property Address</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.streetAddress}, ${property.city}, ${
  property.state
} ${property.zip}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Owner ID</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.ownerId}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Property ID</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.id}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Asking Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${Number(
  property.askingPrice
).toLocaleString()}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">New Offered Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${Number(offeredPrice).toLocaleString()}</td>
    </tr>
  </table>

  <h3 style="font-family: Arial, sans-serif;">Buyer Details:</h3>
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Name</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.firstName} ${buyer.lastName}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Email</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.email}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Phone</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.phone}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Buyer Type</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.buyerType}</td>
    </tr>
  </table>

  <p style="margin-top: 20px; font-family: Arial, sans-serif;">Updated On: <strong>${new Date().toLocaleString()}</strong></p>
`;

/**
 * Template for Low Offer Warning
 *
 * @param {Object} property
 * @param {Object} buyer
 * @param {Number} offeredPrice
 */
export const lowOfferTemplate = (property, buyer, offeredPrice) => `
  <h2 style="font-family: Arial, sans-serif;">Low Offer Alert for ${
    property.streetAddress
  }, ${property.city}, ${property.state} ${property.zip}!</h2>
  
  <h3 style="font-family: Arial, sans-serif;">Property Details:</h3>
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Property Address</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.streetAddress}, ${property.city}, ${
  property.state
} ${property.zip}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Owner ID</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.ownerId}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Property ID</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${property.id}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Asking Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${property.askingPrice}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Offered Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${offeredPrice}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Minimum Price</th>
      <td style="padding: 8px; border: 1px solid #ccc;">$${property.minPrice}</td>
    </tr>
  </table>

  <h3 style="font-family: Arial, sans-serif;">Buyer Details:</h3>
  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Name</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.firstName} ${buyer.lastName}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Email</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.email}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Phone</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.phone}</td>
    </tr>
    <tr>
      <th style="background-color: #324c48; color: #fff; padding: 8px; border: 1px solid #ccc;">Buyer Type</th>
      <td style="padding: 8px; border: 1px solid #ccc;">${buyer.buyerType}</td>
    </tr>
  </table>

  <p style="margin-top: 20px; font-family: Arial, sans-serif;">Submitted On: <strong>${new Date().toLocaleString()}</strong></p>
`;