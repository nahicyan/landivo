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

    // Send email to admin
    await sendPropertyDeletionRequest({
      property,
      reason,
      deletionToken,
      requestedBy: req.user?.email || "System User"
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
    // Find deletion request by token
    const deletionRequest = await prisma.propertyDeletionRequest.findUnique({
      where: { token },
      include: {
        property: true
      }
    });

    if (!deletionRequest) {
      return res.status(404).json({ message: "Invalid deletion request" });
    }

    // Check if token has expired
    if (new Date() > deletionRequest.expiresAt) {
      return res.status(400).json({ message: "Deletion request has expired" });
    }

    // Check if already processed
    if (deletionRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Deletion request already processed" });
    }

    // Delete the property
    await prisma.residency.delete({
      where: { id: deletionRequest.propertyId }
    });

    // Update deletion request status
    await prisma.propertyDeletionRequest.update({
      where: { id: deletionRequest.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date()
      }
    });

    // Return success page or redirect
    res.status(200).json({
      message: "Property deleted successfully",
      property: deletionRequest.property
    });

  } catch (error) {
    console.error("Error approving property deletion:", error);
    res.status(500).json({
      message: "Failed to delete property",
      error: error.message
    });
  }
});