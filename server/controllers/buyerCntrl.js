// server/controllers/buyerCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
// Add this import
import { handleVipBuyerEmailList } from "../services/buyer/vipBuyerEmailListService.js";

/**
 * Create a VIP buyer with Auth0 ID
 * @route POST /api/buyer/createVipBuyer
 * @access Public
 */
export const createVipBuyer = asyncHandler(async (req, res) => {
  const { email, phone, buyerType, firstName, lastName, preferredAreas, auth0Id } = req.body;

  // Validate required fields
  if (!email || !phone || !buyerType || !firstName || !lastName || !preferredAreas || !Array.isArray(preferredAreas)) {
    res.status(400).json({
      message: "All fields are required including preferred areas.",
    });
    return;
  }

  try {
    // Check if buyer already exists
    let buyer = await prisma.buyer.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { phone }],
      },
    });

    if (buyer) {
      // Update existing buyer with VIP status, preferred areas, and Auth0 ID
      buyer = await prisma.buyer.update({
        where: { id: buyer.id },
        data: {
          firstName,
          lastName,
          buyerType,
          preferredAreas,
          source: "VIP Buyers List",
          auth0Id, // Add Auth0 user ID to the buyer record
        },
      });
    } else {
      // Create new buyer with VIP status, preferred areas, and Auth0 ID
      buyer = await prisma.buyer.create({
        data: {
          email: email.toLowerCase(),
          phone,
          buyerType,
          firstName,
          lastName,
          preferredAreas,
          source: "VIP Buyers List",
          auth0Id, // Add Auth0 user ID to the buyer record
        },
      });
    }

    // Handle VIP buyer email list management for each preferred area
    try {
      const emailListResults = [];

      for (const area of preferredAreas) {
        const emailListResult = await handleVipBuyerEmailList(buyer, "VIP", area, buyerType);
        emailListResults.push(emailListResult);
        console.log(`VIP email list result for ${area}:`, emailListResult);
      }

      console.log("All VIP email list management completed:", emailListResults);
    } catch (emailListError) {
      console.error("VIP email list management failed:", emailListError);
      // Don't fail registration if email list fails
    }

    res.status(201).json({
      message: "VIP Buyer created successfully.",
      buyer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while processing the request.",
      error: err.message,
    });
  }
});

/**
 * Get all buyers
 * @route GET /api/buyer/all
 * @access Public (but should be protected in production)
 */
export const getAllBuyers = asyncHandler(async (req, res) => {
  try {
    const buyers = await prisma.buyer.findMany({
      include: {
        offers: {
          select: {
            id: true,
            propertyId: true,
            offeredPrice: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
        // Add email list memberships to include current list associations
        emailListMemberships: {
          include: {
            emailList: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(buyers);
  } catch (err) {
    console.error("Error fetching buyers:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyers",
      error: err.message,
    });
  }
});

/**
 * Get buyer by ID
 * @route GET /api/buyer/:id
 * @access Public (but should be protected in production)
 */
export const getBuyerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      include: {
        offers: {
          select: {
            id: true,
            propertyId: true,
            offeredPrice: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: "desc",
          },
        },
        emailListMemberships: {
          include: {
            emailList: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    res.status(200).json(buyer);
  } catch (err) {
    console.error("Error fetching buyer:", err);
    res.status(500).json({
      message: "An error occurred while fetching the buyer",
      error: err.message,
    });
  }
});

/**
 * Update buyer
 * @route PUT /api/buyer/update/:id
 * @access Private (only admins should update buyers)
 */
export const updateBuyer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, buyerType, source, preferredAreas } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  // Only validate email as required
  if (!email || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if buyer exists
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id },
    });

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Check if email is changing and if it's already in use
    if (email.toLowerCase() !== existingBuyer.email) {
      const emailExists = await prisma.buyer.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: id }, // Exclude current buyer
        },
      });

      if (emailExists) {
        return res.status(400).json({ message: "Email already in use by another buyer" });
      }
    }

    // Check if phone is changing and if it's already in use (only if phone is provided)
    if (phone && phone.trim() && phone !== existingBuyer.phone) {
      const phoneExists = await prisma.buyer.findFirst({
        where: {
          phone: phone,
          id: { not: id }, // Exclude current buyer
        },
      });

      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use by another buyer" });
      }
    }

    // Update the buyer
    const updatedBuyer = await prisma.buyer.update({
      where: { id },
      data: {
        firstName: firstName || null,
        lastName: lastName || null,
        email: email.toLowerCase(),
        phone: phone && phone.trim() ? phone : null,
        buyerType: buyerType || null,
        source,
        preferredAreas: preferredAreas || [],
      },
      include: {
        offers: true,
        emailListMemberships: {
          include: {
            emailList: true,
          },
        },
      },
    });

    res.status(200).json(updatedBuyer);
  } catch (err) {
    console.error("Error updating buyer:", err);
    res.status(500).json({
      message: "An error occurred while updating the buyer",
      error: err.message,
    });
  }
});

