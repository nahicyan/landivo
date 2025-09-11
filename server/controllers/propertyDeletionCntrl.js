// server/controllers/propertyDeletionCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import { sendPropertyDeletionRequest } from "../services/propertyDeletionEmailService.js";
import crypto from "crypto";

/**
 * Request property deletion - sends email to admin
 * @route POST /api/residency/request-deletion/:id
 * @access Private (requires DELETE_PROPERTIES permission)
 */
export const requestPropertyDeletion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Get property details
    const property = await prisma.residency.findUnique({
      where: { id }
    });

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
        const dbUser = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        });

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
    const deletionRequest = await prisma.propertyDeletionRequest.create({
      data: {
        propertyId: id,
        reason: reason || null,
        token: deletionToken,
        expiresAt,
        status: "PENDING"
      }
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
      requestId: deletionRequest.id
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
 * @route GET /api/residency/approve-deletion/:token
 * @access Public (but requires valid token)
 */
export const approvePropertyDeletion = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    // Find and validate deletion request
    const deletionRequest = await prisma.propertyDeletionRequest.findUnique({
      where: { token },
      include: { property: true }
    });

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
    await prisma.$transaction(async (tx) => {
      // First, update the deletion request status
      await tx.propertyDeletionRequest.update({
        where: { id: deletionRequest.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date()
        }
      });

      // Delete ALL deletion requests for this property (in case there are multiple)
      await tx.propertyDeletionRequest.deleteMany({
        where: { propertyId: deletionRequest.propertyId }
      });

      // Now delete the property
      await tx.residency.delete({
        where: { id: deletionRequest.propertyId }
      });
    });

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
 * @route DELETE /api/residency/delete/:id
 * @access Private (requires DELETE_PROPERTIES permission)
 */
export const deletePropertyDirect = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Get property details
    const property = await prisma.residency.findUnique({
      where: { id }
    });

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
        // Continue with fallback values
      }
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // First, clean up any existing deletion requests for this property
      await tx.propertyDeletionRequest.deleteMany({
        where: { propertyId: id }
      });

      // Log the deletion action
      console.log(`Direct property deletion by ${requestingUser.email}:`, {
        propertyId: id,
        propertyTitle: property.title,
        propertyAddress: `${property.streetAddress}, ${property.city}, ${property.state}`,
        propertyStatus: property.status,
        reason: reason || 'No reason provided',
        deletedBy: requestingUser.email,
        deletedAt: new Date().toISOString()
      });

      // Delete the property
      await tx.residency.delete({
        where: { id }
      });
    });

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
    if (error.code === 'P2025') {
      return res.status(404).json({
        message: "Property not found or already deleted"
      });
    }
    
    res.status(500).json({
      message: "Failed to delete property",
      error: error.message
    });
  }
});