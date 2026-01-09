// server/services/propertyBulkDeletionEmailService.js
import nodemailer from "nodemailer";
import { connectMongo } from "../config/mongoose.js";
import { Settings } from "../models/index.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("propertyBulkDeletionEmailService");

/**
 * Send bulk property deletion request email to admin
 */
export const sendPropertyBulkDeletionRequest = async ({
  properties,
  reason,
  deletionToken,
  requestingUser,
  count,
  isDirect = false
}) => {
  try {
    // Get SMTP settings from database
    await connectMongo();
    const settings = await Settings.findOne().lean();

    if (
      !settings?.smtpServer ||
      !settings?.smtpUser ||
      !settings?.smtpPassword
    ) {
      throw new Error("SMTP settings not configured");
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpServer,
      port: parseInt(settings.smtpPort),
      secure: parseInt(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    // Email template
    const emailHtml = generateBulkDeletionRequestTemplate({
      properties,
      reason,
      deletionToken,
      requestingUser,
      count,
      isDirect
    });

    const subject = isDirect 
      ? `Bulk Property Deletion Completed - ${count} Properties`
      : `Bulk Property Deletion Request - ${count} Properties`;

    // Send email
    await transporter.sendMail({
      from: settings.smtpUser,
      to: "nathan@landersinvestment.com",
      subject: subject,
      html: emailHtml,
    });

    log.info(
      "[propertyBulkDeletionEmailService:sendPropertyBulkDeletionRequest] > [Response]: email sent"
    );
  } catch (error) {
    log.error(
      `[propertyBulkDeletionEmailService:sendPropertyBulkDeletionRequest] > [Error]: ${error?.message || error}`
    );
    throw error;
  }
};

/**
 * Generate beautiful HTML template for bulk deletion request email
 */
const generateBulkDeletionRequestTemplate = ({
  properties,
  reason,
  deletionToken,
  requestingUser,
  count,
  isDirect
}) => {
  const approvalUrl = `${process.env.VITE_SERVER_URL || 'https://api.landivo.com'}/api/property/approve-bulk-deletion/${deletionToken}`;

  // Generate property list HTML
  const propertyListHtml = properties.slice(0, 10).map((property, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e8eaed; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e8eaed;">
        <strong>${property.title || 'Untitled Property'}</strong><br/>
        <span style="color: #5f6368; font-size: 13px;">${property.streetAddress}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e8eaed; text-align: center;">
        <span style="
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          ${property.status === 'Available' ? 'background-color: #d4edda; color: #155724;' : ''}
          ${property.status === 'Pending' ? 'background-color: #fff3cd; color: #856404;' : ''}
          ${property.status === 'Sold' ? 'background-color: #d1ecf1; color: #0c5460;' : ''}
        ">${property.status || 'Unknown'}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e8eaed; text-align: right;">
        $${Number(property.askingPrice || 0).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const morePropertiesNote = properties.length > 10 
    ? `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #5f6368; font-style: italic;">
        ... and ${properties.length - 10} more ${properties.length - 10 === 1 ? 'property' : 'properties'}
       </td></tr>`
    : '';

  const actionSection = isDirect ? `
    <!-- Direct Deletion Notification -->
    <div style="
      padding: 40px;
      text-align: center;
      background-color: #f8f9fa;
    ">
      <div style="
        display: inline-block;
        padding: 15px 30px;
        background-color: #28a745;
        color: white;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
      ">
        ✓ DELETION COMPLETED
      </div>
      <p style="
        margin-top: 15px;
        font-size: 14px;
        color: #6c757d;
      ">
        The properties have been permanently deleted from the system.
      </p>
    </div>
  ` : `
    <!-- Action Button -->
    <div style="
      padding: 40px;
      text-align: center;
    ">
      <a href="${approvalUrl}" style="
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
        padding: 15px 40px;
        text-decoration: none;
        border-radius: 8px;
        display: inline-block;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        transition: all 0.3s ease;
      ">⚠️ APPROVE BULK DELETION</a>
    </div>

    <!-- Warning Section -->
    <div style="
      margin: 20px 40px 40px 40px;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 20px;
    ">
      <p style="
        margin: 0;
        font-size: 14px;
        line-height: 22px;
        color: #856404;
        text-align: center;
      ">
        <strong>⚠️ Critical Warning:</strong> Clicking the approval button will permanently delete ${count} ${count === 1 ? 'property' : 'properties'} from the system. This action cannot be undone and all associated data will be lost forever.
      </p>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulk Property Deletion ${isDirect ? 'Notification' : 'Request'}</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    ">
      <!-- Email Container -->
      <div style="
        max-width: 800px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #324c48 0%, #3f4f24 100%);
          padding: 40px;
          text-align: center;
        ">
          <h1 style="
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
          ">LANDIVO</h1>
          <p style="
            margin: 10px 0 0 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            letter-spacing: 2px;
            text-transform: uppercase;
          ">Property Management System</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
          <h2 style="
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 700;
            color: #dc3545;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">${isDirect ? 'BULK PROPERTY DELETION COMPLETED' : 'BULK PROPERTY DELETION REQUEST'}</h2>
          
          <p style="
            font-size: 14px;
            line-height: 22px;
            color: #3c4043;
            margin: 0 0 20px 0;
          ">Hello Admin,</p>
          
          <p style="
            font-size: 14px;
            line-height: 22px;
            color: #3c4043;
            margin: 0 0 20px 0;
          ">
            ${isDirect 
              ? `A bulk property deletion has been completed and requires your attention for records.`
              : `A bulk property deletion request has been submitted and requires your immediate attention for approval.`
            }
          </p>
        </div>

        <!-- Summary Card -->
        <div style="
          margin: 0 40px 20px 40px;
          background-color: #f6ece0;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid #dc3545;
        ">
          <h3 style="
            margin: 0 0 15px 0;
            color: #324c48;
            font-size: 16px;
            font-weight: 600;
          ">Deletion Summary</h3>
          
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          ">
            <tr>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                font-weight: 600;
                color: #3c4043;
                width: 40%;
              ">Total Properties:</td>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                color: #5f6368;
              ">${count} ${count === 1 ? 'property' : 'properties'}</td>
            </tr>
            <tr>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                font-weight: 600;
                color: #3c4043;
              ">Requested By:</td>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                color: #5f6368;
              ">${requestingUser.firstName} ${requestingUser.lastName}</td>
            </tr>
            <tr>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                font-weight: 600;
                color: #3c4043;
              ">Email:</td>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                color: #5f6368;
              ">${requestingUser.email}</td>
            </tr>
            <tr>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                font-weight: 600;
                color: #3c4043;
              ">Reason:</td>
              <td style="
                padding: 8px 0;
                border-bottom: 1px solid #e8eaed;
                color: #5f6368;
              ">${reason || "No reason provided"}</td>
            </tr>
            <tr>
              <td style="
                padding: 8px 0;
                font-weight: 600;
                color: #3c4043;
              ">Request Date:</td>
              <td style="
                padding: 8px 0;
                color: #5f6368;
              ">${new Date().toLocaleString()}</td>
            </tr>
            ${!isDirect ? `
            <tr>
              <td style="
                padding: 8px 0;
                font-weight: 600;
                color: #3c4043;
              ">Expires:</td>
              <td style="
                padding: 8px 0;
                color: #dc3545;
                font-weight: 600;
              ">${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Properties List -->
        <div style="margin: 0 40px 40px 40px;">
          <h3 style="
            margin: 0 0 15px 0;
            color: #324c48;
            font-size: 16px;
            font-weight: 600;
          ">Properties to be Deleted</h3>
          
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            border: 1px solid #e8eaed;
            border-radius: 8px;
            overflow: hidden;
          ">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e8eaed;">#</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e8eaed;">Property</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e8eaed;">Status</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e8eaed;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${propertyListHtml}
              ${morePropertiesNote}
            </tbody>
          </table>
        </div>

        ${actionSection}

        <hr style="border-color: #e8eaed; margin: 20px 40px;" />

        <!-- Footer -->
        <div style="
          padding: 40px;
          text-align: center;
        ">
          <p style="
            font-size: 14px;
            line-height: 22px;
            color: #3c4043;
            margin: 0 0 10px 0;
          ">Thank you,</p>
          <p style="
            font-size: 18px;
            line-height: 22px;
            color: #324c48;
            margin: 0;
            font-weight: 600;
          ">The Landivo System</p>
        </div>

        <!-- Connect Section -->
        <div style="
          background-color: #f6ece0;
          padding: 20px 40px;
          text-align: center;
        ">
          <p style="
            font-size: 14px;
            color: #3c4043;
            margin: 0 0 15px 0;
          ">Connect with us</p>
          
          <div style="margin-bottom: 20px;">
            <a href="mailto:support@landivo.com" style="
              color: #324c48;
              text-decoration: none;
              margin: 0 10px;
              font-size: 14px;
            ">Email Support</a>
            <span style="color: #e8eaed;">|</span>
            <a href="https://landivo.com" style="
              color: #324c48;
              text-decoration: none;
              margin: 0 10px;
              font-size: 14px;
            ">Visit Website</a>
          </div>
        </div>

        <!-- Bottom Footer -->
        <div style="
          background-color: #324c48;
          padding: 20px 40px;
          text-align: center;
        ">
          <p style="
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 5px 0;
          ">© ${new Date().getFullYear()} Landivo LLC. All rights reserved.</p>
          <p style="
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
          ">You have received this administrative notification regarding bulk property management activities in your Landivo system.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