/**
 * Delete buyer
 * @route DELETE /api/buyer/delete/:id
 * @access Private (only admins should delete buyers)
 */
export const deleteBuyer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Check if buyer exists
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id },
    });

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Delete all related records first (due to foreign key constraints)

    // 1. Delete email list memberships
    await prisma.buyerEmailList.deleteMany({
      where: { buyerId: id },
    });

    // 2. Delete buyer activities
    await prisma.buyerActivity.deleteMany({
      where: { buyerId: id },
    });

    // 3. Delete offers from this buyer
    await prisma.offer.deleteMany({
      where: { buyerId: id },
    });

    // 4. Finally delete the buyer
    const deletedBuyer = await prisma.buyer.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Buyer and all associated records deleted successfully",
      buyer: deletedBuyer,
    });
  } catch (err) {
    console.error("Error deleting buyer:", err);
    res.status(500).json({
      message: "An error occurred while deleting the buyer",
      error: err.message,
    });
  }
});

/**
 * Create a regular buyer
 * @route POST /api/buyer/create
 * @access Public
 */
export const createBuyer = asyncHandler(async (req, res) => {
  const {
    email,
    phone,
    buyerType,
    firstName,
    lastName,
    source,
    preferredAreas,
    emailStatus,
    emailPermissionStatus,
    emailLists, // Array of list names or IDs
  } = req.body;

  // Validate required fields
  if (!email || !phone || !firstName || !lastName) {
    res.status(400).json({
      message: "Email, phone, firstName, and lastName are required.",
    });
    return;
  }

  try {
    // Check if buyer already exists
    const existingBuyer = await prisma.buyer.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { phone }],
      },
    });

    if (existingBuyer) {
      res.status(409).json({
        message: "A buyer with this email or phone number already exists.",
        existingBuyer,
      });
      return;
    }

    // Find email lists by name if provided
    let emailListConnections = [];
    if (emailLists && emailLists.length > 0) {
      const lists = await prisma.emailList.findMany({
        where: {
          name: { in: emailLists },
        },
        select: { id: true },
      });
      emailListConnections = lists.map((list) => ({ id: list.id }));
    }

    // Create new buyer with email list connections
    const buyer = await prisma.buyer.create({
      data: {
        email: email.toLowerCase(),
        phone,
        buyerType,
        firstName,
        lastName,
        source: source || "Manual Entry",
        preferredAreas: preferredAreas || [],
        emailStatus: emailStatus || "available",
        emailPermissionStatus,
        emailListMemberships: {
          create: emailListConnections.map((listId) => ({
            emailList: { connect: { id: listId } },
          })),
        },
      },
      include: {
        emailListMemberships: {
          include: {
            emailList: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Buyer created successfully.",
      buyer,
    });
  } catch (err) {
    console.error("Error creating buyer:", err);
    res.status(500).json({
      message: "An error occurred while processing the request.",
      error: err.message,
    });
  }
});

/**
 * Get buyers by preferred area
 * @route GET /api/buyer/byArea/:areaId
 * @access Public (but should be protected in production)
 */
