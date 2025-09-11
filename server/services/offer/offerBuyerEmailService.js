// server/services/offer/offerBuyerEmailService.js
import nodemailer from "nodemailer";
import { prisma } from "../../config/prismaConfig.js";

/**
 * Send email notification to buyer when admin takes action on offer
 */
export const sendBuyerOfferNotification = async (buyer, subject, body) => {
  try {
    // Get system settings from database
    const settings = await prisma.settings.findFirst();
    
    // Check if SMTP is properly configured
    if (!settings || !settings.smtpServer || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword) {
      console.log('Incomplete SMTP configuration for buyer notification');
      return;
    }
    
    // Create nodemailer transporter using database settings
    const transporter = nodemailer.createTransporter({
      host: settings.smtpServer,
      port: parseInt(settings.smtpPort),
      secure: parseInt(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword
      }
    });
    
    // Verify connection before sending
    await transporter.verify();
    
    // Send email to buyer
    const mailOptions = {
      from: `"Landivo Alerts" <${settings.smtpUser}>`,
      to: buyer.email,
      subject: subject,
      html: body,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Buyer notification sent to ${buyer.email}: ${subject}`);
  } catch (error) {
    console.error("Error sending buyer notification email:", error);
  }
};

/**
 * Generate buyer email template using EXACT design from offerEmailService.js
 */
const generateBuyerEmailTemplate = ({ action, property, buyer, offer, counteredPrice, adminMessage }) => {
  const propertyUrl = `https://landivo.com/properties/${property.id}`;
  
  // Action-specific configurations
  const actionConfig = {
    accepted: {
      title: 'YOUR OFFER HAS BEEN ACCEPTED',
      description: 'Congratulations! Your offer has been accepted. Our team will contact you soon with the next steps.'
    },
    rejected: {
      title: 'OFFER UPDATE',
      description: 'Thank you for your interest. Unfortunately, your offer was not accepted this time. You\'re welcome to submit a new offer if you\'re still interested.'
    },
    countered: {
      title: 'COUNTER OFFER RECEIVED',
      description: `We appreciate your offer! We'd like to propose a counter offer. Please review the details below.`
    },
    expired: {
      title: 'OFFER EXPIRED',
      description: 'Your offer has expired. If you\'re still interested in this property, you\'re welcome to submit a new offer.'
    }
  };

  const config = actionConfig[action] || actionConfig.accepted;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.title}</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        background-color: #324c48;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
      ">
        <!-- Main Container -->
        <div style="
          margin: 30px auto;
          max-width: 600px;
          background-color: #FDF8F2;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        ">
          
          <!-- Header with Logo -->
          <div style="
            background: #f6ece0;
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
            ">${config.title}</h2>
            
            <p style="
              font-size: 14px;
              line-height: 22px;
              color: #3c4043;
              margin: 0 0 20px 0;
            ">Hi ${buyer.firstName},</p>
            
            <p style="
              font-size: 14px;
              line-height: 22px;
              color: #3c4043;
              margin: 0 0 20px 0;
            ">${config.description}</p>
          </div>

          <!-- Property Details Card -->
          <div style="
            margin: 20px 40px;
            background-color: #f6ece0;
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
                ">${property.status || "Available"}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  font-weight: 600;
                  color: #3c4043;
                ">Asking Price:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e8eaed;
                  color: #3c4043;
                  font-size: 18px;
                  font-weight: 700;
                ">$${Number(property.askingPrice || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #3c4043;
                ">Your Offer:</td>
                <td style="
                  padding: 8px 0;
                  color: #3c4043;
                  font-size: 18px;
                  font-weight: 700;
                ">$${Number(offer.offeredPrice).toLocaleString()}</td>
              </tr>
              ${counteredPrice ? `
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #3c4043;
                ">Counter Offer:</td>
                <td style="
                  padding: 8px 0;
                  color: #3c4043;
                  font-size: 18px;
                  font-weight: 700;
                ">$${Number(counteredPrice).toLocaleString()}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${adminMessage ? `
          <!-- Admin Message Card -->
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
            ">Message from Landivo</h3>
            <p style="
              margin: 0;
              font-size: 14px;
              line-height: 22px;
              color: #856404;
              background-color: #fffbf0;
              padding: 15px;
              border-radius: 5px;
              border-left: 3px solid #ffc107;
            ">${adminMessage}</p>
          </div>
          ` : ''}

          <!-- Offer Status Card -->
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
            ">Offer Status</h3>
            
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
                ">Status:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                  font-weight: 600;
                  text-transform: uppercase;
                ">${action}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  font-weight: 600;
                  color: #1565c0;
                ">Your Name:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                ">${buyer.firstName} ${buyer.lastName}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  font-weight: 600;
                  color: #1565c0;
                ">Email:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                ">
                  <div><a href="mailto:${buyer.email}" style="color: #1565c0; text-decoration: none;">${buyer.email}</a></div>
                </td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  font-weight: 600;
                  color: #1565c0;
                ">Phone:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                ">${buyer.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #1565c0;
                ">Buyer Type:</td>
                <td style="
                  padding: 8px 0;
                  color: #1565c0;
                ">${buyer.buyerType || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button Section -->
          <div style="padding: 20px 40px; text-align: center;">
            ${action === 'countered' ? `
            <a href="${propertyUrl}" style="
              display: inline-block;
              background-color: #324c48;
              color: #ffffff;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              font-size: 14px;
            ">View Counter Offer</a>
            ` : ''}
            ${action === 'rejected' || action === 'expired' ? `
            <a href="${propertyUrl}" style="
              display: inline-block;
              background-color: #324c48;
              color: #ffffff;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 600;
              font-size: 14px;
            ">Submit New Offer</a>
            ` : ''}
            ${action === 'accepted' ? `
            <div style="
              background-color: #d4edda;
              color: #155724;
              padding: 15px;
              border-radius: 5px;
              font-weight: 600;
              font-size: 14px;
            ">🎉 Congratulations! We'll contact you soon with next steps.</div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="
            background-color: #324c48;
            padding: 20px 40px;
            text-align: center;
          ">
            <p style="
              font-size: 12px;
              color: rgba(255, 255, 255, 0.8);
              margin: 0 0 10px 0;
            ">© 2024 Landivo. All rights reserved.</p>
            <p style="
              font-size: 12px;
              color: rgba(255, 255, 255, 0.6);
              margin: 0;
            ">You have received this notification regarding your property offer activity in your Landivo system.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Template for Accepted Offer
 */
export const acceptedOfferTemplate = (property, buyer, offer, adminMessage = null) => {
  return generateBuyerEmailTemplate({
    action: 'accepted',
    property,
    buyer,
    offer,
    adminMessage
  });
};

/**
 * Template for Rejected Offer
 */
export const rejectedOfferTemplate = (property, buyer, offer, adminMessage = null) => {
  return generateBuyerEmailTemplate({
    action: 'rejected',
    property,
    buyer,
    offer,
    adminMessage
  });
};

/**
 * Template for Counter Offer
 */
export const counterOfferTemplate = (property, buyer, offer, counteredPrice, adminMessage = null) => {
  return generateBuyerEmailTemplate({
    action: 'countered',
    property,
    buyer,
    offer,
    counteredPrice,
    adminMessage
  });
};

/**
 * Template for Expired Offer
 */
export const expiredOfferTemplate = (property, buyer, offer, adminMessage = null) => {
  return generateBuyerEmailTemplate({
    action: 'expired',
    property,
    buyer,
    offer,
    adminMessage
  });
};