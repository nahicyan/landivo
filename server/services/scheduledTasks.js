// server/services/scheduledTasks.js
import { connectMongo } from "../config/mongoose.js";
import { Visit, Visitor, VisitorStat } from "../models/index.js";
import cron from "node-cron";

/**
 * Update top pages and device breakdown in daily stats
 */
async function updateDailyStats() {
  console.log("Running scheduled task: updateDailyStats");
  
  try {
    await connectMongo();
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Find yesterday's stats
    const stats = await VisitorStat.findOne({ date: yesterday });
    
    if (!stats) {
      console.log("No stats found for yesterday");
      return;
    }
    
    // Get top pages
    const topPages = await Visit.aggregate([
      {
        $match: {
          startTime: {
            $gte: yesterday,
            $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      { $group: { _id: "$entryPage", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    
    // Get device breakdown
    const deviceBreakdown = await Visitor.aggregate([
      {
        $match: {
          lastVisit: {
            $gte: yesterday,
            $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
    ]);
    
    // Format the data
    const formattedTopPages = topPages.map((p) => ({
      page: p._id,
      count: p.count,
    }));
    
    const formattedDeviceBreakdown = deviceBreakdown.map((d) => ({
      device: d._id || "unknown",
      count: d.count,
    }));
    
    // Update the stats
    await VisitorStat.updateOne(
      { _id: stats._id },
      {
        $set: {
          topPages: formattedTopPages,
          deviceBreakdown: formattedDeviceBreakdown,
          updatedAt: new Date(),
        },
      }
    );
    
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
