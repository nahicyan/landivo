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

/**
 * Initialize scheduled tasks
 */
export function initScheduledTasks() {
  // Run at 1:00 AM every day
  cron.schedule('0 1 * * *', updateDailyStats);
  
  console.log("Scheduled tasks initialized");
}
