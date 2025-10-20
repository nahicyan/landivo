// client/src/utils/api/users.js

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { api, handleRequestError } from './config';

// ============================================================================
// USER MANAGEMENT - BASIC CRUD OPERATIONS
// ============================================================================

/**
 * Get all users
 * @returns {Promise<Array>} List of all users
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/user/all');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch users");
  }
};

/**
 * Get all user accounts (alias for getAllUsers)
 * @returns {Promise<Array>} List of user accounts
 */
export const getAllUserAccounts = getAllUsers;

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/user/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch user");
  }
};

/**
 * Get user account by ID (alias for getUserById)
 * @param {string} id - User account ID
 * @returns {Promise<Object>} User account data
 */
export const getUserAccountById = getUserById;

/**
 * Update user information
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/user/update/${id}`, userData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user");
  }
};

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<Object>} Response data
 */
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/user/delete/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete user");
  }
};

/**
 * Update user status (enable/disable) - Boolean version
 * @param {string} id - User ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated user
 */
export const updateUserStatus = async (id, isActive) => {
  try {
    const response = await api.put(`/user/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user status");
  }
};

/**
 * Update user status - String version (alternative endpoint)
 * Use this when your backend expects a status string instead of boolean
 * @param {string} id - User ID
 * @param {string} status - Status string (e.g., "active", "inactive", "suspended")
 * @returns {Promise<Object>} Updated user
 */
export const updateUserStatusString = async (id, status) => {
  try {
    const response = await api.put(`/user/${id}/status`, { status });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user status");
  }
};

// ============================================================================
// USER EXISTENCE & SYNCHRONIZATION
// ============================================================================

/**
 * Check if user exists in database by Auth0 ID (Query param version)
 * Returns null if user not found (404)
 * @param {string} auth0Id - Auth0 user ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const checkUserExists = async (auth0Id) => {
  try {
    const response = await api.get(`/user/byAuth0Id?auth0Id=${encodeURIComponent(auth0Id)}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    handleRequestError(error, "Failed to check if user exists");
  }
};

/**
 * Check if user exists by Auth0 ID (Path param version)
 * Use this if your backend uses /user/exists/:auth0Id endpoint
 * @param {string} auth0Id - Auth0 user ID
 * @returns {Promise<Object>} User existence status
 */
export const checkUserExistsByPath = async (auth0Id) => {
  try {
    const response = await api.get(`/user/exists/${auth0Id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    handleRequestError(error, "Failed to check user existence");
  }
};

/**
 * Sync Auth0 user with database
 * @param {Object} userData - User data from Auth0
 * @returns {Promise<Object>} Created or updated user
 */
export const syncAuth0User = async (userData) => {
  try {
    const response = await api.post('/user/sync', userData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to sync user with database");
  }
};

// ============================================================================
// USER PROPERTY PROFILES
// ============================================================================

/**
 * Get user's allowed property profiles (requires authentication via interceptor)
 * This function uses the axios interceptor to automatically add the Auth0 token
 * @returns {Promise<Array>} List of allowed profiles
 */
export const getUserPropertyProfiles = async () => {
  try {
    const response = await api.get('/user/property-profiles');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch user property profiles");
  }
};

/**
 * Update user's allowed profiles (Version 1 - with userId)
 * @param {string} userId - User ID
 * @param {Array<string>} profileIds - Array of profile IDs
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfilesById = async (userId, profileIds) => {
  try {
    const response = await api.put(`/user/${userId}/profiles`, { 
      allowedProfiles: profileIds 
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user profiles");
  }
};

/**
 * Update current user's property profiles (Version 2 - for current user)
 * Use this when updating the currently authenticated user's profiles
 * @param {Array<string>} profiles - Array of profile IDs
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfiles = async (profiles) => {
  try {
    const response = await api.put('/user/profiles', { profiles });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user profiles");
  }
};

// ============================================================================
// AUTHENTICATED USER PROFILE API HOOK
// ============================================================================

/**
 * Custom hook for authenticated user profile operations
 * Uses Auth0 token for authentication
 * 
 * This hook provides methods that explicitly include the Auth0 token
 * in the request headers for operations that require user-specific authentication
 * 
 * @returns {Object} Profile API methods
 */
export function useUserProfileApi() {
  const { getAccessTokenSilently } = useAuth0();
  
  /**
   * Get current user's profile
   * @returns {Promise<Object>} User profile data
   */
  const getUserProfile = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await api.get('/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (error.response?.status === 401) {
        console.log("Authentication error: Your session may have expired");
      }
      throw error;
    }
  }, [getAccessTokenSilently]);
  
  /**
   * Update current user's profile (JSON data only)
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Updated user profile
   */
  const updateUserProfile = useCallback(async (profileData) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await api.put('/user/profile', profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error.response?.status === 401) {
        console.log("Authentication error: Your session may have expired");
      }
      throw error;
    }
  }, [getAccessTokenSilently]);

  /**
   * Update current user's profile with file upload (avatar/images)
   * @param {FormData} formData - FormData with profile data and files
   * @returns {Promise<Object>} Updated user profile
   */
  const updateUserProfileWithFiles = useCallback(async (formData) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await api.put('/user/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user profile with files:", error);
      if (error.response?.status === 401) {
        console.log("Authentication error: Your session may have expired");
      }
      throw error;
    }
  }, [getAccessTokenSilently]);

  /**
   * Get current user's property profiles with explicit authentication
   * @returns {Promise<Array>} List of user's property profiles
   */
  const getUserPropertyProfiles = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await api.get('/user/property-profiles', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user property profiles:", error);
      if (error.response?.status === 401) {
        console.log("Authentication error: Your session may have expired");
      }
      throw error;
    }
  }, [getAccessTokenSilently]);
  
  return {
    getUserProfile,
    updateUserProfile,
    updateUserProfileWithFiles,
    getUserPropertyProfiles
  };
}