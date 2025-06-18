// server/services/offer/offerController.js
import asyncHandler from "express-async-handler";
import { prisma } from "../../config/prismaConfig.js";
import { 
  validateOfferInput, 
  findOrCreateBuyer, 
  checkExistingOffer,
  updateExistingOffer,
  createNewOffer,
  checkOfferBelowMinimum
} from "./offerService.js";
import { 
  sendOfferNotification, 
  newOfferTemplate, 
  updatedOfferTemplate,
  lowOfferTemplate
} from "./offerEmailService.js";
// Add this import
import { handleOfferEmailList } from "./offerEmailListService.js";

/**
 * Make an offer on a property
 * @route POST /api/offer/makeOffer
 * @access Public
 */
export const makeOffer = asyncHandler(async (req, res) => {
  try {
    // 1. Validate input
    const validation = validateOfferInput(req);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const { email, phone, buyerType, propertyId, offeredPrice, firstName, lastName, auth0Id, buyerMessage } = req.body;

    console.log(`Received offer: propertyId: ${propertyId}, price: ${offeredPrice}, email: ${email}, auth0Id: ${auth0Id || 'not provided'}`);

    // 2. Find or create buyer
    const buyer = await findOrCreateBuyer({ 
      email, 
      phone, 
      buyerType, 
      firstName, 
      lastName,
      auth0Id
    });

    // 3. Retrieve property details for notifications
    const property = await prisma.residency.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // 4. Check if the buyer already made an offer on the same property
    const existingOfferCheck = await checkExistingOffer(buyer.id, propertyId, offeredPrice);
    
    if (existingOfferCheck.exists) {
      if (existingOfferCheck.canUpdate) {
        // Update the existing offer with the higher price and add to history
        const updatedOffer = await updateExistingOffer(
          existingOfferCheck.offer.id, 
          offeredPrice, 
          buyerMessage, 
          req.userId || null,
          req.user?.name || null
        );

        // Handle email list management for updated offers
        try {
          await handleOfferEmailList(buyer, property, "Offer");
        } catch (emailListError) {
          console.error("Email list management failed:", emailListError);
          // Don't fail the offer update if email list fails
        }

        // Send response first
        res.status(200).json({
          message: "Your previous offer was updated to the new higher price.",
          offer: updatedOffer,
        });

        // Send notification email in the background
        await sendOfferNotification(
          "Offer Updated",
          updatedOfferTemplate(property, buyer, offeredPrice)
        );
        return;
      } else {
        return res.status(400).json({
          message: `You have already made an offer of $${existingOfferCheck.offer.offeredPrice}. Offer a higher price to update.`,
          existingOffer: existingOfferCheck.offer,
        });
      }
    }

    // 5. Create a new offer with initial history
    const newOffer = await createNewOffer(
      propertyId, 
      offeredPrice, 
      buyer.id, 
      buyerMessage,
      req.userId || null,
      req.user?.name || null
    );

    // 6. Handle email list management for new offers
    try {
      const emailListResult = await handleOfferEmailList(buyer, property, "Offer");
      console.log("Email list management result:", emailListResult);
    } catch (emailListError) {
      console.error("Email list management failed:", emailListError);
      // Don't fail the offer creation if email list fails
    }

    // 7. Check if the offer is below the minimum price
    const isBelowMinimum = checkOfferBelowMinimum(offeredPrice, property);
    
    if (isBelowMinimum) {
      // Send response first with a low offer warning
      res.status(201).json({
        message: `Offer submitted successfully, but it is below the minimum price of $${property.minPrice}. Consider offering a higher price.`,
        offer: newOffer,
      });

      // Send low offer notification in the background
      await sendOfferNotification(
        "Low Offer Submitted",
        lowOfferTemplate(property, buyer, offeredPrice)
      );
      return;
    }

    // 8. Send response for successful offer submission
    res.status(201).json({
      message: "Offer created successfully.",
      offer: newOffer,
    });

    // 9. Send new offer notification in the background
    await sendOfferNotification(
      "New Offer Submitted",
      newOfferTemplate(property, buyer, offeredPrice)
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while processing the offer.",
      error: err.message,
    });
  }
});

/**
 * Get all offers for a specific property
 * @route GET /api/offer/property/:propertyId
 * @access Public
 */
export const getOffersOnProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  if (!propertyId) {
    res.status(400).json({ message: "Property ID is required." });
    return;
  }

  try {
    // Fetch all offers for the property, including buyer details
    const offers = await prisma.offer.findMany({
      where: { propertyId },
      include: {
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc", // Change to "asc" for oldest first
      },
    });

    res.status(200).json({
      propertyId,
      totalOffers: offers.length,
      offers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while fetching offers for the property.",
      error: err.message,
    });
  }
});

/**
 * Get offers by buyer
 * @route GET /api/offer/buyer
 * @access Public
 */
