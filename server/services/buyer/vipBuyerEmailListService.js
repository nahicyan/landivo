// server/services/buyer/vipBuyerEmailListService.js
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
 * Handles VIP buyer registration list management
 * Creates or finds list with format: "{Source} {Area} {BuyerType}"
 */
export const handleVipBuyerEmailList = async (buyer, source = "VIP", area, buyerType) => {
  try {
    await connectMongo();
    // Use provided area and buyerType
    const listArea = area;
    const listBuyerType = buyerType;
    
    // Construct list name: "{Source} {Area} {BuyerType}"
    const listName = `${source} ${listArea} ${listBuyerType}`;
    
    // Check if list already exists with matching source, area, and buyer type
    let emailList = await EmailList.findOne({
      name: listName,
      source: source,
    });
    
    // If list doesn't exist, create it
    if (!emailList) {
      emailList = await createVipEmailList(listName, listArea, listBuyerType, source);
      console.log(`Created new VIP email list: ${listName}`);
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
      console.log(`Added VIP buyer ${buyer.id} to list: ${listName}`);
    }
    
    return {
      success: true,
      listName,
      listId: String(emailList._id),
      buyerAdded: !existingMembership
    };
    
  } catch (error) {
    console.error("Error handling VIP buyer email list:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Creates a new email list for VIP buyer segmentation
 */
const createVipEmailList = async (listName, area, buyerType, source) => {
  const criteria = {
    areas: normalizeCriteriaListValue(area),
    buyerTypes: normalizeCriteriaListValue(buyerType),
    isVIP: true,
    description: `VIP ${buyerType} buyers in ${area}`
  };
  
  return await EmailList.create({
    name: listName,
    description: `Auto-generated VIP list for ${buyerType} buyers in ${area}`,
    source: source,
    criteria: criteria,
    isDefault: false,
  });
};
