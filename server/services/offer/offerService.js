// server/services/offer/offerService.js
import mongoose from "../../config/mongoose.js";
import { connectMongo } from "../../config/mongoose.js";
import { Buyer, Offer } from "../../models/index.js";
import { getLogger } from "../../utils/logger.js";

const normalizeValue = (value) => String(value || "").trim();

const normalizeList = (value) => {
  const collected = [];
  const collect = (entry) => {
    if (Array.isArray(entry)) {
      entry.forEach(collect);
      return;
    }
    if (entry === null || entry === undefined) return;
    const trimmed = normalizeValue(entry);
    if (trimmed) {
      collected.push(trimmed);
    }
  };

  collect(value);
  return collected;
};

const mergeUnique = (existing, incoming) => {
  const merged = new Set([...normalizeList(existing), ...normalizeList(incoming)]);
  return Array.from(merged);
};

const needsMerge = (existing, incoming) => {
  const existingList = normalizeList(existing);
  const mergedList = mergeUnique(existingList, incoming);
  return mergedList.length !== existingList.length;
};

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const log = getLogger("offerService");

/**
 * Validates offer input from request
 */
export const validateOfferInput = (req) => {
  const { email, phone, propertyId, offeredPrice, firstName, lastName } = req.body;
  
  if (!email || !phone || !propertyId || !offeredPrice || !firstName || !lastName) {
    return {
      isValid: false,
      message: "First Name, Last Name, Email, phone, property ID, and offered price are required."
    };
  }
  
  return { isValid: true };
};

/**
 * Find existing buyer or create a new one
 */
export const findOrCreateBuyer = async (buyerData) => {
  const { email, phone, buyerType, firstName, lastName, auth0Id, preferredArea, preferredCity, preferredCounty } = buyerData;
  const normalizedPreferredArea = preferredArea ? String(preferredArea).trim() : "";
  
  let buyer = null;
  let buyerFoundMethod = 'none';

  const applyPreferenceUpdates = async (existingBuyer) => {
    const updateData = {};
    const nextAreas = normalizedPreferredArea ? [normalizedPreferredArea] : [];

    if (nextAreas.length && needsMerge(existingBuyer.preferredAreas, nextAreas)) {
      updateData.preferredAreas = mergeUnique(existingBuyer.preferredAreas, nextAreas);
    }

    if (preferredCity && needsMerge(existingBuyer.preferredCity, preferredCity)) {
      updateData.preferredCity = mergeUnique(existingBuyer.preferredCity, preferredCity);
    }

    if (preferredCounty && needsMerge(existingBuyer.preferredCounty, preferredCounty)) {
      updateData.preferredCounty = mergeUnique(existingBuyer.preferredCounty, preferredCounty);
    }

    if (auth0Id && !existingBuyer.auth0Id) {
      updateData.auth0Id = auth0Id;
    }

    if (Object.keys(updateData).length === 0) {
      return existingBuyer;
    }

    return await Buyer.findByIdAndUpdate(existingBuyer._id, updateData, { new: true });
  };
  
  // First try to find buyer by Auth0 ID if provided
  if (auth0Id) {
    log.info(
      `[offerService:findOrCreateBuyer] > [Request]: auth0Id=${auth0Id}`
    );
    await connectMongo();
    buyer = await Buyer.findOne({ auth0Id });
    
    // If found by Auth0 ID, return early
    if (buyer) {
      buyerFoundMethod = 'auth0Id';
      log.info(
        `[offerService:findOrCreateBuyer] > [Response]: Found by auth0Id, buyerId=${buyer.id}`
      );
      return await applyPreferenceUpdates(buyer);
    }
  }
  
  // If not found by Auth0 ID, try email or phone
  log.info(
    `[offerService:findOrCreateBuyer] > [Request]: email=${email.toLowerCase()}, phone=${phone}`
  );
  await connectMongo();
  buyer = await Buyer.findOne({
    $or: [{ email: email.toLowerCase() }, { phone }],
  });

  if (buyer) {
    buyerFoundMethod = buyer.email.toLowerCase() === email.toLowerCase() ? 'email' : 'phone';
    log.info(
      `[offerService:findOrCreateBuyer] > [Response]: Found by ${buyerFoundMethod}, buyerId=${buyer.id}`
    );
    buyer = await applyPreferenceUpdates(buyer);
  } else {
    // Create a new buyer if not found
    log.info(
      `[offerService:findOrCreateBuyer] > [Response]: Creating buyer email=${email.toLowerCase()}, phone=${phone}${auth0Id ? `, auth0Id=${auth0Id}` : ''}`
    );
    buyer = await Buyer.create({
      email: email.toLowerCase(),
      phone,
      buyerType,
      firstName,
      lastName,
      source: "Property Offer",
      preferredAreas: normalizedPreferredArea ? [normalizedPreferredArea] : [],
      preferredCity: mergeUnique([], preferredCity),
      preferredCounty: mergeUnique([], preferredCounty),
      auth0Id: auth0Id || null,
    });
    buyerFoundMethod = 'created';
    log.info(
      `[offerService:findOrCreateBuyer] > [Response]: Created buyerId=${buyer.id}`
    );
  }
  
  return buyer;
};

