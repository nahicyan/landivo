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
  requestedBy,
}) => {
  try {
    // Get SMTP settings from database
    const settings = await prisma.settings.findFirst();

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
    const emailHtml = generateDeletionRequestTemplate({
      property,
      reason,
      deletionToken,
      requestedBy,
    });

    // Send email
    await transporter.sendMail({
      from: settings.smtpUser,
      to: "nathan@landersinvestment.com",
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
 * Generate beautiful HTML template for deletion request email
 */
const generateDeletionRequestTemplate = ({
  property,
  reason,
  deletionToken,
  requestedBy,
}) => {
  const approvalUrl = `https://landivo.com/property-deletion/${deletionToken}`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Property Deletion Request</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        background-color: #dbddde;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
      ">
        <!-- Main Container -->
        <div style="
          margin: 30px auto;
          max-width: 600px;
          background-color: #fff;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        ">
          
          <!-- Header with Logo -->
          <div style="
            background: linear-gradient(135deg, #324c48 0%, #3f5f5a 100%);
            padding: 40px;
            text-align: center;
          ">
            <img 
              src="https://cdn.landivo.com/wp-content/uploads/2025/08/landivo.png" 
              alt="Landivo" 
              style="
                max-width: 180px;
                height: auto;
                margin-bottom: 20px;
              "
            />
          </div>

          <!-- Content Section -->
          <div style="padding: 0 40px;">
            <hr style="border-color: #e8eaed; margin: 20px 0;" />
            
            <h2 style="
              font-size: 14px;
              line-height: 26px;
              font-weight: 700;
              color: #324c48;
              margin: 0 0 20px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">PROPERTY DELETION REQUEST</h2>
            
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
            ">A property deletion request has been submitted and requires your immediate attention for approval.</p>
          </div>

          <!-- Property Details Card -->
          <div style="
            margin: 20px 40px;
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #324c48;
          ">
            <h3 style="
              margin: 0 0 15px 0;
              color: #324c48;
              font-size: 16px;
              font-weight: 600;
            ">Property Information</h3>
            
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
                  width: 30%;
                ">Address:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  color: #3c4043;
                ">${property.streetAddress}, ${property.city}, ${property.state} ${property.zip}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  font-weight: 600;
                  color: #3c4043;
                ">Title:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  color: #3c4043;
                ">${property.title || "Untitled Property"}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  font-weight: 600;
                  color: #3c4043;
                ">Status:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  color: #3c4043;
                ">${property.status}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #3c4043;
                ">Price:</td>
                <td style="
                  padding: 8px 0;
                  color: #3c4043;
                ">$${Number(property.askingPrice || 0).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          ${
            reason
              ? `
          <!-- Deletion Reason Card -->
          <div style="
            margin: 20px 40px;
            background-color: #fff3cd;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #ffc107;
          ">
            <h3 style="
              margin: 0 0 15px 0;
              color: #856404;
              font-size: 16px;
              font-weight: 600;
            ">Deletion Reason</h3>
            <p style="
              margin: 0;
              font-size: 14px;
              line-height: 22px;
              color: #856404;
              background-color: #fffbf0;
              padding: 15px;
              border-radius: 5px;
              border-left: 3px solid #ffc107;
            ">${reason}</p>
          </div>
          `
              : ""
          }

          <!-- Request Details Card -->
          <div style="
            margin: 20px 40px;
            background-color: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #2196f3;
          ">
            <h3 style="
              margin: 0 0 15px 0;
              color: #1565c0;
              font-size: 16px;
              font-weight: 600;
            ">Request Details</h3>
            
            <table style="
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            ">
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  font-weight: 600;
                  color: #1565c0;
                  width: 40%;
                ">Requested By:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                ">${requestedBy}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  font-weight: 600;
                  color: #1565c0;
                ">Requested Date:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                ">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #1565c0;
                ">Token Expires:</td>
                <td style="
                  padding: 8px 0;
                  color: #1565c0;
                ">${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}</td>
              </tr>
            </table>
          </div>

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
            ">⚠️ APPROVE DELETION</a>
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
              <strong>⚠️ Critical Warning:</strong> Clicking the approval button will permanently delete this property from the system. This action cannot be undone and all associated data will be lost forever.
            </p>
          </div>

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
            background-color: #f0fcff;
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
            ">You have received this administrative notification regarding property management activities in your Landivo system.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
