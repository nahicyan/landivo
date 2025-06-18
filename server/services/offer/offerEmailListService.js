// server/services/offer/offerEmailListService.js
import { prisma } from "../../config/prismaConfig.js";

/**
 * Manages automatic email list creation and buyer addition upon offer submission
 * Creates or finds list with format: "{Source} {Area} {BuyerType}"
 */

/**
 * Handles email list management after offer submission
 * @param {Object} buyer - Buyer object with id, buyerType, source
 * @param {Object} property - Property object with city, area information  
 * @param {String} offerSource - Source of the offer (e.g., "Offer", "Website")
 */
export const handleOfferEmailList = async (buyer, property, offerSource = "Offer") => {
  try {
    // Extract area from property (using city as primary area identifier)
    const area = property.city || "Unknown Area";
    
    // Extract buyer type
    const buyerType = buyer.buyerType || "Unknown Type";
    
    // Construct list name: "{Source} {Area} {BuyerType}"
    const listName = `${offerSource} ${area} ${buyerType}`;
    
    // Check if list already exists
    let emailList = await prisma.emailList.findFirst({
      where: { 
        name: listName,
        source: offerSource
      }
    });
    
    // If list doesn't exist, create it
    if (!emailList) {
      emailList = await createOfferEmailList(listName, area, buyerType, offerSource);
      console.log(`Created new email list: ${listName}`);
    }
    
    // Check if buyer is already in the list
    const existingMembership = await prisma.buyerEmailList.findFirst({
      where: {
        buyerId: buyer.id,
        emailListId: emailList.id
      }
    });
    
    // Add buyer to list if not already a member
    if (!existingMembership) {
      await prisma.buyerEmailList.create({
        data: {
          buyerId: buyer.id,
          emailListId: emailList.id
        }
      });
      console.log(`Added buyer ${buyer.id} to list: ${listName}`);
    }
    
    return {
      success: true,
      listName,
      listId: emailList.id,
      buyerAdded: !existingMembership
    };
    
  } catch (error) {
    console.error("Error handling offer email list:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a new email list for offer-based segmentation
 * @param {String} listName - Name of the list to create
 * @param {String} area - Geographic area
 * @param {String} buyerType - Type of buyer
 * @param {String} source - Source of the list
 */
const createOfferEmailList = async (listName, area, buyerType, source) => {
  // Create criteria that matches buyers in this area and type
  const criteria = {
    areas: [area],
    buyerTypes: [buyerType],
    description: `Automatically created list for ${buyerType} buyers who made offers in ${area}`
  };
  
  return await prisma.emailList.create({
    data: {
      name: listName,
      description: `Auto-generated list for ${buyerType} buyers making offers in ${area}`,
      source: source,
      criteria: criteria,
      isDefault: false
    }
  });
};

/**
 * Get all offer-based email lists
 * @param {String} offerSource - Filter by offer source (optional)
 */
export const getOfferEmailLists = async (offerSource = "Offer") => {
  try {
    const lists = await prisma.emailList.findMany({
      where: {
        source: offerSource
      },
      include: {
        buyerMemberships: {
          include: {
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                buyerType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return lists;
  } catch (error) {
    console.error("Error fetching offer email lists:", error);
    throw error;
  }
};