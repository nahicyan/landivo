// server/controllers/emailCampaignCntrl.js
import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { sendBulkEmails } from "../services/emailService.js";
import { queueEmailCampaign } from "../services/emailQueue.js";

/**
 * Create a new email campaign
 * @route POST /api/email-campaigns
 * @access Private
 */
export const createCampaign = asyncHandler(async (req, res) => {
  const { 
    name, 
    subject, 
    templateId, 
    listIds = [], 
    scheduledAt, 
    fromName, 
    fromEmail,
    campaignType = "manual"
  } = req.body;
  
  const userId = req.user.id;

  try {
    // Validate required fields
    if (!name || !subject || !templateId) {
      return res.status(400).json({
        message: "Campaign name, subject, and template are required"
      });
    }

    // Verify template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({
        message: "Email template not found"
      });
    }

    // Create campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        templateId,
        userId,
        fromName: fromName || "Landivo",
        fromEmail: fromEmail || process.env.SMTP_FROM_EMAIL || "noreply@landivo.com",
        campaignType,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        targetLists: listIds
      },
      include: {
        template: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: "Campaign created successfully",
      campaign
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      message: "Failed to create campaign",
      error: error.message
    });
  }
});

/**
 * Get all email campaigns
 * @route GET /api/email-campaigns
 * @access Private
 */
export const getAllCampaigns = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      userId: req.user.id,
      ...(status && status !== 'all' && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        include: {
          template: {
            select: {
              name: true,
              category: true
            }
          },
          recipients: {
            select: {
              id: true,
              status: true
            }
          },
          _count: {
            select: {
              recipients: true,
              tracking: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.emailCampaign.count({ where })
    ]);

    // Calculate metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const tracking = await prisma.emailTracking.groupBy({
          by: ['eventType'],
          where: { campaignId: campaign.id },
          _count: { eventType: true }
        });

        const trackingStats = tracking.reduce((acc, stat) => {
          acc[stat.eventType] = stat._count.eventType;
          return acc;
        }, {});

        const totalSent = trackingStats.delivered || 0;
        const opens = trackingStats.opened || 0;
        const clicks = trackingStats.clicked || 0;

        return {
          ...campaign,
          totalSent,
          opens,
          clicks,
          openRate: totalSent > 0 ? ((opens / totalSent) * 100).toFixed(2) : 0,
          clickRate: totalSent > 0 ? ((clicks / totalSent) * 100).toFixed(2) : 0,
          bounces: trackingStats.bounced || 0,
          unsubscribes: trackingStats.unsubscribed || 0
        };
      })
    );

    res.status(200).json({
      campaigns: campaignsWithMetrics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({
      message: "Failed to fetch campaigns",
      error: error.message
    });
  }
});

/**
 * Get campaign by ID
 * @route GET /api/email-campaigns/:id
 * @access Private
 */
export const getCampaignById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        template: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        recipients: {
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
        },
        tracking: {
          select: {
            eventType: true,
            eventTimestamp: true,
            recipientId: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    res.status(200).json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({
      message: "Failed to fetch campaign",
      error: error.message
    });
  }
});

/**
 * Update campaign
 * @route PUT /api/email-campaigns/:id
 * @access Private
 */
export const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, subject, templateId, scheduledAt, fromName, fromEmail } = req.body;

  try {
    // Check if campaign exists and belongs to user
    const existingCampaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!existingCampaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    // Check if campaign can be updated (not sent)
    if (existingCampaign.status === 'completed' || existingCampaign.status === 'sending') {
      return res.status(400).json({
        message: "Cannot update a campaign that has been sent or is currently sending"
      });
    }

    const updateData = {
      ...(name && { name }),
      ...(subject && { subject }),
      ...(templateId && { templateId }),
      ...(fromName && { fromName }),
      ...(fromEmail && { fromEmail }),
      ...(scheduledAt && { 
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled'
      }),
      updatedAt: new Date()
    };

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      message: "Campaign updated successfully",
      campaign
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({
      message: "Failed to update campaign",
      error: error.message
    });
  }
});

/**
 * Delete campaign
 * @route DELETE /api/email-campaigns/:id
 * @access Private
 */
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    // Check if campaign can be deleted
    if (campaign.status === 'sending') {
      return res.status(400).json({
        message: "Cannot delete a campaign that is currently sending"
      });
    }

    // Delete related tracking data first
    await prisma.emailTracking.deleteMany({
      where: { campaignId: id }
    });

    // Delete recipients
    await prisma.campaignRecipient.deleteMany({
      where: { campaignId: id }
    });

    // Delete campaign
    await prisma.emailCampaign.delete({
      where: { id }
    });

    res.status(200).json({
      message: "Campaign deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({
      message: "Failed to delete campaign",
      error: error.message
    });
  }
});