export const getBuyersByArea = asyncHandler(async (req, res) => {
  const { areaId } = req.params;

  if (!areaId) {
    return res.status(400).json({ message: "Area ID is required" });
  }

  try {
    const buyers = await prisma.buyer.findMany({
      where: {
        preferredAreas: {
          has: areaId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      areaId,
      count: buyers.length,
      buyers,
    });
  } catch (err) {
    console.error("Error fetching buyers by area:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyers by area",
      error: err.message,
    });
  }
});

/**
 * Send email to selected buyers
 * @route POST /api/buyer/sendEmail
 * @access Private (only admins should send emails)
 */
export const sendEmailToBuyers = asyncHandler(async (req, res) => {
  const { buyerIds, subject, content, includeUnsubscribed = false } = req.body;

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "At least one buyer ID is required" });
  }

  if (!subject || !content) {
    return res.status(400).json({ message: "Email subject and content are required" });
  }

  try {
    // Get the buyers to email
    const buyers = await prisma.buyer.findMany({
      where: {
        id: { in: buyerIds },
        ...(includeUnsubscribed ? {} : { unsubscribed: false }),
      },
    });

    if (buyers.length === 0) {
      return res.status(404).json({
        message: "No eligible buyers found with the provided IDs",
      });
    }

    // In a real implementation, you'd use a service like SendGrid, Mailchimp, etc.
    // Here we'll simulate sending emails

    // Process email content with placeholders
    const emailsSent = buyers.map((buyer) => {
      // Replace placeholders with buyer data
      const personalizedContent = content
        .replace(/{firstName}/g, buyer.firstName)
        .replace(/{lastName}/g, buyer.lastName)
        .replace(/{email}/g, buyer.email)
        .replace(/{preferredAreas}/g, (buyer.preferredAreas || []).join(", "));

      // In a real implementation, send the email here

      return {
        buyerId: buyer.id,
        email: buyer.email,
        name: `${buyer.firstName} ${buyer.lastName}`,
        status: "sent", // In a real implementation, this would be the actual status
      };
    });

    // Create a record of the email campaign
    // In a real implementation, you'd store this in the database

    res.status(200).json({
      message: `Successfully sent emails to ${emailsSent.length} buyers`,
      emailsSent,
      failedCount: buyerIds.length - emailsSent.length,
    });
  } catch (err) {
    console.error("Error sending emails to buyers:", err);
    res.status(500).json({
      message: "An error occurred while sending emails",
      error: err.message,
    });
  }
});

/**
 * Import buyers from CSV
 * @route POST /api/buyer/import
 * @access Private (only admins should import buyers)
 */