/**
 * Check if an offer already exists and if it can be updated
 */
export const checkExistingOffer = async (buyerId, propertyId, newOfferedPrice) => {
  await connectMongo();
  const buyerObjectId = toObjectId(buyerId) || buyerId;
  const existingOffer = await Offer.findOne({
    buyerId: buyerObjectId,
    propertyId,
  });
  
  if (existingOffer) {
    const currentOfferPrice = parseFloat(existingOffer.offeredPrice);
    const newOfferPrice = parseFloat(newOfferedPrice);
    
    if (newOfferPrice > currentOfferPrice) {
      // Higher offer - allow update
      return {
        exists: true,
        canUpdate: true,
        offer: existingOffer
      };
    } else {
      // Same or lower offer - reject
      return {
        exists: true,
        canUpdate: false,
        offer: existingOffer
      };
    }
  }
  
  return { exists: false };
};

/**
 * Update an existing offer with a new price and add to offer history
 */
export const updateExistingOffer = async (offerId, offeredPrice, buyerMessage = null, userId = null, userName = null) => {
  // First get the existing offer to get previous status and prices
  await connectMongo();
  const offerObjectId = toObjectId(offerId);
  const existingOffer = offerObjectId
    ? await Offer.findById(offerObjectId)
    : null;
  
  if (!existingOffer) {
    throw new Error(`Offer with ID ${offerId} not found`);
  }
  
  // Create a history entry for this update
  const historyEntry = {
    timestamp: new Date(),
    previousStatus: existingOffer.offerStatus,
    newStatus: "PENDING", // Reset to pending when buyer increases offer
    previousPrice: existingOffer.offeredPrice,
    newPrice: parseFloat(offeredPrice),
    buyerMessage: buyerMessage || null, // Set to null if not provided
    updatedById: userId,
    updatedByName: userName || "Buyer"
  };
  
  // Get existing history or initialize empty array
  const existingHistory = existingOffer.offerHistory || [];
  
  // Update the offer with new price and add to history
  return await Offer.findByIdAndUpdate(
    offerObjectId,
    {
      offeredPrice: parseFloat(offeredPrice),
      offerStatus: "PENDING",
      buyerMessage: buyerMessage || null,
      offerHistory: [...existingHistory, historyEntry],
      timestamp: new Date(),
      updatedById: userId || null,
    },
    { new: true }
  );
};

/**
 * Create a new offer with initial history entry
 */
export const createNewOffer = async (propertyId, offeredPrice, buyerId, buyerMessage = null, userId = null, userName = null) => {
  // Create initial history entry for the new offer
  const initialHistory = [{
    timestamp: new Date(),
    newStatus: "PENDING",
    newPrice: parseFloat(offeredPrice),
    buyerMessage: buyerMessage || null, // Set to null if not provided
    sysMessage: null, // Always clear system message
    createdById: userId,
    createdByName: userName || "Buyer"
  }];
  
  await connectMongo();
  const buyerObjectId = toObjectId(buyerId) || buyerId;
  return await Offer.create({
    propertyId,
    offeredPrice: parseFloat(offeredPrice),
    buyerId: buyerObjectId,
    offerStatus: "PENDING",
    buyerMessage: buyerMessage || null,
    sysMessage: null,
    offerHistory: initialHistory,
    timestamp: new Date(),
    createdById: userId || null,
  });
};

/**
 * Check if offer is below the property's minimum price
 */
export const checkOfferBelowMinimum = (offeredPrice, property) => {
  return parseFloat(offeredPrice) < parseFloat(property.minPrice);
};