/**
 * Send campaign immediately
 * @route POST /api/email-campaigns/:id/send
 * @access Private
 */
export const sendCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        template: true
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({
        message: "Campaign cannot be sent in its current status"
      });
    }

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id },
      data: { 
        status: 'queued',
        sentAt: new Date()
      }
    });

    // Queue the campaign for sending
    await queueEmailCampaign(id);

    res.status(200).json({
      message: "Campaign queued for sending"
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({
      message: "Failed to send campaign",
      error: error.message
    });
  }
});

/**
 * Schedule campaign
 * @route POST /api/email-campaigns/:id/schedule
 * @access Private
 */
export const scheduleCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledAt } = req.body;

  try {
    if (!scheduledAt) {
      return res.status(400).json({
        message: "Scheduled date and time are required"
      });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        message: "Scheduled time must be in the future"
      });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id },
      data: { 
        status: 'scheduled',
        scheduledAt: scheduledDate
      }
    });

    res.status(200).json({
      message: "Campaign scheduled successfully",
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error("Error scheduling campaign:", error);
    res.status(500).json({
      message: "Failed to schedule campaign",
      error: error.message
    });
  }
});

/**
 * Pause campaign
 * @route POST /api/email-campaigns/:id/pause
 * @access Private
 */
export const pauseCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    if (campaign.status !== 'sending' && campaign.status !== 'queued') {
      return res.status(400).json({
        message: "Only sending or queued campaigns can be paused"
      });
    }

    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'paused' }
    });

    res.status(200).json({
      message: "Campaign paused successfully"
    });
  } catch (error) {
    console.error("Error pausing campaign:", error);
    res.status(500).json({
      message: "Failed to pause campaign",
      error: error.message
    });
  }
});

/**
 * Clone campaign
 * @route POST /api/email-campaigns/:id/clone
 * @access Private
 */
export const cloneCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const originalCampaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!originalCampaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    const clonedCampaign = await prisma.emailCampaign.create({
      data: {
        name: `${originalCampaign.name} (Copy)`,
        subject: originalCampaign.subject,
        templateId: originalCampaign.templateId,
        userId: originalCampaign.userId,
        fromName: originalCampaign.fromName,
        fromEmail: originalCampaign.fromEmail,
        campaignType: originalCampaign.campaignType,
        targetLists: originalCampaign.targetLists,
        status: 'draft'
      },
      include: {
        template: true
      }
    });

    res.status(201).json({
      message: "Campaign cloned successfully",
      campaign: clonedCampaign
    });
  } catch (error) {
    console.error("Error cloning campaign:", error);
    res.status(500).json({
      message: "Failed to clone campaign",
      error: error.message
    });
  }
});

/**
 * Get campaign analytics
 * @route GET /api/email-campaigns/:id/analytics
 * @access Private
 */
export const getCampaignAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    // Get tracking data grouped by event type
    const trackingData = await prisma.emailTracking.groupBy({
      by: ['eventType'],
      where: { campaignId: id },
      _count: { eventType: true }
    });

    // Get tracking data over time for charts
    const trackingOverTime = await prisma.emailTracking.findMany({
      where: { campaignId: id },
      select: {
        eventType: true,
        eventTimestamp: true
      },
      orderBy: { eventTimestamp: 'asc' }
    });

    // Calculate metrics
    const stats = trackingData.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count.eventType;
      return acc;
    }, {});

    const totalSent = stats.delivered || 0;
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
      trackingOverTime
    };

    res.status(200).json({ analytics });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    res.status(500).json({
      message: "Failed to fetch campaign analytics",
      error: error.message
    });
  }
});

/**
 * Get campaign recipients
 * @route GET /api/email-campaigns/:id/recipients
 * @access Private
 */
export const getCampaignRecipients = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recipients, total] = await Promise.all([
      prisma.campaignRecipient.findMany({
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
        },
        skip,
        take: parseInt(limit),
        orderBy: { sentAt: 'desc' }
      }),
      prisma.campaignRecipient.count({
        where: { campaignId: id }
      })
    ]);

    res.status(200).json({
      recipients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching campaign recipients:", error);
    res.status(500).json({
      message: "Failed to fetch campaign recipients",
      error: error.message
    });
  }
});

/**
 * Test campaign (send to test email)
 * @route POST /api/email-campaigns/:id/test
 * @access Private
 */
export const testCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { testEmail } = req.body;

  try {
    if (!testEmail) {
      return res.status(400).json({
        message: "Test email address is required"
      });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        template: true
      }
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found"
      });
    }

    // Send test email using the email service
    await sendBulkEmails([{
      email: testEmail,
      firstName: "Test",
      lastName: "User"
    }], campaign.template.htmlContent, campaign.subject, {
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail
    });

    res.status(200).json({
      message: "Test email sent successfully"
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      message: "Failed to send test email",
      error: error.message
    });
  }
});