// server/services/scheduledTasks.js
import { prisma } from "../config/prismaConfig.js";
import cron from "node-cron";

/**
 * Update top pages and device breakdown in daily stats
 */
async function updateDailyStats() {
  console.log("Running scheduled task: updateDailyStats");
  
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Find yesterday's stats
    const stats = await prisma.visitorStat.findUnique({
      where: { date: yesterday }
    });
    
    if (!stats) {
      console.log("No stats found for yesterday");
      return;
    }
    
    // Get top pages
    const topPages = await prisma.visit.groupBy({
      by: ['entryPage'],
      where: {
        startTime: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      _count: { entryPage: true },
      orderBy: { _count: { entryPage: 'desc' } },
      take: 10
    });
    
    // Get device breakdown
    const deviceBreakdown = await prisma.visitor.groupBy({
      by: ['deviceType'],
      where: {
        lastVisit: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      _count: { visitorId: true }
    });
    
    // Format the data
    const formattedTopPages = topPages.map(p => ({
      page: p.entryPage,
      count: p._count.entryPage
    }));
    
    const formattedDeviceBreakdown = deviceBreakdown.map(d => ({
      device: d.deviceType || 'unknown',
      count: d._count.visitorId
    }));
    
    // Update the stats
    await prisma.visitorStat.update({
      where: { id: stats.id },
      data: {
        topPages: formattedTopPages,
        deviceBreakdown: formattedDeviceBreakdown,
        updatedAt: new Date()
      }
    });
    
    console.log("Updated daily stats for yesterday");
  } catch (error) {
    console.error("Error updating daily stats:", error);
  }
}

const GENERATED_LIST_CLEANUP_CRON =
  process.env.GENERATED_LIST_CLEANUP_CRON || "*/1 * * * *";

async function purgeExpiredGeneratedLists() {
  const now = new Date();
  try {
    const generatedLists = await prisma.emailList.findMany({
      where: { source: "generated" },
    });

    if (!generatedLists.length) {
      return;
    }

    const expiredLists = generatedLists.filter((list) => {
      const deleteAfter = list?.criteria?.deleteAfter;
      if (!deleteAfter) return false;
      const deleteAfterDate = new Date(deleteAfter);
      if (Number.isNaN(deleteAfterDate.getTime())) return false;
      return deleteAfterDate <= now;
    });

    for (const list of expiredLists) {
      await prisma.buyerEmailList.deleteMany({
        where: { emailListId: list.id },
      });
      await prisma.emailList.delete({
        where: { id: list.id },
      });
    }

    if (expiredLists.length > 0) {
      console.log(`Purged ${expiredLists.length} expired generated email lists`);
    }
  } catch (error) {
    console.error("Error purging expired generated lists:", error);
  }
}

/**
 * Initialize scheduled tasks
 */
export function initScheduledTasks() {
  // Run at 1:00 AM every day
  cron.schedule('0 1 * * *', updateDailyStats);
  cron.schedule(GENERATED_LIST_CLEANUP_CRON, purgeExpiredGeneratedLists);
  
  console.log("Scheduled tasks initialized");
}
