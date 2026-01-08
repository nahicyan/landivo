// server/services/qualification/financeQualificationEmailListService.js
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

/**
 * Handles finance qualification email list management
 * Creates or finds list with format: "{Source} {Area} {BuyerType}"
 */
export const handleFinanceQualificationEmailList = async (buyer, property, financeSource = "Finance Qualification") => {
  try {
    await connectMongo();
    // Extract area from property (using area as primary area identifier)
    const area = property.area || "Unknown Area";
    
    // Extract buyer type
    const buyerType = buyer.buyerType || "Unknown Type";
    
    // Construct list name: "{Source} {Area} {BuyerType}"
    const listName = `${financeSource} ${area} ${buyerType}`;
    
    // Check if list already exists with matching source, area, and buyer type
    let emailList = await EmailList.findOne({
      name: listName,
      source: financeSource,
    });
    
    // If list doesn't exist, create it
    if (!emailList) {
      emailList = await createFinanceQualificationEmailList(listName, area, buyerType, financeSource);
      console.log(`Created new finance qualification email list: ${listName}`);
    }
    
    // Check if buyer is already in the list
    const buyerObjectId = mongoose.Types.ObjectId.isValid(buyer.id)
      ? new mongoose.Types.ObjectId(buyer.id)
      : buyer._id;
    const existingMembership = await BuyerEmailList.findOne({
      buyerId: buyerObjectId,
      emailListId: emailList._id,
    }).lean();
    
    // Add buyer to list if not already a member
    if (!existingMembership) {
      await BuyerEmailList.create({
        buyerId: buyerObjectId,
        emailListId: emailList._id,
      });
      console.log(`Added buyer ${buyer.id} to finance qualification list: ${listName}`);
    }
    
    return {
      success: true,
      listName,
      listId: String(emailList._id),
      buyerAdded: !existingMembership
    };
    
  } catch (error) {
    console.error("Error handling finance qualification email list:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a new email list for finance qualification segmentation
 */
const createFinanceQualificationEmailList = async (listName, area, buyerType, source) => {
  const criteria = {
    areas: normalizeCriteriaListValue(area),
    buyerTypes: normalizeCriteriaListValue(buyerType),
    description: `Buyers who completed finance qualification for ${buyerType} properties in ${area}`
  };
  
  return await EmailList.create({
    name: listName,
    description: `Auto-generated list for ${buyerType} buyers completing finance qualification in ${area}`,
    source: source,
    criteria: criteria,
    isDefault: false,
  });
};

/**
 * Get all finance qualification email lists
 */
export const getFinanceQualificationEmailLists = async (financeSource = "Finance Qualification") => {
  try {
    await connectMongo();
    const lists = await EmailList.find({ source: financeSource })
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
    console.error("Error fetching finance qualification email lists:", error);
    throw error;
  }
};
