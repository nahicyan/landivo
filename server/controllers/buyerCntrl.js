// server/controllers/buyerCntrl.js
import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { Buyer, BuyerActivity, BuyerEmailList, EmailList, Offer } from "../models/index.js";
import { handleVipBuyerEmailList } from "../services/buyer/vipBuyerEmailListService.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("buyerCntrl");

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

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const toBuyerResponse = (buyer) =>
  buyer ? { id: String(buyer._id), ...buyer } : buyer;

/**
 * Create a VIP buyer with Auth0 ID
 * @route POST /api/buyer/createVipBuyer
 * @access Public
 */
export const createVipBuyer = asyncHandler(async (req, res) => {
  const { email, phone, buyerType, firstName, lastName, preferredAreas, preferredCity, preferredCounty, auth0Id } = req.body;

  // Validate required fields
  if (!email || !phone || !buyerType || !firstName || !lastName || !preferredAreas || !Array.isArray(preferredAreas)) {
    res.status(400).json({
      message: "All fields are required including preferred areas.",
    });
    return;
  }

  try {
    await connectMongo();
    const emailLower = email.toLowerCase();
    // Check if buyer already exists
    let buyer = await Buyer.findOne({
      $or: [{ email: emailLower }, { phone }],
    });

    if (buyer) {
      const mergedAreas = mergeUnique(buyer.preferredAreas, preferredAreas);
      const mergedCities = mergeUnique(buyer.preferredCity, preferredCity);
      const mergedCounties = mergeUnique(buyer.preferredCounty, preferredCounty);

      // Update existing buyer with VIP status, preferred areas, and Auth0 ID
      buyer.set({
        firstName,
        lastName,
        buyerType,
        preferredAreas: mergedAreas,
        preferredCity: mergedCities,
        preferredCounty: mergedCounties,
        source: "VIP Buyers List",
        auth0Id,
      });
      await buyer.save();
    } else {
      const normalizedAreas = normalizeList(preferredAreas);
      const normalizedCities = normalizeList(preferredCity);
      const normalizedCounties = normalizeList(preferredCounty);

      // Create new buyer with VIP status, preferred areas, and Auth0 ID
      buyer = await Buyer.create({
        email: emailLower,
        phone,
        buyerType,
        firstName,
        lastName,
        preferredAreas: normalizedAreas,
        preferredCity: normalizedCities,
        preferredCounty: normalizedCounties,
        source: "VIP Buyers List",
        auth0Id,
      });
    }

    // Handle VIP buyer email list management for each preferred area
    try {
      const emailListResults = [];

      for (const area of preferredAreas) {
        const emailListResult = await handleVipBuyerEmailList(buyer, "VIP", area, buyerType);
        emailListResults.push(emailListResult);
        log.info(`VIP email list result for ${area}:`, emailListResult);
      }

      log.info("All VIP email list management completed:", emailListResults);
    } catch (emailListError) {
      log.error("VIP email list management failed:", emailListError);
      // Don't fail registration if email list fails
    }

    const buyerResponse = buyer?.toObject ? buyer.toObject() : buyer;
    res.status(201).json({
      message: "VIP Buyer created successfully.",
      buyer: toBuyerResponse(buyerResponse),
    });
  } catch (err) {
    log.error(err);
    res.status(500).json({
      message: "An error occurred while processing the request.",
      error: err.message,
    });
  }
});

/**
 * Get all buyers
 * @route GET /api/buyer/all
 * @access Public (but should be protected in production)
 */