export const getOffersByBuyer = asyncHandler(async (req, res) => {
  const { buyerId, email, phone, auth0Id } = req.query;

  if (!buyerId && !email && !phone && !auth0Id) {
    return res.status(400).json({ 
      message: "At least one of buyerId, email, phone, or auth0Id is required." 
    });
  }

  try {
    // Find buyer by ID, email, phone, or auth0Id
    let buyer;
    
    if (buyerId) {
      buyer = await prisma.buyer.findUnique({
        where: { id: buyerId }
      });
    } else if (auth0Id) {
      buyer = await prisma.buyer.findFirst({
        where: { auth0Id }
      });
    } else if (email) {
      buyer = await prisma.buyer.findFirst({
        where: { email }
      });
    } else if (phone) {
      buyer = await prisma.buyer.findFirst({
        where: { phone }
      });
    }

    if (!buyer) {
      return res.status(404).json({ 
        message: "Buyer not found with the provided information." 
      });
    }

    // Fetch all offers by the buyer without property relation
    const offers = await prisma.offer.findMany({
      where: { buyerId: buyer.id },
      // Removed include: { property: true } that would cause an error
      orderBy: {
        timestamp: 'desc' // Latest first
      }
    });

    // Return offers with buyer information
    res.status(200).json({
      buyer: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phone: buyer.phone,
        buyerType: buyer.buyerType,
        id: buyer.id
      },
      totalOffers: offers.length,
      offers
    });
  } catch (err) {
    console.error("Error fetching offers by buyer:", err);
    res.status(500).json({
      message: "An error occurred while fetching offers by buyer.",
      error: err.message
    });
  }
});

/**
 * Update offer status (admin action)
 * @route PUT /api/offer/:id/status
 * @access Private (Admin only)
 */
export const updateOfferStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, counteredPrice, sysMessage } = req.body;
  
  // Validation code remains the same...
  
  try {
    // Find the offer
    const existingOffer = await prisma.offer.findUnique({
      where: { id },
      include: { buyer: true }
    });
    
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    // Handle system message - set to null if not provided in request
    const updatedSysMessage = sysMessage || null;
    
    // Create a history entry for this update
    const historyEntry = {
      timestamp: new Date(),
      previousStatus: existingOffer.offerStatus,
      newStatus: status,
      previousPrice: existingOffer.offeredPrice,
      counteredPrice: status === "COUNTERED" ? parseFloat(counteredPrice) : null,
      sysMessage: updatedSysMessage,
      buyerMessage: null, // Always clear buyer message
      updatedById: req.userId || null,
      updatedByName: req.user?.name || "Admin"
    };
    
    // Get existing history or initialize empty array
    const existingHistory = existingOffer.offerHistory || [];
    
    // Update the offer
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        offerStatus: status,
        counteredPrice: status === "COUNTERED" ? parseFloat(counteredPrice) : null,
        sysMessage: updatedSysMessage,
        buyerMessage: null, // Always clear buyer message 
        offerHistory: [...existingHistory, historyEntry],
        updatedById: req.userId || null,
        updatedAt: new Date()
      }
    });
    
    // Get property for notification
    const property = await prisma.residency.findUnique({
      where: { id: existingOffer.propertyId }
    });
    
    res.status(200).json({
      message: `Offer status updated to ${status}`,
      offer: updatedOffer
    });
    
    // Send notification based on status (async, don't wait)
    let emailSubject, emailTemplate;
    
    switch(status) {
      case "ACCEPTED":
        emailSubject = "Your Offer Has Been Accepted!";
        // Use a template for accepted offers
        break;
      case "REJECTED":
        emailSubject = "Offer Status Update";
        // Use a template for rejected offers
        break;
      case "COUNTERED":
        emailSubject = "Counter Offer Received";
        // Use a template for counter offers
        break;
      case "EXPIRED":
        emailSubject = "Your Offer Has Expired";
        // Use a template for expired offers
        break;
    }
    
    // If we have a subject and template, send the email
    if (emailSubject && emailTemplate) {
      try {
        await sendOfferNotification(emailSubject, emailTemplate);
      } catch (emailError) {
        console.error("Failed to send offer status notification:", emailError);
      }
    }
    
  } catch (err) {
    console.error("Error updating offer status:", err);
    res.status(500).json({
      message: "An error occurred while updating the offer status",
      error: err.message
    });
  }
});

/**
 * Get offer history
 * @route GET /api/offer/:id/history
 * @access Private
 */
export const getOfferHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ message: "Offer ID is required" });
  }
  
  try {
    const offer = await prisma.offer.findUnique({
      where: { id },
      select: {
        id: true,
        offerHistory: true,
        buyerId: true,
        propertyId: true
      }
    });
    
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    
    res.status(200).json({
      offerId: id,
      history: offer.offerHistory || []
    });
    
  } catch (err) {
    console.error("Error fetching offer history:", err);
    res.status(500).json({
      message: "An error occurred while fetching offer history",
      error: err.message
    });
  }
});

/**
 * Get all offers with properties and buyers for admin
 * @route GET /api/offer/all
 * @access Private (Admin only)
 */
