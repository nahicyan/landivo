// File location: server/controllers/emailListCntrl.js

import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

let buyerPreferenceNormalizationCompleted = false;
let emailListLegacyNormalizationCompleted = false;
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
    await prisma.$runCommandRaw({
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

    await prisma.$runCommandRaw({
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

    await prisma.$runCommandRaw({
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

    await prisma.$runCommandRaw({
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

    await prisma.$runCommandRaw({
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
    console.error("Failed to normalize buyer preference fields:", error);
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
    await prisma.$runCommandRaw({
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
    console.error("Failed to normalize EmailList legacy fields:", error);
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
    console.log("[EmailListController]:[getAllEmailLists]:[Request]", {
      query: req?.query || {},
    });
    await ensureEmailListLegacyFieldsNormalized();
    const lists = await prisma.emailList.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        buyerMemberships: {
          select: {
            buyerId: true,
          },
        },
      },
    });

    // For each list, count the buyers that match its criteria and manual members
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        // Get manually added buyers through join table
        const manualBuyerIds = list.buyerMemberships.map((m) => m.buyerId);

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
              query.preferredAreas = {
                hasSome: criteria.areas,
              };
            }

            // Add buyer type filter if specified
            if (hasBuyerTypes) {
              query.buyerType = {
                in: criteria.buyerTypes,
              };
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
            const criteriaBuyers = await prisma.buyer.findMany({
              where: query,
              select: { id: true },
            });

            criteriaBuyerIds = criteriaBuyers.map((b) => b.id);
          }
        }

        // Combine and remove duplicates using Set
        const uniqueBuyerIds = new Set([...manualBuyerIds, ...criteriaBuyerIds]);
        const totalCount = uniqueBuyerIds.size;

        // Remove the buyerMemberships from the response
        const { buyerMemberships, ...listData } = list;
        const normalizedCriteria = listData.criteria
          ? normalizeEmailListCriteria(listData.criteria)
          : listData.criteria;

        return {
          ...listData,
          criteria: normalizedCriteria,
          buyerCount: totalCount,
        };
      })
    );

    console.log("[EmailListController]:[getAllEmailLists]:[Response]", {
      totalLists: listsWithCounts.length,
    });
    res.status(200).json(listsWithCounts);
  } catch (err) {
    console.error("Error fetching email lists:", err);
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
    console.log("[EmailListController]:[getEmailList]:[Request]", { id });
    await ensureEmailListLegacyFieldsNormalized();
    await ensureBuyerPreferenceFieldsNormalized();
    // Get the list with buyers through join table
    const list = await prisma.emailList.findUnique({
      where: { id },
      include: {
        buyerMemberships: {
          include: {
            buyer: {
              include: {
                emailListMemberships: {
                  include: {
                    emailList: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Extract buyers from join table
    const manualBuyers = list.buyerMemberships.map((membership) => membership.buyer);
    const manualBuyerIds = manualBuyers.map((buyer) => buyer.id).filter(Boolean);

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
          query.preferredAreas = {
            hasSome: criteria.areas,
          };
        }

        // Add buyer type filter if specified
        if (hasBuyerTypes) {
          query.buyerType = {
            in: criteria.buyerTypes,
          };
        }

        // Add VIP filter if specified
        if (criteria.isVIP) {
          query.source = "VIP Buyers List";
        }

        // Note: city and county in criteria are for reference/categorization only
        // They describe the property location but don't filter buyers
        // since buyers don't have these fields

        // Get buyers matching the criteria
        criteriaBuyers = await prisma.buyer.findMany({
          where: query,
          include: {
            emailListMemberships: {
              include: {
                emailList: true,
              },
            },
          },
        });
        console.log("[EmailListController]:[getEmailList]:[Criteria]", {
          id,
          listName: list?.name,
          query,
          criteriaBuyerCount: criteriaBuyers.length,
        });
      }
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([...manualBuyerIds, ...criteriaBuyers.map((b) => b.id)]);
    console.log("[EmailListController]:[getEmailList]:[Buyers]", {
      id,
      listName: list?.name,
      manualBuyerCount: manualBuyerIds.length,
      criteriaBuyerCount: criteriaBuyers.length,
      uniqueBuyerCount: allBuyerIds.size,
    });

    const allBuyers = await prisma.buyer.findMany({
      where: {
        id: { in: Array.from(allBuyerIds) },
      },
      include: {
        emailListMemberships: {
          include: {
            emailList: true,
          },
        },
      },
    });

    // Transform buyer data to include emailLists array
    const buyersWithEmailLists = allBuyers.map((buyer) => {
      const { emailListMemberships, ...buyerData } = buyer;
      return {
        ...buyerData,
        emailLists: emailListMemberships.map((m) => m.emailList),
      };
    });

    // Remove buyerMemberships from response and add transformed buyers
    const { buyerMemberships, ...listData } = list;
    const normalizedCriteria = listData.criteria
      ? normalizeEmailListCriteria(listData.criteria)
      : listData.criteria;

    console.log("[EmailListController]:[getEmailList]:[Response]", {
      id,
      listName: list?.name,
      buyerCount: buyersWithEmailLists.length,
    });
    res.status(200).json({
      ...listData,
      criteria: normalizedCriteria,
      buyers: buyersWithEmailLists,
      buyerCount: buyersWithEmailLists.length,
    });
  } catch (err) {
    console.error("Error fetching email list:", err);
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
    // Ensure buyerIds is an array
    const buyerIdsArray = Array.isArray(buyerIds) ? buyerIds : [];
    const normalizedCriteria = criteria ? normalizeEmailListCriteria(criteria) : criteria;

    // Log criteria for debugging (especially useful for city/county)
    if (normalizedCriteria) {
      console.log("Creating email list with criteria:", {
        name,
        areas: normalizedCriteria.areas,
        city: normalizedCriteria.city,
        county: normalizedCriteria.county,
        buyerTypes: normalizedCriteria.buyerTypes,
        isVIP: normalizedCriteria.isVIP
      });
    }

    // Create the list with initial buyers if provided
    const newList = await prisma.emailList.create({
      data: {
        name,
        description,
        criteria: normalizedCriteria,
        color,
        source: source || "Manual", // Add source field with default fallback
        createdBy: req.userId,
        buyerMemberships: {
          create: buyerIdsArray.map((buyerId) => ({
            buyer: { connect: { id: buyerId } },
          })),
        },
      },
    });

    res.status(201).json({
      message: "Email list created successfully",
      list: newList,
    });
  } catch (err) {
    console.error("Error creating email list:", err);
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
    const existingList = await prisma.emailList.findUnique({
      where: { id },
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Log criteria updates for debugging
    const normalizedCriteria = criteria ? normalizeEmailListCriteria(criteria) : criteria;

    if (normalizedCriteria) {
      console.log("Updating email list criteria:", {
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
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        name,
        description,
        criteria: normalizedCriteria,
        color,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      message: "Email list updated successfully",
      list: updatedList,
    });
  } catch (err) {
    console.error("Error updating email list:", err);
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
    const existingList = await prisma.emailList.findUnique({
      where: { id },
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    let deletedBuyersCount = 0;

    if (deleteBuyers) {
      // Get all buyer IDs in this list
      const buyerMemberships = await prisma.buyerEmailList.findMany({
        where: { emailListId: id },
        select: { buyerId: true },
      });

      const buyerIds = buyerMemberships.map((m) => m.buyerId);

      if (buyerIds.length > 0) {
        // Delete offers first (foreign key constraint)
        await prisma.offer.deleteMany({
          where: { buyerId: { in: buyerIds } },
        });

        // Delete buyer activities
        await prisma.buyerActivity.deleteMany({
          where: { buyerId: { in: buyerIds } },
        });

        // Delete all buyer memberships for these buyers
        await prisma.buyerEmailList.deleteMany({
          where: { buyerId: { in: buyerIds } },
        });

        // Delete the buyers
        const deleteResult = await prisma.buyer.deleteMany({
          where: { id: { in: buyerIds } },
        });

        deletedBuyersCount = deleteResult.count;
      }
    } else {
      // Just delete the memberships for this list
      await prisma.buyerEmailList.deleteMany({
        where: { emailListId: id },
      });
    }

    // Delete the list
    await prisma.emailList.delete({
      where: { id },
    });

    res.status(200).json({
      message: deleteBuyers ? `Email list and ${deletedBuyersCount} buyers deleted successfully` : "Email list deleted successfully",
      deletedBuyersCount,
    });
  } catch (err) {
    console.error("Error deleting email list:", err);
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
    const existingList = await prisma.emailList.findUnique({
      where: { id },
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get existing memberships to avoid duplicates
    const existingMemberships = await prisma.buyerEmailList.findMany({
      where: {
        emailListId: id,
        buyerId: { in: buyerIds },
      },
      select: { buyerId: true },
    });

    const existingBuyerIds = new Set(existingMemberships.map((m) => m.buyerId));
    const newBuyerIds = buyerIds.filter((buyerId) => !existingBuyerIds.has(buyerId));

    // Create new memberships for buyers not already in the list
    if (newBuyerIds.length > 0) {
      await prisma.buyerEmailList.createMany({
        data: newBuyerIds.map((buyerId) => ({
          buyerId,
          emailListId: id,
        })),
      });
    }

    // Update the list's updatedAt timestamp
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
      include: {
        buyerMemberships: {
          include: {
            buyer: true,
          },
        },
      },
    });

    res.status(200).json({
      message: `Successfully added ${newBuyerIds.length} new buyers to the list (${existingBuyerIds.size} were already in the list)`,
      list: updatedList,
      addedCount: newBuyerIds.length,
      skippedCount: existingBuyerIds.size,
    });
  } catch (err) {
    console.error("Error adding buyers to list:", err);
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
    // Check if the list exists
    const existingList = await prisma.emailList.findUnique({
      where: { id },
    });

    if (!existingList) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Delete memberships
    const deleteResult = await prisma.buyerEmailList.deleteMany({
      where: {
        emailListId: id,
        buyerId: { in: buyerIds },
      },
    });

    // Update the list
    const updatedList = await prisma.emailList.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      message: `Successfully removed ${deleteResult.count} buyers from the list`,
      list: updatedList,
      removedCount: deleteResult.count,
    });
  } catch (err) {
    console.error("Error removing buyers from list:", err);
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
    await ensureEmailListLegacyFieldsNormalized();
    // Get the list
    const list = await prisma.emailList.findUnique({
      where: { id },
    });

    if (!list) {
      return res.status(404).json({ message: "Email list not found" });
    }

    // Get manually added buyers through join table
    const manualBuyerMemberships = await prisma.buyerEmailList.findMany({
      where: {
        emailListId: id,
      },
      include: {
        buyer: true,
      },
    });

    const manualBuyers = manualBuyerMemberships.map((m) => m.buyer);

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
        const query = {
          ...(includeUnsubscribed
            ? {}
            : {
                OR: [{ emailStatus: null }, { emailStatus: "available" }],
              }),
        };

        // Add area filter if specified
        if (hasAreas) {
          query.preferredAreas = {
            hasSome: criteria.areas,
          };
        }

        // Add buyer type filter if specified
        if (hasBuyerTypes) {
          query.buyerType = {
            in: criteria.buyerTypes,
          };
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
        criteriaBuyers = await prisma.buyer.findMany({
          where: query,
        });
      }
    }

    // Combine and remove duplicates
    const allBuyerIds = new Set([...manualBuyers.map((b) => b.id), ...criteriaBuyers.map((b) => b.id)]);

    // Get all unique buyers with email status check
    const allBuyers = await prisma.buyer.findMany({
      where: {
        id: { in: Array.from(allBuyerIds) },
        ...(includeUnsubscribed
          ? {}
          : {
              OR: [{ emailStatus: null }, { emailStatus: "available" }],
            }),
      },
    });

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
        buyerId: buyer.id,
        email: buyer.email,
        name: `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim(),
        status: "sent", // In a real implementation, this would be the actual status
      };
    });

    // Update last email date for the list
    await prisma.emailList.update({
      where: { id },
      data: {
        lastEmailDate: new Date(),
      },
    });

    res.status(200).json({
      message: `Successfully sent emails to ${emailsSent.length} buyers in the list`,
      emailsSent,
      totalRecipients: emailsSent.length,
    });
  } catch (err) {
    console.error("Error sending email to list:", err);
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
    console.log("[EmailListController]:[previewEmailListRecipients]:[Request]", {
      includeBuyerIds,
      sampleSize: normalizedSampleSize,
      filters,
    });
    await ensureBuyerPreferenceFieldsNormalized();
    const buyers = await prisma.buyer.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        buyerType: true,
        preferredAreas: true,
        preferredCity: true,
        preferredCounty: true,
        emailStatus: true,
        emailPermissionStatus: true,
      },
    });

    const filtered = filterBuyersByFilters(buyers, filters)
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

    console.log("[EmailListController]:[previewEmailListRecipients]:[Response]", {
      totalBuyers: buyers.length,
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
    console.error("Error previewing email list recipients:", err);
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
    const buyers = await prisma.buyer.findMany({
      where: {
        id: { in: buyerIds },
      },
      select: {
        id: true,
        email: true,
        emailStatus: true,
        emailPermissionStatus: true,
      },
    });

    const eligibleBuyers = dedupeBuyers(
      buyers.filter((buyer) => isValidEmail(buyer.email) && !isUnsubscribed(buyer))
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

    const list = await prisma.emailList.create({
      data: {
        name: generatedName,
        description,
        source: GENERATED_LIST_SOURCE,
        criteria: criteriaPayload,
        isDefault: false,
        createdBy: req.userId,
      },
    });

    const insertResult = await prisma.buyerEmailList.createMany({
      data: eligibleBuyers.map((buyer) => ({
        buyerId: buyer.id,
        emailListId: list.id,
      })),
    });

    res.status(201).json({
      generatedListId: list.id,
      totalContacts: insertResult.count,
    });
  } catch (err) {
    console.error("Error creating generated email list:", err);
    res.status(500).json({
      message: "An error occurred while creating the generated email list",
      error: err.message,
    });
  }
});
