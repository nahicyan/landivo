// server/services/propertyDeletionEmailService.js
import nodemailer from "nodemailer";
import { prisma } from "../config/prismaConfig.js";

/**
 * Send property deletion request email to admin
 */
export const sendPropertyDeletionRequest = async ({
  property,
  reason,
  deletionToken,
  requestedBy
}) => {
  try {
    // Get SMTP settings from database
    const settings = await prisma.settings.findFirst();
    
    if (!settings?.smtpServer || !settings?.smtpUser || !settings?.smtpPassword) {
      throw new Error("SMTP settings not configured");
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: settings.smtpServer,
      port: parseInt(settings.smtpPort),
      secure: parseInt(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Email template
    const emailHtml = generateDeletionRequestTemplate({
      property,
      reason,
      deletionToken,
      requestedBy
    });

    // Send email
    await transporter.sendMail({
      from: settings.smtpUser,
      to: "nathan@landersinvestment.com", // Will be configurable later
      subject: `Property Deletion Request - ${property.streetAddress}`,
      html: emailHtml,
    });

    console.log("Property deletion request email sent successfully");

  } catch (error) {
    console.error("Error sending property deletion email:", error);
    throw error;
  }
};

/**
 * Generate HTML template for deletion request email
 */
const generateDeletionRequestTemplate = ({
  property,
  reason,
  deletionToken,
  requestedBy
}) => {
  const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/residency/approve-deletion/${deletionToken}`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #324c48; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Property Deletion Request</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p><strong>A property deletion request has been submitted and requires your approval.</strong></p>
        
        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #324c48;">Property Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Address:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Property ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${property.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Owner ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${property.ownerId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${property.status}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Price:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">$${Number(property.askingPrice || 0).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        ${reason ? `
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #324c48;">Deletion Reason</h3>
            <p style="margin: 0; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #324c48;">
              ${reason}
            </p>
          </div>
        ` : ''}

        <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #324c48;">Request Details</h3>
          <p><strong>Requested By:</strong> ${requestedBy}</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Token Expires:</strong> ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            APPROVE DELETION
          </a>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Important:</strong> Clicking the approval button will permanently delete this property from the system. This action cannot be undone.
          </p>
        </div>

        <hr style="border: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          This deletion request will expire in 24 hours.<br>
          If you did not expect this request, please contact your system administrator.
        </p>
      </div>
    </div>
  `;
};