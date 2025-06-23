// server/services/emailQueue.js
import Bull from 'bull';
import { prisma } from '../config/prismaConfig.js';
import { sendBulkEmails } from './emailService.js';

// Create email queue
const emailQueue = new Bull('email processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

/**
 * Queue a campaign for sending
 * @param {string} campaignId - Campaign ID to send
 */
export const queueEmailCampaign = async (campaignId) => {
  const job = await emailQueue.add('send-campaign', { campaignId }, {
    attempts: 3,
    backoff: 'exponential'
  });
  
  console.log(`Campaign ${campaignId} queued for sending with job ID: ${job.id}`);
  return job;
};

/**
 * Queue individual emails
 * @param {Array} buyers - Array of buyers
 * @param {string} templateId - Template ID
 * @param {Object} options - Email options
 */
export const queueBulkEmails = async (buyers, templateId, options = {}) => {
  // Split buyers into batches of 50 for processing
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < buyers.length; i += batchSize) {
    batches.push(buyers.slice(i, i + batchSize));
  }
  
  const jobs = [];
  for (let i = 0; i < batches.length; i++) {
    const job = await emailQueue.add('send-bulk-emails', {
      buyers: batches[i],
      templateId,
      options,
      batchNumber: i + 1,
      totalBatches: batches.length
    }, {
      delay: i * 1000 // Delay each batch by 1 second
    });
    jobs.push(job);
  }
  
  return jobs;
};

/**
 * Schedule email campaign
 * @param {string} campaignId - Campaign ID
 * @param {Date} scheduledDate - When to send
 */
export const scheduleEmailCampaign = async (campaignId, scheduledDate) => {
  const delay = new Date(scheduledDate).getTime() - Date.now();
  
  if (delay <= 0) {
    throw new Error('Scheduled time must be in the future');
  }
  
  const job = await emailQueue.add('send-campaign', { campaignId }, {
    delay,
    attempts: 3
  });
  
  console.log(`Campaign ${campaignId} scheduled for ${scheduledDate}`);
  return job;
};

// Process campaign sending jobs
emailQueue.process('send-campaign', async (job) => {
  const { campaignId } = job.data;
  
  try {
    console.log(`Processing campaign ${campaignId}`);
    
    // Get campaign details
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        user: true
      }
    });
    
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    if (campaign.status === 'paused') {
      console.log(`Campaign ${campaignId} is paused, skipping`);
      return { status: 'paused' };
    }
    
    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending' }
    });
    
    // Get buyers from target lists
    const buyers = await getBuyersFromTargetLists(campaign.targetLists);
    
    if (buyers.length === 0) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'completed',
          completedAt: new Date()
        }
      });
      return { status: 'completed', recipients: 0 };
    }
    
    // Create recipient records
    const recipientData = buyers.map(buyer => ({
      campaignId,
      buyerId: buyer.id,
      status: 'pending',
      sentAt: new Date()
    }));
    
    await prisma.campaignRecipient.createMany({
      data: recipientData
    });
    
    // Send emails in batches
    const batchSize = 50;
    let totalSent = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < buyers.length; i += batchSize) {
      const batch = buyers.slice(i, i + batchSize);
      
      // Update job progress
      const progress = Math.round((i / buyers.length) * 100);
      job.progress(progress);
      
      try {
        const result = await sendBulkEmails(
          batch,
          campaign.template.htmlContent,
          campaign.subject,
          {
            fromName: campaign.fromName,
            fromEmail: campaign.fromEmail
          },
          campaignId
        );
        
        totalSent += result.totalSent;
        totalFailed += result.totalFailed;
        
        // Update recipient statuses
        for (const sent of result.sent) {
          await prisma.campaignRecipient.updateMany({
            where: {
              campaignId,
              buyerId: sent.buyerId
            },
            data: { status: 'sent' }
          });
        }
        
        for (const failed of result.failed) {
          await prisma.campaignRecipient.updateMany({
            where: {
              campaignId,
              buyerId: failed.buyerId
            },
            data: { 
              status: 'failed',
              error: failed.error
            }
          });
        }
        
        // Small delay between batches
        if (i + batchSize < buyers.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (batchError) {
        console.error(`Error sending batch ${i}-${i + batchSize}:`, batchError);
        totalFailed += batch.length;
      }
    }
    
    // Update campaign completion
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        totalSent,
        totalFailed
      }
    });
    
    job.progress(100);
    
    console.log(`Campaign ${campaignId} completed. Sent: ${totalSent}, Failed: ${totalFailed}`);
    
    return {
      status: 'completed',
      totalSent,
      totalFailed,
      recipients: buyers.length
    };
    
  } catch (error) {
    console.error(`Error processing campaign ${campaignId}:`, error);
    
    // Update campaign status to failed
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { 
        status: 'failed',
        error: error.message
      }
    });
    
    throw error;
  }
});

