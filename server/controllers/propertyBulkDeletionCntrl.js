// server/controllers/propertyBulkDeletionCntrl.js
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { PropertyDeletionRequest, Property, User } from "../models/index.js";
import { sendPropertyBulkDeletionRequest } from "../services/propertyBulkDeletionEmailService.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("propertyBulkDeletionCntrl");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

/**
 * Request bulk property deletion
 * @route POST /api/property/request-bulk-deletion
 * @access Private (authenticated users)
 */
export const requestPropertyBulkDeletion = asyncHandler(async (req, res) => {
  const { propertyIds, reason } = req.body;

  // Validate input
  if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
    return res.status(400).json({ 
      message: "Property IDs array is required and cannot be empty" 
    });
  }

  try {
    await connectMongo();
    const propertyObjectIds = propertyIds
      .map((propertyId) => toObjectId(propertyId))
      .filter(Boolean);
    if (propertyObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid property IDs provided" });
    }
    // Fetch all properties
    const properties = await Property.find({ _id: { $in: propertyObjectIds } }).lean();

    if (properties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }

    // Get requesting user's details
    let requestingUser = {
      firstName: "Unknown",
      lastName: "User",
      email: req.user?.email || "Unknown Email",
      auth0Id: req.user?.sub || "Unknown"
    };

    if (req.userId) {
      try {
        const userId = toObjectId(req.userId);
        const dbUser = userId
          ? await User.findById(userId)
              .select("firstName lastName email auth0Id")
              .lean()
          : null;

        if (dbUser) {
          requestingUser = {
            firstName: dbUser.firstName || "Unknown",
            lastName: dbUser.lastName || "User",
            email: dbUser.email || req.user?.email || "Unknown Email",
            auth0Id: dbUser.auth0Id || req.user?.sub || "Unknown"
          };
        }
      } catch (error) {
        log.error("Error fetching user details:", error);
      }
    }

    // Generate a single bulk deletion token
    const deletionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create deletion requests for all properties in a transaction
    const session = await mongoose.startSession();
    let deletionRequests = [];
    try {
      await session.withTransaction(async () => {
        deletionRequests = await PropertyDeletionRequest.insertMany(
          properties.map((property) => ({
            propertyId: property._id,
            token: `${deletionToken}-${property._id}`,
            reason: reason || "Bulk deletion request",
            requestedBy: requestingUser.email,
            requestedByAuth0Id: requestingUser.auth0Id,
            requestedByName: `${requestingUser.firstName} ${requestingUser.lastName}`,
            expiresAt,
            status: "PENDING",
          })),
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    // Send bulk deletion request email to admin
    await sendPropertyBulkDeletionRequest({
      properties,
      reason,
      deletionToken, // Base token for bulk approval
      requestingUser,
      count: properties.length
    });

    res.status(200).json({
      message: `Bulk deletion request sent for ${properties.length} properties`,
      count: properties.length,
      requestIds: deletionRequests.map((reqItem) => String(reqItem._id))
    });

  } catch (error) {
    log.error("Error requesting bulk property deletion:", error);
    res.status(500).json({
      message: "Failed to send bulk deletion request",
      error: error.message
    });
  }
});

/**
 * Direct bulk property deletion - for users with DELETE_PROPERTIES permission
 * @route POST /api/property/delete-bulk
 * @access Private (requires DELETE_PROPERTIES permission)
 */
export const deletePropertiesBulkDirect = asyncHandler(async (req, res) => {
  const { propertyIds, reason } = req.body;

  // Validate input
  if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
    return res.status(400).json({ 
      message: "Property IDs array is required and cannot be empty" 
    });
  }

  try {
    await connectMongo();
    const propertyObjectIds = propertyIds
      .map((propertyId) => toObjectId(propertyId))
      .filter(Boolean);
    if (propertyObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid property IDs provided" });
    }
    // Fetch all properties
    const properties = await Property.find({ _id: { $in: propertyObjectIds } }).lean();

    if (properties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }

    // Get requesting user's details for logging
    let requestingUser = {
      firstName: "Unknown",
      lastName: "User",
      email: req.user?.email || "Unknown Email",
      auth0Id: req.user?.sub || "Unknown"
    };

    if (req.userId) {
      try {
        const userId = toObjectId(req.userId);
        const dbUser = userId
          ? await User.findById(userId)
              .select("firstName lastName email auth0Id")
              .lean()
          : null;

        if (dbUser) {
          requestingUser = {
            firstName: dbUser.firstName || "Unknown",
            lastName: dbUser.lastName || "User",
            email: dbUser.email || req.user?.email || "Unknown Email",
            auth0Id: dbUser.auth0Id || req.user?.sub || "Unknown"
          };
        }
      } catch (error) {
        log.error("Error fetching user details:", error);
      }
    }

    // Use a transaction to ensure all operations succeed or fail together
    const session = await mongoose.startSession();
    let result = { deletedCount: 0 };
    try {
      await session.withTransaction(async () => {
        await PropertyDeletionRequest.deleteMany(
          { propertyId: { $in: propertyObjectIds } },
          { session }
        );

        const deleteResult = await Property.deleteMany(
          { _id: { $in: propertyObjectIds } },
          { session }
        );

        result = deleteResult;
      });
    } finally {
      session.endSession();
    }

    // Log the bulk deletion action
    log.info(`Bulk property deletion by ${requestingUser.email}:`, {
      count: result.deletedCount,
      propertyIds: propertyIds,
      reason: reason || "No reason provided",
      timestamp: new Date().toISOString()
    });

    // Send notification email to admin about bulk deletion
    try {
      await sendPropertyBulkDeletionRequest({
        properties,
        reason,
        requestingUser,
        count: result.deletedCount,
        isDirect: true // Flag to indicate this was a direct deletion
      });
    } catch (emailError) {
      log.error("Failed to send deletion notification email:", emailError);
      // Don't fail the deletion if email fails
    }

    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} properties`,
      count: result.deletedCount
    });

  } catch (error) {
    log.error("Error in bulk property deletion:", error);
    res.status(500).json({
      message: "Failed to delete properties",
      error: error.message
    });
  }
});

/**
 * Approve bulk property deletion via email link
 * @route GET /api/property/approve-bulk-deletion/:token
 * @access Public (but requires valid token)
 */
export const approvePropertyBulkDeletion = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    await connectMongo();
    // Find all deletion requests with this base token
    const tokenPattern = new RegExp(`^${token}`);
    const deletionRequests = await PropertyDeletionRequest.find({
      token: tokenPattern,
      status: "PENDING",
    })
      .populate("propertyId")
      .lean();

    if (deletionRequests.length === 0) {
      return res.status(404).json({
        message: "This bulk deletion request is invalid or has already been processed."
      });
    }

    // Check if any request has expired
    const now = new Date();
    const hasExpired = deletionRequests.some(req => now > req.expiresAt);
    
    if (hasExpired) {
      return res.status(400).json({
        message: "This bulk deletion request has expired."
      });
    }

    // Use a transaction to delete all properties
    const session = await mongoose.startSession();
    let result = { deletedCount: 0 };
    try {
      await session.withTransaction(async () => {
        const requestIds = deletionRequests.map((reqItem) => reqItem._id);
        const propertyIdsToDelete = deletionRequests.map((reqItem) => reqItem.propertyId);

        await PropertyDeletionRequest.updateMany(
          { _id: { $in: requestIds } },
          { $set: { status: "APPROVED", approvedAt: new Date() } },
          { session }
        );

        await PropertyDeletionRequest.deleteMany(
          { propertyId: { $in: propertyIdsToDelete } },
          { session }
        );

        const deleteResult = await Property.deleteMany(
          { _id: { $in: propertyIdsToDelete } },
          { session }
        );

        result = deleteResult;
      });
    } finally {
      session.endSession();
    }

    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} properties.`,
      count: result.deletedCount
    });

  } catch (error) {
    log.error("Error approving bulk property deletion:", error);
    res.status(500).json({
      message: "Failed to delete properties",
      error: error.message
    });
  }
});