export const getAllBuyers = asyncHandler(async (req, res) => {
  try {
    await connectMongo();
    const buyers = await Buyer.find({}).sort({ createdAt: -1 }).lean();
    const buyerIds = buyers.map((buyer) => buyer._id);

    const offers = buyerIds.length
      ? await Offer.find(
          { buyerId: { $in: buyerIds } },
          "buyerId propertyId offeredPrice timestamp"
        )
          .sort({ timestamp: -1 })
          .lean()
      : [];

    const offersByBuyer = new Map();
    offers.forEach((offer) => {
      const buyerId = String(offer.buyerId);
      const entry = {
        id: String(offer._id),
        propertyId: offer.propertyId,
        offeredPrice: offer.offeredPrice,
        timestamp: offer.timestamp,
      };
      if (!offersByBuyer.has(buyerId)) {
        offersByBuyer.set(buyerId, []);
      }
      offersByBuyer.get(buyerId).push(entry);
    });

    const memberships = buyerIds.length
      ? await BuyerEmailList.find({ buyerId: { $in: buyerIds } })
          .populate({ path: "emailListId", select: "name description" })
          .lean()
      : [];

    const membershipMap = new Map();
    memberships.forEach((membership) => {
      const buyerId = String(membership.buyerId);
      const emailList = membership.emailListId;
      const emailListEntry = emailList
        ? {
            id: String(emailList._id),
            name: emailList.name,
            description: emailList.description,
          }
        : null;
      const entry = {
        id: String(membership._id),
        buyerId,
        emailListId: emailList ? String(emailList._id) : String(membership.emailListId),
        emailList: emailListEntry,
      };
      if (!membershipMap.has(buyerId)) {
        membershipMap.set(buyerId, []);
      }
      membershipMap.get(buyerId).push(entry);
    });

    const buyersWithRelations = buyers.map((buyer) => ({
      ...buyer,
      id: String(buyer._id),
      offers: offersByBuyer.get(String(buyer._id)) || [],
      emailListMemberships: membershipMap.get(String(buyer._id)) || [],
    }));

    res.status(200).json(buyersWithRelations);
  } catch (err) {
    log.error("Error fetching buyers:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyers",
      error: err.message,
    });
  }
});

/**
 * Get buyer by ID
 * @route GET /api/buyer/:id
 * @access Public (but should be protected in production)
 */
export const getBuyerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const buyer = await Buyer.findById(buyerId).lean();

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    const offers = await Offer.find(
      { buyerId },
      "propertyId offeredPrice timestamp"
    )
      .sort({ timestamp: -1 })
      .lean();
    const mappedOffers = offers.map((offer) => ({
      id: String(offer._id),
      propertyId: offer.propertyId,
      offeredPrice: offer.offeredPrice,
      timestamp: offer.timestamp,
    }));

    const memberships = await BuyerEmailList.find({ buyerId })
      .populate({ path: "emailListId", select: "name description" })
      .lean();
    const mappedMemberships = memberships.map((membership) => {
      const emailList = membership.emailListId;
      return {
        id: String(membership._id),
        buyerId: String(membership.buyerId),
        emailListId: emailList ? String(emailList._id) : String(membership.emailListId),
        emailList: emailList
          ? {
              id: String(emailList._id),
              name: emailList.name,
              description: emailList.description,
            }
          : null,
      };
    });

    res.status(200).json({
      ...buyer,
      id: String(buyer._id),
      offers: mappedOffers,
      emailListMemberships: mappedMemberships,
    });
  } catch (err) {
    log.error("Error fetching buyer:", err);
    res.status(500).json({
      message: "An error occurred while fetching the buyer",
      error: err.message,
    });
  }
});

/**
 * Update buyer
 * @route PUT /api/buyer/update/:id
 * @access Private (only admins should update buyers)
 */
