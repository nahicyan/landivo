// server/controllers/emailTrackingCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from '../config/prismaConfig.js';
import { decodeTrackingToken, verifyUnsubscribeToken, handleSendGridWebhook } from "../services/emailService.js";

/**
 * Track email open via tracking pixel
 * @route GET /api/email-tracking/pixel/:token
 * @access Public
 */
export const trackEmailOpen = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    const trackingData = decodeTrackingToken(token);
    
    if (!trackingData) {
      // Return a 1x1 transparent pixel even if token is invalid
      return sendTrackingPixel(res);
    }

    const { campaignId, buyerId } = trackingData;

    // Check if this open was already tracked recently (within 1 hour)
    const recentOpen = await prisma.emailTracking.findFirst({
      where: {
        campaignId,
        recipientId: buyerId,
        eventType: 'opened',
        eventTimestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (!recentOpen) {
      // Record the email open
      await prisma.emailTracking.create({
        data: {
          campaignId,
          recipientId: buyerId,
          eventType: 'opened',
          eventTimestamp: new Date(),
          ipAddress: getClientIP(req),
          userAgent: req.get('User-Agent'),
          metadata: {
            trackingToken: token
          }
        }
      });

      console.log(`Email open tracked: Campaign ${campaignId}, Buyer ${buyerId}`);
    }

    // Return tracking pixel
    sendTrackingPixel(res);
  } catch (error) {
    console.error("Error tracking email open:", error);
    sendTrackingPixel(res);
  }
});

/**
 * Track email click
 * @route GET /api/email-tracking/click/:token
 * @access Public
 */
export const trackEmailClick = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { url } = req.query;

  try {
    const trackingData = decodeTrackingToken(token);
    
    if (trackingData) {
      const { campaignId, buyerId } = trackingData;

      // Record the email click
      await prisma.emailTracking.create({
        data: {
          campaignId,
          recipientId: buyerId,
          eventType: 'clicked',
          eventTimestamp: new Date(),
          ipAddress: getClientIP(req),
          userAgent: req.get('User-Agent'),
          clickUrl: url,
          metadata: {
            trackingToken: token,
            referrer: req.get('Referer')
          }
        }
      });

      console.log(`Email click tracked: Campaign ${campaignId}, Buyer ${buyerId}, URL: ${url}`);
    }

    // Redirect to the actual URL
    if (url) {
      res.redirect(decodeURIComponent(url));
    } else {
      res.redirect(process.env.FRONTEND_URL || 'https://landivo.com');
    }
  } catch (error) {
    console.error("Error tracking email click:", error);
    // Redirect to homepage even if tracking fails
    res.redirect(process.env.FRONTEND_URL || 'https://landivo.com');
  }
});

/**
 * Handle SendGrid webhook events
 * @route POST /api/email-tracking/webhook
 * @access Public
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    // Process webhook events
    await handleSendGridWebhook(events);

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ message: "Error processing webhook" });
  }
});

/**
 * Get email analytics dashboard
 * @route GET /api/email-tracking/analytics
 * @access Private
 */
