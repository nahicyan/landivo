// server/services/emailService.js
import sgMail from '@sendgrid/mail';
import Handlebars from 'handlebars';
import { prisma } from '../config/prismaConfig.js';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send bulk emails to buyers
 * @param {Array} buyers - Array of buyer objects with email, firstName, lastName
 * @param {string} htmlTemplate - HTML template content
 * @param {string} subject - Email subject template
 * @param {Object} options - Additional options like fromName, fromEmail
 * @param {string} campaignId - Campaign ID for tracking
 */
export const sendBulkEmails = async (buyers, htmlTemplate, subject, options = {}, campaignId = null) => {
  const {
    fromName = "Landivo",
    fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@landivo.com",
    replyTo = process.env.SMTP_REPLY_TO || "support@landivo.com"
  } = options;

  const results = {
    sent: [],
    failed: [],
    totalSent: 0,
    totalFailed: 0
  };

  // Compile templates
  const compiledHtml = Handlebars.compile(htmlTemplate);
  const compiledSubject = Handlebars.compile(subject);

  for (const buyer of buyers) {
    try {
      // Prepare template data
      const templateData = {
        buyerName: `${buyer.firstName} ${buyer.lastName}`.trim(),
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        buyerType: buyer.buyerType,
        preferredAreas: buyer.preferredAreas ? buyer.preferredAreas.join(", ") : "",
        // Add tracking pixel and unsubscribe link
        trackingPixel: campaignId ? `${process.env.EMAIL_TRACKING_DOMAIN}/api/email-tracking/pixel/${generateTrackingToken(campaignId, buyer.id)}` : "",
        unsubscribeUrl: `${process.env.EMAIL_TRACKING_DOMAIN}/unsubscribe?email=${encodeURIComponent(buyer.email)}&token=${generateUnsubscribeToken(buyer.email)}`,
        // Add any additional properties from buyer object
        ...buyer
      };

      // Render email content
      const personalizedHtml = compiledHtml(templateData);
      const personalizedSubject = compiledSubject(templateData);

      // Add tracking pixel to HTML if campaign ID provided
      const finalHtml = campaignId ? 
        personalizedHtml + `<img src="${templateData.trackingPixel}" width="1" height="1" style="display:none;" />` :
        personalizedHtml;

      // Prepare email
      const emailData = {
        to: buyer.email,
        from: {
          email: fromEmail,
          name: fromName
        },
        replyTo,
        subject: personalizedSubject,
        html: finalHtml,
        // Add custom headers for tracking
        customArgs: {
          campaignId: campaignId || 'manual',
          buyerId: buyer.id,
          emailType: 'campaign'
        },
        // Add unsubscribe header
        asm: {
          groupId: parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '1')
        }
      };

      // Send email
      await sgMail.send(emailData);

      // Record successful send
      results.sent.push({
        buyerId: buyer.id,
        email: buyer.email,
        status: 'sent'
      });
      results.totalSent++;

      // Create tracking record if campaign ID provided
      if (campaignId) {
        await createEmailTrackingRecord(campaignId, buyer.id, 'sent', {
          subject: personalizedSubject,
          fromEmail,
          fromName
        });
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Failed to send email to ${buyer.email}:`, error);
      
      results.failed.push({
        buyerId: buyer.id,
        email: buyer.email,
        error: error.message,
        status: 'failed'
      });
      results.totalFailed++;

      // Record failed send if campaign ID provided
      if (campaignId) {
        await createEmailTrackingRecord(campaignId, buyer.id, 'failed', {
          error: error.message
        });
      }
    }
  }

  return results;
};

/**
 * Send a single email
 * @param {Object} buyer - Buyer object
 * @param {string} htmlTemplate - HTML template
 * @param {string} subject - Email subject
 * @param {Object} options - Additional options
 */
export const sendSingleEmail = async (buyer, htmlTemplate, subject, options = {}) => {
  const result = await sendBulkEmails([buyer], htmlTemplate, subject, options);
  return result.sent.length > 0;
};

/**
 * Send property-specific emails (property alerts, price drops, etc.)
 * @param {Array} buyers - Array of buyers
 * @param {string} templateId - Email template ID
 * @param {Object} propertyData - Property information
 * @param {Object} options - Additional options
 */
export const sendPropertyEmails = async (buyers, templateId, propertyData, options = {}) => {
  try {
    // Get template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Email template not found');
    }

    // Enhance buyer data with property information
    const buyersWithPropertyData = buyers.map(buyer => ({
      ...buyer,
      // Property data
      propertyTitle: propertyData.title,
      propertyPrice: formatPrice(propertyData.price),
      propertyLocation: `${propertyData.city}, ${propertyData.state || propertyData.country}`,
      propertyType: propertyData.propertyType,
      propertyAddress: propertyData.address,
      propertyDescription: propertyData.description,
      propertyImage: propertyData.images && propertyData.images.length > 0 ? propertyData.images[0] : '',
      propertyUrl: `${process.env.FRONTEND_URL}/properties/${propertyData.id}`,
      // Additional property fields
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      area: propertyData.area,
      // Price drop specific fields
      originalPrice: propertyData.originalPrice ? formatPrice(propertyData.originalPrice) : null,
      newPrice: formatPrice(propertyData.price),
      savingsAmount: propertyData.originalPrice ? formatPrice(propertyData.originalPrice - propertyData.price) : null,
      // Timing
      eventDate: propertyData.eventDate,
      eventTime: propertyData.eventTime,
      ...propertyData
    }));

    return await sendBulkEmails(
      buyersWithPropertyData,
      template.htmlContent,
      template.subject,
      options
    );
  } catch (error) {
    console.error('Error sending property emails:', error);
    throw error;
  }
};

/**
 * Send welcome email to new buyer
 * @param {Object} buyer - Buyer object
 */
export const sendWelcomeEmail = async (buyer) => {
  try {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        name: 'Welcome New Buyer',
        isSystemTemplate: true,
        isActive: true
      }
    });

    if (!template) {
      console.warn('Welcome email template not found');
      return false;
    }

    const enhancedBuyer = {
      ...buyer,
      profileUrl: `${process.env.FRONTEND_URL}/profile`,
      browseUrl: `${process.env.FRONTEND_URL}/properties`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@landivo.com'
    };

    return await sendSingleEmail(
      enhancedBuyer,
      template.htmlContent,
      template.subject,
      {
        fromName: "Landivo Team",
        fromEmail: process.env.SMTP_FROM_EMAIL
      }
    );
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Create email tracking record
 * @param {string} campaignId - Campaign ID
 * @param {string} buyerId - Buyer ID
 * @param {string} eventType - Event type (sent, delivered, opened, clicked, etc.)
 * @param {Object} metadata - Additional metadata
 */
export const createEmailTrackingRecord = async (campaignId, buyerId, eventType, metadata = {}) => {
  try {
    await prisma.emailTracking.create({
      data: {
        campaignId,
        recipientId: buyerId,
        eventType,
        eventTimestamp: new Date(),
        metadata
      }
    });
  } catch (error) {
    console.error('Error creating tracking record:', error);
  }
};

/**
 * Generate tracking token for email opens and clicks
 * @param {string} campaignId - Campaign ID
 * @param {string} buyerId - Buyer ID
 */
export const generateTrackingToken = (campaignId, buyerId) => {
  const data = `${campaignId}:${buyerId}:${Date.now()}`;
  return Buffer.from(data).toString('base64url');
};

/**
 * Decode tracking token
 * @param {string} token - Tracking token
 */
export const decodeTrackingToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [campaignId, buyerId, timestamp] = decoded.split(':');
    return { campaignId, buyerId, timestamp: parseInt(timestamp) };
  } catch (error) {
    console.error('Error decoding tracking token:', error);
    return null;
  }
};

/**
 * Generate unsubscribe token
 * @param {string} email - Email address
 */
export const generateUnsubscribeToken = (email) => {
  const data = `${email}:${process.env.UNSUBSCRIBE_SECRET || 'default-secret'}`;
  return Buffer.from(data).toString('base64url');
};

/**
 * Verify unsubscribe token
 * @param {string} token - Unsubscribe token
 * @param {string} email - Email address
 */
export const verifyUnsubscribeToken = (token, email) => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [tokenEmail, secret] = decoded.split(':');
    return tokenEmail === email && secret === (process.env.UNSUBSCRIBE_SECRET || 'default-secret');
  } catch (error) {
    console.error('Error verifying unsubscribe token:', error);
    return false;
  }
};

/**
 * Format price for display
 * @param {number} price - Price amount
 */
export const formatPrice = (price) => {
  if (!price) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Handle SendGrid webhook events
 * @param {Array} events - SendGrid webhook events
 */
export const handleSendGridWebhook = async (events) => {
  for (const event of events) {
    try {
      const { campaignId, buyerId } = event.customArgs || {};
      
      if (!campaignId || !buyerId) {
        continue; // Skip events without tracking info
      }

      // Map SendGrid events to our event types
      const eventTypeMap = {
        'delivered': 'delivered',
        'open': 'opened',
        'click': 'clicked',
        'bounce': 'bounced',
        'dropped': 'failed',
        'deferred': 'deferred',
        'unsubscribe': 'unsubscribed',
        'spamreport': 'spam'
      };

      const eventType = eventTypeMap[event.event];
      if (!eventType) {
        continue; // Skip unknown events
      }

      // Create tracking record
      await createEmailTrackingRecord(campaignId, buyerId, eventType, {
        sendgridEventId: event.sg_event_id,
        timestamp: event.timestamp,
        email: event.email,
        url: event.url, // For click events
        reason: event.reason, // For bounce/drop events
        userAgent: event.useragent,
        ip: event.ip
      });

      // Handle unsubscribes
      if (eventType === 'unsubscribed') {
        await prisma.buyer.update({
          where: { email: event.email },
          data: { 
            emailStatus: 'unsubscribed',
            emailOptIn: false
          }
        });
      }

    } catch (error) {
      console.error('Error processing SendGrid webhook event:', error);
    }
  }
};

export default {
  sendBulkEmails,
  sendSingleEmail,
  sendPropertyEmails,
  sendWelcomeEmail,
  createEmailTrackingRecord,
  generateTrackingToken,
  decodeTrackingToken,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  handleSendGridWebhook
};