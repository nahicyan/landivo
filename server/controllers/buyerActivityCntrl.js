// server/controllers/buyerActivityCntrl.js
import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { Buyer, BuyerActivity, Offer } from "../models/index.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("buyerActivityCntrl");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

/**
 * Record buyer activity
 * @route POST /api/buyer/activity
 * @access Private - VIP buyers & Admins only
 */

export const recordBuyerActivity = asyncHandler(async (req, res) => {
  const { events } = req.body;

  if (!events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({
      message: "No events provided or invalid events format",
    });
  }

  try {
    await connectMongo();
    // console.log(`Processing ${events.length} activity events`);
    let recordedEvents = 0;
    const errors = [];

    // Process each event
    for (const event of events) {
      try {
        const { type, buyerId, auth0UserId, timestamp, data } = event;

        // Log the event being processed for debugging
        // console.log(`Processing event: ${type} for buyer ${buyerId}`, data);

        if (!type || !buyerId) {
          errors.push({ event, error: "Missing required fields (type or buyerId)" });
          continue;
        }

        // Verify that the buyer exists
        const buyerObjectId = toObjectId(buyerId);
        if (!buyerObjectId) {
          errors.push({ event, error: "Invalid buyer ID" });
          continue;
        }
        const buyer = await Buyer.findById(buyerObjectId).lean();

        if (!buyer) {
          errors.push({ event, error: `Buyer with ID ${buyerId} not found` });
          continue;
        }

        // Verify the auth0UserId matches if provided
        if (auth0UserId && buyer.auth0Id && auth0UserId !== buyer.auth0Id) {
          errors.push({ event, error: "Auth0 user ID mismatch - potential security issue" });
          continue;
        }

        // Create the activity record
        const createdActivity = await BuyerActivity.create({
          eventType: type,
          buyerId: buyerObjectId,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
          eventData: {
            ...data,
            ...(type === "search" || type === "search_query"
              ? {
                  searchType: data.searchType || "standard",
                  query: data.query || "",
                  resultsCount: data.resultsCount || 0,
                  area: data.area || null,
                  context: data.context || null,
                  filters: data.filters || {},
                }
              : {}),
          },
          sessionId: data?.sessionId || null,
          page: data?.path || data?.url || null,
          propertyId: data?.propertyId || null,
          interactionType: data?.elementType || (type === "search" ? "search" : null),
          ipAddress: req.ip || null,
          userAgent: req.headers["user-agent"] || null,
        });

        // console.log(`Successfully recorded ${type} event:`, createdActivity.id);
        recordedEvents++;
      } catch (eventError) {
        log.error("Error recording activity event:", eventError);
        errors.push({ event, error: eventError.message });
      }
    }

    // Return a summary of what happened
    res.status(200).json({
      message: `Recorded ${recordedEvents} of ${events.length} events`,
      succeeded: recordedEvents,
      failed: events.length - recordedEvents,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log.error("Error in recordBuyerActivity:", error);
    res.status(500).json({
      message: "An error occurred while recording buyer activity",
      error: error.message,
    });
  }
});

/**
 * Get buyer activity
 * @route GET /api/buyer/activity/:buyerId
 * @access Private - Admins only
 */
export const getBuyerActivity = asyncHandler(async (req, res) => {
  const { buyerId } = req.params;
  const { page = 1, limit = 50, type, startDate, endDate, propertyId } = req.query;

  if (!buyerId) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Check if buyer exists
    await connectMongo();
    const buyerObjectId = toObjectId(buyerId);
    if (!buyerObjectId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const buyer = await Buyer.findById(buyerObjectId).lean();

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Build query filters
    const filter = { buyerId: buyerObjectId };

    if (type) {
      filter.eventType = type;
    }

    if (startDate || endDate) {
      filter.timestamp = {};

      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    if (propertyId) {
      filter.propertyId = propertyId;
    }

    // Get total count
    const totalCount = await BuyerActivity.countDocuments(filter);

    // Get paginated activities
    const activities = await BuyerActivity.find(filter)
      .sort({ timestamp: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      buyerId,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      email: buyer.email,
      phone: buyer.phone,
      buyerType: buyer.buyerType,
      totalActivities: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      activities,
    });
  } catch (error) {
    log.error("Error in getBuyerActivity:", error);
    res.status(500).json({
      message: "An error occurred while fetching buyer activity",
      error: error.message,
    });
  }
});

export const getBuyerActivitySummary = asyncHandler(async (req, res) => {
  const { buyerId } = req.params;

  if (!buyerId) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Check if buyer exists
    await connectMongo();
    const buyerObjectId = toObjectId(buyerId);
    if (!buyerObjectId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const buyer = await Buyer.findById(buyerObjectId).lean();

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Get activity counts by type
    const activityCounts = await BuyerActivity.aggregate([
      { $match: { buyerId: buyerObjectId } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]);

    // Get ALL property views without limit
    const propertyViews = await BuyerActivity.find({
      buyerId: buyerObjectId,
      eventType: "property_view",
    })
      .sort({ timestamp: "desc" })
      .lean();

    // Get ALL search history
    const searchHistory = await BuyerActivity.find({
      buyerId: buyerObjectId,
      eventType: "search",
    })
      .sort({ timestamp: "desc" })
      .lean();

    // Get ALL page views
    const pageViews = await BuyerActivity.find({
      buyerId: buyerObjectId,
      eventType: "page_view",
    })
      .sort({ timestamp: "desc" })
      .lean();

    // Get ALL offer submissions WITHOUT the property include that's causing the error
    const offerHistory = await Offer.find({ buyerId: buyerObjectId })
      .sort({ timestamp: "desc" })
      .lean();

    // Get ALL click events
    const clickEvents = await BuyerActivity.find({
      buyerId: buyerObjectId,
      eventType: "click",
    })
      .sort({ timestamp: "desc" })
      .lean();

    // Get ALL session history
    const sessionHistory = await BuyerActivity.find({
      buyerId: buyerObjectId,
      eventType: { $in: ["session_start", "session_end"] },
    })
      .sort({ timestamp: "desc" })
      .lean();

    // Find the most recent activity
    const lastActive = await BuyerActivity.findOne({ buyerId: buyerObjectId })
      .sort({ timestamp: "desc" })
      .select("timestamp")
      .lean();

    // Calculate engagement score based on activity volume and recency
    let engagementScore = 0;

    // Convert activityCounts to a more usable format
    const activityByType = {};
    activityCounts.forEach((item) => {
      activityByType[item._id] = item.count;
    });

    // Base score on total activity volume
    const totalActivities = Object.values(activityByType).reduce((sum, count) => sum + count, 0);

    // More weight for property views, offers, and searches
    const propertyViewWeight = (activityByType["property_view"] || 0) * 3;
    const offerWeight = (offerHistory.length || 0) * 5;
    const searchWeight = (activityByType["search"] || 0) * 2;

    // Basic engagement score formula
    engagementScore = Math.min(100, Math.round((totalActivities * 0.5 + propertyViewWeight + offerWeight + searchWeight) / 10));

    // Adjust for recency
    if (lastActive) {
      const daysSinceActive = Math.floor((new Date() - new Date(lastActive.timestamp)) / (1000 * 60 * 60 * 24));

      // Reduce score for inactivity
      if (daysSinceActive > 30) {
        engagementScore = Math.round(engagementScore * 0.7);
      } else if (daysSinceActive > 14) {
        engagementScore = Math.round(engagementScore * 0.9);
      }
    }

    // Build the summary response
    const summary = {
      buyerId,
      buyerName: `${buyer.firstName} ${buyer.lastName}`,
      email: buyer.email,
      phone: buyer.phone,
      buyerType: buyer.buyerType,
      lastActive: lastActive?.timestamp || null,
      engagementScore,
      activityCounts: activityByType,
      totalActivities,
      propertyViews,
      offerHistory, // Now without property details, but at least it won't error
      searchHistory,
      pageViews,
      clickEvents,
      sessionHistory: processSessionHistory(sessionHistory),
      offers: offerHistory.length, // Include the count explicitly
    };

    res.status(200).json(summary);
  } catch (error) {
    log.error("Error in getBuyerActivitySummary:", error);
    res.status(500).json({
      message: "An error occurred while fetching buyer activity summary",
      error: error.message,
    });
  }
});

/**
 * Delete buyer activity
 * @route DELETE /api/buyer/activity/:buyerId
 * @access Private - Admins only
 */
export const deleteBuyerActivity = asyncHandler(async (req, res) => {
  const { buyerId } = req.params;
  const { before, type } = req.query;

  if (!buyerId) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Build delete criteria
    await connectMongo();
    const buyerObjectId = toObjectId(buyerId);
    if (!buyerObjectId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const deleteWhere = { buyerId: buyerObjectId };

    if (before) {
      deleteWhere.timestamp = {
        $lt: new Date(before),
      };
    }

    if (type) {
      deleteWhere.eventType = type;
    }

    // Delete the activities
    const result = await BuyerActivity.deleteMany(deleteWhere);

    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} activity records`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    log.error("Error in deleteBuyerActivity:", error);
    res.status(500).json({
      message: "An error occurred while deleting buyer activity",
      error: error.message,
    });
  }
});

/**
 * Helper function to process session history data
 * @param {Array} sessions - Raw session events
 * @returns {Array} Processed session data
 */
function processSessionHistory(sessions) {
  const sessionMap = new Map();
  const result = [];

  // Group sessions by sessionId if available
  sessions.forEach((event) => {
    const sessionId = event.eventData?.sessionId || `anon-${event.timestamp}`;

    if (event.eventType === "session_start") {
      sessionMap.set(sessionId, {
        loginTime: event.timestamp,
        device: event.userAgent || event.eventData?.userAgent || "Unknown device",
        ipAddress: event.ipAddress || event.eventData?.ipAddress || "Unknown",
      });
    } else if (event.eventType === "session_end") {
      const session = sessionMap.get(sessionId);
      if (session) {
        session.logoutTime = event.timestamp;

        // Add the completed session to results
        result.push(session);

        // Remove from map
        sessionMap.delete(sessionId);
      }
    }
  });

  // Add any sessions without end events (using current time as end)
  sessionMap.forEach((session) => {
    session.logoutTime = session.loginTime; // Just show same time if no logout recorded
    result.push(session);
  });

  return result.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));
}
