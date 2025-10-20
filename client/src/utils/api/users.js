// client/src/utils/api/users.js

import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { api, handleRequestError } from './config';

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

// Alias for backward compatibility
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

// Alias for backward compatibility
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
 * Update user status (enable/disable)
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
 * Check if user exists in database by Auth0 ID
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

/**
 * Custom hook for authenticated user profile operations
 * Uses Auth0 token for authentication
 * @returns {Object} Profile API methods
 */
export function useUserProfileApi() {
  const { getAccessTokenSilently } = useAuth0();
  
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
  
  return {
    getUserProfile,
    updateUserProfile
  };
}