export const updateBuyer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    phone,
    buyerType,
    source,
    preferredAreas,
    preferredCity,
    preferredCounty
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  // Only validate email as required
  if (!email || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if buyer exists
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const existingBuyer = await Buyer.findById(buyerId).lean();

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Check if email is changing and if it's already in use
    const emailLower = email.toLowerCase();
    if (emailLower !== existingBuyer.email) {
      const emailExists = await Buyer.findOne({
        email: emailLower,
        _id: { $ne: buyerId },
      }).lean();

      if (emailExists) {
        return res.status(400).json({ message: "Email already in use by another buyer" });
      }
    }

    // Check if phone is changing and if it's already in use (only if phone is provided)
    if (phone && phone.trim() && phone !== existingBuyer.phone) {
      const phoneExists = await Buyer.findOne({
        phone,
        _id: { $ne: buyerId },
      }).lean();

      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use by another buyer" });
      }
    }

    const nextPreferredAreas = preferredAreas
      ? mergeUnique(existingBuyer.preferredAreas, preferredAreas)
      : existingBuyer.preferredAreas || [];
    const nextPreferredCities = preferredCity
      ? mergeUnique(existingBuyer.preferredCity, preferredCity)
      : existingBuyer.preferredCity || [];
    const nextPreferredCounties = preferredCounty
      ? mergeUnique(existingBuyer.preferredCounty, preferredCounty)
      : existingBuyer.preferredCounty || [];

    // Update the buyer
    const updatedBuyer = await Buyer.findByIdAndUpdate(
      buyerId,
      {
        firstName: firstName || null,
        lastName: lastName || null,
        email: emailLower,
        phone: phone && phone.trim() ? phone : null,
        buyerType: buyerType || null,
        ...(typeof source !== "undefined" ? { source } : {}),
        preferredAreas: nextPreferredAreas,
        preferredCity: nextPreferredCities,
        preferredCounty: nextPreferredCounties,
      },
      { new: true }
    ).lean();

    const offers = await Offer.find(
      { buyerId },
      "propertyId offeredPrice timestamp"
    )
      .sort({ timestamp: -1 })
      .lean();
    const mappedOffers = offers.map((offer) => ({
      id: String(offer._id),
      propertyId: offer.propertyId,
      offeredPrice: offer.offeredPrice,
      timestamp: offer.timestamp,
    }));

    const memberships = await BuyerEmailList.find({ buyerId })
      .populate({ path: "emailListId", select: "name description" })
      .lean();
    const mappedMemberships = memberships.map((membership) => {
      const emailList = membership.emailListId;
      return {
        id: String(membership._id),
        buyerId: String(membership.buyerId),
        emailListId: emailList ? String(emailList._id) : String(membership.emailListId),
        emailList: emailList
          ? {
              id: String(emailList._id),
              name: emailList.name,
              description: emailList.description,
            }
          : null,
      };
    });

    res.status(200).json({
      ...updatedBuyer,
      id: String(updatedBuyer._id),
      offers: mappedOffers,
      emailListMemberships: mappedMemberships,
    });
  } catch (err) {
    log.error("Error updating buyer:", err);
    res.status(500).json({
      message: "An error occurred while updating the buyer",
      error: err.message,
    });
  }
});

/**
 * Delete buyer
 * @route DELETE /api/buyer/delete/:id
 * @access Private (only admins should delete buyers)
 */
export const deleteBuyer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Check if buyer exists
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const existingBuyer = await Buyer.findById(buyerId).lean();

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Delete all related records first (due to foreign key constraints)

    // 1. Delete email list memberships
    await BuyerEmailList.deleteMany({ buyerId });

    // 2. Delete buyer activities
    await BuyerActivity.deleteMany({ buyerId });

    // 3. Delete offers from this buyer
    await Offer.deleteMany({ buyerId });

    // 4. Finally delete the buyer
    const deletedBuyer = await Buyer.findByIdAndDelete(buyerId).lean();

    res.status(200).json({
      message: "Buyer and all associated records deleted successfully",
      buyer: deletedBuyer
        ? { id: String(deletedBuyer._id), ...deletedBuyer }
        : deletedBuyer,
    });
  } catch (err) {
    log.error("Error deleting buyer:", err);
    res.status(500).json({
      message: "An error occurred while deleting the buyer",
      error: err.message,
    });
  }
});

/**
 * Create a regular buyer
 * @route POST /api/buyer/create
 * @access Public
 */
