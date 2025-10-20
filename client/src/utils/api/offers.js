// client/src/utils/api/offers.js

import { api, handleRequestError } from './config';

/**
 * Make an offer on a property
 * @param {Object} offerData - Offer details
 * @returns {Promise<Object>} Created offer
 */
export const makeOffer = async (offerData) => {
  try {
    const response = await api.post('/offer/makeOffer', offerData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to make offer");
  }
};

/**
 * Get offer by ID
 * @param {string} offerId - Offer ID
 * @returns {Promise<Object>} Offer data
 */
export const getOfferById = async (offerId) => {
  try {
    const response = await api.get(`/offer/${offerId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch offer");
  }
};

/**
 * Get offer history (status changes, counter offers, etc.)
 * @param {string} offerId - Offer ID
 * @returns {Promise<Array>} Offer history
 */
export const getOfferHistory = async (offerId) => {
  try {
    const response = await api.get(`/offer/${offerId}/history`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch offer history");
  }
};

/**
 * Get all offers for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Property offers
 */
export const getPropertyOffers = async (propertyId) => {
  try {
    const response = await api.get(`/offer/property/${propertyId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property offers");
  }
};

/**
 * Get all offers made by a buyer
 * @param {string|Object} params - Buyer ID as string or object with query params
 * @returns {Promise<Object>} Buyer offers data
 */
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

/**
 * Accept an offer
 * @param {string} offerId - Offer ID
 * @returns {Promise<Object>} Updated offer
 */
export const acceptOffer = async (offerId) => {
  try {
    const response = await api.put(`/offer/${offerId}/accept`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to accept offer");
  }
};

/**
 * Reject an offer
 * @param {string} offerId - Offer ID
 * @param {string} message - Rejection message
 * @returns {Promise<Object>} Updated offer
 */
export const rejectOffer = async (offerId, message = "") => {
  try {
    const response = await api.put(`/offer/${offerId}/reject`, { message });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to reject offer");
  }
};

/**
 * Make a counter offer
 * @param {string} offerId - Offer ID
 * @param {number} counterPrice - Counter offer price
 * @param {string} message - Counter offer message
 * @returns {Promise<Object>} Updated offer
 */
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

/**
 * Accept a counter offer
 * @param {string} offerId - Offer ID
 * @returns {Promise<Object>} Updated offer
 */
export const acceptCounterOffer = async (offerId) => {
  try {
    const response = await api.put(`/offer/${offerId}/accept-counter`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to accept counter offer");
  }
};

/**
 * Withdraw an offer
 * @param {string} offerId - Offer ID
 * @returns {Promise<Object>} Updated offer
 */
export const withdrawOffer = async (offerId) => {
  try {
    const response = await api.put(`/offer/${offerId}/withdraw`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to withdraw offer");
  }
};

/**
 * Update offer status (CENTRALIZED STATUS UPDATE FUNCTION)
 * This replaces all manual api.put('/offer/{id}/status') calls
 * @param {string} offerId - Offer ID
 * @param {Object} statusData - Status update data
 * @param {string} statusData.status - New status (PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED)
 * @param {string} [statusData.message] - Optional message (for admin/system)
 * @param {string} [statusData.buyerMessage] - Optional buyer message
 * @param {number} [statusData.counteredPrice] - Counter offer price
 * @param {number} [statusData.acceptedPrice] - Accepted price (when accepting counter)
 * @returns {Promise<Object>} Updated offer with new status
 */
export const updateOfferStatus = async (offerId, statusData) => {
  try {
    const response = await api.put(`/offer/${offerId}/status`, statusData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update offer status");
  }
};

/**
 * Get recent offer activity across all properties
 * Returns a feed of recent offer actions (created, accepted, rejected, etc.)
 * @param {number} [limit=10] - Maximum number of activities to return
 * @returns {Promise<Array>} List of recent offer activities
 */
export const getRecentOfferActivity = async (limit = 10) => {
  try {
    const response = await api.get(`/offer/activity/recent?limit=${limit}`);
    return response.data.activities || [];
  } catch (error) {
    console.error("Error fetching offer activity:", error);
    return [];
  }
};

/**
 * Get all offers across all properties
 * Used for admin/management views
 * @param {Object} [options] - Optional query parameters
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.offset] - Offset for pagination
 * @returns {Promise<Object>} Object with offers array and metadata
 */
export const getAllOffers = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams(options);
    const endpoint = queryParams.toString() 
      ? `/offer/all?${queryParams}` 
      : '/offer/all';
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch all offers");
  }
};