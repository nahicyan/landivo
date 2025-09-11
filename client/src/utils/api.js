// client/src/utils/api.js

import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true, // Enable cookies for cross-origin requests
});

// Helper function to handle errors and provide consistent logging
const handleRequestError = (error, message) => {
  console.error(`${message}:`, error);
  throw error;
};

// Get all properties
export const getAllProperties = async () => {
  try {
    const response = await api.get('/residency/allresd');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch properties");
  }
};

// Get a specific property
export const getProperty = async (id) => {
  try {
    const response = await api.get(`/residency/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    // Return a basic object instead of throwing to avoid breaking the UI
    return { 
      title: "Unknown Property", 
      streetAddress: "Address not available" 
    };
  }
};

// Make an offer on a property - Updated to use the new offer endpoint
export const makeOffer = async (offerData) => {
  try {
    const response = await api.post('/offer/makeOffer', offerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to make offer");
  }
};

// Update property
export const updateProperty = async (id, updatedData) => {
  try {
    const response = await api.put(`/residency/update/${id}`, updatedData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update property");
  }
};

// Get offers for a specific property - Updated to use the new offer endpoint
export const getPropertyOffers = async (propertyId) => {
  try {
    const response = await api.get(`/offer/property/${propertyId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property offers");
  }
};

// Get offers for a specific buyer - Updated to use the new offer endpoint
export const getBuyerOffers = async (params) => {
  try {
    // Handle different parameter formats
    let endpoint;
    
    if (typeof params === 'string') {
      // Direct buyerId as string
      endpoint = `/offer/buyer?buyerId=${params}`;
    } else if (params && typeof params === 'object') {
      // Object with parameters - extract the buyerId properly
      if (params.buyerId) {
        if (typeof params.buyerId === 'object') {
          console.error('Invalid buyerId format:', params.buyerId);
          return { offers: [] };
        }
        endpoint = `/offer/buyer?buyerId=${params.buyerId}`;
      } else if (params.email) {
        endpoint = `/offer/buyer?email=${encodeURIComponent(params.email)}`;
      } else if (params.phone) {
        endpoint = `/offer/buyer?phone=${encodeURIComponent(params.phone)}`;
      } else {
        console.error('Missing required parameter in getBuyerOffers:', params);
        return { offers: [] };
      }
    } else {
      console.error('Invalid parameters for getBuyerOffers:', params);
      return { offers: [] };
    }
    
    console.log(`Making GET request to ${endpoint}`);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching buyer offers:", error);
    // Return empty object with offers array to avoid UI errors
    return { 
      offers: [],
      buyer: null,
      totalOffers: 0 
    };
  }
};

// New function to create residency with files
export const createResidencyWithFiles = async (formData) => {
  try {
    const response = await api.post('/residency/createWithFile', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create property with files");
  }
};

// Submit qualification data
export const submitQualification = async (qualificationData) => {
  try {
    const response = await api.post('/qualification/create', qualificationData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to submit qualification");
  }
};

// Get qualifications for a property
export const getPropertyQualifications = async (propertyId) => {
  try {
    const response = await api.get(`/qualification/property/${propertyId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property qualifications");
  }
};

// Get all qualifications with optional filtering
export const getAllQualifications = async (page = 1, limit = 10, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    });
    
    const response = await api.get(`/qualification/all?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch qualifications");
  }
};

// Create A VIP Buyer
export const createVipBuyer = async (buyerData) => {
  try {
    const response = await api.post('/buyer/createVipBuyer', buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create VIP buyer");
  }
};

// 9. API Client Function for User Detail
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/user/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch user details");
  }
};

// Get All Users
export const getAllUsers = async () => {
  try {
    const response = await api.get('/user/all');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch users");
  }
};

// Get All Buyers
export const getAllBuyers = async () => {
  try {
    const response = await api.get('/buyer/all');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyers");
  }
};

// Get Buyer by ID
export const getBuyerById = async (id) => {
  try {
    const response = await api.get(`/buyer/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching buyer details:", error);
    throw error;
  }
};

// Update Buyer
export const updateBuyer = async (id, buyerData) => {
  try {
    const response = await api.put(`/buyer/update/${id}`, buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update buyer");
  }
};

// Delete Buyer
export const deleteBuyer = async (id) => {
  try {
    const response = await api.delete(`/buyer/delete/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete buyer");
  }
};

/**
 * Record buyer activity events
 * @param {Array} events - Array of activity events
 * @returns {Promise<Object>} Response data
 */
export const recordBuyerActivity = async (events) => {
  try {
    const response = await api.post('/buyer/activity', { events });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to record buyer activity");
  }
};


/**
 * Get activity data for a specific buyer
 * @param {string} buyerId - Buyer ID
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=500] - Results per page (increased from 50)
 * @param {string} [options.type] - Filter by event type
 * @param {string} [options.startDate] - Filter by start date
 * @param {string} [options.endDate] - Filter by end date
 * @param {string} [options.propertyId] - Filter by property ID
 * @returns {Promise<Object>} Activity data
 */
export const getBuyerActivity = async (buyerId, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: options.page || 1,
      limit: options.limit || 500, // Increased from 50
      ...(options.type && { type: options.type }),
      ...(options.startDate && { startDate: options.startDate }),
      ...(options.endDate && { endDate: options.endDate }),
      ...(options.propertyId && { propertyId: options.propertyId })
    });
    
    const response = await api.get(`/buyer/activity/${buyerId}?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer activity");
  }
};

/**
 * Get a summary of buyer activity
 * @param {string} buyerId - Buyer ID
 * @returns {Promise<Object>} Activity summary
 */
export const getBuyerActivitySummary = async (buyerId) => {
  try {
    const response = await api.get(`/buyer/activity/${buyerId}/summary`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer activity summary");
  }
};

/**
 * Delete buyer activity records
 * @param {string} buyerId - Buyer ID
 * @param {Object} [options] - Delete options
 * @param {string} [options.before] - Delete records before this date
 * @param {string} [options.type] - Delete records of this type
 * @returns {Promise<Object>} Response data
 */
export const deleteBuyerActivity = async (buyerId, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      ...(options.before && { before: options.before }),
      ...(options.type && { type: options.type })
    });
    
    const response = await api.delete(`/buyer/activity/${buyerId}?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete buyer activity");
  }
};

// Get all email lists
export const getEmailLists = async () => {
  try {
    const response = await api.get('/email-lists');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch email lists");
  }
};

// Get a specific email list with its members
export const getEmailList = async (id) => {
  try {
    const response = await api.get(`/email-lists/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch email list");
  }
};

// Create a new email list
export const createEmailList = async (listData) => {
  try {
    const response = await api.post('/email-lists', listData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create email list");
  }
};

// Update a email list
export const updateEmailList = async (id, listData) => {
  try {
    const response = await api.put(`/email-lists/${id}`, listData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update email list");
  }
};

// Delete a email list
export const deleteEmailList = async (id, deleteBuyers = false) => {
  try {
    const response = await api.delete(`/email-lists/${id}`, {
      data: { deleteBuyers } // Send in request body
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete email list");
  }
};

// Add buyers to a list
export const addBuyersToList = async (listId, buyerIds) => {
  try {
    const response = await api.post(`/email-lists/${listId}/add-buyers`, { buyerIds });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to add buyers to list");
  }
};

// Remove buyers from a list
export const removeBuyersFromList = async (listId, buyerIds) => {
  try {
    const response = await api.post(`/email-lists/${listId}/remove-buyers`, { buyerIds });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to remove buyers from list");
  }
};

// Send email to list members
export const sendEmailToList = async (listId, emailData) => {
  try {
    const response = await api.post(`/email-lists/${listId}/send-email`, emailData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to send email to list");
  }
};


// Create a new deal
export const createDeal = async (dealData) => {
  try {
    console.log("Creating deal with data:", JSON.stringify(dealData, null, 2));
    const response = await api.post('/deal/create', dealData);
    return response.data;
  } catch (error) {
    console.error("Deal creation error details:", error.response?.data);
    handleRequestError(error, "Failed to create deal");
  }
};

// Get all deals
export const getAllDeals = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await api.get(`/deal/all?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deals");
  }
};

// Get deal by ID
export const getDealById = async (id) => {
  try {
    const response = await api.get(`/deal/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deal");
  }
};

// Update deal
export const updateDeal = async (id, dealData) => {
  try {
    const response = await api.put(`/deal/update/${id}`, dealData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update deal");
  }
};

// Record a payment
export const recordPayment = async (paymentData) => {
  try {
    const response = await api.post('/deal/payment', paymentData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to record payment");
  }
};

// Get deal financial summary
export const getDealFinancialSummary = async (id) => {
  try {
    const response = await api.get(`/deal/${id}/summary`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deal summary");
  }
};

// Create a custom hook for authenticated user profile operations
export function useUserProfileApi() {
  const { getAccessTokenSilently } = useAuth0();
  
  // Get user profile - with auth token
  const getUserProfile = useCallback(async () => {
    try {
      // Get the Auth0 token first
      const token = await getAccessTokenSilently();
      
      // Make the API request with the token in the Authorization header
      const response = await api.get('/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (error.response?.status === 401) {
        // Token might be expired or invalid
        console.log("Authentication error: Your session may have expired");
      }
      throw error;
    }
  }, [getAccessTokenSilently]);
  
  // Update user profile - with auth token
  const updateUserProfile = useCallback(async (profileData) => {
    try {
      // Get the Auth0 token first
      const token = await getAccessTokenSilently();
      
      // Make the API request with the token in the Authorization header
      const response = await api.put('/user/profile', profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error.response?.status === 401) {
        // Token might be expired or invalid
        console.log("Authentication error: Your session may have expired");
      }
      throw error;
    }
  }, [getAccessTokenSilently]);
  
  // Return the functions
  return {
    getUserProfile,
    updateUserProfile
  };
}

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
      return null; // User not found
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
 * Get all users (admin only)
 * @returns {Promise<Array>} List of users
 */
export const getAllUserAccounts = async () => {
  try {
    const response = await api.get('/user/all');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch user accounts");
  }
};

/**
 * Get user by ID (admin only)
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserAccountById = async (id) => {
  try {
    const response = await api.get(`/user/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch user account");
  }
};

/**
 * Get property rows with optional filtering by row type
 * @param {string} rowType - Optional row type to filter by (e.g., "featured")
 * @returns {Promise<Array>} Property rows data
 */
export const getPropertyRows = async (rowType) => {
  try {
    const queryParams = rowType ? `?rowType=${encodeURIComponent(rowType)}` : '';
    const response = await api.get(`/property-rows${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching property rows:', error);
    throw error;
  }
};

/**
 * Get a specific property row
 * @param {string} id - Property row ID
 * @returns {Promise<Object>} Property row data
 */
export const getPropertyRowById = async (id) => {
  try {
    const response = await api.get(`/property-rows/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching property row ${id}:`, error);
    throw error;
  }
};

/**
 * Get the featured properties row with property details
 * @returns {Promise<Object>} Featured property row with ordered properties
 */
export const getFeaturedPropertiesRow = async () => {
  try {
    const response = await api.get('/property-rows?rowType=featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured property row:', error);
    throw error;
  }
};

// Update user status (enable/disable)
export const updateUserStatus = async (id, isActive) => {
  try {
    const response = await api.put(`/user/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user status");
  }
};

// Update updateUserProfile to handle new fields
export const updateUserProfileWithFields = async (profileData) => {
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
    throw error;
  }
};


// client/src/utils/api.js - Add/Update functions for email settings

/**
 * Get system settings
 * @returns {Promise<Object>} Settings object
 */
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return null;
  }
};

/**
 * Update system settings
 * @param {Object} settingsData - Settings data to update
 * @returns {Promise<Object>} Updated settings
 */
export const updateSystemSettings = async (settingsData) => {
  try {
    const response = await api.put('/settings', settingsData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update system settings");
  }
};

/**
 * Test SMTP connection
 * @param {Object} smtpData - SMTP connection details and test recipient
 * @returns {Promise<Object>} Response with success/failure message
 */
export const testSmtpConnection = async (smtpData) => {
  try {
    const response = await api.post('/settings/test-smtp', smtpData);
    return response.data;
  } catch (error) {
    console.error("SMTP test failed:", error.response?.data || error);
    throw error; // Rethrow to handle in the component
  }
};

/**
 * Get visitor statistics for dashboard
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Visitor statistics
 */
export const getVisitorStats = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      period: options.period || 'week',
      ...(options.startDate && { startDate: options.startDate }),
      ...(options.endDate && { endDate: options.endDate })
    });
    
    const response = await api.get(`/visitors/stats?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching visitor statistics:", error);
    return {
      dailyStats: [],
      currentPeriod: { uniqueVisitors: 0, totalVisits: 0, newVisitors: 0, returningVisitors: 0 },
      previousPeriod: { uniqueVisitors: 0, totalVisits: 0, newVisitors: 0, returningVisitors: 0 },
      topPages: [],
      deviceBreakdown: []
    };
  }
};

/**
 * Get current active visitor count
 * @returns {Promise<Object>} Current visitor count
 */
export const getCurrentVisitorCount = async () => {
  try {
    const response = await api.get('/visitors/current');
    return response.data;
  } catch (error) {
    console.error("Error fetching current visitor count:", error);
    return { currentVisitors: 0 };
  }
};


/**
 * Request property deletion (existing function - for users without delete permissions)
 * @param {string} propertyId - Property ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise<Object>} Response data
 */
export const requestPropertyDeletion = async (propertyId, reason) => {
  try {
    const response = await api.post(`/residency/request-deletion/${propertyId}`, {
      reason
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to request property deletion");
  }
};

/**
 * Direct property deletion (new function - for users with delete:properties permission)
 * @param {string} propertyId - Property ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise<Object>} Response data
 */
export const deletePropertyDirect = async (propertyId, reason) => {
  try {
    const response = await api.delete(`/residency/delete/${propertyId}`, {
      data: { reason }
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete property");
  }
};