export const createBuyer = asyncHandler(async (req, res) => {
  const {
    email,
    phone,
    buyerType,
    firstName,
    lastName,
    source,
    preferredAreas,
    preferredCity,
    preferredCounty,
    emailStatus,
    emailPermissionStatus,
    emailLists, // Array of list names or IDs
  } = req.body;

  // Validate required fields
  if (!email || !phone || !firstName || !lastName) {
    res.status(400).json({
      message: "Email, phone, firstName, and lastName are required.",
    });
    return;
  }

  try {
    // Check if buyer already exists
    await connectMongo();
    const emailLower = email.toLowerCase();
    const existingBuyer = await Buyer.findOne({
      $or: [{ email: emailLower }, { phone }],
    }).lean();

    if (existingBuyer) {
      res.status(409).json({
        message: "A buyer with this email or phone number already exists.",
        existingBuyer,
      });
      return;
    }

    // Find email lists by name if provided
    let emailListConnections = [];
    if (emailLists && emailLists.length > 0) {
      const listObjectIds = emailLists
        .map((listId) => toObjectId(listId))
        .filter(Boolean);
      const listNames = emailLists.filter((value) => !toObjectId(value));
      const listQuery = [];
      if (listObjectIds.length > 0) {
        listQuery.push({ _id: { $in: listObjectIds } });
      }
      if (listNames.length > 0) {
        listQuery.push({ name: { $in: listNames } });
      }
      const lists =
        listQuery.length > 0
          ? await EmailList.find({ $or: listQuery }).select("_id").lean()
          : [];
      emailListConnections = lists.map((list) => list._id);
    }

    const normalizedAreas = normalizeList(preferredAreas);
    const normalizedCities = normalizeList(preferredCity);
    const normalizedCounties = normalizeList(preferredCounty);

    // Create new buyer with email list connections
    const buyer = await Buyer.create({
      email: emailLower,
      phone,
      buyerType,
      firstName,
      lastName,
      source: source || "Manual Entry",
      preferredAreas: normalizedAreas,
      preferredCity: normalizedCities,
      preferredCounty: normalizedCounties,
      emailStatus: emailStatus || "available",
      emailPermissionStatus,
    });

    if (emailListConnections.length > 0) {
      await BuyerEmailList.insertMany(
        emailListConnections.map((listId) => ({
          buyerId: buyer._id,
          emailListId: listId,
        })),
        { ordered: false }
      );
    }

    const memberships = await BuyerEmailList.find({ buyerId: buyer._id })
      .populate("emailListId")
      .lean();
    const mappedMemberships = memberships.map((membership) => {
      const emailList = membership.emailListId;
      return {
        id: String(membership._id),
        buyerId: String(membership.buyerId),
        emailListId: emailList ? String(emailList._id) : String(membership.emailListId),
        emailList: emailList
          ? {
              id: String(emailList._id),
              name: emailList.name,
              description: emailList.description,
            }
          : null,
      };
    });

    res.status(201).json({
      message: "Buyer created successfully.",
      buyer: {
        ...(buyer?.toObject ? buyer.toObject() : buyer),
        id: String(buyer._id),
        emailListMemberships: mappedMemberships,
      },
    });
  } catch (err) {
    log.error("Error creating buyer:", err);
    res.status(500).json({
      message: "An error occurred while processing the request.",
      error: err.message,
    });
  }
});

/**
 * Get buyers by preferred area
 * @route GET /api/buyer/byArea/:areaId
 * @access Public (but should be protected in production)
 */
export const getBuyersByArea = asyncHandler(async (req, res) => {
  const { areaId } = req.params;

  if (!areaId) {
    return res.status(400).json({ message: "Area ID is required" });
  }

  try {
    await connectMongo();
    const buyers = await Buyer.find({ preferredAreas: areaId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      areaId,
      count: buyers.length,
      buyers: buyers.map((buyer) => ({ id: String(buyer._id), ...buyer })),
    });
  } catch (err) {
    log.error("Error fetching buyers by area:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyers by area",
      error: err.message,
    });
  }
});

/**
 * Send email to selected buyers
 * @route POST /api/buyer/sendEmail
 * @access Private (only admins should send emails)
 */
