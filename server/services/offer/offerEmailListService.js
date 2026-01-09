// File location: server/services/offer/offerEmailListService.js
import mongoose from "../../config/mongoose.js";
import { connectMongo } from "../../config/mongoose.js";
import { BuyerEmailList, EmailList } from "../../models/index.js";

const normalizeCriteriaListValue = (value) => {
  const collected = [];
  const collect = (entry) => {
    if (Array.isArray(entry)) {
      entry.forEach(collect);
      return;
    }
    if (entry === null || entry === undefined) return;
    const entryType = typeof entry;
    if (entryType !== "string" && entryType !== "number" && entryType !== "boolean") {
      return;
    }
    const trimmed = String(entry).trim();
    if (trimmed) {
      collected.push(trimmed);
    }
  };

  collect(value);

  if (collected.length === 0) return [];

  const unique = [];
  const seen = new Set();
  collected.forEach((item) => {
    if (seen.has(item)) return;
    seen.add(item);
    unique.push(item);
  });
  return unique;
};

const mergeCriteriaList = (currentValue, nextValue) => {
  const current = normalizeCriteriaListValue(currentValue);
  const next = normalizeCriteriaListValue(nextValue);
  const merged = [...current, ...next];
  return Array.from(new Set(merged));
};

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

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
    await connectMongo();
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
    let emailList = await EmailList.findOne({
      name: listName,
      source: offerSource,
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
      await updateEmailListCriteria(emailList._id, propertyArea, propertyCity, propertyCounty, buyerType);
      console.log(`Updated existing email list criteria: ${listName}`);
    }
    
    // Check if buyer is already in the list
    const buyerObjectId = toObjectId(buyer.id) || buyer._id;
    const listObjectId = emailList._id;
    const existingMembership = await BuyerEmailList.findOne({
      buyerId: buyerObjectId,
      emailListId: listObjectId,
    }).lean();
    
    // Add buyer to list if not already a member
    if (!existingMembership) {
      await BuyerEmailList.create({
        buyerId: buyerObjectId,
        emailListId: listObjectId,
      });
      console.log(`Added buyer ${buyer.id} to list: ${listName}`);
    } else {
      console.log(`Buyer ${buyer.id} already in list: ${listName}`);
    }
    
    return {
      success: true,
      listName,
      listId: String(emailList._id),
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
    areas: normalizeCriteriaListValue(area), // Property.area - the main area designation
    city: normalizeCriteriaListValue(city), // Property.city - specific city
    county: normalizeCriteriaListValue(county), // Property.county - county information
    buyerTypes: normalizeCriteriaListValue(buyerType), // Buyer type
    isVIP: false,
    description: `Automatically created for ${buyerType} buyers who made offers on properties in ${area} (${city}, ${county})`
  };
  
  return await EmailList.create({
    name: listName,
    description: `Auto-generated list for ${buyerType} buyers making offers in ${area}`,
    source: source,
    criteria: criteria,
    isDefault: false,
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
    const listObjectId = toObjectId(emailListId) || emailListId;
    const existingList = await EmailList.findById(listObjectId).lean();
    
    if (!existingList) return;
    
    // Get existing criteria or create new
    const currentCriteria = existingList.criteria || {};
    
    // Update criteria with new structure
    const updatedCriteria = {
      ...currentCriteria,
      areas: mergeCriteriaList(currentCriteria.areas, area),
      city: mergeCriteriaList(currentCriteria.city, city),
      county: mergeCriteriaList(currentCriteria.county, county),
      buyerTypes: mergeCriteriaList(currentCriteria.buyerTypes, buyerType),
      isVIP: currentCriteria.isVIP || false,
      description: currentCriteria.description || 
        `Automatically created for ${buyerType} buyers who made offers on properties in ${area} (${city}, ${county})`
    };
    
    await EmailList.updateOne(
      { _id: listObjectId },
      { $set: { criteria: updatedCriteria } }
    );
    
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
    await connectMongo();
    const lists = await EmailList.find({ source: offerSource })
      .sort({ createdAt: -1 })
      .lean();

    const listIds = lists.map((list) => list._id);
    const memberships = listIds.length
      ? await BuyerEmailList.find({ emailListId: { $in: listIds } })
          .populate({ path: "buyerId", select: "firstName lastName email buyerType" })
          .lean()
      : [];
    const membershipMap = new Map();
    memberships.forEach((membership) => {
      const listId = String(membership.emailListId);
      const buyer = membership.buyerId;
      const entry = {
        id: String(membership._id),
        buyerId: buyer ? String(buyer._id) : String(membership.buyerId),
        emailListId: listId,
        buyer: buyer
          ? {
              id: String(buyer._id),
              firstName: buyer.firstName,
              lastName: buyer.lastName,
              email: buyer.email,
              buyerType: buyer.buyerType,
            }
          : null,
      };
      if (!membershipMap.has(listId)) {
        membershipMap.set(listId, []);
      }
      membershipMap.get(listId).push(entry);
    });

    return lists.map((list) => ({
      ...list,
      id: String(list._id),
      buyerMemberships: membershipMap.get(String(list._id)) || [],
    }));
  } catch (error) {
    console.error("Error fetching offer email lists:", error);
    throw error;
  }
};
