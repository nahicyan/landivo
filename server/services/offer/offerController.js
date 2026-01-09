// server/services/offer/offerController.js
import asyncHandler from "express-async-handler";
import mongoose from "../../config/mongoose.js";
import { connectMongo } from "../../config/mongoose.js";
import { Buyer, Offer, Property } from "../../models/index.js";
import { validateOfferInput, findOrCreateBuyer, checkExistingOffer, updateExistingOffer, createNewOffer, checkOfferBelowMinimum } from "./offerService.js";
import { sendOfferNotification, newOfferTemplate, updatedOfferTemplate, lowOfferTemplate, generateOfferSubject } from "./offerEmailService.js";
import { sendBuyerOfferNotification, acceptedOfferTemplate, rejectedOfferTemplate, counterOfferTemplate, expiredOfferTemplate, generateBuyerOfferSubject } from "./offerBuyerEmailService.js";
// Add this import
import { handleOfferEmailList } from "./offerEmailListService.js";
import { getLogger } from "../../utils/logger.js";

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const log = getLogger("offerController");

/**
 * Make an offer on a property
 * @route POST /api/offer/makeOffer
 * @access Public
 */
// server/services/offer/offerController.js
export const makeOffer = asyncHandler(async (req, res) => {
  try {
    // 1. Validate input
    const validation = validateOfferInput(req);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const { email, phone, buyerType, propertyId, offeredPrice, firstName, lastName, auth0Id, buyerMessage } = req.body;

    log.info(
      `[offerController:makeOffer] > [Request]: propertyId=${propertyId}, offeredPrice=${offeredPrice}, email=${email}, auth0Id=${auth0Id || "not provided"}`
    );

    // 2. Retrieve property details for notifications
    await connectMongo();
    const propertyObjectId = toObjectId(propertyId);
    const property = propertyObjectId
      ? await Property.findById(propertyObjectId).lean()
      : null;
    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // 3. Find or create buyer
    const buyer = await findOrCreateBuyer({
      email,
      phone,
      buyerType,
      firstName,
      lastName,
      auth0Id,
      preferredArea: property.area,
      preferredCity: property.city,
      preferredCounty: property.county
    });

    // 4. Check if the buyer already made an offer on the same property
    const existingOfferCheck = await checkExistingOffer(buyer.id, propertyId, offeredPrice);

    if (existingOfferCheck.exists) {
      if (existingOfferCheck.canUpdate) {
        // Update the existing offer with the higher price and add to history
        const updatedOffer = await updateExistingOffer(existingOfferCheck.offer.id, offeredPrice, buyerMessage, req.userId || null, req.user?.name || null);

        // Handle email list management for updated offers
        try {
          await handleOfferEmailList(buyer, property, "Offer");
        } catch (emailListError) {
          log.error(
            `[offerController:makeOffer] > [Error]: email list management failed: ${emailListError?.message || emailListError}`
          );
          // Don't fail the offer update if email list fails
        }

        // Check if the updated offer is below the minimum price
        const isBelowMinimum = checkOfferBelowMinimum(offeredPrice, property);

        if (isBelowMinimum) {
          // Send response first with a low offer warning
          res.status(200).json({
            message: `Your offer has been updated, but it is below the minimum price of $${property.minPrice.toLocaleString()}. Consider offering a higher price.`,
            offer: updatedOffer,
          });

          // Send low offer notification in the background
          await sendOfferNotification(generateOfferSubject("low_offer", buyer, property), lowOfferTemplate(property, buyer, offeredPrice, buyerMessage, updatedOffer.id));
          return;
        }

        // Send response for valid updated offer
        res.status(200).json({
          message: "Your previous offer was updated to the new higher price.",
          offer: updatedOffer,
        });

        // Send notification email in the background
        await sendOfferNotification(generateOfferSubject("updated", buyer, property), updatedOfferTemplate(property, buyer, offeredPrice, buyerMessage, updatedOffer.id));
        return;
      } else {
        // Offer is same or lower - just show warning, don't update
        // Check if it's below minimum to provide appropriate message
        const isBelowMinimum = checkOfferBelowMinimum(offeredPrice, property);

        if (isBelowMinimum) {
          return res.status(400).json({
            message: `At this time we cannot accept any offers below $${property.minPrice.toLocaleString()}. You previously offered $${existingOfferCheck.offer.offeredPrice.toLocaleString()}. Consider offering a higher price.`,
            existingOffer: existingOfferCheck.offer,
          });
        }

        return res.status(400).json({
          message: `You have already made an offer of $${existingOfferCheck.offer.offeredPrice.toLocaleString()}. Offer a higher price to update.`,
          existingOffer: existingOfferCheck.offer,
        });
      }
    }

    // 5. Create a new offer with initial history
    const newOffer = await createNewOffer(propertyId, offeredPrice, buyer.id, buyerMessage, req.userId || null, req.user?.name || null);

    // 6. Handle email list management for new offers
    try {
      const emailListResult = await handleOfferEmailList(buyer, property, "Offer");
      log.info(
        `[offerController:makeOffer] > [Response]: email list result=${JSON.stringify(emailListResult)}`
      );
    } catch (emailListError) {
      log.error(
        `[offerController:makeOffer] > [Error]: email list management failed: ${emailListError?.message || emailListError}`
      );
      // Don't fail the offer creation if email list fails
    }

    // 7. Check if the offer is below the minimum price
    const isBelowMinimum = checkOfferBelowMinimum(offeredPrice, property);

    if (isBelowMinimum) {
      // Send response first with a low offer warning
      res.status(201).json({
        message: `Offer submitted successfully, but it is below the minimum price of $${property.minPrice.toLocaleString()}. Consider offering a higher price.`,
        offer: newOffer,
      });

      // Send low offer notification in the background
      await sendOfferNotification(generateOfferSubject("low_offer", buyer, property), lowOfferTemplate(property, buyer, offeredPrice, buyerMessage, newOffer.id));
      return;
    }

    // 8. Send response for successful offer submission
    res.status(201).json({
      message: "Offer created successfully.",
      offer: newOffer,
    });

    // 9. Send new offer notification in the background
    await sendOfferNotification(generateOfferSubject("submitted", buyer, property), newOfferTemplate(property, buyer, offeredPrice, buyerMessage, newOffer.id));
  } catch (err) {
    log.error(
      `[offerController:makeOffer] > [Error]: ${err?.message || err}`
    );
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
    await connectMongo();
    const offers = await Offer.find({ propertyId })
      .populate({ path: "buyerId", select: "firstName lastName email phone" })
      .sort({ timestamp: -1 })
      .lean();
    const normalizedOffers = offers.map((offer) => {
      const buyer = offer.buyerId
        ? {
            id: String(offer.buyerId._id),
            firstName: offer.buyerId.firstName,
            lastName: offer.buyerId.lastName,
            email: offer.buyerId.email,
            phone: offer.buyerId.phone,
          }
        : null;
      return {
        ...offer,
        id: String(offer._id),
        buyer,
        buyerId: buyer ? buyer.id : String(offer.buyerId),
      };
    });

    res.status(200).json({
      propertyId,
      totalOffers: normalizedOffers.length,
      offers: normalizedOffers,
    });
  } catch (err) {
    log.error(
      `[offerController:getOffersOnProperty] > [Error]: ${err?.message || err}`
    );
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
      message: "At least one of buyerId, email, phone, or auth0Id is required.",
    });
  }

  try {
    // Find buyer by ID, email, phone, or auth0Id
    let buyer;

    if (buyerId) {
      await connectMongo();
      const buyerObjectId = toObjectId(buyerId);
      buyer = buyerObjectId ? await Buyer.findById(buyerObjectId).lean() : null;
    } else if (auth0Id) {
      await connectMongo();
      buyer = await Buyer.findOne({ auth0Id }).lean();
    } else if (email) {
      await connectMongo();
      buyer = await Buyer.findOne({ email: String(email).toLowerCase() }).lean();
    } else if (phone) {
      await connectMongo();
      buyer = await Buyer.findOne({ phone }).lean();
    }

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found with the provided information.",
      });
    }

    // Fetch all offers by the buyer without property relation
    const offers = await Offer.find({ buyerId: buyer._id })
      .sort({ timestamp: -1 })
      .lean();
    const normalizedOffers = offers.map((offer) => ({
      ...offer,
      id: String(offer._id),
      buyerId: String(offer.buyerId),
    }));

    // Return offers with buyer information
    res.status(200).json({
      buyer: {
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        email: buyer.email,
        phone: buyer.phone,
        buyerType: buyer.buyerType,
        id: String(buyer._id),
      },
      totalOffers: normalizedOffers.length,
      offers: normalizedOffers,
    });
  } catch (err) {
    log.error(
      `[offerController:getOffersByBuyer] > [Error]: ${err?.message || err}`
    );
    res.status(500).json({
      message: "An error occurred while fetching offers by buyer.",
      error: err.message,
    });
  }
});