export const sendEmailToBuyers = asyncHandler(async (req, res) => {
  const { buyerIds, subject, content, includeUnsubscribed = false } = req.body;

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "At least one buyer ID is required" });
  }

  if (!subject || !content) {
    return res.status(400).json({ message: "Email subject and content are required" });
  }

  try {
    // Get the buyers to email
    await connectMongo();
    const buyerObjectIds = buyerIds
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean);
    if (buyerObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid buyer IDs provided" });
    }
    const buyers = await Buyer.find({ _id: { $in: buyerObjectIds } }).lean();
    const eligibleBuyers = includeUnsubscribed
      ? buyers
      : buyers.filter((buyer) => {
          const emailStatus = String(buyer.emailStatus || "").toLowerCase();
          const permissionStatus = String(buyer.emailPermissionStatus || "").toLowerCase();
          return emailStatus !== "unsubscribed" && permissionStatus !== "unsubscribed";
        });

    if (eligibleBuyers.length === 0) {
      return res.status(404).json({
        message: "No eligible buyers found with the provided IDs",
      });
    }

    // In a real implementation, you'd use a service like SendGrid, Mailchimp, etc.
    // Here we'll simulate sending emails

    // Process email content with placeholders
    const emailsSent = eligibleBuyers.map((buyer) => {
      // Replace placeholders with buyer data
      const personalizedContent = content
        .replace(/{firstName}/g, buyer.firstName)
        .replace(/{lastName}/g, buyer.lastName)
        .replace(/{email}/g, buyer.email)
        .replace(/{preferredAreas}/g, (buyer.preferredAreas || []).join(", "));

      // In a real implementation, send the email here

      return {
        buyerId: String(buyer._id),
        email: buyer.email,
        name: `${buyer.firstName} ${buyer.lastName}`,
        status: "sent", // In a real implementation, this would be the actual status
      };
    });

    // Create a record of the email campaign
    // In a real implementation, you'd store this in the database

    res.status(200).json({
      message: `Successfully sent emails to ${emailsSent.length} buyers`,
      emailsSent,
      failedCount: buyerIds.length - emailsSent.length,
    });
  } catch (err) {
    log.error("Error sending emails to buyers:", err);
    res.status(500).json({
      message: "An error occurred while sending emails",
      error: err.message,
    });
  }
});

/**
 * Import buyers from CSV
 * @route POST /api/buyer/import
 * @access Private (only admins should import buyers)
 */
