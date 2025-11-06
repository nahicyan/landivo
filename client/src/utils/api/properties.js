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

/**
 * Get finance applications for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} List of finance applications for the property
 */
export const getPropertyFinanceApplications = async (propertyId) => {
  try {
    const response = await api.get(`/properties/${propertyId}/finance-applications`);
    return response.data;
  } catch (error) {
    console.error("Error fetching finance applications:", error);
    // Return empty array instead of throwing to prevent UI breaks
    return [];
  }
};

/**
 * Get offers for a property (property-centric endpoint)
 * Alternative to getPropertyOffers from offers.js
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} List of offers for the property
 */
export const getPropertyOffersData = async (propertyId) => {
  try {
    const response = await api.get(`/properties/${propertyId}/offers`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property offers:", error);
    return [];
  }
};

/**
 * Get activity history for a property
 * Includes views, inquiries, and other property-related activities
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} List of activities for the property
 */
export const getPropertyActivities = async (propertyId) => {
  try {
    const response = await api.get(`/properties/${propertyId}/activities`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property activities:", error);
    return [];
  }
};

/**
 * Request bulk property deletion (for users without delete permissions)
 * @param {string[]} propertyIds - Array of Property IDs
 * @param {string} reason - Reason for deletion
 * @returns {Promise<Object>} Response data
 */
export const requestPropertyBulkDeletion = async (propertyIds, reason) => {
  try {
    const response = await api.post(`/residency/request-bulk-deletion`, {
      propertyIds,
      reason
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to request bulk property deletion");
  }
};

/**
 * Direct bulk property deletion (for users with delete permissions)
 * @param {string[]} propertyIds - Array of Property IDs
 * @param {string} reason - Reason for deletion
 * @returns {Promise<Object>} Response data
 */
export const deletePropertiesBulk = async (propertyIds, reason) => {
  try {
    const response = await api.post(`/residency/delete-bulk`, {
      propertyIds,
      reason
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete properties");
  }
};