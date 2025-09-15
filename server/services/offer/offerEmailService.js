// server/services/offer/offerEmailService.js
import nodemailer from "nodemailer";
import { prisma } from "../../config/prismaConfig.js";

/**
 * Send offer notification email using database settings
 */
export const sendOfferNotification = async (subject, body) => {
  try {
    // Get system settings from database
    const settings = await prisma.settings.findFirst();
    
    // Check if offer emails are enabled and properly configured
    if (!settings || !settings.enableOfferEmails) {
      console.log('Offer email notifications are disabled in settings');
      return;
    }
    
    if (!settings.offerEmailRecipients || settings.offerEmailRecipients.length === 0) {
      console.log('No offer email recipients configured');
      return;
    }
    
    if (!settings.smtpServer || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword) {
      console.log('Incomplete SMTP configuration');
      return;
    }
    
    // Create nodemailer transporter using database settings
    const transporter = nodemailer.createTransport({
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
 * Generate beautiful offer email template using EXACT design from property deletion service
 */
const generateOfferEmailTemplate = ({ action, property, buyer, offeredPrice, buyerMessage }) => {
  const propertyUrl = `https://landivo.com/properties/${property.id}`;
  const manageOfferUrl = `https://landivo.com/admin/offers/id/${offerId}`;
  
  // Action-specific configurations
  const actionConfig = {
    submitted: {
      title: 'NEW OFFER SUBMITTED',
      description: 'A new offer has been submitted and requires your attention for review.'
    },
    updated: {
      title: 'OFFER UPDATED', 
      description: 'An existing offer has been updated with a new price.'
    },
    low_offer: {
      title: 'LOW OFFER ALERT',
      description: 'A low offer below the minimum price has been submitted and requires special attention.'
    }
  };

  const config = actionConfig[action] || actionConfig.submitted;

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
            ">Hello Admin,</p>
            
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
                ">${Number(property.askingPrice || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #3c4043;
                ">${action === 'updated' ? 'New ' : ''}Offered Price:</td>
                <td style="
                  padding: 8px 0;
                  color: #3c4043;
                  font-size: 18px;
                  font-weight: 700;
                ">${Number(offeredPrice).toLocaleString()}</td>
              </tr>
              ${action === 'low_offer' && property.minPrice ? `
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #3c4043;
                ">Minimum Price:</td>
                <td style="
                  padding: 8px 0;
                  color: #3c4043;
                  font-size: 18px;
                  font-weight: 700;
                ">${Number(property.minPrice).toLocaleString()}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${buyerMessage ? `
          <!-- Buyer Message Card -->
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
            ">Buyer Message</h3>
            <p style="
              margin: 0;
              font-size: 14px;
              line-height: 22px;
              color: #856404;
              background-color: #fffbf0;
              padding: 15px;
              border-radius: 5px;
              border-left: 3px solid #ffc107;
            ">${buyerMessage}</p>
          </div>
          ` : ''}

          <!-- Buyer Details Card -->
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
            ">Buyer Information</h3>
            
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
                ">Name:</td>
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
                "><a href="tel:${buyer.phone}" style="color: #1565c0; text-decoration: none;">${buyer.phone}</a></td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  font-weight: 600;
                  color: #1565c0;
                ">Buyer Type:</td>
                <td style="
                  padding: 8px 0;
                  border-bottom: 1px solid #bbdefb;
                  color: #1565c0;
                ">${buyer.buyerType || "Not specified"}</td>
              </tr>
              <tr>
                <td style="
                  padding: 8px 0;
                  font-weight: 600;
                  color: #1565c0;
                ">${action === 'updated' ? 'Updated' : 'Submitted'} On:</td>
                <td style="
                  padding: 8px 0;
                  color: #1565c0;
                ">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="
            padding: 40px;
            text-align: center;
          ">
            <a href="${propertyUrl}" style="
              background: linear-gradient(135deg, #324c48 0%, #2c3e3a 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(50, 76, 72, 0.3);
              transition: all 0.3s ease;
            ">Go to Property</a>
            
            ${manageOfferUrl ? `
            <a href="${manageOfferUrl}" style="
              background: linear-gradient(135deg, #D4A017 0%, #B8940F 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              display: inline-block;
              font-weight: 600;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(212, 160, 23, 0.3);
              transition: all 0.3s ease;
            ">Manage Offer</a>
            ` : ''}
          </div>

          ${action === 'low_offer' ? `
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
              <strong>⚠️ Attention:</strong> This offer is below the minimum acceptable price. Consider negotiating with the buyer or reviewing your pricing strategy.
            </p>
          </div>
          ` : ''}

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
            ">© 2025 Landivo LLC. All rights reserved.</p>
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

/**
 * Template for New Offer
 */
export const newOfferTemplate = (property, buyer, offeredPrice, buyerMessage = null) => {
  return generateOfferEmailTemplate({
    action: 'submitted',
    property,
    buyer,
    offeredPrice,
    buyerMessage
  });
};

/**
 * Template for Updated Offer
 */
export const updatedOfferTemplate = (property, buyer, offeredPrice, buyerMessage = null) => {
  return generateOfferEmailTemplate({
    action: 'updated',
    property,
    buyer,
    offeredPrice,
    buyerMessage
  });
};

/**
 * Template for Low Offer Warning
 */
export const lowOfferTemplate = (property, buyer, offeredPrice, buyerMessage = null) => {
  return generateOfferEmailTemplate({
    action: 'low_offer',
    property,
    buyer,
    offeredPrice,
    buyerMessage
  });
};