export const importBuyersFromCsv = asyncHandler(async (req, res) => {
  const { buyers, source = "CSV Import" } = req.body;

  if (!buyers || !Array.isArray(buyers) || buyers.length === 0) {
    return res.status(400).json({ message: "No buyer data provided" });
  }

  try {
    await connectMongo();
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      createdBuyerIds: [],
      updatedBuyerIds: [],
    };

    // Process each buyer
    for (const buyerData of buyers) {
      try {
        const {
          email,
          phone,
          firstName,
          lastName,
          buyerType,
          preferredAreas,
          preferredCity,
          preferredCounty,
          emailStatus,
          emailPermissionStatus,
          isNew,
          existingBuyerId
        } = buyerData;

        // Check required fields
        if (!email) {
          results.failed++;
          results.errors.push({
            data: buyerData,
            reason: "Missing required email field",
          });
          continue;
        }

        if (isNew) {
          // Create new buyer
          const newBuyer = await Buyer.create({
            email: email.toLowerCase(),
            phone: phone || null,
            buyerType: buyerType || null,
            firstName: firstName || null,
            lastName: lastName || null,
            source: source,
            preferredAreas: normalizeList(preferredAreas),
            preferredCity: normalizeList(preferredCity),
            preferredCounty: normalizeList(preferredCounty),
            emailStatus: emailStatus || "available",
            emailPermissionStatus: emailPermissionStatus || null,
          });

          results.created++;
          results.createdBuyerIds.push(String(newBuyer._id));
        } else if (existingBuyerId) {
          const buyerId = toObjectId(existingBuyerId);
          if (!buyerId) {
            results.failed++;
            results.errors.push({
              data: buyerData,
              reason: "Invalid existing buyer ID",
            });
            continue;
          }
          const existingBuyer = await Buyer.findById(buyerId)
            .select("preferredAreas preferredCity preferredCounty")
            .lean();

          const nextPreferredAreas = mergeUnique(existingBuyer?.preferredAreas, preferredAreas);
          const nextPreferredCities = mergeUnique(existingBuyer?.preferredCity, preferredCity);
          const nextPreferredCounties = mergeUnique(existingBuyer?.preferredCounty, preferredCounty);

          // Update existing buyer (duplicates are handled in the frontend)
          await Buyer.findByIdAndUpdate(buyerId, {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
            ...(buyerType ? { buyerType } : {}),
            preferredAreas: nextPreferredAreas,
            preferredCity: nextPreferredCities,
            preferredCounty: nextPreferredCounties,
            ...(source ? { source } : {}),
            ...(emailStatus ? { emailStatus } : {}),
            ...(emailPermissionStatus ? { emailPermissionStatus } : {}),
          });

          results.updated++;
          results.updatedBuyerIds.push(existingBuyerId);
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          data: buyerData,
          reason: err.message,
        });
      }
    }

    res.status(200).json({
      message: `Processed ${buyers.length} buyers: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      results,
    });
  } catch (err) {
    log.error("Error importing buyers:", err);
    res.status(500).json({
      message: "An error occurred while importing buyers",
      error: err.message,
    });
  }
});

/**
 * Get buyer statistics
 * @route GET /api/buyer/stats
 * @access Private (only admins should access stats)
 */
export const getBuyerStats = asyncHandler(async (req, res) => {
  try {
    await connectMongo();
    // Get total buyer count
    const totalCount = await Buyer.countDocuments();

    // Get count of VIP buyers
    const vipCount = await Buyer.countDocuments({ source: "VIP Buyers List" });

    // Get counts by area (this is more complex with array fields)
    // In MongoDB/Prisma, we'd need aggregation for this
    // This is a simplified version
    const buyers = await Buyer.find(
      {},
      "preferredAreas buyerType source createdAt"
    ).lean();

    // Manually count by area
    const byArea = {};
    const byType = {};
    const bySource = {};

    // Process for time-based analytics - group by month
    const monthlyGrowth = {};

    buyers.forEach((buyer) => {
      // Count by area
      if (buyer.preferredAreas) {
        buyer.preferredAreas.forEach((area) => {
          byArea[area] = (byArea[area] || 0) + 1;
        });
      }

      // Count by type
      if (buyer.buyerType) {
        byType[buyer.buyerType] = (byType[buyer.buyerType] || 0) + 1;
      }

      // Count by source
      const source = buyer.source || "Unknown";
      bySource[source] = (bySource[source] || 0) + 1;

      // Process for monthly growth
      if (buyer.createdAt) {
        const date = new Date(buyer.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
      }
    });

    // Return stats
    res.status(200).json({
      totalCount,
      vipCount,
      byArea,
      byType,
      bySource,
      monthlyGrowth,
    });
  } catch (err) {
    log.error("Error getting buyer stats:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyer statistics",
      error: err.message,
    });
  }
});

/**
 * Get buyer by Auth0 ID
 * @route GET /api/buyer/byAuth0Id
 * @access Public
 */
export const getBuyerByAuth0Id = asyncHandler(async (req, res) => {
  const { auth0Id } = req.query;

  if (!auth0Id) {
    return res.status(400).json({ message: "Auth0 ID is required" });
  }

  try {
    // Find buyer by Auth0 ID
    await connectMongo();
    const buyer = await Buyer.findOne({ auth0Id }).lean();

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Return buyer data with 200 status
    res.status(200).json({ id: String(buyer._id), ...buyer });
  } catch (err) {
    log.error("Error fetching buyer by Auth0 ID:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyer information",
      error: err.message,
    });
  }
});

/**
 * Bulk delete buyers
 * @route DELETE /api/buyer/bulk-delete
 * @access Private
 */
export const bulkDeleteBuyers = asyncHandler(async (req, res) => {
  const { buyerIds } = req.body;

  if (!buyerIds || !Array.isArray(buyerIds) || buyerIds.length === 0) {
    return res.status(400).json({ message: "Buyer IDs array is required" });
  }

  try {
    // Delete all related records first (due to foreign key constraints)
    await connectMongo();
    const buyerObjectIds = buyerIds
      .map((buyerId) => toObjectId(buyerId))
      .filter(Boolean);
    if (buyerObjectIds.length === 0) {
      return res.status(400).json({ message: "No valid buyer IDs provided" });
    }

    // 1. Delete email list memberships
    await BuyerEmailList.deleteMany({ buyerId: { $in: buyerObjectIds } });

    // 2. Delete buyer activities
    await BuyerActivity.deleteMany({ buyerId: { $in: buyerObjectIds } });

    // 3. Delete offers
    await Offer.deleteMany({ buyerId: { $in: buyerObjectIds } });

    // 4. Delete buyers
    const result = await Buyer.deleteMany({ _id: { $in: buyerObjectIds } });

    res.status(200).json({
      message: `${result.deletedCount} buyers and all associated records deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    log.error("Error bulk deleting buyers:", err);
    res.status(500).json({
      message: "An error occurred while deleting buyers",
      error: err.message,
    });
  }
});

