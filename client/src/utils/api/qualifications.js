// client/src/utils/api/qualifications.js

import { api, handleRequestError } from './config';

/**
 * Submit a qualification form
 * @param {Object} qualificationData - Qualification form data
 * @returns {Promise<Object>} Created qualification
 */
export const submitQualification = async (qualificationData) => {
  try {
    const response = await api.post('/qualification/create', qualificationData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to submit qualification");
  }
};

/**
 * Get all qualifications for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Property qualifications
 */
export const getPropertyQualifications = async (propertyId) => {
  try {
    const response = await api.get(`/qualification/property/${propertyId}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property qualifications");
  }
};

/**
 * Get all qualifications with pagination and filters
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Paginated qualifications
 */
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