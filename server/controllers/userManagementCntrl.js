// server/controllers/userManagementCntrl.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by Auth0 ID:", error);
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
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (user) {
      // Update existing user with new fields
      user = await prisma.user.update({
        where: { auth0Id },
        data: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          email,
          phone: phone || user.phone,
          profileRole: profileRole || user.profileRole,
          avatarUrl: avatarUrl || user.avatarUrl,
          allowedProfiles: allowedProfiles || user.allowedProfiles,
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
        },
      });

      return res.status(200).json({
        message: "User updated successfully",
        user,
      });
    } else {
      // Create new user with new fields
      user = await prisma.user.create({
        data: {
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
        },
      });

      return res.status(201).json({
        message: "User created successfully",
        user,
      });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
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

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        createdResidencies: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            imageUrls: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
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
      const existingUser = await prisma.user.findUnique({
        where: { auth0Id },
      });

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
            console.log(`Deleted old avatar: ${oldAvatarPath}`);
          }
        } catch (err) {
          console.error(`Error deleting old avatar: ${err.message}`);
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
      const updatedUser = await prisma.user.update({
        where: { auth0Id },
        data: {
          firstName,
          lastName,
          phone,
          profileRole,
          avatarUrl,
        },
      });

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
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
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdResidencies: {
          select: {
            id: true,
          },
        },
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        // Properties created by this user
        createdResidencies: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            imageUrls: true,
            status: true,
            featured: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        // Properties updated by this user (limited to recent 10)
        updatedResidencies: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 10
        },
        // Buyers created by this user
        createdBuyers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            buyerType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        // Buyers updated by this user (limited to recent 10)
        updatedBuyers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 10
        },
        // Deals created by this user - CORRECTED FIELDS
        createdDeals: {
          select: {
            id: true,
            purchasePrice: true,
            salePrice: true,
            status: true,
            startDate: true,
            completionDate: true,
            profitLoss: true,
            currentRevenue: true,
            createdAt: true,
            // Include related property for display
            property: {
              select: {
                id: true,
                title: true,
                streetAddress: true,
                city: true,
                state: true,
              }
            },
            // Include related buyer for display
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        // Deals updated by this user (limited to recent 10) - CORRECTED FIELDS
        updatedDeals: {
          select: {
            id: true,
            purchasePrice: true,
            salePrice: true,
            status: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 10
        },
        // Qualifications updated by this user - CORRECTED FIELDS (no status field!)
        updatedQualifications: {
          select: {
            id: true,
            qualified: true,  // Boolean field instead of status
            disqualificationReason: true,
            firstName: true,
            lastName: true,
            email: true,
            propertyPrice: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 10
        },
        // Activity logs for this user (limited to recent 20)
        activityLogs: {
          select: {
            id: true,
            entityType: true,
            entityId: true,
            actionType: true,
            details: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 20
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add computed statistics
    const userWithStats = {
      ...user,
      stats: {
        totalPropertiesCreated: user.createdResidencies?.length || 0,
        totalPropertiesUpdated: user.updatedResidencies?.length || 0,
        totalBuyersCreated: user.createdBuyers?.length || 0,
        totalBuyersUpdated: user.updatedBuyers?.length || 0,
        totalDealsCreated: user.createdDeals?.length || 0,
        totalDealsUpdated: user.updatedDeals?.length || 0,
        totalQualificationsUpdated: user.updatedQualifications?.length || 0,
        totalActivities: user.activityLogs?.length || 0,
        lastActivity: user.activityLogs?.[0]?.createdAt || null,
      }
    };

    res.status(200).json(userWithStats);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
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
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: isActive === true || isActive === "true",
      },
    });

    res.status(200).json({
      message: `User ${isActive ? "enabled" : "disabled"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
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
    const user = await prisma.user.update({
      where: { id },
      data: { allowedProfiles },
    });

    res.status(200).json({
      message: "User profiles updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user profiles:", error);
    res.status(500).json({
      message: "An error occurred while updating user profiles",
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
    const currentUser = await prisma.user.findUnique({
      where: { auth0Id },
      select: {
        id: true,
        allowedProfiles: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get only the profiles that the user is allowed to use
    const allowedProfileIds = currentUser.allowedProfiles || [];

    // Include the user's own profile
    if (!allowedProfileIds.includes(currentUser.id)) {
      allowedProfileIds.push(currentUser.id);
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: allowedProfileIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileRole: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Return limited profile data
    const profiles = users.map((user) => ({
      id: user.id,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || `User (${user.id.substring(0, 8)}...)`,
      role: user.profileRole || "Landivo Expert",
    }));

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error fetching profiles for property assignment:", error);
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileRole: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching public profile:", error);
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
    const properties = await prisma.residency.findMany({
      where: { profileId: id },
      select: {
        id: true,
        title: true,
        streetAddress: true,
        city: true,
        state: true,
        zip: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties using profile:", error);
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
    const count = await prisma.residency.count({
      where: { profileId: id },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting properties using profile:", error);
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
    const newProfile = await prisma.user.findUnique({
      where: { id: newProfileId },
      select: { id: true },
    });

    if (!newProfile) {
      return res.status(404).json({ message: "New profile not found" });
    }

    // Update all properties using the old profile ID
    const result = await prisma.residency.updateMany({
      where: { profileId: id },
      data: { profileId: newProfileId },
    });

    res.status(200).json({
      message: `${result.count} properties reassigned successfully`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error reassigning properties:", error);
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
    const whereClause = {
      isActive: true, // Only return enabled/active users
      // Ensure user has basic profile info
      AND: [
        {
          OR: [{ firstName: { not: null } }, { lastName: { not: null } }],
        },
      ],
    };

    // Add profileRole filter if provided
    if (profileRole) {
      whereClause.profileRole = profileRole;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileRole: true,
        avatarUrl: true,
      },
      orderBy: [{ profileRole: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause,
    });

    res.status(200).json({
      profiles: users,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + users.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching public profiles:", error);
    res.status(500).json({
      message: "An error occurred while fetching profiles",
      error: error.message,
    });
  }
});