// Process bulk email jobs
emailQueue.process('send-bulk-emails', async (job) => {
  const { buyers, templateId, options, batchNumber, totalBatches } = job.data;
  
  try {
    console.log(`Processing email batch ${batchNumber}/${totalBatches} with ${buyers.length} recipients`);
    
    // Get template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Send emails
    const result = await sendBulkEmails(
      buyers,
      template.htmlContent,
      template.subject,
      options
    );
    
    console.log(`Batch ${batchNumber}/${totalBatches} completed. Sent: ${result.totalSent}, Failed: ${result.totalFailed}`);
    
    return result;
    
  } catch (error) {
    console.error(`Error processing email batch ${batchNumber}:`, error);
    throw error;
  }
});

/**
 * Get buyers from target lists
 * @param {Array} listIds - Array of list IDs
 */
async function getBuyersFromTargetLists(listIds) {
  if (!listIds || listIds.length === 0) {
    return [];
  }
  
  const buyers = new Set();
  
  for (const listId of listIds) {
    try {
      const emailList = await prisma.emailList.findUnique({
        where: { id: listId },
        include: {
          buyerMemberships: {
            include: {
              buyer: {
                where: {
                  emailOptIn: true,
                  emailStatus: {
                    not: 'unsubscribed'
                  }
                }
              }
            }
          }
        }
      });
      
      if (emailList) {
        // Add manually added buyers
        emailList.buyerMemberships.forEach(membership => {
          if (membership.buyer) {
            buyers.add(membership.buyer);
          }
        });
        
        // Add buyers matching criteria if defined
        if (emailList.criteria) {
          const criteriaBuyers = await getBuyersMatchingCriteria(emailList.criteria);
          criteriaBuyers.forEach(buyer => buyers.add(buyer));
        }
      }
    } catch (error) {
      console.error(`Error processing list ${listId}:`, error);
    }
  }
  
  return Array.from(buyers);
}

/**
 * Get buyers matching email list criteria
 * @param {Object} criteria - Search criteria
 */
async function getBuyersMatchingCriteria(criteria) {
  const query = {
    emailOptIn: true,
    emailStatus: {
      not: 'unsubscribed'
    }
  };
  
  // Add area filter
  if (criteria.areas && criteria.areas.length > 0) {
    query.preferredAreas = {
      hasSome: criteria.areas
    };
  }
  
  // Add buyer type filter
  if (criteria.buyerTypes && criteria.buyerTypes.length > 0) {
    query.buyerType = {
      in: criteria.buyerTypes
    };
  }
  
  // Add VIP filter
  if (criteria.isVIP) {
    query.source = "VIP Buyers List";
  }
  
  try {
    return await prisma.buyer.findMany({
      where: query,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        buyerType: true,
        preferredAreas: true
      }
    });
  } catch (error) {
    console.error('Error fetching buyers by criteria:', error);
    return [];
  }
}

// Event listeners
emailQueue.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

emailQueue.on('progress', (job, progress) => {
  console.log(`Email job ${job.id} progress: ${progress}%`);
});

// Clean completed jobs older than 24 hours
emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
emailQueue.clean(24 * 60 * 60 * 1000, 'failed');

export { emailQueue };
export default {
  queueEmailCampaign,
  queueBulkEmails,
  scheduleEmailCampaign
};