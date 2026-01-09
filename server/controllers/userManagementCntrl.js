// server/controllers/userManagementCntrl.js
import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import {
  ActivityLog,
  Buyer,
  Deal,
  Qualification,
  Property,
  User,
} from "../models/index.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { getLogger } from "../utils/logger.js";

const log = getLogger("userManagementCntrl");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

// Configure multer for avatar uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const avatarDirectory = path.join(__dirname, "../uploads/avatars");

// Ensure avatar directory exists
if (!fs.existsSync(avatarDirectory)) {
  fs.mkdirSync(avatarDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "avatar-" + uniqueSuffix + ext);
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.test(ext.substring(1))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP) are allowed."));
    }
  },
}).single("avatar");

/**
 * Get user by Auth0 ID
 * Used to check if a user exists in our database and to retrieve user data
 */
export const getUserByAuth0Id = asyncHandler(async (req, res) => {
  const { auth0Id } = req.query;

  if (!auth0Id) {
    return res.status(400).json({ message: "Auth0 ID is required" });
  }

  try {
    await connectMongo();
    const user = await User.findOne({ auth0Id }).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ id: String(user._id), ...user });
  } catch (error) {
    log.error("Error fetching user by Auth0 ID:", error);
    res.status(500).json({
      message: "An error occurred while fetching user information",
      error: error.message,
    });
  }
});

/**
 * Create or update user based on Auth0 ID
 * This is called when a new user with Auth0 roles/permissions logs in
 */
export const createOrUpdateUser = asyncHandler(async (req, res) => {
  const { auth0Id, firstName, lastName, email, phone, profileRole, avatarUrl, allowedProfiles } = req.body;

  if (!auth0Id || !email) {
    return res.status(400).json({ message: "Auth0 ID and email are required" });
  }

  try {
    // Try to find existing user
    await connectMongo();
    let user = await User.findOne({ auth0Id });

    if (user) {
      // Update existing user with new fields
      user.set({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email,
        phone: phone || user.phone,
        profileRole: profileRole || user.profileRole,
        avatarUrl: avatarUrl || user.avatarUrl,
        allowedProfiles: allowedProfiles || user.allowedProfiles,
        lastLoginAt: new Date(),
      });
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();

      return res.status(200).json({
        message: "User updated successfully",
        user: { id: String(user._id), ...user.toObject() },
      });
    } else {
      // Create new user with new fields
      user = await User.create({
        auth0Id,
        firstName,
        lastName,
        email,
        phone,
        profileRole,
        avatarUrl,
        allowedProfiles: allowedProfiles || [],
        lastLoginAt: new Date(),
        loginCount: 1,
      });

      return res.status(201).json({
        message: "User created successfully",
        user: { id: String(user._id), ...user.toObject() },
      });
    }
  } catch (error) {
    log.error("Error creating/updating user:", error);
    res.status(500).json({
      message: "An error occurred while creating/updating the user",
      error: error.message,
    });
  }
});

