// client/src/utils/api/properties.js

import { api, handleRequestError } from './config';

/**
 * Get all properties
 * @returns {Promise<Array>} List of all properties
 */
export const getAllProperties = async () => {
  try {
    const response = await api.get('/residency/allresd');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch properties");
  }
};

/**
 * Get a single property by ID
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Property data
 */
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

/**
 * Create a new property
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} Created property
 */
export const createProperty = async (propertyData) => {
  try {
    const response = await api.post('/residency/create', propertyData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create property");
  }
};

/**
 * Create property with files (images, documents)
 * @param {FormData} formData - Form data with property info and files
 * @returns {Promise<Object>} Created property
 */
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

/**
 * Update property details
 * @param {string} id - Property ID
 * @param {Object} updatedData - Updated property data
 * @returns {Promise<Object>} Updated property
 */
export const updateProperty = async (id, updatedData) => {
  try {
    const response = await api.put(`/residency/update/${id}`, updatedData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update property");
  }
};

/**
 * Delete property
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Response data
 */
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

/**
 * Approve property deletion with token from email
 * @param {string} token - Approval token from email
 * @returns {Promise<Object>} Response data
 */
export const approvePropertyDeletion = async (token) => {
  try {
    const response = await api.post(`/residency/approve-deletion/${token}`, {}, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to approve property deletion");
  }
};