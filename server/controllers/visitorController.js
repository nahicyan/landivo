// server/controllers/visitorController.js
import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { Property, Visit, Visitor, VisitorStat } from "../models/index.js";

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

/**
 * Track a visitor page view
 * @route POST /api/visitors/track
 * @access Public
 */
export const trackVisit = asyncHandler(async (req, res) => {
  const { visitorId, sessionId, page, referrer, screenSize, previousSessionEnd } = req.body;

  if (!visitorId || !sessionId || !page) {
    return res.status(400).json({ message: "Missing required tracking parameters" });
  }

  try {
    await connectMongo();
    // Get IP and user agent
    const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0] || "";
    const userAgent = req.headers["user-agent"] || "";

    // Determine device type from user agent
    const isMobile = /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent);
    const isTablet = /ipad|tablet/i.test(userAgent);
    const deviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

    // Check if visitor exists
    let visitor = await Visitor.findOne({ visitorId });
    let isNewVisitor = !visitor;

    if (isNewVisitor) {
      // Create new visitor with duplicate-key safety
      try {
        visitor = await Visitor.create({
          visitorId,
          firstVisit: new Date(),
          lastVisit: new Date(),
          totalVisits: 1,
          deviceType,
          browser: userAgent.includes("Chrome")
            ? "Chrome"
            : userAgent.includes("Firefox")
            ? "Firefox"
            : userAgent.includes("Safari")
            ? "Safari"
            : userAgent.includes("Edge")
            ? "Edge"
            : "Other",
          os: userAgent.includes("Windows")
            ? "Windows"
            : userAgent.includes("Mac")
            ? "Mac"
            : userAgent.includes("Linux")
            ? "Linux"
            : userAgent.includes("Android")
            ? "Android"
            : userAgent.includes("iOS")
            ? "iOS"
            : "Other",
        });
      } catch (err) {
        if (err.code === 11000) {
          console.warn(
            `[visitorController:trackVisit] > [Request]: duplicate visitorId=${visitorId} during insert`
          );
          visitor = await Visitor.findOne({ visitorId });
          isNewVisitor = false;
        } else {
          throw err;
        }
      }
    } else {
      // Update existing visitor
      visitor = await Visitor.findOneAndUpdate(
        { visitorId },
        { $set: { lastVisit: new Date() }, $inc: { totalVisits: 1 } },
        { new: true }
      );
    }

    // Check if we need to close previous session
    if (previousSessionEnd && sessionId) {
      try {
        const existingVisit = await Visit.findOne({ sessionId });

        if (existingVisit && !existingVisit.endTime) {
          const endTime = new Date(previousSessionEnd);
          const startTime = new Date(existingVisit.startTime);
          const durationSec = Math.floor((endTime - startTime) / 1000);

          await Visit.updateOne(
            { _id: existingVisit._id },
            {
              $set: {
                endTime,
                duration: durationSec > 0 ? durationSec : 0,
                exitPage: page,
              },
            }
          );
        }
      } catch (err) {
        console.error("Error updating previous session:", err);
      }
    }

    // Create or update visit record
    let visit;
    try {
      // First try to find an existing visit for this session
      const existingVisit = await Visit.findOne({
        sessionId,
        visitorId: visitor.visitorId,
      });

      if (existingVisit) {
        // Update existing visit
        visit = await Visit.findByIdAndUpdate(
          existingVisit._id,
          { $inc: { pagesViewed: 1 }, $set: { exitPage: page } },
          { new: true }
        );
      } else {
        // Create new visit
        visit = await Visit.create({
          visitorId: visitor.visitorId,
          sessionId,
          startTime: new Date(),
          entryPage: page,
          exitPage: page,
          referrer: referrer || null,
          userAgent,
          ipAddress: ip,
          screenSize,
        });
      }
    } catch (err) {
      console.error("Error creating/updating visit:", err);
    }

    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First try to find today's stats
    let todayStats = await VisitorStat.findOne({ date: today });

    if (todayStats) {
      // Update existing stats
      const incrementPayload = {
        totalVisits: 1,
        ...(isNewVisitor
          ? { uniqueVisitors: 1, newVisitors: 1 }
          : { returningVisitors: 1 }),
      };
      await VisitorStat.updateOne(
        { _id: todayStats._id },
        { $inc: incrementPayload, $set: { updatedAt: new Date() } }
      );
    } else {
      // Create new stats for today
      await VisitorStat.create({
        date: today,
        uniqueVisitors: 1,
        totalVisits: 1,
        newVisitors: isNewVisitor ? 1 : 0,
        returningVisitors: isNewVisitor ? 0 : 1,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error tracking visit:", error);
    // Return success anyway to not interrupt user experience
    res.status(200).json({ success: true });
  }
});

/**
 * Get visitor statistics for dashboard
 * @route GET /api/visitors/stats
 * @access Private (Admin only)
 */
export const getVisitorStats = asyncHandler(async (req, res) => {
  const { period = "week", startDate, endDate } = req.query;

  try {
    await connectMongo();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);

      start = new Date(end);
      switch (period) {
        case "day":
          start.setDate(start.getDate() - 1);
          break;
        case "week":
          start.setDate(start.getDate() - 7);
          break;
        case "month":
          start.setMonth(start.getMonth() - 1);
          break;
        case "year":
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setDate(start.getDate() - 7);
      }
      start.setHours(0, 0, 0, 0);
    }

    // Get daily stats
    const stats = await VisitorStat.find({
      date: { $gte: start, $lte: end },
    })
      .sort({ date: 1 })
      .lean();

    // Get current period totals
    const currentPeriodStats = await VisitorStat.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          uniqueVisitors: { $sum: "$uniqueVisitors" },
          totalVisits: { $sum: "$totalVisits" },
          newVisitors: { $sum: "$newVisitors" },
          returningVisitors: { $sum: "$returningVisitors" },
        },
      },
    ]);

    // Get previous period stats
    const periodDuration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodDuration);

    const previousPeriodStats = await VisitorStat.aggregate([
      { $match: { date: { $gte: prevStart, $lte: prevEnd } } },
      {
        $group: {
          _id: null,
          uniqueVisitors: { $sum: "$uniqueVisitors" },
          totalVisits: { $sum: "$totalVisits" },
          newVisitors: { $sum: "$newVisitors" },
          returningVisitors: { $sum: "$returningVisitors" },
        },
      },
    ]);

    // Get top pages - Updated to handle property pages better
    const topPages = await Visit.aggregate([
      { $match: { startTime: { $gte: start, $lte: end } } },
      { $group: { _id: "$entryPage", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Process top pages to properly handle property pages
    const processedTopPages = await Promise.all(
      topPages.map(async (p) => {
        // Check if this is a property page with an ID
        if (p._id.startsWith("/properties/") && p._id.length > 12) {
          const propertyId = p._id.split("/").pop();

          // Try to get property info to enhance the display (title if available)
          let propertyInfo = null;
          try {
            const propertyObjectId = toObjectId(propertyId);
            propertyInfo = propertyObjectId
              ? await Property.findById(propertyObjectId)
                  .select("title streetAddress")
                  .lean()
              : null;
          } catch (err) {
            console.log("Property not found for ID:", propertyId);
          }

          return {
            page: p._id,
            count: p.count,
            isProperty: true,
            propertyId,
            propertyTitle: propertyInfo?.title || "Unknown Property",
            propertyAddress: propertyInfo?.streetAddress || "",
          };
        }

        return {
          page: p._id,
          count: p.count,
          isProperty: false,
        };
      })
    );

    // Get device breakdown
    const deviceBreakdown = await Visitor.aggregate([
      { $match: { lastVisit: { $gte: start, $lte: end } } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
    ]);

    // Get page performance details
    const pagePerformance = await Promise.all(
      processedTopPages.slice(0, 5).map(async (page) => {
        // Count unique visitors for this page
        const uniqueVisitors = await Visit.distinct("visitorId", {
          entryPage: page.page,
          startTime: { $gte: start, $lte: end },
        });

        // Calculate average visit duration for this page
        const pageDurations = await Visit.find(
          {
            entryPage: page.page,
            startTime: { $gte: start, $lte: end },
            duration: { $ne: null },
          },
          "duration"
        ).lean();

        const totalDuration = pageDurations.reduce((sum, visit) => sum + (visit.duration || 0), 0);
        const avgDuration = pageDurations.length > 0 ? totalDuration / pageDurations.length : 0;

        // Calculate bounce rate (visits with just 1 page view)
        const singlePageVisits = await Visit.countDocuments({
          entryPage: page.page,
          startTime: { $gte: start, $lte: end },
          pagesViewed: 1,
        });

        const bounceRate = page.count > 0 ? Math.round((singlePageVisits / page.count) * 100) : 0;

        return {
          ...page,
          uniqueVisitors: uniqueVisitors.length,
          avgDuration: Math.round(avgDuration / 60), // Convert to minutes
          bounceRate,
        };
      })
    );

    res.status(200).json({
      dailyStats: stats,
      currentPeriod: {
        uniqueVisitors: currentPeriodStats[0]?.uniqueVisitors || 0,
        totalVisits: currentPeriodStats[0]?.totalVisits || 0,
        newVisitors: currentPeriodStats[0]?.newVisitors || 0,
        returningVisitors: currentPeriodStats[0]?.returningVisitors || 0,
      },
      previousPeriod: {
        uniqueVisitors: previousPeriodStats[0]?.uniqueVisitors || 0,
        totalVisits: previousPeriodStats[0]?.totalVisits || 0,
        newVisitors: previousPeriodStats[0]?.newVisitors || 0,
        returningVisitors: previousPeriodStats[0]?.returningVisitors || 0,
      },
      topPages: processedTopPages,
      pagePerformance,
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d._id || "unknown",
        count: d.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching visitor stats:", error);
    res.status(500).json({
      message: "An error occurred while fetching visitor statistics",
      error: error.message,
    });
  }
});

/**
 * Get current visitor count
 * @route GET /api/visitors/current
 * @access Private (Admin only)
 */
export const getCurrentVisitors = asyncHandler(async (req, res) => {
  try {
    await connectMongo();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Use findMany with distinct instead, then count the results
    const activeVisits = await Visit.distinct("visitorId", {
      $or: [
        { startTime: { $gte: fiveMinutesAgo } },
        { endTime: { $gte: fiveMinutesAgo } },
      ],
    });

    // Count the unique visitors
    const uniqueVisitorCount = activeVisits.length;

    res.status(200).json({ currentVisitors: uniqueVisitorCount });
  } catch (error) {
    console.error("Error fetching current visitors:", error);
    res.status(500).json({
      message: "An error occurred while fetching current visitor count",
      error: error.message,
    });
  }
});
