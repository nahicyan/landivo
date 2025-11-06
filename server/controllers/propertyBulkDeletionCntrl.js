// server/controllers/propertyBulkDeletionCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import crypto from "crypto";
import { sendPropertyBulkDeletionRequest } from "../services/propertyBulkDeletionEmailService.js";

/**
 * Request bulk property deletion
 * @route POST /api/residency/request-bulk-deletion
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
    // Fetch all properties
    const properties = await prisma.residency.findMany({
      where: {
        id: { in: propertyIds }
      }
    });

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
        const dbUser = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            auth0Id: true
          }
        });

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
      }
    }

    // Generate a single bulk deletion token
    const deletionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create deletion requests for all properties in a transaction
    const deletionRequests = await prisma.$transaction(
      properties.map(property =>
        prisma.propertyDeletionRequest.create({
          data: {
            propertyId: property.id,
            token: `${deletionToken}-${property.id}`, // Unique token per property
            reason: reason || "Bulk deletion request",
            requestedBy: requestingUser.email,
            requestedByAuth0Id: requestingUser.auth0Id,
            requestedByName: `${requestingUser.firstName} ${requestingUser.lastName}`,
            expiresAt,
            status: "PENDING"
          }
        })
      )
    );

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
      requestIds: deletionRequests.map(req => req.id)
    });

  } catch (error) {
    console.error("Error requesting bulk property deletion:", error);
    res.status(500).json({
      message: "Failed to send bulk deletion request",
      error: error.message
    });
  }
});

/**
 * Direct bulk property deletion - for users with DELETE_PROPERTIES permission
 * @route POST /api/residency/delete-bulk
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
    // Fetch all properties
    const properties = await prisma.residency.findMany({
      where: {
        id: { in: propertyIds }
      }
    });

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
        const dbUser = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            auth0Id: true
          }
        });

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
      }
    }

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // First, clean up any existing deletion requests for these properties
      await tx.propertyDeletionRequest.deleteMany({
        where: { propertyId: { in: propertyIds } }
      });

      // Delete all properties
      const deleteResult = await tx.residency.deleteMany({
        where: { id: { in: propertyIds } }
      });

      return deleteResult;
    });

    // Log the bulk deletion action
    console.log(`Bulk property deletion by ${requestingUser.email}:`, {
      count: result.count,
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
        count: result.count,
        isDirect: true // Flag to indicate this was a direct deletion
      });
    } catch (emailError) {
      console.error("Failed to send deletion notification email:", emailError);
      // Don't fail the deletion if email fails
    }

    res.status(200).json({
      message: `Successfully deleted ${result.count} properties`,
      count: result.count
    });

  } catch (error) {
    console.error("Error in bulk property deletion:", error);
    res.status(500).json({
      message: "Failed to delete properties",
      error: error.message
    });
  }
});

/**
 * Approve bulk property deletion via email link
 * @route GET /api/residency/approve-bulk-deletion/:token
 * @access Public (but requires valid token)
 */
export const approvePropertyBulkDeletion = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    // Find all deletion requests with this base token
    const deletionRequests = await prisma.propertyDeletionRequest.findMany({
      where: {
        token: {
          startsWith: token
        },
        status: "PENDING"
      },
      include: { property: true }
    });

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
    const result = await prisma.$transaction(async (tx) => {
      // Update all deletion request statuses
      await tx.propertyDeletionRequest.updateMany({
        where: {
          id: { in: deletionRequests.map(req => req.id) }
        },
        data: {
          status: "APPROVED",
          approvedAt: new Date()
        }
      });

      // Delete all related deletion requests
      await tx.propertyDeletionRequest.deleteMany({
        where: {
          propertyId: { in: deletionRequests.map(req => req.propertyId) }
        }
      });

      // Delete all properties
      const deleteResult = await tx.residency.deleteMany({
        where: {
          id: { in: deletionRequests.map(req => req.propertyId) }
        }
      });

      return deleteResult;
    });

    res.status(200).json({
      message: `Successfully deleted ${result.count} properties.`,
      count: result.count
    });

  } catch (error) {
    console.error("Error approving bulk property deletion:", error);
    res.status(500).json({
      message: "Failed to delete properties",
      error: error.message
    });
  }
});