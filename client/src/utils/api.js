// client/src/utils/api.js

import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { toast } from 'react-toastify';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
});

// Helper function to handle errors
const handleRequestError = (error, message) => {
  console.error(`${message}:`, error);
  throw error;
};

// ============================================================================
// PROPERTIES
// ============================================================================

export const getAllProperties = async () => {
  try {
    const response = await api.get('/residency/allresd');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch properties");
  }
};

export const getProperty = async (id) => {
  try {
    const response = await api.get(`/residency/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    return {
      title: "Unknown Property",
      streetAddress: "Address not available"
    };
  }
};

export const createProperty = async (propertyData) => {
  try {
    const response = await api.post('/residency/create', propertyData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create property");
  }
};

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

export const updateProperty = async (id, updatedData) => {
  try {
    const response = await api.put(`/residency/update/${id}`, updatedData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update property");
  }
};

export const deleteProperty = async (id) => {
  try {
    const response = await api.delete(`/residency/delete/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete property");
  }
};

/**
 * Request property deletion (for users without delete permissions)
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
 * Direct property deletion (for users with delete permissions)
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

// ============================================================================
// BUYERS
// ============================================================================

export const getAllBuyers = async () => {
  try {
    const response = await api.get('/buyer/all');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyers");
  }
};

export const getBuyerById = async (id) => {
  try {
    const response = await api.get(`/buyer/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer");
  }
};

export const getBuyerByAuth0Id = async (auth0Id) => {
  try {
    const response = await api.get(`/buyer/byAuth0Id?auth0Id=${auth0Id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer by Auth0 ID");
  }
};

export const getBuyersByArea = async (areaId) => {
  try {
    const response = await api.get(`/buyer/byArea/${areaId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyers by area");
  }
};

export const createBuyer = async (buyerData) => {
  try {
    const response = await api.post('/buyer/create', buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create buyer");
  }
};

export const createVipBuyer = async (buyerData) => {
  try {
    const response = await api.post('/buyer/createVipBuyer', buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create VIP buyer");
  }
};

export const updateBuyer = async (id, buyerData) => {
  try {
    const response = await api.put(`/buyer/update/${id}`, buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update buyer");
  }
};

export const deleteBuyer = async (id) => {
  try {
    const response = await api.delete(`/buyer/delete/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete buyer");
  }
};

export const importBuyers = async (buyers, source = "CSV Import") => {
  try {
    const response = await api.post('/buyer/import', {
      buyers,
      source
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to import buyers");
  }
};

export const getBuyerStats = async () => {
  try {
    const response = await api.get('/buyer/stats');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer statistics");
  }
};

export const sendEmailToBuyers = async (buyerIds, subject, content, includeUnsubscribed = false) => {
  try {
    const response = await api.post('/buyer/sendEmail', {
      buyerIds,
      subject,
      content,
      includeUnsubscribed
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to send emails to buyers");
  }
};

// ============================================================================
// BUYER ACTIVITY
// ============================================================================

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
 * @param {number} [options.limit=500] - Results per page
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
      limit: options.limit || 500,
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

// ============================================================================
// OFFERS
// ============================================================================

export const makeOffer = async (offerData) => {
  try {
    const response = await api.post('/offer/makeOffer', offerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to make offer");
  }
};

export const getOfferById = async (offerId) => {
  try {
    const response = await api.get(`/offer/${offerId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch offer");
  }
};

export const getOfferHistory = async (offerId) => {
  try {
    const response = await api.get(`/offer/${offerId}/history`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch offer history");
  }
};

export const getPropertyOffers = async (propertyId) => {
  try {
    const response = await api.get(`/offer/property/${propertyId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property offers");
  }
};

export const getBuyerOffers = async (params) => {
  try {
    let endpoint;
    
    if (typeof params === 'string') {
      endpoint = `/offer/buyer?buyerId=${params}`;
    } else if (params && typeof params === 'object') {
      if (params.buyerId) {
        endpoint = `/offer/buyer?buyerId=${params.buyerId}`;
      } else if (params.email) {
        endpoint = `/offer/buyer?email=${encodeURIComponent(params.email)}`;
      } else if (params.phone) {
        endpoint = `/offer/buyer?phone=${encodeURIComponent(params.phone)}`;
      } else if (params.auth0Id) {
        endpoint = `/offer/buyer?auth0Id=${params.auth0Id}`;
      } else {
        console.error('Missing required parameter in getBuyerOffers:', params);
        return { offers: [] };
      }
    } else {
      console.error('Invalid parameters for getBuyerOffers:', params);
      return { offers: [] };
    }
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching buyer offers:", error);
    return { 
      offers: [],
      buyer: null,
      totalOffers: 0 
    };
  }
};

export const acceptOffer = async (offerId) => {
  try {
    const response = await api.put(`/offer/${offerId}/accept`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to accept offer");
  }
};

export const rejectOffer = async (offerId, message = "") => {
  try {
    const response = await api.put(`/offer/${offerId}/reject`, { message });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to reject offer");
  }
};

export const counterOffer = async (offerId, counterPrice, message = "") => {
  try {
    const response = await api.put(`/offer/${offerId}/counter`, {
      counterPrice,
      message
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to counter offer");
  }
};

export const acceptCounterOffer = async (offerId) => {
  try {
    const response = await api.put(`/offer/${offerId}/accept-counter`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to accept counter offer");
  }
};

export const withdrawOffer = async (offerId) => {
  try {
    const response = await api.put(`/offer/${offerId}/withdraw`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to withdraw offer");
  }
};

// ============================================================================
// EMAIL LISTS
// ============================================================================

export const getAllEmailLists = async () => {
  try {
    const response = await api.get('/email-lists');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch email lists");
  }
};

// Alias for backward compatibility
export const getEmailLists = getAllEmailLists;

export const getEmailList = async (id) => {
  try {
    const response = await api.get(`/email-lists/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch email list");
  }
};

export const createEmailList = async (listData) => {
  try {
    const response = await api.post('/email-lists', listData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create email list");
  }
};

export const updateEmailList = async (id, listData) => {
  try {
    const response = await api.put(`/email-lists/${id}`, listData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update email list");
  }
};

export const deleteEmailList = async (id, deleteBuyers = false) => {
  try {
    const response = await api.delete(`/email-lists/${id}`, {
      data: { deleteBuyers }
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete email list");
  }
};

export const addBuyersToList = async (listId, buyerIds) => {
  try {
    const response = await api.post(`/email-lists/${listId}/add-buyers`, { buyerIds });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to add buyers to list");
  }
};

export const removeBuyersFromList = async (listId, buyerIds) => {
  try {
    const response = await api.post(`/email-lists/${listId}/remove-buyers`, { buyerIds });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to remove buyers from list");
  }
};

export const sendEmailToList = async (listId, emailData) => {
  try {
    const response = await api.post(`/email-lists/${listId}/send-email`, emailData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to send email to list");
  }
};

// ============================================================================
// QUALIFICATIONS
// ============================================================================

export const submitQualification = async (qualificationData) => {
  try {
    const response = await api.post('/qualification/create', qualificationData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to submit qualification");
  }
};

export const getPropertyQualifications = async (propertyId) => {
  try {
    const response = await api.get(`/qualification/property/${propertyId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property qualifications");
  }
};

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

// ============================================================================
// DEALS
// ============================================================================

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

export const getAllDeals = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await api.get(`/deal/all?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deals");
  }
};

export const getDealById = async (id) => {
  try {
    const response = await api.get(`/deal/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deal");
  }
};

export const updateDeal = async (id, dealData) => {
  try {
    const response = await api.put(`/deal/update/${id}`, dealData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update deal");
  }
};

export const recordPayment = async (paymentData) => {
  try {
    const response = await api.post('/deal/payment', paymentData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to record payment");
  }
};

export const getDealFinancialSummary = async (id) => {
  try {
    const response = await api.get(`/deal/${id}/summary`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deal summary");
  }
};

// ============================================================================
// USERS
// ============================================================================

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

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/user/update/${id}`, userData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update user");
  }
};

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

// ============================================================================
// USER PROFILE (with Auth0 token)
// ============================================================================

/**
 * Custom hook for authenticated user profile operations
 * Uses Auth0 token for authentication
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

// ============================================================================
// SETTINGS
// ============================================================================

export const getSystemSettings = async () => {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return null;
  }
};

export const updateSystemSettings = async (settingsData) => {
  try {
    const response = await api.put('/settings', settingsData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update system settings");
  }
};

export const testSmtpConnection = async (smtpData) => {
  try {
    const response = await api.post('/settings/test-smtp', smtpData);
    return response.data;
  } catch (error) {
    console.error("SMTP test failed:", error.response?.data || error);
    throw error;
  }
};

// ============================================================================
// VISITORS
// ============================================================================

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

export const getVisitorActivity = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams(options);
    const response = await api.get(`/visitors/activity?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch visitor activity");
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

// ============================================================================
// PROPERTY ROWS
// ============================================================================

export const getAllPropertyRows = async () => {
  try {
    const response = await api.get('/property-rows');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property rows");
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

export const createPropertyRow = async (rowData) => {
  try {
    const response = await api.post('/property-rows', rowData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create property row");
  }
};

export const updatePropertyRow = async (id, rowData) => {
  try {
    const response = await api.put(`/property-rows/${id}`, rowData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update property row");
  }
};

export const deletePropertyRow = async (id) => {
  try {
    const response = await api.delete(`/property-rows/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete property row");
  }
};