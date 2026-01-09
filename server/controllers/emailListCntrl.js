// File location: server/controllers/emailListCntrl.js

import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { Buyer, BuyerActivity, BuyerEmailList, EmailList, Offer } from "../models/index.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("emailListCntrl");

let buyerPreferenceNormalizationCompleted = false;
let emailListLegacyNormalizationCompleted = false;
const runMongoCommand = async (command) => {
  await connectMongo();
  return mongoose.connection.db.command(command);
};

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};
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

const normalizeEmailListCriteria = (criteria) => {
  if (!criteria || typeof criteria !== "object") return criteria;

  const nextCriteria = { ...criteria };

  if (Object.prototype.hasOwnProperty.call(criteria, "areas")) {
    nextCriteria.areas = normalizeCriteriaListValue(criteria.areas);
  }

  if (Object.prototype.hasOwnProperty.call(criteria, "city")) {
    nextCriteria.city = normalizeCriteriaListValue(criteria.city);
  }

  if (Object.prototype.hasOwnProperty.call(criteria, "county")) {
    nextCriteria.county = normalizeCriteriaListValue(criteria.county);
  }

  if (Object.prototype.hasOwnProperty.call(criteria, "buyerTypes")) {
    nextCriteria.buyerTypes = normalizeCriteriaListValue(criteria.buyerTypes);
  }

  return nextCriteria;
};

