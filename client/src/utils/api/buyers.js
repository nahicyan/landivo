// client/src/utils/api/buyers.js

import { api, handleRequestError } from './config';

/**
 * Get all buyers
 * @returns {Promise<Array>} List of all buyers
 */
export const getAllBuyers = async () => {
  try {
    const response = await api.get('/buyer/all');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyers");
  }
};

/**
 * Get buyer by ID
 * @param {string} id - Buyer ID
 * @returns {Promise<Object>} Buyer data
 */
export const getBuyerById = async (id) => {
  try {
    const response = await api.get(`/buyer/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer");
  }
};

/**
 * Get buyer by Auth0 ID
 * @param {string} auth0Id - Auth0 user ID
 * @returns {Promise<Object>} Buyer data
 */
export const getBuyerByAuth0Id = async (auth0Id) => {
  try {
    const response = await api.get(`/buyer/byAuth0Id?auth0Id=${auth0Id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer by Auth0 ID");
  }
};

/**
 * Get buyers by preferred area
 * @param {string} areaId - Area ID
 * @returns {Promise<Object>} Buyers in area
 */
export const getBuyersByArea = async (areaId) => {
  try {
    const response = await api.get(`/buyer/byArea/${areaId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyers by area");
  }
};

/**
 * Create a new buyer
 * @param {Object} buyerData - Buyer data
 * @returns {Promise<Object>} Created buyer
 */
export const createBuyer = async (buyerData) => {
  try {
    const response = await api.post('/buyer/create', buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create buyer");
  }
};

/**
 * Create a VIP buyer with special status
 * @param {Object} buyerData - VIP buyer data
 * @returns {Promise<Object>} Created VIP buyer
 */
export const createVipBuyer = async (buyerData) => {
  try {
    const response = await api.post('/buyer/createVipBuyer', buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create VIP buyer");
  }
};

/**
 * Update buyer information
 * @param {string} id - Buyer ID
 * @param {Object} buyerData - Updated buyer data
 * @returns {Promise<Object>} Updated buyer
 */
export const updateBuyer = async (id, buyerData) => {
  try {
    const response = await api.put(`/buyer/update/${id}`, buyerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update buyer");
  }
};

/**
 * Delete buyer
 * @param {string} id - Buyer ID
 * @returns {Promise<Object>} Response data
 */
export const deleteBuyer = async (id) => {
  try {
    const response = await api.delete(`/buyer/delete/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete buyer");
  }
};

/**
 * Import multiple buyers from CSV or other sources
 * @param {Array} buyers - Array of buyer objects
 * @param {string} source - Source of import (e.g., "CSV Import")
 * @returns {Promise<Object>} Import results
 */
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

/**
 * Get buyer statistics
 * @returns {Promise<Object>} Buyer stats (totals, by type, etc.)
 */
export const getBuyerStats = async () => {
  try {
    const response = await api.get('/buyer/stats');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyer statistics");
  }
};

/**
 * Send email to multiple buyers
 * @param {Array<string>} buyerIds - Array of buyer IDs
 * @param {string} subject - Email subject
 * @param {string} content - Email content
 * @param {boolean} includeUnsubscribed - Whether to include unsubscribed buyers
 * @returns {Promise<Object>} Send results
 */
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

export const getBuyersPaginated = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || "",
      area: params.area || "all",
      buyerType: params.buyerType || "all",
      source: params.source || "all"
    });
    
    const response = await api.get(`/buyer/paginated?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch buyers");
  }
};