/**
 * Get user profile - gets the current authenticated user's profile
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    // Auth0 ID should be in req.user.sub from the auth middleware
    const auth0Id = req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    await connectMongo();
    const user = await User.findOne({ auth0Id }).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    const createdProperties = await Property.find(
      { createdById: user._id },
      "title streetAddress city state imageUrls"
    ).lean();

    res.status(200).json({
      id: String(user._id),
      ...user,
      createdProperties: createdProperties.map((property) => ({
        id: String(property._id),
        ...property,
      })),
    });
  } catch (error) {
    log.error("Error fetching user profile:", error);
    res.status(500).json({
      message: "An error occurred while fetching user profile",
      error: error.message,
    });
  }
});

/**
 * Update user profile - allows users to update their own profile info
 * Now supports file uploads for profile avatars
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const auth0Id = req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    // Process file upload
    uploadAvatar(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          message: "Error uploading profile picture",
          error: err.message,
        });
      }

      // Get form data
      const { firstName, lastName, phone, profileRole, removeAvatar } = req.body;

      // Get the existing user to check if it exists
      await connectMongo();
      const existingUser = await User.findOne({ auth0Id });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle avatar removal or replacement
      let avatarUrl = existingUser.avatarUrl;

      // Remove existing avatar if requested or if uploading a new one
      if ((removeAvatar === "true" || req.file) && existingUser.avatarUrl) {
        const oldAvatarPath = path.join(__dirname, "..", existingUser.avatarUrl);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
            log.info(`Deleted old avatar: ${oldAvatarPath}`);
          }
        } catch (err) {
          log.error(`Error deleting old avatar: ${err.message}`);
        }

        // Set to null if removing without replacement
        if (removeAvatar === "true" && !req.file) {
          avatarUrl = null;
        }
      }

      // Set new avatar URL if file was uploaded
      if (req.file) {
        avatarUrl = `uploads/avatars/${req.file.filename}`;
      }

      // Update the user with new fields
      const updatedUser = await User.findOneAndUpdate(
        { auth0Id },
        {
          ...(typeof firstName !== "undefined" ? { firstName } : {}),
          ...(typeof lastName !== "undefined" ? { lastName } : {}),
          ...(typeof phone !== "undefined" ? { phone } : {}),
          ...(typeof profileRole !== "undefined" ? { profileRole } : {}),
          avatarUrl,
        },
        { new: true }
      ).lean();

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser
          ? { id: String(updatedUser._id), ...updatedUser }
          : updatedUser,
      });
    });
  } catch (error) {
    log.error("Error updating user profile:", error);
    res.status(500).json({
      message: "An error occurred while updating user profile",
      error: error.message,
    });
  }
});
/**
 * Get all users (Admin only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    await connectMongo();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const userIds = users.map((user) => user._id);
    const properties = userIds.length
      ? await Property.find(
          { createdById: { $in: userIds } },
          "_id createdById"
        ).lean()
      : [];
    const propertyMap = new Map();
    properties.forEach((property) => {
      const key = String(property.createdById);
      if (!propertyMap.has(key)) {
        propertyMap.set(key, []);
      }
      propertyMap.get(key).push({ id: String(property._id) });
    });

    res.status(200).json(
      users.map((user) => ({
        id: String(user._id),
        ...user,
        createdProperties: propertyMap.get(String(user._id)) || [],
      }))
    );
  } catch (error) {
    log.error("Error fetching all users:", error);
    res.status(500).json({
      message: "An error occurred while fetching users",
      error: error.message,
    });
  }
});


/**
 * Get user by ID (Admin only) - FINAL corrected version
 * @route GET /api/user/:id
 * @access Private (requires read:users permission)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await connectMongo();
    const userId = toObjectId(id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [
      createdProperties,
      updatedProperties,
      createdBuyers,
      updatedBuyers,
      createdDeals,
      updatedDeals,
      updatedQualifications,
      activityLogs,
    ] = await Promise.all([
      Property.find(
        { createdById: userId },
        "title streetAddress city state imageUrls status featured createdAt updatedAt"
      )
        .sort({ createdAt: -1 })
        .lean(),
      Property.find(
        { updatedById: userId },
        "title streetAddress city state updatedAt"
      )
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      Buyer.find(
        { createdById: userId },
        "firstName lastName email phone buyerType createdAt"
      )
        .sort({ createdAt: -1 })
        .lean(),
      Buyer.find(
        { updatedById: userId },
        "firstName lastName email updatedAt"
      )
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      Deal.find({ createdById: userId })
        .populate({ path: "propertyId", select: "title streetAddress city state" })
        .populate({ path: "buyerId", select: "firstName lastName email" })
        .sort({ createdAt: -1 })
        .lean(),
      Deal.find({ updatedById: userId })
        .select("purchasePrice salePrice status updatedAt")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      Qualification.find(
        { updatedById: userId },
        "qualified disqualificationReason firstName lastName email propertyPrice updatedAt"
      )
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      ActivityLog.find(
        { userId },
        "entityType entityId actionType details createdAt"
      )
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const mappedCreatedDeals = createdDeals.map((deal) => ({
      id: String(deal._id),
      purchasePrice: deal.purchasePrice,
      salePrice: deal.salePrice,
      status: deal.status,
      startDate: deal.startDate,
      completionDate: deal.completionDate,
      profitLoss: deal.profitLoss,
      currentRevenue: deal.currentRevenue,
      createdAt: deal.createdAt,
      property: deal.propertyId
        ? {
            id: String(deal.propertyId._id),
            title: deal.propertyId.title,
            streetAddress: deal.propertyId.streetAddress,
            city: deal.propertyId.city,
            state: deal.propertyId.state,
          }
        : null,
      buyer: deal.buyerId
        ? {
            id: String(deal.buyerId._id),
            firstName: deal.buyerId.firstName,
            lastName: deal.buyerId.lastName,
            email: deal.buyerId.email,
          }
        : null,
    }));

    const mappedUpdatedDeals = updatedDeals.map((deal) => ({
      id: String(deal._id),
      purchasePrice: deal.purchasePrice,
      salePrice: deal.salePrice,
      status: deal.status,
      updatedAt: deal.updatedAt,
    }));

    const mappedCreatedProperties = createdProperties.map((item) => ({
      id: String(item._id),
      ...item,
    }));

    const mappedUpdatedProperties = updatedProperties.map((item) => ({
      id: String(item._id),
      ...item,
    }));

    const mappedCreatedBuyers = createdBuyers.map((item) => ({
      id: String(item._id),
      ...item,
    }));

    const mappedUpdatedBuyers = updatedBuyers.map((item) => ({
      id: String(item._id),
      ...item,
    }));

    const mappedUpdatedQualifications = updatedQualifications.map((item) => ({
      id: String(item._id),
      ...item,
    }));

    const mappedActivityLogs = activityLogs.map((item) => ({
      id: String(item._id),
      ...item,
    }));

    // Add computed statistics
    const userWithStats = {
      id: String(user._id),
      ...user,
      createdProperties: mappedCreatedProperties,
      updatedProperties: mappedUpdatedProperties,
      createdBuyers: mappedCreatedBuyers,
      updatedBuyers: mappedUpdatedBuyers,
      createdDeals: mappedCreatedDeals,
      updatedDeals: mappedUpdatedDeals,
      updatedQualifications: mappedUpdatedQualifications,
      activityLogs: mappedActivityLogs,
      stats: {
        totalPropertiesCreated: mappedCreatedProperties.length,
        totalPropertiesUpdated: mappedUpdatedProperties.length,
        totalBuyersCreated: mappedCreatedBuyers.length,
        totalBuyersUpdated: mappedUpdatedBuyers.length,
        totalDealsCreated: mappedCreatedDeals.length,
        totalDealsUpdated: mappedUpdatedDeals.length,
        totalQualificationsUpdated: mappedUpdatedQualifications.length,
        totalActivities: mappedActivityLogs.length,
        lastActivity: mappedActivityLogs[0]?.createdAt || null,
      }
    };

    res.status(200).json(userWithStats);
  } catch (error) {
    log.error("Error fetching user by ID:", error);
    res.status(500).json({
      message: "An error occurred while fetching user information",
      error: error.message,
    });
  }
});

/**
 * Update user status (enable/disable)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    await connectMongo();
    const userId = toObjectId(id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive: isActive === true || isActive === "true" },
      { new: true }
    ).lean();

    res.status(200).json({
      message: `User ${isActive ? "enabled" : "disabled"} successfully`,
      user: updatedUser
        ? { id: String(updatedUser._id), ...updatedUser }
        : updatedUser,
    });
  } catch (error) {
    log.error("Error updating user status:", error);
    res.status(500).json({
      message: "An error occurred while updating user status",
      error: error.message,
    });
  }
});

/**
 * Update user's allowed profiles
 */
