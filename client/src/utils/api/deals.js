// client/src/utils/api/deals.js

import { api, handleRequestError } from './config';

/**
 * Create a new deal
 * @param {Object} dealData - Deal data
 * @returns {Promise<Object>} Created deal
 */
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

/**
 * Get all deals with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of deals
 */
export const getAllDeals = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await api.get(`/deal/all?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deals");
  }
};

/**
 * Get deal by ID
 * @param {string} id - Deal ID
 * @returns {Promise<Object>} Deal data
 */
export const getDealById = async (id) => {
  try {
    const response = await api.get(`/deal/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deal");
  }
};

/**
 * Update deal information
 * @param {string} id - Deal ID
 * @param {Object} dealData - Updated deal data
 * @returns {Promise<Object>} Updated deal
 */
export const updateDeal = async (id, dealData) => {
  try {
    const response = await api.put(`/deal/update/${id}`, dealData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update deal");
  }
};

/**
 * Record a payment for a deal
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Recorded payment
 */
export const recordPayment = async (paymentData) => {
  try {
    const response = await api.post('/deal/payment', paymentData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to record payment");
  }
};

/**
 * Get financial summary for a deal
 * @param {string} id - Deal ID
 * @returns {Promise<Object>} Financial summary
 */
export const getDealFinancialSummary = async (id) => {
  try {
    const response = await api.get(`/deal/${id}/summary`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch deal summary");
  }
};