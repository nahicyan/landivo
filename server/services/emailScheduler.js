// server/services/emailScheduler.js
import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { queueEmailCampaign } from './emailQueue.js';
import { executeAutomationRule } from '../controllers/emailAutomationCntrl.js';
import { sendWelcomeEmail } from './emailService.js';

/**
 * Initialize email scheduler with cron jobs
 */
export const initEmailScheduler = () => {
  console.log('Initializing email scheduler...');

  // Check for scheduled campaigns every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledCampaigns();
    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
    }
  });

  // Process automation triggers every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await processAutomationTriggers();
    } catch (error) {
      console.error('Error processing automation triggers:', error);
    }
  });

  // Clean up old tracking data (daily at 2 AM)
  cron.schedule('0 2 * * *', async () => {
    try {
      await cleanupOldTrackingData();
    } catch (error) {
      console.error('Error cleaning up tracking data:', error);
    }
  });

  // Send daily analytics summary (daily at 9 AM)
  cron.schedule('0 9 * * *', async () => {
    try {
      await sendDailyAnalyticsSummary();
    } catch (error) {
      console.error('Error sending daily analytics:', error);
    }
  });

  // Process inactive buyer re-engagement (weekly on Monday at 10 AM)
  cron.schedule('0 10 * * 1', async () => {
    try {
      await processInactiveBuyerReengagement();
    } catch (error) {
      console.error('Error processing inactive buyer re-engagement:', error);
    }
  });

  console.log('Email scheduler initialized with cron jobs');
};

/**
 * Process scheduled campaigns that are ready to send
 */
async function processScheduledCampaigns() {
  const now = new Date();
  
  try {
    // Find campaigns that should be sent now
    const campaignsToSend = await prisma.emailCampaign.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: now
        }
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

    for (const campaign of campaignsToSend) {
      try {
        console.log(`Processing scheduled campaign: ${campaign.name}`);
        
        // Update status to queued
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: 'queued' }
        });

        // Queue the campaign
        await queueEmailCampaign(campaign.id);
        
        console.log(`Campaign ${campaign.name} queued successfully`);
      } catch (error) {
        console.error(`Error queuing campaign ${campaign.name}:`, error);
        
        // Mark campaign as failed
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { 
            status: 'failed',
            error: error.message
          }
        });
      }
    }

    if (campaignsToSend.length > 0) {
      console.log(`Processed ${campaignsToSend.length} scheduled campaigns`);
    }
  } catch (error) {
    console.error('Error in processScheduledCampaigns:', error);
  }
}

/**
 * Process automation triggers
 */
async function processAutomationTriggers() {
  try {
    // Process new buyer registrations
    await processNewBuyerTriggers();
    
    // Process property upload triggers
    await processPropertyUploadTriggers();
    
    // Process buyer inactivity triggers
    await processBuyerInactivityTriggers();
    
  } catch (error) {
    console.error('Error in processAutomationTriggers:', error);
  }
}

/**
 * Process new buyer registration triggers
 */
async function processNewBuyerTriggers() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Find buyers registered in the last 5 minutes
  const newBuyers = await prisma.buyer.findMany({
    where: {
      createdAt: {
        gte: fiveMinutesAgo
      },
      emailOptIn: true,
      emailStatus: {
        not: 'unsubscribed'
      }
    }
  });

  if (newBuyers.length === 0) return;

  // Find active automation rules for buyer registration
  const automationRules = await prisma.emailAutomationRule.findMany({
    where: {
      triggerType: 'BUYER_REGISTERED',
      isActive: true
    },
    include: {
      template: true
    }
  });

  for (const rule of automationRules) {
    for (const buyer of newBuyers) {
      try {
        await executeAutomationRule(rule, {
          eventType: 'buyer_registered',
          buyerId: buyer.id,
          buyerData: buyer
        });
      } catch (error) {
        console.error(`Error executing automation rule ${rule.name} for buyer ${buyer.id}:`, error);
      }
    }
  }

  console.log(`Processed ${newBuyers.length} new buyer registrations`);
}

/**
 * Process property upload triggers
 */
async function processPropertyUploadTriggers() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Find properties uploaded in the last 5 minutes
  const newProperties = await prisma.residency.findMany({
    where: {
      createdAt: {
        gte: fiveMinutesAgo
      },
      autoNotifyOnUpload: true
    }
  });

  if (newProperties.length === 0) return;

  // Find active automation rules for property uploads
  const automationRules = await prisma.emailAutomationRule.findMany({
    where: {
      triggerType: 'PROPERTY_UPLOADED',
      isActive: true
    },
    include: {
      template: true
    }
  });

  for (const rule of automationRules) {
    for (const property of newProperties) {
      try {
        await executeAutomationRule(rule, {
          eventType: 'property_uploaded',
          propertyId: property.id,
          propertyData: property
        });
      } catch (error) {
        console.error(`Error executing automation rule ${rule.name} for property ${property.id}:`, error);
      }
    }
  }

  console.log(`Processed ${newProperties.length} new property uploads`);
}

/**
 * Process buyer inactivity triggers
 */