/**
 * Update buyer subscription preferences (partial unsubscribe)
 * @route PUT /api/buyer/unsubscribe/:id
 * @access Public
 */
export const updateSubscriptionPreferences = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { preferredAreas, weeklyUpdates, holidayDeals, specialDiscounts } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const existingBuyer = await Buyer.findById(buyerId).lean();

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Update subscription preferences
    const updatedBuyer = await Buyer.findByIdAndUpdate(
      buyerId,
      {
        preferredAreas: preferredAreas || [],
        weeklyUpdates: weeklyUpdates || "available",
        holidayDeals: holidayDeals || "available",
        specialDiscounts: specialDiscounts || "available",
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    // Log the activity
    await BuyerActivity.create({
      buyerId,
      eventType: "subscription_update",
      eventData: {
        action: "preferences_updated",
        oldPreferences: {
          preferredAreas: existingBuyer.preferredAreas,
          weeklyUpdates: existingBuyer.weeklyUpdates,
          holidayDeals: existingBuyer.holidayDeals,
          specialDiscounts: existingBuyer.specialDiscounts,
        },
        newPreferences: {
          preferredAreas,
          weeklyUpdates,
          holidayDeals,
          specialDiscounts,
        },
      },
    });

    res.status(200).json({
      message: "Subscription preferences updated successfully",
      buyer: updatedBuyer
        ? { id: String(updatedBuyer._id), ...updatedBuyer }
        : updatedBuyer,
    });
  } catch (err) {
    log.error("Error updating subscription preferences:", err);
    res.status(500).json({
      message: "An error occurred while updating preferences",
      error: err.message,
    });
  }
});

/**
 * Resubscribe buyer (in case they want to re-enable emails)
 * @route PUT /api/buyer/resubscribe/:id
 * @access Public
 */
export const resubscribeBuyer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { emailTypes = [], areas = [] } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const existingBuyer = await Buyer.findById(buyerId).lean();

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Prepare update data
    const updateData = {
      emailStatus: "available",
      emailPermissionStatus: "available",
      preferredAreas: areas,
      updatedAt: new Date(),
    };

    // Set specific email type preferences
    if (emailTypes.includes("weeklyUpdates")) {
      updateData.weeklyUpdates = "available";
    }
    if (emailTypes.includes("holidayDeals")) {
      updateData.holidayDeals = "available";
    }
    if (emailTypes.includes("specialDiscounts")) {
      updateData.specialDiscounts = "available";
    }

    // Update buyer
    const updatedBuyer = await Buyer.findByIdAndUpdate(buyerId, updateData, {
      new: true,
    }).lean();

    // Log the resubscribe activity
    await BuyerActivity.create({
      buyerId,
      eventType: "subscription_update",
      eventData: {
        action: "resubscribe",
        emailTypes,
        areas,
        resubscribeDate: new Date().toISOString(),
      },
    });

    res.status(200).json({
      message: "Successfully resubscribed to emails",
      buyer: updatedBuyer
        ? { id: String(updatedBuyer._id), ...updatedBuyer }
        : updatedBuyer,
    });
  } catch (err) {
    log.error("Error resubscribing buyer:", err);
    res.status(500).json({
      message: "An error occurred while resubscribing",
      error: err.message,
    });
  }
});