export const getAllOffers = asyncHandler(async (req, res) => {
  try {
    // Get pagination parameters or use defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    // Get filters from query params
    const { status, buyerId, propertyId, minPrice, maxPrice } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.offerStatus = status.toUpperCase();
    }
    
    if (buyerId) {
      filter.buyerId = buyerId;
    }
    
    if (propertyId) {
      filter.propertyId = propertyId;
    }
    
    if (minPrice) {
      filter.offeredPrice = { ...(filter.offeredPrice || {}), $gte: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      filter.offeredPrice = { ...(filter.offeredPrice || {}), $lte: parseFloat(maxPrice) };
    }
    
    // Fetch offers with buyer details
    const offers = await prisma.offer.findMany({
      where: filter,
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            buyerType: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      skip,
      take: limit,
    });
    
    // Get total count for pagination
    const totalCount = await prisma.offer.count({ where: filter });
    
    // Get property titles since there's no direct relationship
    const propertyIds = [...new Set(offers.map(offer => offer.propertyId))];
    const properties = await prisma.residency.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, title: true, streetAddress: true, city: true, state: true },
    });
    
    // Create a map of propertyId -> property data for quick lookup
    const propertyMap = {};
    properties.forEach(property => {
      propertyMap[property.id] = property;
    });
    
    // Add property info to each offer
    const offersWithPropertyData = offers.map(offer => ({
      ...offer,
      property: propertyMap[offer.propertyId] || null,
    }));
    
    // Return the offers with pagination
    res.status(200).json({
      offers: offersWithPropertyData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching all offers:", err);
    res.status(500).json({
      message: "An error occurred while fetching offers.",
      error: err.message,
    });
  }
});

/**
 * Get recent offer activity for the admin dashboard
 * @route GET /api/offer/activity/recent
 * @access Private (Admin only)
 */
export const getRecentOfferActivity = asyncHandler(async (req, res) => {
  try {
    // Get limit from query or use default
    const limit = parseInt(req.query.limit) || 10;
    
    // Get all offers with history, ordered by most recent update
    const offers = await prisma.offer.findMany({
      orderBy: {
        timestamp: "desc",
      },
      take: 50, // Get more than we need, since we'll filter for those with history
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    // Extract activities from offer history and add context
    let allActivities = [];
    
    // Get property information for context
    const propertyIds = [...new Set(offers.map(offer => offer.propertyId))];
    const properties = await prisma.residency.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, title: true, streetAddress: true, city: true, state: true },
    });
    
    // Create a map of propertyId -> property data for quick lookup
    const propertyMap = {};
    properties.forEach(property => {
      propertyMap[property.id] = property;
    });
    
    // Process each offer to extract history
    offers.forEach(offer => {
      // Get property details
      const property = propertyMap[offer.propertyId] || { 
        title: "Unknown Property", 
        streetAddress: "Unknown Address" 
      };
      
      // Add the initial offer as an activity if it has no history
      if (!offer.offerHistory || offer.offerHistory.length === 0) {
        allActivities.push({
          offerId: offer.id,
          propertyId: offer.propertyId,
          propertyAddress: property.streetAddress,
          propertyTitle: property.title,
          buyerId: offer.buyerId,
          buyerName: `${offer.buyer.firstName} ${offer.buyer.lastName || ''}`,
          buyerFirstName: offer.buyer.firstName,
          buyerLastName: offer.buyer.lastName,
          timestamp: offer.timestamp,
          newStatus: offer.offerStatus,
          newPrice: offer.offeredPrice,
          buyerMessage: offer.buyerMessage,
          sysMessage: offer.sysMessage,
        });
      } 
      // Extract activities from history
      else if (Array.isArray(offer.offerHistory)) {
        const activities = offer.offerHistory.map(history => ({
          offerId: offer.id,
          propertyId: offer.propertyId,
          propertyAddress: property.streetAddress,
          propertyTitle: property.title,
          buyerId: offer.buyerId,
          buyerName: `${offer.buyer.firstName} ${offer.buyer.lastName || ''}`,
          buyerFirstName: offer.buyer.firstName,
          buyerLastName: offer.buyer.lastName,
          timestamp: history.timestamp,
          previousStatus: history.previousStatus,
          newStatus: history.newStatus,
          previousPrice: history.previousPrice,
          newPrice: history.newPrice,
          counteredPrice: history.counteredPrice,
          buyerMessage: history.buyerMessage,
          sysMessage: history.sysMessage,
          updatedById: history.updatedById,
          updatedByName: history.updatedByName,
        }));
        
        allActivities = [...allActivities, ...activities];
      }
    });
    
    // Sort by timestamp (newest first) and limit results
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = allActivities.slice(0, limit);
    
    res.status(200).json({
      activities: recentActivities,
      totalCount: allActivities.length,
    });
  } catch (err) {
    console.error("Error fetching recent offer activity:", err);
    res.status(500).json({
      message: "An error occurred while fetching recent offer activity.",
      error: err.message,
    });
  }
});