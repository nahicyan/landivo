// server/controllers/propertyDeletionCntrl.js
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { PropertyDeletionRequest, Property, User } from "../models/index.js";
import { sendPropertyDeletionRequest } from "../services/propertyDeletionEmailService.js";

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

/**
 * Request property deletion - sends email to admin
 * @route POST /api/property/request-deletion/:id
 * @access Private (requires DELETE_PROPERTIES permission)
 */
export const requestPropertyDeletion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await connectMongo();
    const propertyId = toObjectId(id);
    if (!propertyId) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    // Get property details
    const property = await Property.findById(propertyId).lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if property status allows deletion
    if (property.status !== "Sold" && property.status !== "Not Available") {
      return res.status(400).json({ 
        message: "Property must be Sold or Not Available to request deletion" 
      });
    }

    // Get requesting user's details from database
    let requestingUser = {
      firstName: "Unknown",
      lastName: "User",
      email: req.user?.email || "Unknown Email"
    };

    if (req.userId) {
      try {
        const userId = toObjectId(req.userId);
        const dbUser = userId
          ? await User.findById(userId)
              .select("firstName lastName email")
              .lean()
          : null;

        if (dbUser) {
          requestingUser = {
            firstName: dbUser.firstName || "Unknown",
            lastName: dbUser.lastName || "User",
            email: dbUser.email || req.user?.email || "Unknown Email"
          };
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        // Continue with fallback values
      }
    }

    // Generate unique deletion token
    const deletionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store deletion request in database
    const deletionRequest = await PropertyDeletionRequest.create({
      propertyId,
      reason: reason || null,
      token: deletionToken,
      expiresAt,
      status: "PENDING",
    });

    // Send email to admin with user details
    await sendPropertyDeletionRequest({
      property,
      reason,
      deletionToken,
      requestingUser
    });

    res.status(200).json({
      message: "Deletion request sent to admin successfully",
      requestId: String(deletionRequest._id)
    });

  } catch (error) {
    console.error("Error requesting property deletion:", error);
    res.status(500).json({
      message: "Failed to send deletion request",
      error: error.message
    });
  }
});

/**
 * Approve property deletion via email link
 * @route GET /api/property/approve-deletion/:token
 * @access Public (but requires valid token)
 */
export const approvePropertyDeletion = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    await connectMongo();
    // Find and validate deletion request
    const deletionRequest = await PropertyDeletionRequest.findOne({ token })
      .populate("propertyId")
      .lean();

    if (!deletionRequest) {
      return res.status(404).json({
        message: "This deletion request is invalid or has already been processed."
      });
    }

    if (new Date() > deletionRequest.expiresAt) {
      return res.status(400).json({
        message: "This deletion request has expired."
      });
    }

    if (deletionRequest.status !== "PENDING") {
      return res.status(400).json({
        message: "This deletion request has already been processed."
      });
    }

    // Use a transaction to ensure both operations succeed or fail together
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await PropertyDeletionRequest.updateOne(
          { _id: deletionRequest._id },
          { $set: { status: "APPROVED", approvedAt: new Date() } },
          { session }
        );

        await PropertyDeletionRequest.deleteMany(
          { propertyId: deletionRequest.propertyId },
          { session }
        );

        await Property.deleteOne(
          { _id: deletionRequest.propertyId },
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    res.status(200).json({
      message: "Property has been successfully deleted."
    });

  } catch (error) {
    console.error("Error approving property deletion:", error);
    res.status(500).json({
      message: "Failed to delete property",
      error: error.message
    });
  }
});


/**
 * Direct property deletion - for users with DELETE_PROPERTIES permission
 * @route DELETE /api/property/delete/:id
 * @access Private (requires DELETE_PROPERTIES permission)
 */
export const deletePropertyDirect = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await connectMongo();
    const propertyId = toObjectId(id);
    if (!propertyId) {
      return res.status(400).json({ message: "Invalid property ID" });
    }
    // Get property details
    const property = await Property.findById(propertyId).lean();

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
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
        console.error("Error fetching user details:", error);
        // Continue with fallback values
      }
    }

    // Use a transaction to ensure all operations succeed or fail together
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await PropertyDeletionRequest.deleteMany(
          { propertyId },
          { session }
        );

        console.log(`Direct property deletion by ${requestingUser.email}:`, {
          propertyId: id,
          propertyTitle: property.title,
          propertyAddress: `${property.streetAddress}, ${property.city}, ${property.state}`,
          propertyStatus: property.status,
          reason: reason || "No reason provided",
          deletedBy: requestingUser.email,
          deletedAt: new Date().toISOString(),
        });

        await Property.deleteOne({ _id: propertyId }, { session });
      });
    } finally {
      session.endSession();
    }

    res.status(200).json({
      message: "Property has been successfully deleted",
      deletedProperty: {
        id: property.id,
        title: property.title,
        address: `${property.streetAddress}, ${property.city}, ${property.state}`,
        status: property.status
      },
      deletedBy: requestingUser.email,
      reason: reason || null
    });

  } catch (error) {
    console.error("Error in direct property deletion:", error);
    
    // Handle specific Prisma errors
    res.status(500).json({
      message: "Failed to delete property",
      error: error.message
    });
  }
});