async function processBuyerInactivityTriggers() {
  // Find automation rules for buyer inactivity
  const automationRules = await prisma.emailAutomationRule.findMany({
    where: {
      triggerType: 'BUYER_INACTIVE',
      isActive: true
    },
    include: {
      template: true
    }
  });

  if (automationRules.length === 0) return;

  for (const rule of automationRules) {
    try {
      const inactiveDays = rule.triggerConditions?.inactiveDays || 30;
      const inactiveDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

      // Find inactive buyers
      const inactiveBuyers = await prisma.buyer.findMany({
        where: {
          emailOptIn: true,
          emailStatus: {
            not: 'unsubscribed'
          },
          updatedAt: {
            lte: inactiveDate
          },
          lastEmailSent: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Haven't received email in 7 days
          }
        }
      });

      for (const buyer of inactiveBuyers) {
        await executeAutomationRule(rule, {
          eventType: 'buyer_inactive',
          buyerId: buyer.id,
          buyerData: buyer,
          inactiveDays
        });
      }

      console.log(`Processed ${inactiveBuyers.length} inactive buyers for rule ${rule.name}`);
    } catch (error) {
      console.error(`Error processing inactivity rule ${rule.name}:`, error);
    }
  }
}

/**
 * Process inactive buyer re-engagement campaigns
 */
async function processInactiveBuyerReengagement() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find buyers who haven't been active in 30 days but haven't received re-engagement email in 7 days
    const inactiveBuyers = await prisma.buyer.findMany({
      where: {
        emailOptIn: true,
        emailStatus: {
          not: 'unsubscribed'
        },
        updatedAt: {
          lte: thirtyDaysAgo
        },
        OR: [
          { lastEmailSent: null },
          { lastEmailSent: { lte: sevenDaysAgo } }
        ]
      },
      take: 100 // Limit to prevent overwhelming the system
    });

    if (inactiveBuyers.length === 0) return;

    // Find re-engagement template
    const reengagementTemplate = await prisma.emailTemplate.findFirst({
      where: {
        name: { contains: 'Re-engagement' },
        isActive: true
      }
    });

    if (!reengagementTemplate) {
      console.log('No re-engagement template found');
      return;
    }

    // Send re-engagement emails
    // This would use your email service to send the emails
    console.log(`Would send re-engagement emails to ${inactiveBuyers.length} inactive buyers`);

    // Update last email sent timestamp
    await prisma.buyer.updateMany({
      where: {
        id: { in: inactiveBuyers.map(b => b.id) }
      },
      data: {
        lastEmailSent: new Date()
      }
    });

  } catch (error) {
    console.error('Error in processInactiveBuyerReengagement:', error);
  }
}

/**
 * Clean up old tracking data
 */
async function cleanupOldTrackingData() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Delete tracking data older than 6 months
    const deletedCount = await prisma.emailTracking.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        }
      }
    });

    // Delete completed automation executions older than 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const deletedExecutions = await prisma.automationExecution.deleteMany({
      where: {
        executedAt: {
          lt: threeMonthsAgo
        },
        status: 'COMPLETED'
      }
    });

    console.log(`Cleanup completed: ${deletedCount.count} tracking records, ${deletedExecutions.count} automation executions`);
  } catch (error) {
    console.error('Error in cleanupOldTrackingData:', error);
  }
}

/**
 * Send daily analytics summary to admin users
 */
async function sendDailyAnalyticsSummary() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        // Add your admin role filter here
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (adminUsers.length === 0) return;

    // Get yesterday's email statistics
    const stats = await getEmailStatsForDate(yesterday, today);

    if (stats.totalSent === 0) return; // Skip if no emails sent

    // Create analytics summary email
    const summaryData = {
      date: yesterday.toDateString(),
      ...stats
    };

    // Send summary to admin users
    for (const admin of adminUsers) {
      // This would send the analytics summary email
      console.log(`Would send daily analytics summary to ${admin.email}:`, summaryData);
    }

  } catch (error) {
    console.error('Error in sendDailyAnalyticsSummary:', error);
  }
}

/**
 * Get email statistics for a specific date range
 */
async function getEmailStatsForDate(startDate, endDate) {
  try {
    const trackingData = await prisma.emailTracking.groupBy({
      by: ['eventType'],
      where: {
        eventTimestamp: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: { eventType: true }
    });

    const stats = trackingData.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count.eventType;
      return acc;
    }, {});

    const totalSent = stats.delivered || stats.sent || 0;
    const opens = stats.opened || 0;
    const clicks = stats.clicked || 0;
    const bounces = stats.bounced || 0;
    const unsubscribes = stats.unsubscribed || 0;

    return {
      totalSent,
      opens,
      clicks,
      bounces,
      unsubscribes,
      openRate: totalSent > 0 ? ((opens / totalSent) * 100).toFixed(2) : 0,
      clickRate: totalSent > 0 ? ((clicks / totalSent) * 100).toFixed(2) : 0,
      bounceRate: totalSent > 0 ? ((bounces / totalSent) * 100).toFixed(2) : 0,
      unsubscribeRate: totalSent > 0 ? ((unsubscribes / totalSent) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting email stats:', error);
    return {
      totalSent: 0,
      opens: 0,
      clicks: 0,
      bounces: 0,
      unsubscribes: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0
    };
  }
}

export default {
  initEmailScheduler,
  processScheduledCampaigns,
  processAutomationTriggers
};