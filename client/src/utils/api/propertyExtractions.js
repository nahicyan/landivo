import { api, handleRequestError } from './config';

/**
 * Get all property extractions with pagination and filters
 * @param {Object} params - Query parameters (page, limit, search, email_uid, sortBy, sortOrder)
 * @returns {Promise<Object>} Property extractions with pagination
 */
export const getAllPropertyExtractions = async (params = {}) => {
  try {
    const response = await api.get('/propertyExtracted', { params });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property extractions");
  }
};

/**
 * Get property extraction by ID
 * @param {string} id - Property extraction ID
 * @returns {Promise<Object>} Property extraction data
 */
export const getPropertyExtractionById = async (id) => {
  try {
    const response = await api.get(`/propertyExtracted/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property extraction");
  }
};

/**
 * Delete property extraction
 * @param {string} id - Property extraction ID
 * @returns {Promise<Object>} Response data
 */
export const deletePropertyExtraction = async (id) => {
  try {
    const response = await api.delete(`/propertyExtracted/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete property extraction");
  }
};