/**
 * Complete unsubscribe from all emails
 * @route PUT /api/buyer/unsubscribe/:id/complete
 * @access Public
 */
export const completeUnsubscribe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const existingBuyer = await Buyer.findById(buyerId).lean();

    if (!existingBuyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Update buyer to unsubscribe from all emails
    const updatedBuyer = await Buyer.findByIdAndUpdate(
      buyerId,
      {
        emailStatus: "unsubscribe",
        emailPermissionStatus: "unsubscribe",
        weeklyUpdates: "unsubscribe",
        holidayDeals: "unsubscribe",
        specialDiscounts: "unsubscribe",
        preferredAreas: [],
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    // Remove from all email lists
    await BuyerEmailList.deleteMany({ buyerId });

    // Log the activity
    await BuyerActivity.create({
      buyerId,
      eventType: "subscription_update",
      eventData: {
        action: "complete_unsubscribe",
        previousStatus: existingBuyer.emailStatus,
        unsubscribeDate: new Date().toISOString(),
      },
    });

    res.status(200).json({
      message: "Successfully unsubscribed from all emails",
      buyer: updatedBuyer
        ? { id: String(updatedBuyer._id), ...updatedBuyer }
        : updatedBuyer,
    });
  } catch (err) {
    log.error("Error completing unsubscribe:", err);
    res.status(500).json({
      message: "An error occurred while unsubscribing",
      error: err.message,
    });
  }
});

/**
 * Get buyer data for unsubscribe page (public endpoint)
 * @route GET /api/buyer/unsubscribe/:id/data
 * @access Public
 */
export const getBuyerForUnsubscribe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Buyer ID is required" });
  }

  try {
    // Find the buyer with only necessary fields for unsubscribe page
    await connectMongo();
    const buyerId = toObjectId(id);
    if (!buyerId) {
      return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const buyer = await Buyer.findById(
      buyerId,
      "firstName lastName email preferredAreas emailStatus emailPermissionStatus weeklyUpdates holidayDeals specialDiscounts createdAt"
    ).lean();

    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    // Log the unsubscribe page visit
    await BuyerActivity.create({
      buyerId,
      eventType: "page_view",
      eventData: {
        page: "unsubscribe",
        timestamp: new Date().toISOString(),
      },
    });

    res.status(200).json({ id: String(buyer._id), ...buyer });
  } catch (err) {
    log.error("Error fetching buyer for unsubscribe:", err);
    res.status(500).json({
      message: "An error occurred while fetching buyer information",
      error: err.message,
    });
  }
});

export const getBuyersPaginated = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    area = "all",
    buyerType = "all",
    source = "all"
  } = req.query;

  try {
    await connectMongo();

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (area && area !== "all") {
      query.preferredAreas = { $in: [area] };
    }

    if (buyerType && buyerType !== "all") {
      query.buyerType = buyerType;
    }

    if (source && source !== "all") {
      query.source = source;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count and paginated results
    const [buyers, totalCount] = await Promise.all([
      Buyer.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .lean(),
      Buyer.countDocuments(query)
    ]);

    // Normalize buyers
    const normalizedBuyers = buyers.map(buyer => ({
      ...buyer,
      id: String(buyer._id),
    }));

    res.status(200).json({
      buyers: normalizedBuyers,
      pagination: {
        currentPage: pageNum,
        pageSize: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (err) {
    log.error("Error fetching paginated buyers:", err);
    res.status(500).json({ message: "Error fetching buyers", error: err.message });
  }
});