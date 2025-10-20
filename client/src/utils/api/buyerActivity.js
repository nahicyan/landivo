// client/src/utils/api/buyerActivity.js

import { api, handleRequestError } from './config';

/**
 * Record buyer activity events
 * @param {Array|Object} events - Activity event(s) to record
 * @returns {Promise<Object>} Response data
 */
export const recordBuyerActivity = async (events) => {
  try {
    const payload = Array.isArray(events) ? { events } : events;
    const response = await api.post('/buyer/activity', payload);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to record buyer activity");
  }
};

/**
 * Get activity data for a specific buyer
 * @param {string} buyerId - Buyer ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Activity data with pagination
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
 * @param {Object} options - Delete options
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