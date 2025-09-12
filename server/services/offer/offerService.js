// server/services/offer/offerService.js
import { prisma } from "../../config/prismaConfig.js";

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
  const { email, phone, buyerType, firstName, lastName, auth0Id } = buyerData;
  
  let buyer = null;
  let buyerFoundMethod = 'none';
  
  // First try to find buyer by Auth0 ID if provided
  if (auth0Id) {
    console.log(`Attempting to find buyer by Auth0 ID: ${auth0Id}`);
    buyer = await prisma.buyer.findFirst({
      where: { auth0Id }
    });
    
    // If found by Auth0 ID, return early
    if (buyer) {
      buyerFoundMethod = 'auth0Id';
      console.log(`Buyer found by Auth0 ID: ${auth0Id}, buyerId: ${buyer.id}`);
      return buyer;
    }
  }
  
  // If not found by Auth0 ID, try email or phone
  console.log(`Attempting to find buyer by email: ${email} or phone: ${phone}`);
  buyer = await prisma.buyer.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { phone }],
    },
  });

  if (buyer) {
    buyerFoundMethod = buyer.email.toLowerCase() === email.toLowerCase() ? 'email' : 'phone';
    console.log(`Buyer found by ${buyerFoundMethod}: buyerId: ${buyer.id}`);
    
    // If buyer found by email/phone but doesn't have Auth0 ID, update with Auth0 ID
    if (auth0Id && !buyer.auth0Id) {
      console.log(`Updating existing buyer (${buyer.id}) with Auth0 ID: ${auth0Id}`);
      buyer = await prisma.buyer.update({
        where: { id: buyer.id },
        data: { auth0Id }
      });
    }
  } else {
    // Create a new buyer if not found
    console.log(`No existing buyer found. Creating new buyer with email: ${email}, phone: ${phone}${auth0Id ? `, auth0Id: ${auth0Id}` : ''}`);
    buyer = await prisma.buyer.create({
      data: {
        email: email.toLowerCase(),
        phone,
        buyerType,
        firstName,
        lastName,
        source: "Property Offer",
        auth0Id: auth0Id || null // Store Auth0 ID if provided
      },
    });
    buyerFoundMethod = 'created';
    console.log(`New buyer created with ID: ${buyer.id}`);
  }
  
  return buyer;
};

/**
 * Check if an offer already exists and if it can be updated
 */
export const checkExistingOffer = async (buyerId, propertyId, newOfferedPrice) => {
  const existingOffer = await prisma.offer.findFirst({
    where: {
      buyerId,
      propertyId,
    },
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
  const existingOffer = await prisma.offer.findUnique({
    where: { id: offerId }
  });
  
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
    sysMessage: existingOffer.sysMessage, 
    updatedById: userId,
    updatedByName: userName || "Buyer"
  };
  
  // Get existing history or initialize empty array
  const existingHistory = existingOffer.offerHistory || [];
  
  // Update the offer with new price and add to history
  return await prisma.offer.update({
    where: { id: offerId },
    data: {
      offeredPrice: parseFloat(offeredPrice),
      offerStatus: "PENDING", // Reset to pending with new offer
      buyerMessage: buyerMessage || null, // Set to null if not provided
      // sysMessage: null, // Don't Always clear system message
      offerHistory: [...existingHistory, historyEntry],
      timestamp: new Date(),
      updatedById: userId
    },
  });
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
  
  return await prisma.offer.create({
    data: {
      propertyId,
      offeredPrice: parseFloat(offeredPrice),
      buyerId,
      offerStatus: "PENDING",
      buyerMessage: buyerMessage || null, // Set to null if not provided
      sysMessage: null, // Always clear system message
      offerHistory: initialHistory,
      timestamp: new Date(),
      createdById: userId
    },
  });
};

/**
 * Check if offer is below the property's minimum price
 */
export const checkOfferBelowMinimum = (offeredPrice, property) => {
  return parseFloat(offeredPrice) < parseFloat(property.minPrice);
};