export const updateUserProfiles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { allowedProfiles } = req.body;

  try {
    await connectMongo();
    const userId = toObjectId(id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { allowedProfiles },
      { new: true }
    ).lean();

    res.status(200).json({
      message: "User profiles updated successfully",
      user: user ? { id: String(user._id), ...user } : user,
    });
  } catch (error) {
    log.error("Error updating user profiles:", error);
    res.status(500).json({
      message: "An error occurred while updating user profiles",
      error: error.message,
    });
  }
});


/**
 * Update user information (Admin function)
 * Allows admins to update basic user information: firstName, lastName, phone, profileRole
 * @route PUT /api/user/update/:id
 * @access Admin (requires write:users permission)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, profileRole } = req.body;

  // Validation
  if (!firstName || !lastName) {
    return res.status(400).json({ 
      message: "First name and last name are required" 
    });
  }

  try {
    // Check if user exists
    await connectMongo();
    const userId = toObjectId(id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const existingUser = await User.findById(userId).lean();

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with new information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        profileRole: profileRole?.trim() || null,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
        ? { id: String(updatedUser._id), ...updatedUser }
        : updatedUser,
    });
  } catch (error) {
    log.error("Error updating user:", error);
    res.status(500).json({
      message: "An error occurred while updating the user",
      error: error.message,
    });
  }
});


export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await connectMongo();
    const userId = toObjectId(id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ 
        message: "Cannot delete an active user. Please disable the user first." 
      });
    }

    // Delete related records first
    await ActivityLog.deleteMany({ userId });

    // Now delete the user
    await User.deleteOne({ _id: userId });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    log.error("Error deleting user:", error);
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
});

/**
 * Get limited user profiles for property assignments
 * Used when creating/editing properties to select a contact profile
 */
