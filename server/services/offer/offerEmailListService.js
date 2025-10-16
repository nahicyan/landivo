// File location: server/services/offer/offerEmailListService.js
import { prisma } from "../../config/prismaConfig.js";

/**
 * Manages automatic email list creation and buyer addition upon offer submission
 * Creates or finds list with format: "{Source} {Area} {BuyerType}"
 */

/**
 * Handles email list management after offer submission
 * @param {Object} buyer - Buyer object with id, buyerType, source
 * @param {Object} property - Property object with area, city, county information  
 * @param {String} offerSource - Source of the offer (e.g., "Offer", "Website")
 */
export const handleOfferEmailList = async (buyer, property, offerSource = "Offer") => {
  try {
    // Extract property location data
    const propertyArea = property.area || "Unknown Area"; // This is the main area field
    const propertyCity = property.city || "Unknown City";
    const propertyCounty = property.county || "Unknown County";
    
    // Extract buyer type
    const buyerType = buyer.buyerType || "Unknown Type";
    
    // Construct list name: "{Source} {Area} {BuyerType}"
    // Using property.area for the list name (this is the designated area field)
    const listName = `${offerSource} ${propertyArea} ${buyerType}`;
    
    console.log(`Processing offer email list:`, {
      listName,
      propertyArea,
      propertyCity,
      propertyCounty,
      buyerType
    });
    
    // Check if list already exists with the same criteria
    let emailList = await prisma.emailList.findFirst({
      where: { 
        name: listName,
        source: offerSource
      }
    });
    
    // If list doesn't exist, create it with proper criteria
    if (!emailList) {
      emailList = await createOfferEmailList(
        listName, 
        propertyArea, 
        propertyCity, 
        propertyCounty, 
        buyerType, 
        offerSource
      );
      console.log(`Created new email list: ${listName} with criteria:`, {
        area: propertyArea,
        city: propertyCity,
        county: propertyCounty,
        buyerType
      });
    } else {
      // Update existing list criteria to ensure it has the latest structure
      await updateEmailListCriteria(emailList.id, propertyArea, propertyCity, propertyCounty, buyerType);
      console.log(`Updated existing email list criteria: ${listName}`);
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
    } else {
      console.log(`Buyer ${buyer.id} already in list: ${listName}`);
    }
    
    return {
      success: true,
      listName,
      listId: emailList.id,
      buyerAdded: !existingMembership,
      criteria: {
        area: propertyArea,
        city: propertyCity,
        county: propertyCounty,
        buyerType
      }
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
 * @param {String} area - Geographic area from property.area
 * @param {String} city - City from property.city
 * @param {String} county - County from property.county
 * @param {String} buyerType - Type of buyer
 * @param {String} source - Source of the list
 */
const createOfferEmailList = async (listName, area, city, county, buyerType, source) => {
  // Create criteria that includes area, city, county, and buyer type
  const criteria = {
    areas: [area], // Property.area - the main area designation
    city: city, // Property.city - specific city
    county: county, // Property.county - county information
    buyerTypes: [buyerType], // Buyer type
    isVIP: false,
    description: `Automatically created for ${buyerType} buyers who made offers on properties in ${area} (${city}, ${county})`
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
 * Updates an existing email list's criteria to include city and county
 * @param {String} emailListId - ID of the email list
 * @param {String} area - Geographic area
 * @param {String} city - City
 * @param {String} county - County
 * @param {String} buyerType - Type of buyer
 */
const updateEmailListCriteria = async (emailListId, area, city, county, buyerType) => {
  try {
    const existingList = await prisma.emailList.findUnique({
      where: { id: emailListId }
    });
    
    if (!existingList) return;
    
    // Get existing criteria or create new
    const currentCriteria = existingList.criteria || {};
    
    // Update criteria with new structure
    const updatedCriteria = {
      ...currentCriteria,
      areas: currentCriteria.areas || [area],
      city: city,
      county: county,
      buyerTypes: currentCriteria.buyerTypes || [buyerType],
      isVIP: currentCriteria.isVIP || false,
      description: currentCriteria.description || 
        `Automatically created for ${buyerType} buyers who made offers on properties in ${area} (${city}, ${county})`
    };
    
    await prisma.emailList.update({
      where: { id: emailListId },
      data: {
        criteria: updatedCriteria
      }
    });
    
    console.log(`Updated criteria for list ${emailListId}:`, updatedCriteria);
  } catch (error) {
    console.error("Error updating email list criteria:", error);
    throw error;
  }
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