export const importBuyersFromCsv = asyncHandler(async (req, res) => {
  const { buyers, source = "CSV Import" } = req.body;

  if (!buyers || !Array.isArray(buyers) || buyers.length === 0) {
    return res.status(400).json({ message: "No buyer data provided" });
  }

  try {
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      createdBuyerIds: [],
      updatedBuyerIds: [],
    };

    // Process each buyer
    for (const buyerData of buyers) {
      try {
        const { email, phone, firstName, lastName, buyerType, preferredAreas, emailStatus, emailPermissionStatus, isNew, existingBuyerId } = buyerData;

        // Check required fields
        if (!email) {
          results.failed++;
          results.errors.push({
            data: buyerData,
            reason: "Missing required email field",
          });
          continue;
        }

        if (isNew) {
          // Create new buyer
          const newBuyer = await prisma.buyer.create({
            data: {
              email: email.toLowerCase(),
              phone: phone || null,
              buyerType: buyerType || null,
              firstName: firstName || null,
              lastName: lastName || null,
              source: source,
              preferredAreas: preferredAreas || [],
              emailStatus: emailStatus || "available",
              emailPermissionStatus: emailPermissionStatus || null,
            },
          });

          results.created++;
          results.createdBuyerIds.push(newBuyer.id);
        } else if (existingBuyerId) {
          // Update existing buyer (duplicates are handled in the frontend)
          await prisma.buyer.update({
            where: { id: existingBuyerId },
            data: {
              firstName: firstName || undefined,
              lastName: lastName || undefined,
              buyerType: buyerType || undefined,
              preferredAreas: preferredAreas || undefined,
              source: source || undefined,
              emailStatus: emailStatus || undefined,
              emailPermissionStatus: emailPermissionStatus || undefined,
            },
          });

          results.updated++;
          results.updatedBuyerIds.push(existingBuyerId);
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          data: buyerData,
          reason: err.message,
        });
      }
    }

    res.status(200).json({
      message: `Processed ${buyers.length} buyers: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      results,
    });
  } catch (err) {
    console.error("Error importing buyers:", err);
    res.status(500).json({
      message: "An error occurred while importing buyers",
      error: err.message,
    });
  }
});

/**
 * Get buyer statistics
 * @route GET /api/buyer/stats
 * @access Private (only admins should access stats)
 */
export const getBuyerStats = asyncHandler(async (req, res) => {
  try {
    // Get total buyer count
    const totalCount = await prisma.buyer.count();

    // Get count of VIP buyers
    const vipCount = await prisma.buyer.count({
      where: { source: "VIP Buyers List" },
    });

    // Get counts by area (this is more complex with array fields)
    // In MongoDB/Prisma, we'd need aggregation for this
    // This is a simplified version
    const buyers = await prisma.buyer.findMany({
      select: {
        id: true,
        preferredAreas: true,
        buyerType: true,
        source: true,
        createdAt: true,
      },
    });

    // Manually count by area
    const byArea = {};
    const byType = {};
    const bySource = {};

    // Process for time-based analytics - group by month
    const monthlyGrowth = {};

    buyers.forEach((buyer) => {
      // Count by area
      if (buyer.preferredAreas) {
        buyer.preferredAreas.forEach((area) => {
          byArea[area] = (byArea[area] || 0) + 1;
        });
      }

      // Count by type
      if (buyer.buyerType) {
        byType[buyer.buyerType] = (byType[buyer.buyerType] || 0) + 1;
      }

      // Count by source
      const source = buyer.source || "Unknown";
      bySource[source] = (bySource[source] || 0) + 1;

      // Process for monthly growth
      if (buyer.createdAt) {
        const date = new Date(buyer.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
      }
    });

    // Return stats
    res.status(200).json({
      totalCount,
      vipCount,
      byArea,
      byType,
      bySource,
      monthlyGrowth,
    });
  } catch (err) {
    console.error("Error getting buyer stats:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyer statistics",
      error: err.message,
    });
  }
});

/**
 * Get buyer by Auth0 ID
 * @route GET /api/buyer/byAuth0Id
 * @access Public
 */
export const getBuyerByAuth0Id = asyncHandler(async (req, res) => {
  const { auth0Id } = req.query;

  if (!auth0Id) {
    return res.status(400).json({ message: "Auth0 ID is required" });
  }

  try {
    // Find buyer by Auth0 ID
    const buyer = await prisma.buyer.findFirst({
      where: { auth0Id },
    });

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Return buyer data with 200 status
    res.status(200).json(buyer);
  } catch (err) {
    console.error("Error fetching buyer by Auth0 ID:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyer information",
      error: err.message,
    });
  }
});

/**
 * Bulk delete buyers
 * @route DELETE /api/buyer/bulk-delete
 * @access Private
 */
export const bulkDeleteBuyers = asyncHandler(async (req, res) => {
  const { buyerIds } = req.body;

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "Buyer IDs array is required" });
  }

  try {
    // Delete all related records first (due to foreign key constraints)

    // 1. Delete email list memberships
    await prisma.buyerEmailList.deleteMany({
      where: { buyerId: { in: buyerIds } },
    });

    // 2. Delete buyer activities
    await prisma.buyerActivity.deleteMany({
      where: { buyerId: { in: buyerIds } },
    });

    // 3. Delete offers
    await prisma.offer.deleteMany({
      where: { buyerId: { in: buyerIds } },
    });

    // 4. Delete buyers
    const result = await prisma.buyer.deleteMany({
      where: { id: { in: buyerIds } },
    });

    res.status(200).json({
      message: `${result.count} buyers and all associated records deleted successfully`,
      deletedCount: result.count,
    });
  } catch (err) {
    console.error("Error bulk deleting buyers:", err);
    res.status(500).json({
      message: "An error occurred while deleting buyers",
      error: err.message,
    });
  }
});

/**
 * Update buyer subscription preferences (partial unsubscribe)
 * @route PUT /api/buyer/unsubscribe/:id
 * @access Public
 */
export const updateSubscriptionPreferences = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { preferredAreas, weeklyUpdates, holidayDeals, specialDiscounts } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id },
    });

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Update subscription preferences
    const updatedBuyer = await prisma.buyer.update({
      where: { id },
      data: {
        preferredAreas: preferredAreas || [],
        weeklyUpdates: weeklyUpdates || "available",
        holidayDeals: holidayDeals || "available",
        specialDiscounts: specialDiscounts || "available",
        updatedAt: new Date(),
      },
    });

    // Log the activity
    await prisma.buyerActivity.create({
      data: {
        buyerId: id,
        eventType: "subscription_update",
        eventData: {
          action: "preferences_updated",
          oldPreferences: {
            preferredAreas: existingBuyer.preferredAreas,
            weeklyUpdates: existingBuyer.weeklyUpdates,
            holidayDeals: existingBuyer.holidayDeals,
            specialDiscounts: existingBuyer.specialDiscounts,
          },
          newPreferences: {
            preferredAreas,
            weeklyUpdates,
            holidayDeals,
            specialDiscounts,
          },
        },
      },
    });

    res.status(200).json({
      message: "Subscription preferences updated successfully",
      buyer: updatedBuyer,
    });
  } catch (err) {
    console.error("Error updating subscription preferences:", err);
    res.status(500).json({
      message: "An error occurred while updating preferences",
      error: err.message,
    });
  }
});

/**
 * Complete unsubscribe from all emails
 * @route PUT /api/buyer/unsubscribe/:id/complete
 * @access Public
 */
export const completeUnsubscribe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id },
    });

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Update buyer to unsubscribe from all emails
    const updatedBuyer = await prisma.buyer.update({
      where: { id },
      data: {
        emailStatus: "unsubscribe",
        emailPermissionStatus: "unsubscribe",
        weeklyUpdates: "unsubscribe",
        holidayDeals: "unsubscribe",
        specialDiscounts: "unsubscribe",
        preferredAreas: [], // Clear preferred areas
        updatedAt: new Date(),
      },
    });

    // Remove from all email lists
    await prisma.buyerEmailList.deleteMany({
      where: { buyerId: id },
    });

    // Log the activity
    await prisma.buyerActivity.create({
      data: {
        buyerId: id,
        eventType: "subscription_update",
        eventData: {
          action: "complete_unsubscribe",
          previousStatus: existingBuyer.emailStatus,
          unsubscribeDate: new Date().toISOString(),
        },
      },
    });

    res.status(200).json({
      message: "Successfully unsubscribed from all emails",
      buyer: updatedBuyer,
    });
  } catch (err) {
    console.error("Error completing unsubscribe:", err);
    res.status(500).json({
      message: "An error occurred while unsubscribing",
      error: err.message,
    });
  }
});

/**
 * Get buyer data for unsubscribe page (public endpoint)
 * @route GET /api/buyer/unsubscribe/:id/data
 * @access Public
 */
export const getBuyerForUnsubscribe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer with only necessary fields for unsubscribe page
    const buyer = await prisma.buyer.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        preferredAreas: true,
        emailStatus: true,
        emailPermissionStatus: true,
        weeklyUpdates: true,
        holidayDeals: true,
        specialDiscounts: true,
        createdAt: true,
      },
    });

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Log the unsubscribe page visit
    await prisma.buyerActivity.create({
      data: {
        buyerId: id,
        eventType: "page_view",
        eventData: {
          page: "unsubscribe",
          timestamp: new Date().toISOString(),
        },
      },
    });

    res.status(200).json(buyer);
  } catch (err) {
    console.error("Error fetching buyer for unsubscribe:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyer information",
      error: err.message,
    });
  }
});