async function normalizeBuyerPreferenceFields() {
  try {
    await runMongoCommand({
      update: "Buyer",
      updates: [
        {
          q: { preferredCity: { $type: "string" } },
          u: [
            {
              $set: {
                preferredCity: {
                  $cond: [
                    { $eq: ["$preferredCity", ""] },
                    [],
                    ["$preferredCity"],
                  ],
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runMongoCommand({
      update: "Buyer",
      updates: [
        {
          q: { preferredCounty: { $type: "string" } },
          u: [
            {
              $set: {
                preferredCounty: {
                  $cond: [
                    { $eq: ["$preferredCounty", ""] },
                    [],
                    ["$preferredCounty"],
                  ],
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runMongoCommand({
      update: "Buyer",
      updates: [
        {
          q: { preferredAreas: { $elemMatch: { $type: "array" } } },
          u: [
            {
              $set: {
                preferredAreas: {
                  $let: {
                    vars: { input: { $ifNull: ["$preferredAreas", []] } },
                    in: {
                      $reduce: {
                        input: "$$input",
                        initialValue: [],
                        in: {
                          $concatArrays: [
                            "$$value",
                            {
                              $cond: [
                                { $isArray: "$$this" },
                                "$$this",
                                ["$$this"],
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runMongoCommand({
      update: "Buyer",
      updates: [
        {
          q: { preferredCity: { $elemMatch: { $type: "array" } } },
          u: [
            {
              $set: {
                preferredCity: {
                  $let: {
                    vars: { input: { $ifNull: ["$preferredCity", []] } },
                    in: {
                      $reduce: {
                        input: "$$input",
                        initialValue: [],
                        in: {
                          $concatArrays: [
                            "$$value",
                            {
                              $cond: [
                                { $isArray: "$$this" },
                                "$$this",
                                ["$$this"],
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runMongoCommand({
      update: "Buyer",
      updates: [
        {
          q: { preferredCounty: { $elemMatch: { $type: "array" } } },
          u: [
            {
              $set: {
                preferredCounty: {
                  $let: {
                    vars: { input: { $ifNull: ["$preferredCounty", []] } },
                    in: {
                      $reduce: {
                        input: "$$input",
                        initialValue: [],
                        in: {
                          $concatArrays: [
                            "$$value",
                            {
                              $cond: [
                                { $isArray: "$$this" },
                                "$$this",
                                ["$$this"],
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    return true;
  } catch (error) {
    log.error("Failed to normalize buyer preference fields:", error);
    return false;
  }
}

async function ensureBuyerPreferenceFieldsNormalized() {
  if (buyerPreferenceNormalizationCompleted) return;
  const didNormalize = await normalizeBuyerPreferenceFields();
  if (didNormalize) {
    buyerPreferenceNormalizationCompleted = true;
  }
}

async function normalizeEmailListLegacyFields() {
  try {
    await runMongoCommand({
      update: "EmailList",
      updates: [
        {
          q: { preferredCity: { $type: "array" } },
          u: { $unset: { preferredCity: "" } },
          multi: true,
        },
        {
          q: { preferredCounty: { $type: "array" } },
          u: { $unset: { preferredCounty: "" } },
          multi: true,
        },
      ],
    });
    return true;
  } catch (error) {
    log.error("Failed to normalize EmailList legacy fields:", error);
    return false;
  }
}

async function ensureEmailListLegacyFieldsNormalized() {
  if (emailListLegacyNormalizationCompleted) return;
  const didNormalize = await normalizeEmailListLegacyFields();
  if (didNormalize) {
    emailListLegacyNormalizationCompleted = true;
  }
}

// Get all email lists
export const getAllEmailLists = asyncHandler(async (req, res) => {
  try {
    log.info("[EmailListController]:[getAllEmailLists]:[Request]", {
      query: req?.query || {},
    });
    await connectMongo();
    await ensureEmailListLegacyFieldsNormalized();
    const lists = await EmailList.find({})
      .sort({ createdAt: -1 })
      .lean();
    const listIds = lists.map((list) => list._id);
    const memberships = listIds.length
      ? await BuyerEmailList.find({ emailListId: { $in: listIds } })
          .select("buyerId emailListId")
          .lean()
      : [];
    const membershipMap = new Map();
    memberships.forEach((membership) => {
      const listId = String(membership.emailListId);
      const buyerId = String(membership.buyerId);
      if (!membershipMap.has(listId)) {
        membershipMap.set(listId, new Set());
      }
      membershipMap.get(listId).add(buyerId);
    });

    // For each list, count the buyers that match its criteria and manual members
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        // Get manually added buyers through join table
        const manualBuyerIds = Array.from(
          membershipMap.get(String(list._id)) || []
        );

        // Get buyers that match criteria
        let criteriaBuyerIds = [];
        if (list.criteria) {
          const criteria = normalizeEmailListCriteria(
            JSON.parse(JSON.stringify(list.criteria))
          );

          // Check if criteria has any actual filters
          const hasAreas = Array.isArray(criteria?.areas) && criteria.areas.length > 0;
          const hasBuyerTypes =
            Array.isArray(criteria?.buyerTypes) && criteria.buyerTypes.length > 0;
          const hasCity = Array.isArray(criteria?.city)
            ? criteria.city.length > 0
            : Boolean(criteria?.city);
          const hasCounty = Array.isArray(criteria?.county)
            ? criteria.county.length > 0
            : Boolean(criteria?.county);
          const hasCriteriaFilters =
            hasAreas || hasBuyerTypes || criteria?.isVIP || hasCity || hasCounty;

          if (hasCriteriaFilters) {
            // Build the query based on criteria
            const query = {};

            // Add area filter if specified
            if (hasAreas) {
              query.preferredAreas = { $in: criteria.areas };
            }

            // Add buyer type filter if specified
            if (hasBuyerTypes) {
              query.buyerType = { $in: criteria.buyerTypes };
            }

            // Add VIP filter if specified
            if (criteria.isVIP) {
              query.source = "VIP Buyers List";
            }

            // Note: city and county are stored in criteria for list categorization
            // and reference purposes. They describe the property location that
            // triggered the list creation, but are not used for buyer filtering
            // since buyers don't have city/county fields in their profile.
            // Buyers are matched by preferredAreas and buyerType instead.

            // Get buyer IDs matching the criteria
            const criteriaBuyers = await Buyer.find(query).select("_id").lean();

            criteriaBuyerIds = criteriaBuyers.map((b) => String(b._id));
          }
        }

        // Combine and remove duplicates using Set
        const uniqueBuyerIds = new Set([...manualBuyerIds, ...criteriaBuyerIds]);
        const totalCount = uniqueBuyerIds.size;

        // Remove the buyerMemberships from the response
        const { _id, ...listData } = list;
        const normalizedCriteria = listData.criteria
          ? normalizeEmailListCriteria(listData.criteria)
          : listData.criteria;

        return {
          id: String(_id),
          ...listData,
          criteria: normalizedCriteria,
          buyerCount: totalCount,
        };
      })
    );

    log.info("[EmailListController]:[getAllEmailLists]:[Response]", {
      totalLists: listsWithCounts.length,
    });
    res.status(200).json(listsWithCounts);
  } catch (err) {
    log.error("Error fetching email lists:", err);
    res.status(500).json({
      message: "An error occurred while fetching email lists",
      error: err.message,
    });
  }
});

// Get a specific email list with its members
export const getEmailList = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  try {
    log.info("[EmailListController]:[getEmailList]:[Request]", { id });
    await connectMongo();
    await ensureEmailListLegacyFieldsNormalized();
    await ensureBuyerPreferenceFieldsNormalized();
    // Get the list with buyers through join table
    const listId = toObjectId(id);
    if (!listId) {
      return res.status(400).json({ message: "Invalid list ID" });
    }

    const list = await EmailList.findById(listId).lean();

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Extract buyers from join table
    const manualMemberships = await BuyerEmailList.find({ emailListId: listId })
      .select("buyerId")
      .lean();
    const manualBuyerIds = manualMemberships.map((membership) =>
      String(membership.buyerId)
    );

    // Get buyers matching criteria
    let criteriaBuyers = [];
    if (list.criteria) {
      const criteria = normalizeEmailListCriteria(
        JSON.parse(JSON.stringify(list.criteria))
      );

      // Check if criteria has any actual filters
      const hasAreas = Array.isArray(criteria?.areas) && criteria.areas.length > 0;
      const hasBuyerTypes =
        Array.isArray(criteria?.buyerTypes) && criteria.buyerTypes.length > 0;
      const hasCity = Array.isArray(criteria?.city)
        ? criteria.city.length > 0
        : Boolean(criteria?.city);
      const hasCounty = Array.isArray(criteria?.county)
        ? criteria.county.length > 0
        : Boolean(criteria?.county);
      const hasCriteriaFilters =
        hasAreas || hasBuyerTypes || criteria?.isVIP || hasCity || hasCounty;

      if (hasCriteriaFilters) {
        // Build the query based on criteria
        const query = {};

        // Add area filter if specified
        if (hasAreas) {
          query.preferredAreas = { $in: criteria.areas };
        }

        // Add buyer type filter if specified
        if (hasBuyerTypes) {
          query.buyerType = { $in: criteria.buyerTypes };
        }

        // Add VIP filter if specified
        if (criteria.isVIP) {
          query.source = "VIP Buyers List";
        }

        // Note: city and county in criteria are for reference/categorization only
        // They describe the property location but don't filter buyers
        // since buyers don't have these fields

        // Get buyers matching the criteria
        criteriaBuyers = await Buyer.find(query).select("_id").lean();
        log.info("[EmailListController]:[getEmailList]:[Criteria]", {
          id,
          listName: list?.name,
          query,
          criteriaBuyerCount: criteriaBuyers.length,
        });
      }
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([
      ...manualBuyerIds,
      ...criteriaBuyers.map((b) => String(b._id)),
    ]);
    log.info("[EmailListController]:[getEmailList]:[Buyers]", {
      id,
      listName: list?.name,
      manualBuyerCount: manualBuyerIds.length,
      criteriaBuyerCount: criteriaBuyers.length,
      uniqueBuyerCount: allBuyerIds.size,
    });

    const buyerObjectIds = Array.from(allBuyerIds)
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean);

    const allBuyers = buyerObjectIds.length
      ? await Buyer.find({ _id: { $in: buyerObjectIds } }).lean()
      : [];

    const buyerMemberships = buyerObjectIds.length
      ? await BuyerEmailList.find({ buyerId: { $in: buyerObjectIds } })
          .populate("emailListId")
          .lean()
      : [];
    const buyerMembershipMap = new Map();
    buyerMemberships.forEach((membership) => {
      const buyerId = String(membership.buyerId);
      if (!buyerMembershipMap.has(buyerId)) {
        buyerMembershipMap.set(buyerId, []);
      }
      if (membership.emailListId && membership.emailListId._id) {
        const { _id, ...rest } = membership.emailListId;
        buyerMembershipMap.get(buyerId).push({ id: String(_id), ...rest });
      }
    });

    // Transform buyer data to include emailLists array
    const buyersWithEmailLists = allBuyers.map((buyer) => {
      const { _id, ...buyerData } = buyer;
      return {
        id: String(_id),
        ...buyerData,
        emailLists: buyerMembershipMap.get(String(_id)) || [],
      };
    });

    // Remove buyerMemberships from response and add transformed buyers
    const { _id, ...listData } = list;
    const normalizedCriteria = listData.criteria
      ? normalizeEmailListCriteria(listData.criteria)
      : listData.criteria;

    log.info("[EmailListController]:[getEmailList]:[Response]", {
      id,
      listName: list?.name,
      buyerCount: buyersWithEmailLists.length,
    });
    res.status(200).json({
      id: String(_id),
      ...listData,
      criteria: normalizedCriteria,
      buyers: buyersWithEmailLists,
      buyerCount: buyersWithEmailLists.length,
    });
  } catch (err) {
    log.error("Error fetching email list:", err);
    res.status(500).json({
      message: "An error occurred while fetching the email list",
      error: err.message,
    });
  }
});

// Create a new email list
export const createEmailList = asyncHandler(async (req, res) => {
  const { name, description, criteria, buyerIds = [], color, source } = req.body;

  if (!name) {
    return res.status(400).json({ message: "List name is required" });
  }

  try {
    await connectMongo();
    // Ensure buyerIds is an array
    const buyerIdsArray = Array.isArray(buyerIds) ? buyerIds : [];
    const normalizedCriteria = criteria ? normalizeEmailListCriteria(criteria) : criteria;

    // Log criteria for debugging (especially useful for city/county)
    if (normalizedCriteria) {
      log.info("Creating email list with criteria:", {
        name,
        areas: normalizedCriteria.areas,
        city: normalizedCriteria.city,
        county: normalizedCriteria.county,
        buyerTypes: normalizedCriteria.buyerTypes,
        isVIP: normalizedCriteria.isVIP
      });
    }

    // Create the list with initial buyers if provided
    const newList = await EmailList.create({
      name,
      description,
      criteria: normalizedCriteria,
      color,
      source: source || "Manual",
      createdBy: toObjectId(req.userId),
    });

    const membershipDocs = buyerIdsArray
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean)
      .map((buyerId) => ({
        buyerId,
        emailListId: newList._id,
      }));

    if (membershipDocs.length > 0) {
      await BuyerEmailList.insertMany(membershipDocs, { ordered: false });
    }

    res.status(201).json({
      message: "Email list created successfully",
      list: {
        id: String(newList._id),
        ...newList.toObject(),
      },
    });
  } catch (err) {
    log.error("Error creating email list:", err);
    res.status(500).json({
      message: "An error occurred while creating the email list",
      error: err.message,
    });
  }
});

// Update a email list
export const updateEmailList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, criteria, color } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!name) {
    return res.status(400).json({ message: "List name is required" });
  }

  try {
    // Check if the list exists
    await connectMongo();
    const listId = toObjectId(id);
    if (!listId) {
      return res.status(400).json({ message: "Invalid list ID" });
    }
    const existingList = await EmailList.findById(listId).lean();

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Log criteria updates for debugging
    const normalizedCriteria = criteria ? normalizeEmailListCriteria(criteria) : criteria;

    if (normalizedCriteria) {
      log.info("Updating email list criteria:", {
        listId: id,
        name,
        areas: normalizedCriteria.areas,
        city: normalizedCriteria.city,
        county: normalizedCriteria.county,
        buyerTypes: normalizedCriteria.buyerTypes,
        isVIP: normalizedCriteria.isVIP
      });
    }

    // Update the list
    const updatedList = await EmailList.findByIdAndUpdate(
      listId,
      {
        name,
        description,
        criteria: normalizedCriteria,
        color,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    res.status(200).json({
      message: "Email list updated successfully",
      list: updatedList
        ? { id: String(updatedList._id), ...updatedList }
        : updatedList,
    });
  } catch (err) {
    log.error("Error updating email list:", err);
    res.status(500).json({
      message: "An error occurred while updating the email list",
      error: err.message,
    });
  }
});

// Delete a email list
export const deleteEmailList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deleteBuyers = false } = req.body; // New parameter

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  try {
    // Check if the list exists
    await connectMongo();
    const listId = toObjectId(id);
    if (!listId) {
      return res.status(400).json({ message: "Invalid list ID" });
    }
    const existingList = await EmailList.findById(listId).lean();

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    let deletedBuyersCount = 0;

    if (deleteBuyers) {
      // Get all buyer IDs in this list
      const buyerMemberships = await BuyerEmailList.find({
        emailListId: listId,
      })
        .select("buyerId")
        .lean();

      const buyerIds = buyerMemberships.map((m) => m.buyerId);

      if (buyerIds.length > 0) {
        // Delete offers first (foreign key constraint)
        await Offer.deleteMany({ buyerId: { $in: buyerIds } });

        // Delete buyer activities
        await BuyerActivity.deleteMany({ buyerId: { $in: buyerIds } });

        // Delete all buyer memberships for these buyers
        await BuyerEmailList.deleteMany({ buyerId: { $in: buyerIds } });

        // Delete the buyers
        const deleteResult = await Buyer.deleteMany({ _id: { $in: buyerIds } });

        deletedBuyersCount = deleteResult.deletedCount || 0;
      }
    } else {
      // Just delete the memberships for this list
      await BuyerEmailList.deleteMany({ emailListId: listId });
    }

    // Delete the list
    await EmailList.deleteOne({ _id: listId });

    res.status(200).json({
      message: deleteBuyers ? `Email list and ${deletedBuyersCount} buyers deleted successfully` : "Email list deleted successfully",
      deletedBuyersCount,
    });
  } catch (err) {
    log.error("Error deleting email list:", err);
    res.status(500).json({
      message: "An error occurred while deleting the email list",
      error: err.message,
    });
  }
});

// Add buyers to a list
export const addBuyersToList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { buyerIds } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "At least one buyer ID is required" });
  }

  try {
    // Check if the list exists
    await connectMongo();
    const listId = toObjectId(id);
    if (!listId) {
      return res.status(400).json({ message: "Invalid list ID" });
    }
    const existingList = await EmailList.findById(listId).lean();

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get existing memberships to avoid duplicates
    const buyerObjectIds = buyerIds.map((buyerId) => toObjectId(buyerId)).filter(Boolean);
    const existingMemberships = buyerObjectIds.length
      ? await BuyerEmailList.find({
          emailListId: listId,
          buyerId: { $in: buyerObjectIds },
        })
          .select("buyerId")
          .lean()
      : [];

    const existingBuyerIds = new Set(
      existingMemberships.map((membership) => String(membership.buyerId))
    );
    const newBuyerIds = buyerObjectIds.filter(
      (buyerId) => !existingBuyerIds.has(String(buyerId))
    );

    // Create new memberships for buyers not already in the list
    if (newBuyerIds.length > 0) {
      await BuyerEmailList.insertMany(
        newBuyerIds.map((buyerId) => ({
          buyerId,
          emailListId: listId,
        })),
        { ordered: false }
      );
    }

    // Update the list's updatedAt timestamp
    await EmailList.updateOne(
      { _id: listId },
      { $set: { updatedAt: new Date() } }
    );
    const updatedList = await EmailList.findById(listId).lean();

    res.status(200).json({
      message: `Successfully added ${newBuyerIds.length} new buyers to the list (${existingBuyerIds.size} were already in the list)`,
      list: updatedList
        ? { id: String(updatedList._id), ...updatedList }
        : updatedList,
      addedCount: newBuyerIds.length,
      skippedCount: existingBuyerIds.size,
    });
  } catch (err) {
    log.error("Error adding buyers to list:", err);
    res.status(500).json({
      message: "An error occurred while adding buyers to the list",
      error: err.message,
    });
  }
});

// Remove buyers from a list
export const removeBuyersFromList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { buyerIds } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "At least one buyer ID is required" });
  }

  try {
    await connectMongo();
    const listId = toObjectId(id);
    if (!listId) {
      return res.status(400).json({ message: "Invalid list ID" });
    }
    const existingList = await EmailList.findById(listId).lean();

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    const buyerObjectIds = buyerIds
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean);
    if (buyerObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid buyer IDs provided" });
    }

    const deleteResult = await BuyerEmailList.deleteMany({
      emailListId: listId,
      buyerId: { $in: buyerObjectIds },
    });

    // Update the list
    const updatedList = await EmailList.findByIdAndUpdate(
      listId,
      { updatedAt: new Date() },
      { new: true }
    ).lean();

    res.status(200).json({
      message: `Successfully removed ${deleteResult.deletedCount} buyers from the list`,
      list: updatedList
        ? { id: String(updatedList._id), ...updatedList }
        : updatedList,
      removedCount: deleteResult.deletedCount,
    });
  } catch (err) {
    log.error("Error removing buyers from list:", err);
    res.status(500).json({
      message: "An error occurred while removing buyers from the list",
      error: err.message,
    });
  }
});

// Send email to list members
export const sendEmailToList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, content, includeUnsubscribed = false } = req.body;

  if (!id) {
    return res.status(400).json({ message: "List ID is required" });
  }

  if (!subject || !content) {
    return res.status(400).json({ message: "Email subject and content are required" });
  }

  try {
    await connectMongo();
    await ensureEmailListLegacyFieldsNormalized();
    const listId = toObjectId(id);
    if (!listId) {
      return res.status(400).json({ message: "Invalid list ID" });
    }
    const list = await EmailList.findById(listId).lean();

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get manually added buyers through join table
    const manualBuyerMemberships = await BuyerEmailList.find({
      emailListId: listId,
    })
      .populate("buyerId")
      .lean();

    const manualBuyers = manualBuyerMemberships
      .map((membership) => membership.buyerId)
      .filter(Boolean)
      .map((buyer) => ({ ...buyer, id: String(buyer._id) }));

    // Get buyers matching criteria
    let criteriaBuyers = [];
    if (list.criteria) {
      const criteria = normalizeEmailListCriteria(
        JSON.parse(JSON.stringify(list.criteria))
      );

      // Check if criteria has any actual filters
      const hasAreas = Array.isArray(criteria?.areas) && criteria.areas.length > 0;
      const hasBuyerTypes =
        Array.isArray(criteria?.buyerTypes) && criteria.buyerTypes.length > 0;
      const hasCity = Array.isArray(criteria?.city)
        ? criteria.city.length > 0
        : Boolean(criteria?.city);
      const hasCounty = Array.isArray(criteria?.county)
        ? criteria.county.length > 0
        : Boolean(criteria?.county);
      const hasCriteriaFilters =
        hasAreas || hasBuyerTypes || criteria?.isVIP || hasCity || hasCounty;

      if (hasCriteriaFilters) {
        // Build the query based on criteria
        const query = {};

        if (!includeUnsubscribed) {
          query.$or = [{ emailStatus: null }, { emailStatus: "available" }];
        }

        // Add area filter if specified
        if (hasAreas) {
          query.preferredAreas = { $in: criteria.areas };
        }

        // Add buyer type filter if specified
        if (hasBuyerTypes) {
          query.buyerType = { $in: criteria.buyerTypes };
        }

        // Add VIP filter if specified
        if (criteria.isVIP) {
          query.source = "VIP Buyers List";
        }

        // Note: city and county are stored in criteria for categorization
        // and reference (they describe the property location), but are not
        // used for buyer filtering since buyers don't have city/county fields.
        // This allows list organizers to see which geographic areas (city/county)
        // the list was created for, even though buyer matching uses preferredAreas.

        // Get buyers matching the criteria
        const criteriaResults = await Buyer.find(query).lean();
        criteriaBuyers = criteriaResults.map((buyer) => ({
          ...buyer,
          id: String(buyer._id),
        }));
      }
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([
      ...manualBuyers.map((b) => b.id),
      ...criteriaBuyers.map((b) => b.id),
    ]);
    if (allBuyerIds.size === 0) {
      return res.status(404).json({
        message: "No eligible buyers found in this list",
      });
    }

    // Get all unique buyers with email status check
    const buyerObjectIds = Array.from(allBuyerIds)
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean);
    const allBuyerQuery = { _id: { $in: buyerObjectIds } };
    if (!includeUnsubscribed) {
      allBuyerQuery.$or = [{ emailStatus: null }, { emailStatus: "available" }];
    }
    const allBuyers = await Buyer.find(allBuyerQuery).lean();

    if (allBuyers.length === 0) {
      return res.status(404).json({
        message: "No eligible buyers found in this list",
      });
    }

    // In a real implementation, you'd use a service like SendGrid, Mailchimp, etc.
    // Here we'll simulate sending emails

    // Process email content with placeholders
    const emailsSent = allBuyers.map((buyer) => {
      // Replace placeholders with buyer data
      const personalizedContent = content
        .replace(/{firstName}/g, buyer.firstName || "")
        .replace(/{lastName}/g, buyer.lastName || "")
        .replace(/{email}/g, buyer.email)
        .replace(/{preferredAreas}/g, (buyer.preferredAreas || []).join(", "));

      // In a real implementation, send the email here
      // await emailService.send({
      //   to: buyer.email,
      //   subject: subject,
      //   html: personalizedContent
      // });

      return {
        buyerId: String(buyer._id),
        email: buyer.email,
        name: `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim(),
        status: "sent", // In a real implementation, this would be the actual status
      };
    });

    // Update last email date for the list
    await EmailList.updateOne(
      { _id: listId },
      { $set: { lastEmailDate: new Date() } }
    );

    res.status(200).json({
      message: `Successfully sent emails to ${emailsSent.length} buyers in the list`,
      emailsSent,
      totalRecipients: emailsSent.length,
    });
  } catch (err) {
    log.error("Error sending email to list:", err);
    res.status(500).json({
      message: "An error occurred while sending email to the list",
      error: err.message,
    });
  }
});

const GENERATED_LIST_PREFIX = "[generated]";
const GENERATED_LIST_SOURCE = "temp-generated";

function normalizeWhitespace(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeAreaValue(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeLocationValue(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeRuleValues(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeWhitespace(value)).filter(Boolean);
}

function isValidEmail(email) {
  if (!email) return false;
  const trimmed = String(email).trim();
  if (!trimmed) return false;
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return false;
  const dotIndex = trimmed.indexOf(".", atIndex + 1);
  if (dotIndex <= atIndex + 1 || dotIndex === trimmed.length - 1) return false;
  return true;
}

function isUnsubscribed(buyer) {
  const emailStatus = String(buyer?.emailStatus || "").toLowerCase();
  const permissionStatus = String(buyer?.emailPermissionStatus || "").toLowerCase();
  return emailStatus === "unsubscribed" || permissionStatus === "unsubscribed";
}

function dedupeBuyers(buyers) {
  const seen = new Set();
  const deduped = [];

  buyers.forEach((buyer) => {
    const key =
      buyer?.id ||
      (buyer?.email ? String(buyer.email).toLowerCase() : null);
    if (!key || seen.has(key)) return;
    seen.add(key);
    deduped.push(buyer);
  });

  return deduped;
}

function evaluateBuyerRule(buyer, rule) {
  if (!rule || !rule.field) return true;

  const values = normalizeRuleValues(rule.value);
  if (values.length === 0) return true;

  if (rule.field === "buyerType") {
    const buyerType = buyer?.buyerType ? String(buyer.buyerType) : "";
    if (!buyerType) return false;
    if (rule.op === "equals") return values.includes(buyerType);
    return values.includes(buyerType);
  }

  if (rule.field === "preferredAreas") {
    const buyerAreas = Array.isArray(buyer?.preferredAreas)
      ? buyer.preferredAreas.map(normalizeAreaValue)
      : [];
    if (buyerAreas.length === 0) return false;

    const normalizedValues = values.map(normalizeAreaValue);
    const matchMode = rule.match || "contains-any";

    if (matchMode === "contains-all") {
      return normalizedValues.every((value) =>
        buyerAreas.some((area) => area.includes(value))
      );
    }

    if (matchMode === "exact") {
      return normalizedValues.some((value) =>
        buyerAreas.some((area) => area === value)
      );
    }

    return normalizedValues.some((value) =>
      buyerAreas.some((area) => area.includes(value))
    );
  }

  return true;
}

function evaluateBuyerRules(buyer, rules, mode) {
  if (!Array.isArray(rules) || rules.length === 0) return true;
  const normalizedMode = mode === "or" ? "or" : "and";
  const results = rules.map((rule) => evaluateBuyerRule(buyer, rule));
  return normalizedMode === "and" ? results.every(Boolean) : results.some(Boolean);
}

function normalizeLocationList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeLocationValue(value))
    .filter(Boolean);
}

function matchesPreferredLocation(buyerValues, filterValues) {
  const normalizedFilter = normalizeLocationList(filterValues);
  if (normalizedFilter.length === 0) return true;

  const normalizedBuyer = normalizeLocationList(buyerValues);
  if (normalizedBuyer.length === 0) return false;

  return normalizedFilter.some((value) => normalizedBuyer.includes(value));
}

function evaluateBuyerGroup(buyer, group) {
  if (!group) return true;
  const rulesMatch = evaluateBuyerRules(buyer, group?.rules, group?.mode);
  const cityMatch = matchesPreferredLocation(
    buyer?.preferredCity,
    group?.preferredCity
  );
  const countyMatch = matchesPreferredLocation(
    buyer?.preferredCounty,
    group?.preferredCounty
  );
  return rulesMatch && cityMatch && countyMatch;
}

function filterBuyersByFilters(buyers, filters) {
  if (!filters) return buyers;

  const advancedEnabled = Boolean(filters?.advanced?.enabled);
  if (advancedEnabled) {
    const groups = Array.isArray(filters?.advanced?.groups)
      ? filters.advanced.groups
      : [];

    if (groups.length === 0) return buyers;

    return buyers.filter((buyer) =>
      groups.some((group) => evaluateBuyerGroup(buyer, group))
    );
  }

  return buyers.filter((buyer) =>
    evaluateBuyerRules(buyer, filters?.rules, filters?.mode) &&
    matchesPreferredLocation(buyer?.preferredCity, filters?.preferredCity) &&
    matchesPreferredLocation(buyer?.preferredCounty, filters?.preferredCounty)
  );
}

export const previewEmailListRecipients = asyncHandler(async (req, res) => {
  const { filters, includeBuyerIds = false, sampleSize = 25 } = req.body || {};

  const normalizedSampleSize = Number.isFinite(Number(sampleSize))
    ? Math.max(0, Number(sampleSize))
    : 25;

  try {
    log.info("[EmailListController]:[previewEmailListRecipients]:[Request]", {
      includeBuyerIds,
      sampleSize: normalizedSampleSize,
      filters,
    });
    await connectMongo();
    await ensureBuyerPreferenceFieldsNormalized();
    const buyers = await Buyer.find(
      {},
      "email firstName lastName buyerType preferredAreas preferredCity preferredCounty emailStatus emailPermissionStatus"
    ).lean();
    const buyersWithId = buyers.map((buyer) => ({
      ...buyer,
      id: String(buyer._id),
    }));

    const filtered = filterBuyersByFilters(buyersWithId, filters)
      .filter((buyer) => isValidEmail(buyer.email))
      .filter((buyer) => !isUnsubscribed(buyer));

    const deduped = dedupeBuyers(filtered);
    const total = deduped.length;

    const sampleRecipients =
      normalizedSampleSize > 0
        ? deduped.slice(0, normalizedSampleSize).map((buyer) => ({
            id: buyer.id,
            email: buyer.email,
            firstName: buyer.firstName,
            lastName: buyer.lastName,
            buyerType: buyer.buyerType,
          }))
        : [];

    log.info("[EmailListController]:[previewEmailListRecipients]:[Response]", {
      totalBuyers: buyersWithId.length,
      filteredCount: filtered.length,
      dedupedCount: total,
      sampleRecipients: sampleRecipients.length,
      includeBuyerIds,
    });
    res.status(200).json({
      total,
      buyerIds: includeBuyerIds ? deduped.map((buyer) => buyer.id) : undefined,
      sampleRecipients,
    });
  } catch (err) {
    log.error("Error previewing email list recipients:", err);
    res.status(500).json({
      message: "An error occurred while previewing recipients",
      error: err.message,
    });
  }
});

export const createGeneratedEmailList = asyncHandler(async (req, res) => {
  const { name, description, criteria, buyerIds } = req.body || {};

  if (!name) {
    return res.status(400).json({ message: "List name is required" });
  }

  if (!Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "buyerIds must be a non-empty array" });
  }

  let serializedCriteria = criteria || {};
  try {
    JSON.stringify(serializedCriteria);
  } catch (error) {
    return res.status(400).json({ message: "criteria must be JSON-serializable" });
  }

  const generatedName = name.startsWith(GENERATED_LIST_PREFIX)
    ? name
    : `${GENERATED_LIST_PREFIX} ${name}`;

  try {
    await connectMongo();
    const buyerObjectIds = buyerIds
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean);
    if (buyerObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid buyer IDs provided" });
    }
    const buyers = await Buyer.find(
      { _id: { $in: buyerObjectIds } },
      "email emailStatus emailPermissionStatus"
    ).lean();
    const buyersWithId = buyers.map((buyer) => ({
      ...buyer,
      id: String(buyer._id),
    }));

    const eligibleBuyers = dedupeBuyers(
      buyersWithId.filter((buyer) => isValidEmail(buyer.email) && !isUnsubscribed(buyer))
    );

    if (eligibleBuyers.length === 0) {
      return res.status(400).json({
        message: "No eligible buyers found after permission and email checks",
      });
    }

    const criteriaPayload = {
      ...normalizeEmailListCriteria(serializedCriteria),
      isGenerated: true,
      generatedAt: serializedCriteria.generatedAt || new Date().toISOString(),
    };

    const createdBy = toObjectId(req.userId);
    const list = await EmailList.create({
      name: generatedName,
      description,
      source: GENERATED_LIST_SOURCE,
      criteria: criteriaPayload,
      isDefault: false,
      ...(createdBy ? { createdBy } : {}),
    });

    const insertResult = await BuyerEmailList.insertMany(
      eligibleBuyers.map((buyer) => ({
        buyerId: toObjectId(buyer.id),
        emailListId: list._id,
      })),
      { ordered: false }
    );

    res.status(201).json({
      generatedListId: String(list._id),
      totalContacts: insertResult.length,
    });
  } catch (err) {
    log.error("Error creating generated email list:", err);
    res.status(500).json({
      message: "An error occurred while creating the generated email list",
      error: err.message,
    });
  }
});
