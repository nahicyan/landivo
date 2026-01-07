// client/src/utils/api/emailLists.js

import { api, handleRequestError } from './config';

/**
 * Get all email lists
 * @returns {Promise<Array>} List of email lists
 */
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

/**
 * Get email list by ID
 * @param {string} id - Email list ID
 * @returns {Promise<Object>} Email list data
 */
export const getEmailList = async (id) => {
  try {
    const response = await api.get(`/email-lists/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch email list");
  }
};

/**
 * Create a new email list
 * @param {Object} listData - Email list data
 * @returns {Promise<Object>} Created email list
 */
export const createEmailList = async (listData) => {
  try {
    const response = await api.post('/email-lists', listData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create email list");
  }
};

/**
 * Update email list
 * @param {string} id - Email list ID
 * @param {Object} listData - Updated list data
 * @returns {Promise<Object>} Updated email list
 */
export const updateEmailList = async (id, listData) => {
  try {
    const response = await api.put(`/email-lists/${id}`, listData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update email list");
  }
};

/**
 * Delete email list
 * @param {string} id - Email list ID
 * @param {boolean} deleteBuyers - Whether to delete associated buyers
 * @returns {Promise<Object>} Response data
 */
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

/**
 * Add buyers to email list
 * @param {string} listId - Email list ID
 * @param {Array<string>} buyerIds - Array of buyer IDs
 * @returns {Promise<Object>} Response data
 */
export const addBuyersToList = async (listId, buyerIds) => {
  try {
    const response = await api.post(`/email-lists/${listId}/add-buyers`, { buyerIds });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to add buyers to list");
  }
};

/**
 * Remove buyers from email list
 * @param {string} listId - Email list ID
 * @param {Array<string>} buyerIds - Array of buyer IDs
 * @returns {Promise<Object>} Response data
 */
export const removeBuyersFromList = async (listId, buyerIds) => {
  try {
    const response = await api.post(`/email-lists/${listId}/remove-buyers`, { buyerIds });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to remove buyers from list");
  }
};

/**
 * Send email to all buyers in a list
 * @param {string} listId - Email list ID
 * @param {Object} emailData - Email data (subject, content, etc.)
 * @returns {Promise<Object>} Send results
 */
export const sendEmailToList = async (listId, emailData) => {
  try {
    const response = await api.post(`/email-lists/${listId}/send-email`, emailData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to send email to list");
  }
};