/**
 * Update offer status (admin action) - UPDATED VERSION
 * @route PUT /api/offer/:id/status
 * @access Private (Admin only)
 */
export const updateOfferStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, counteredPrice, message } = req.body;

  // Validate input
  if (!status || !["ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided" });
  }

  if (status === "COUNTERED" && !counteredPrice) {
    return res.status(400).json({ message: "Counter price is required for COUNTERED status" });
  }

  try {
    // Get the existing offer with buyer
    await connectMongo();
    const offerObjectId = toObjectId(id);
    if (!offerObjectId) {
      return res.status(400).json({ message: "Invalid offer ID" });
    }
    const existingOffer = await Offer.findById(offerObjectId)
      .populate("buyerId")
      .lean();

    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Fetch the property separately
    const propertyObjectId = toObjectId(existingOffer.propertyId);
    const property = propertyObjectId
      ? await Property.findById(propertyObjectId).lean()
      : null;

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Add property to existingOffer for email sending
    existingOffer.property = property;
    existingOffer.buyer = existingOffer.buyerId;

    // Build system message
    const updatedSysMessage = message || null;

    // Create history entry with CONSISTENT field names
    const historyEntry = {
      timestamp: new Date(),
      previousStatus: existingOffer.offerStatus,
      newStatus: status, // Changed from 'status' to 'newStatus'
      previousPrice: existingOffer.offeredPrice, // Added previousPrice
      counteredPrice: status === "COUNTERED" ? parseFloat(counteredPrice) : null,
      sysMessage: updatedSysMessage,
      updatedById: req.userId || null,
      updatedByName: req.user?.name || "Admin",
    };

    // Get existing history or initialize empty array
    const existingHistory = existingOffer.offerHistory || [];

    // Update the offer
    const updatedOffer = await Offer.findByIdAndUpdate(
      offerObjectId,
      {
        offerStatus: status,
        counteredPrice: status === "COUNTERED" ? parseFloat(counteredPrice) : null,
        sysMessage: updatedSysMessage,
        offerHistory: [...existingHistory, historyEntry],
        updatedById: req.userId || null,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    res.status(200).json({
      message: `Offer status updated to ${status}`,
      offer: updatedOffer
        ? { id: String(updatedOffer._id), ...updatedOffer }
        : updatedOffer,
    });

    // Send buyer notification emails based on status (async, don't wait)
    if (existingOffer.buyer && existingOffer.property) {
      try {
        let emailSubject, emailTemplate;

        switch (status) {
          case "ACCEPTED":
            emailSubject = generateBuyerOfferSubject("accepted", existingOffer.property);
            emailTemplate = acceptedOfferTemplate(existingOffer.property, existingOffer.buyer, existingOffer, updatedSysMessage);

            break;

          case "REJECTED":
            emailSubject = generateBuyerOfferSubject("rejected", existingOffer.property);
            emailTemplate = rejectedOfferTemplate(existingOffer.property, existingOffer.buyer, existingOffer, updatedSysMessage);
            break;

          case "COUNTERED":
            emailSubject = generateBuyerOfferSubject("countered", existingOffer.property);
            emailTemplate = counterOfferTemplate(existingOffer.property, existingOffer.buyer, existingOffer, parseFloat(counteredPrice), updatedSysMessage);
            break;

          case "EXPIRED":
            emailSubject = generateBuyerOfferSubject("expired", existingOffer.property);
            emailTemplate = expiredOfferTemplate(existingOffer.property, existingOffer.buyer, existingOffer, updatedSysMessage);
            break;
        }

        // Send buyer notification if we have both subject and template
        if (emailSubject && emailTemplate) {
          await sendBuyerOfferNotification(existingOffer.buyer, emailSubject, emailTemplate);
        }
      } catch (emailError) {
        log.error(
          `[offerController:updateOfferStatus] > [Error]: failed to send buyer notification: ${emailError?.message || emailError}`
        );
        // Don't fail the offer update if email fails
      }
    }
  } catch (err) {
    log.error(
      `[offerController:updateOfferStatus] > [Error]: ${err?.message || err}`
    );
    res.status(500).json({
      message: "An error occurred while updating offer status.",
      error: err.message,
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
    await connectMongo();
    const offerObjectId = toObjectId(id);
    if (!offerObjectId) {
      return res.status(400).json({ message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(
      offerObjectId,
      "offerHistory buyerId propertyId"
    ).lean();

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.status(200).json({
      offerId: id,
      history: offer.offerHistory || [],
    });
  } catch (err) {
    log.error(
      `[offerController:getOfferHistory] > [Error]: ${err?.message || err}`
    );
    res.status(500).json({
      message: "An error occurred while fetching offer history",
      error: err.message,
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
      const buyerObjectId = toObjectId(buyerId);
      filter.buyerId = buyerObjectId || buyerId;
    }

    if (propertyId) {
      filter.propertyId = propertyId;
    }

    if (minPrice) {
      filter.offeredPrice = {
        ...(filter.offeredPrice || {}),
        $gte: parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      filter.offeredPrice = {
        ...(filter.offeredPrice || {}),
        $lte: parseFloat(maxPrice),
      };
    }

    // Fetch offers with buyer details
    await connectMongo();
    const offers = await Offer.find(filter)
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone buyerType",
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Offer.countDocuments(filter);

    // Get property titles since there's no direct relationship
    const propertyIds = [...new Set(offers.map((offer) => offer.propertyId))];
    const propertyObjectIds = propertyIds
      .map((propertyIdValue) => toObjectId(propertyIdValue))
      .filter(Boolean);
    const properties = propertyObjectIds.length
      ? await Property.find(
          { _id: { $in: propertyObjectIds } },
          "title streetAddress city state"
        ).lean()
      : [];

    // Create a map of propertyId -> property data for quick lookup
    const propertyMap = {};
    properties.forEach((property) => {
      propertyMap[String(property._id)] = {
        id: String(property._id),
        title: property.title,
        streetAddress: property.streetAddress,
        city: property.city,
        state: property.state,
      };
    });

    // Add property info to each offer
    const offersWithPropertyData = offers.map((offer) => ({
      ...offer,
      id: String(offer._id),
      buyer: offer.buyerId
        ? {
            id: String(offer.buyerId._id),
            firstName: offer.buyerId.firstName,
            lastName: offer.buyerId.lastName,
            email: offer.buyerId.email,
            phone: offer.buyerId.phone,
            buyerType: offer.buyerId.buyerType,
          }
        : null,
      buyerId: offer.buyerId ? String(offer.buyerId._id) : String(offer.buyerId),
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
    log.error(
      `[offerController:getAllOffers] > [Error]: ${err?.message || err}`
    );
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
    await connectMongo();
    const offers = await Offer.find({})
      .populate({
        path: "buyerId",
        select: "firstName lastName email",
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Extract activities from offer history and add context
    let allActivities = [];

    // Get property information for context
    const propertyIds = [...new Set(offers.map((offer) => offer.propertyId))];
    const propertyObjectIds = propertyIds
      .map((propertyIdValue) => toObjectId(propertyIdValue))
      .filter(Boolean);
    const properties = propertyObjectIds.length
      ? await Property.find(
          { _id: { $in: propertyObjectIds } },
          "title streetAddress city state"
        ).lean()
      : [];

    // Create a map of propertyId -> property data for quick lookup
    const propertyMap = {};
    properties.forEach((property) => {
      propertyMap[String(property._id)] = {
        id: String(property._id),
        title: property.title,
        streetAddress: property.streetAddress,
        city: property.city,
        state: property.state,
      };
    });

    // Process each offer to extract history
    offers.forEach((offer) => {
      // Get property details
      const property = propertyMap[offer.propertyId] || {
        title: "Unknown Property",
        streetAddress: "Unknown Address",
      };
      const buyer = offer.buyerId || {};

      // Add the initial offer as an activity if it has no history
      if (!offer.offerHistory || offer.offerHistory.length === 0) {
        allActivities.push({
          offerId: String(offer._id),
          propertyId: offer.propertyId,
          propertyAddress: property.streetAddress,
          propertyTitle: property.title,
          buyerId: buyer?._id ? String(buyer._id) : String(offer.buyerId),
          buyerName: `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim(),
          buyerFirstName: buyer.firstName,
          buyerLastName: buyer.lastName,
          timestamp: offer.timestamp,
          newStatus: offer.offerStatus,
          newPrice: offer.offeredPrice,
          buyerMessage: offer.buyerMessage,
          sysMessage: offer.sysMessage,
        });
      }
      // Extract activities from history
      else if (Array.isArray(offer.offerHistory)) {
        const activities = offer.offerHistory.map((history) => ({
          offerId: String(offer._id),
          propertyId: offer.propertyId,
          propertyAddress: property.streetAddress,
          propertyTitle: property.title,
          buyerId: buyer?._id ? String(buyer._id) : String(offer.buyerId),
          buyerName: `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim(),
          buyerFirstName: buyer.firstName,
          buyerLastName: buyer.lastName,
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
    log.error(
      `[offerController:getRecentOfferActivity] > [Error]: ${err?.message || err}`
    );
    res.status(500).json({
      message: "An error occurred while fetching recent offer activity.",
      error: err.message,
    });
  }
});

/**
 * Get a single offer by ID
 * @route GET /api/offer/:id
 * @access Private
 */
export const getOfferById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Offer ID is required" });
  }

  try {
    await connectMongo();
    const offerObjectId = toObjectId(id);
    if (!offerObjectId) {
      return res.status(400).json({ message: "Invalid offer ID" });
    }
    const offer = await Offer.findById(offerObjectId)
      .populate({
        path: "buyerId",
        select: "firstName lastName email phone buyerType",
      })
      .lean();

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Fetch property details separately
    let property = null;
    try {
      const propertyObjectId = toObjectId(offer.propertyId);
      property = propertyObjectId
        ? await Property.findById(
            propertyObjectId,
            "title streetAddress city state askingPrice minPrice"
          ).lean()
        : null;
    } catch (propertyError) {
      log.warn(
        `[offerController:getOfferById] > [Response]: property lookup failed: ${propertyError?.message || propertyError}`
      );
    }

    res.status(200).json({
      offer: {
        ...offer,
        id: String(offer._id),
        buyer: offer.buyerId
          ? {
              id: String(offer.buyerId._id),
              firstName: offer.buyerId.firstName,
              lastName: offer.buyerId.lastName,
              email: offer.buyerId.email,
              phone: offer.buyerId.phone,
              buyerType: offer.buyerId.buyerType,
            }
          : null,
        buyerId: offer.buyerId ? String(offer.buyerId._id) : String(offer.buyerId),
        property: property
          ? {
              id: String(property._id),
              title: property.title,
              streetAddress: property.streetAddress,
              city: property.city,
              state: property.state,
              askingPrice: property.askingPrice,
              minPrice: property.minPrice,
            }
          : null,
      },
    });
  } catch (err) {
    log.error(
      `[offerController:getOfferById] > [Error]: ${err?.message || err}`
    );
    res.status(500).json({
      message: "An error occurred while fetching the offer",
      error: err.message,
    });
  }
});
