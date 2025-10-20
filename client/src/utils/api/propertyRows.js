// client/src/utils/api/propertyRows.js

import { api, handleRequestError } from './config';

/**
 * Get all property rows
 * @returns {Promise<Array>} List of property rows
 */
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
 * @param {string} [rowType] - Optional row type to filter by
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

/**
 * Create a new property row
 * @param {Object} rowData - Property row data
 * @returns {Promise<Object>} Created property row
 */
export const createPropertyRow = async (rowData) => {
  try {
    const response = await api.post('/property-rows', rowData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create property row");
  }
};

/**
 * Update property row
 * @param {string} id - Property row ID
 * @param {Object} rowData - Updated row data
 * @returns {Promise<Object>} Updated property row
 */
export const updatePropertyRow = async (id, rowData) => {
  try {
    const response = await api.put(`/property-rows/${id}`, rowData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update property row");
  }
};

/**
 * Delete property row
 * @param {string} id - Property row ID
 * @returns {Promise<Object>} Response data
 */
export const deletePropertyRow = async (id) => {
  try {
    const response = await api.delete(`/property-rows/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete property row");
  }
};