export const getEmailAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, campaignId } = req.query;
  const userId = req.user.id;

  try {
    // Default to last 30 days if no date range provided
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    // Get user's campaigns
    const userCampaigns = await prisma.emailCampaign.findMany({
      where: { 
        userId,
        ...(campaignId && { id: campaignId })
      },
      select: { id: true, name: true }
    });

    const campaignIds = userCampaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return res.status(200).json({
        analytics: {
          totalSent: 0,
          totalOpens: 0,
          totalClicks: 0,
          totalBounces: 0,
          totalUnsubscribes: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
          unsubscribeRate: 0
        },
        chartData: [],
        topPerformingCampaigns: []
      });
    }

    // Get tracking data
    const trackingData = await prisma.emailTracking.groupBy({
      by: ['eventType'],
      where: {
        campaignId: { in: campaignIds },
        eventTimestamp: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: { eventType: true }
    });

    // Calculate metrics
    const stats = trackingData.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count.eventType;
      return acc;
    }, {});

    const totalSent = stats.delivered || stats.sent || 0;
    const totalOpens = stats.opened || 0;
    const totalClicks = stats.clicked || 0;
    const totalBounces = stats.bounced || 0;
    const totalUnsubscribes = stats.unsubscribed || 0;

    const analytics = {
      totalSent,
      totalOpens,
      totalClicks,
      totalBounces,
      totalUnsubscribes,
      openRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(2) : 0,
      clickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(2) : 0,
      bounceRate: totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(2) : 0,
      unsubscribeRate: totalSent > 0 ? ((totalUnsubscribes / totalSent) * 100).toFixed(2) : 0
    };

    // Get daily tracking data for charts
    const dailyData = await prisma.emailTracking.groupBy({
      by: ['eventType'],
      where: {
        campaignId: { in: campaignIds },
        eventTimestamp: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: { eventType: true },
      orderBy: { eventTimestamp: 'asc' }
    });

    // Get top performing campaigns
    const topCampaigns = await Promise.all(
      userCampaigns.slice(0, 5).map(async (campaign) => {
        const campaignStats = await prisma.emailTracking.groupBy({
          by: ['eventType'],
          where: {
            campaignId: campaign.id,
            eventTimestamp: {
              gte: fromDate,
              lte: toDate
            }
          },
          _count: { eventType: true }
        });

        const campaignMetrics = campaignStats.reduce((acc, stat) => {
          acc[stat.eventType] = stat._count.eventType;
          return acc;
        }, {});

        const sent = campaignMetrics.delivered || campaignMetrics.sent || 0;
        const opens = campaignMetrics.opened || 0;
        const clicks = campaignMetrics.clicked || 0;

        return {
          ...campaign,
          totalSent: sent,
          totalOpens: opens,
          totalClicks: clicks,
          openRate: sent > 0 ? ((opens / sent) * 100).toFixed(2) : 0,
          clickRate: sent > 0 ? ((clicks / sent) * 100).toFixed(2) : 0
        };
      })
    );

    res.status(200).json({
      analytics,
      chartData: dailyData,
      topPerformingCampaigns: topCampaigns.sort((a, b) => b.openRate - a.openRate)
    });
  } catch (error) {
    console.error("Error fetching email analytics:", error);
    res.status(500).json({
      message: "Failed to fetch email analytics",
      error: error.message
    });
  }
});

/**
 * Get campaign-specific analytics
 * @route GET /api/email-tracking/campaigns/:id/analytics
 * @access Private
 */
export const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verify campaign belongs to user
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    // Get tracking data
    const trackingData = await prisma.emailTracking.groupBy({
      by: ['eventType'],
      where: { campaignId: id },
      _count: { eventType: true }
    });

    // Get tracking data over time
    const timelineData = await prisma.emailTracking.findMany({
      where: { campaignId: id },
      select: {
        eventType: true,
        eventTimestamp: true,
        clickUrl: true,
        ipAddress: true,
        userAgent: true
      },
      orderBy: { eventTimestamp: 'asc' }
    });

    // Get recipient details
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: id },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            buyerType: true
          }
        }
      }
    });

    // Calculate metrics
    const stats = trackingData.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count.eventType;
      return acc;
    }, {});

    const totalSent = stats.delivered || stats.sent || recipients.length;
    const opens = stats.opened || 0;
    const clicks = stats.clicked || 0;
    const bounces = stats.bounced || 0;
    const unsubscribes = stats.unsubscribed || 0;

    const analytics = {
      totalSent,
      opens,
      clicks,
      bounces,
      unsubscribes,
      openRate: totalSent > 0 ? ((opens / totalSent) * 100).toFixed(2) : 0,
      clickRate: totalSent > 0 ? ((clicks / totalSent) * 100).toFixed(2) : 0,
      bounceRate: totalSent > 0 ? ((bounces / totalSent) * 100).toFixed(2) : 0,
      unsubscribeRate: totalSent > 0 ? ((unsubscribes / totalSent) * 100).toFixed(2) : 0,
      timeline: timelineData,
      recipients: recipients.length
    };

    // Get click URLs breakdown
    const clickUrls = await prisma.emailTracking.groupBy({
      by: ['clickUrl'],
      where: {
        campaignId: id,
        eventType: 'clicked',
        clickUrl: { not: null }
      },
      _count: { clickUrl: true },
      orderBy: { _count: { clickUrl: 'desc' } }
    });

    // Get device/browser breakdown
    const deviceData = await prisma.emailTracking.findMany({
      where: {
        campaignId: id,
        eventType: 'opened',
        userAgent: { not: null }
      },
      select: { userAgent: true }
    });

    res.status(200).json({
      analytics,
      clickUrls: clickUrls.map(url => ({
        url: url.clickUrl,
        clicks: url._count.clickUrl
      })),
      deviceBreakdown: processDeviceData(deviceData)
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    res.status(500).json({
      message: "Failed to fetch campaign analytics",
      error: error.message
    });
  }
});