export const getProfilesForPropertyAssignment = asyncHandler(async (req, res) => {
  try {
    // Get current user's ID from the auth token
    const auth0Id = req.user?.sub;

    if (!auth0Id) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    // Get the current user from database to get their allowedProfiles
    await connectMongo();
    const currentUser = await User.findOne({ auth0Id })
      .select("_id allowedProfiles")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get only the profiles that the user is allowed to use
    const allowedProfileIds = (currentUser.allowedProfiles || []).filter(Boolean);

    // Include the user's own profile
    if (!allowedProfileIds.includes(String(currentUser._id))) {
      allowedProfileIds.push(String(currentUser._id));
    }

    const allowedObjectIds = allowedProfileIds
      .map((value) => toObjectId(value))
      .filter(Boolean);
    const users = await User.find(
      { _id: { $in: allowedObjectIds } },
      "firstName lastName email profileRole"
    )
      .sort({ firstName: 1 })
      .lean();

    // Return limited profile data
    const profiles = users.map((user) => {
      const idString = String(user._id);
      return {
        id: idString,
        name:
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email || `User (${idString.substring(0, 8)}...)`,
        role: user.profileRole || "Landivo Expert",
      };
    });

    res.status(200).json(profiles);
  } catch (error) {
    log.error("Error fetching profiles for property assignment:", error);
    res.status(500).json({
      message: "An error occurred while fetching profiles",
      error: error.message,
    });
  }
});

/**
 * Get public profile for property contact
 * This endpoint is public and doesn't require authentication
 */
export const getPublicProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await connectMongo();
    const userId = toObjectId(id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }
    const user = await User.findById(
      userId,
      "firstName lastName email phone profileRole avatarUrl"
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ id: String(user._id), ...user });
  } catch (error) {
    log.error("Error fetching public profile:", error);
    res.status(500).json({
      message: "An error occurred while fetching profile information",
      error: error.message,
    });
  }
});

// server/controllers/userManagementCntrl.js - Add new functions

/**
 * Get properties using a specific profile ID
 */
export const getPropertiesUsingProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await connectMongo();
    const properties = await Property.find(
      { profileId: id },
      "title streetAddress city state zip updatedAt"
    )
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json(
      properties.map((property) => ({
        id: String(property._id),
        ...property,
      }))
    );
  } catch (error) {
    log.error("Error fetching properties using profile:", error);
    res.status(500).json({
      message: "An error occurred while fetching properties",
      error: error.message,
    });
  }
});

/**
 * Get count of properties using a specific profile ID
 */
export const getPropertiesCountByProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await connectMongo();
    const count = await Property.countDocuments({ profileId: id });

    res.status(200).json({ count });
  } catch (error) {
    log.error("Error counting properties using profile:", error);
    res.status(500).json({
      message: "An error occurred while counting properties",
      error: error.message,
    });
  }
});

/**
 * Reassign properties from one profile to another
 */
export const reassignProperties = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newProfileId } = req.body;

  if (!newProfileId) {
    return res.status(400).json({ message: "New profile ID is required" });
  }

  try {
    // Check if new profile exists
    await connectMongo();
    const newProfileObjectId = toObjectId(newProfileId);
    if (!newProfileObjectId) {
      return res.status(400).json({ message: "Invalid new profile ID" });
    }
    const newProfile = await User.findById(newProfileObjectId)
      .select("_id")
      .lean();

    if (!newProfile) {
      return res.status(404).json({ message: "New profile not found" });
    }

    // Update all properties using the old profile ID
    const result = await Property.updateMany(
      { profileId: id },
      { $set: { profileId: String(newProfile._id) } }
    );

    res.status(200).json({
      message: `${result.modifiedCount} properties reassigned successfully`,
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    log.error("Error reassigning properties:", error);
    res.status(500).json({
      message: "An error occurred while reassigning properties",
      error: error.message,
    });
  }
});

/**
 * Get all enabled public profiles
 * This endpoint is public and doesn't require authentication
 * Returns only active users with their public profile information
 */
export const getPublicProfiles = asyncHandler(async (req, res) => {
  try {
    // Query parameters for optional filtering
    const { limit = 50, offset = 0, profileRole } = req.query;

    // Build where clause
    await connectMongo();
    const whereClause = {
      isActive: true,
      $or: [{ firstName: { $ne: null } }, { lastName: { $ne: null } }],
    };

    // Add profileRole filter if provided
    if (profileRole) {
      whereClause.profileRole = profileRole;
    }

    const users = await User.find(
      whereClause,
      "firstName lastName email phone profileRole avatarUrl"
    )
      .sort({ profileRole: 1, firstName: 1, lastName: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments(whereClause);

    res.status(200).json({
      profiles: users.map((user) => ({ id: String(user._id), ...user })),
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + users.length < totalCount,
      },
    });
  } catch (error) {
    log.error("Error fetching public profiles:", error);
    res.status(500).json({
      message: "An error occurred while fetching profiles",
      error: error.message,
    });
  }
});
