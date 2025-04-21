import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import {
  sendOfferNotification,
  newOfferTemplate,
  updatedOfferTemplate,
  lowOfferTemplate,
} from "../utils/offerNotification.js";

/**
 * Validates offer input from request
 */
const validateOfferInput = (req) => {
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
const findOrCreateBuyer = async (buyerData) => {
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
const checkExistingOffer = async (buyerId, propertyId, newOfferedPrice) => {
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
 * Update an existing offer with a new price
 */
const updateExistingOffer = async (offerId, offeredPrice) => {
  return await prisma.offer.update({
    where: { id: offerId },
    data: {
      offeredPrice,
      timestamp: new Date(),
    },
  });
};

/**
 * Create a new offer
 */
const createNewOffer = async (propertyId, offeredPrice, buyerId) => {
  return await prisma.offer.create({
    data: {
      propertyId,
      offeredPrice,
      buyerId,
      timestamp: new Date(),
    },
  });
};

/**
 * Check if offer is below the property's minimum price
 */
const checkOfferBelowMinimum = (offeredPrice, property) => {
  return parseFloat(offeredPrice) < parseFloat(property.minPrice);
};

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

    const { email, phone, buyerType, propertyId, offeredPrice, firstName, lastName, auth0Id } = req.body;

    console.log(`Received offer: propertyId: ${propertyId}, price: ${offeredPrice}, email: ${email}, auth0Id: ${auth0Id || 'not provided'}`);

    // 2. Find or create buyer
    const buyer = await findOrCreateBuyer({ 
      email, 
      phone, 
      buyerType, 
      firstName, 
      lastName,
      auth0Id  // Pass Auth0 ID if provided in request body
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
        // Update the existing offer with the higher price
        const updatedOffer = await updateExistingOffer(existingOfferCheck.offer.id, offeredPrice);

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

    // 5. Create a new offer
    const newOffer = await createNewOffer(propertyId, offeredPrice, buyer.id);

    // 6. Check if the offer is below the minimum price
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

    // 7. Send response for successful offer submission
    res.status(201).json({
      message: "Offer created successfully.",
      offer: newOffer,
    });

    // 8. Send new offer notification in the background
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