/**
 * Get buyer email history
 * @route GET /api/email-tracking/buyers/:id/history
 * @access Private
 */
export const getBuyerEmailHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  try {
    // Verify user has access to this buyer
    const buyer = await prisma.buyer.findFirst({
      where: { 
        id,
        // Add user relationship check here if needed
      }
    });

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found"
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get email history
    const [emailHistory, total] = await Promise.all([
      prisma.emailTracking.findMany({
        where: { recipientId: id },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              subject: true,
              sentAt: true
            }
          }
        },
        orderBy: { eventTimestamp: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.emailTracking.count({
        where: { recipientId: id }
      })
    ]);

    // Get campaign participation
    const campaigns = await prisma.campaignRecipient.findMany({
      where: { buyerId: id },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            subject: true,
            sentAt: true,
            status: true
          }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    res.status(200).json({
      buyer: {
        id: buyer.id,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        emailStatus: buyer.emailStatus,
        emailOptIn: buyer.emailOptIn
      },
      emailHistory,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching buyer email history:", error);
    res.status(500).json({
      message: "Failed to fetch buyer email history",
      error: error.message
    });
  }
});

/**
 * Unsubscribe buyer from emails
 * @route POST /api/email-tracking/unsubscribe
 * @access Public
 */
export const unsubscribeBuyer = asyncHandler(async (req, res) => {
  const { email, token } = req.body;

  try {
    if (!email || !token) {
      return res.status(400).json({
        message: "Email and token are required"
      });
    }

    // Verify unsubscribe token
    if (!verifyUnsubscribeToken(token, email)) {
      return res.status(400).json({
        message: "Invalid unsubscribe token"
      });
    }

    // Update buyer email status
    const buyer = await prisma.buyer.updateMany({
      where: { email: email.toLowerCase() },
      data: {
        emailStatus: 'unsubscribed',
        emailOptIn: false
      }
    });

    if (buyer.count === 0) {
      return res.status(404).json({
        message: "Email address not found"
      });
    }

    res.status(200).json({
      message: "Successfully unsubscribed from email communications"
    });
  } catch (error) {
    console.error("Error unsubscribing buyer:", error);
    res.status(500).json({
      message: "Failed to unsubscribe",
      error: error.message
    });
  }
});

/**
 * Get unsubscribe page
 * @route GET /api/email-tracking/unsubscribe
 * @access Public
 */
export const getUnsubscribePage = asyncHandler(async (req, res) => {
  const { email, token } = req.query;

  // Return simple HTML unsubscribe page
  const unsubscribeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Unsubscribe - Landivo</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { text-align: center; }
            .btn { background: #d32f2f; color: white; padding: 10px 20px; border: none; cursor: pointer; }
            .btn:hover { background: #b71c1c; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Unsubscribe from Landivo Emails</h2>
            <p>We're sorry to see you go! Click the button below to unsubscribe from our email communications.</p>
            <p><strong>Email:</strong> ${email || ''}</p>
            <form method="POST" action="/api/email-tracking/unsubscribe">
                <input type="hidden" name="email" value="${email || ''}" />
                <input type="hidden" name="token" value="${token || ''}" />
                <button type="submit" class="btn">Unsubscribe</button>
            </form>
            <p><small>You can always re-subscribe by contacting us or updating your preferences in your account.</small></p>
        </div>
    </body>
    </html>
  `;

  res.send(unsubscribeHtml);
});

/**
 * Helper function to send 1x1 transparent tracking pixel
 */
function sendTrackingPixel(res) {
  // 1x1 transparent GIF pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.end(pixel);
}

/**
 * Helper function to get client IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Helper function to process device/browser data
 */
function processDeviceData(deviceData) {
  const devices = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
  const browsers = {};

  deviceData.forEach(({ userAgent }) => {
    if (!userAgent) return;

    const ua = userAgent.toLowerCase();
    
    // Device detection
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      devices.mobile++;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      devices.tablet++;
    } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      devices.desktop++;
    } else {
      devices.unknown++;
    }

    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    browsers[browser] = (browsers[browser] || 0) + 1;
  });

  return { devices, browsers };
}