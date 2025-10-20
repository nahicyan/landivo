// client/src/utils/api/pdfMerge.js

import { api, handleRequestError } from './config';

/**
 * Get all PDF merge templates
 * @returns {Promise<Array>} List of templates
 */
export const getPdfMergeTemplates = async () => {
  try {
    const response = await api.get('/pdf-merge/templates');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch templates");
  }
};

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Promise<Object>} Template data
 */
export const getPdfMergeTemplateById = async (id) => {
  try {
    const response = await api.get(`/pdf-merge/templates/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch template");
  }
};

/**
 * Create new PDF merge template
 * @param {FormData} formData - Form data with template file
 * @returns {Promise<Object>} Created template
 */
export const createPdfMergeTemplate = async (formData) => {
  try {
    const response = await api.post('/pdf-merge/templates', formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create template");
  }
};

/**
 * Delete PDF merge template
 * @param {string} id - Template ID
 * @returns {Promise<Object>} Response data
 */
export const deletePdfMergeTemplate = async (id) => {
  try {
    const response = await api.delete(`/pdf-merge/templates/${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete template");
  }
};

/**
 * Analyze template and CSV files to extract variables
 * @param {FormData} formData - Form data with template ID and CSV file
 * @returns {Promise<Object>} Analysis results
 */
export const analyzePdfMergeFiles = async (formData) => {
  try {
    const response = await api.post('/pdf-merge/analyze', formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to analyze files");
  }
};

/**
 * Generate merged PDF from template and data
 * @param {FormData} formData - Form data with template ID, CSV, and mappings
 * @returns {Promise<Object>} Generation result
 */
export const generateMergedPdf = async (formData) => {
  try {
    const response = await api.post('/pdf-merge/generate', formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 3600000 // 1 hour timeout for large files
    });
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to generate PDF");
  }
};

/**
 * Get PDF merge generation progress
 * @param {string} progressId - Progress ID from generation
 * @returns {Promise<Object>} Progress data
 */
export const getPdfMergeProgress = async (progressId) => {
  try {
    const response = await api.get(`/pdf-merge/progress/${progressId}`);
    return response.data;
  } catch (error) {
    // Don't throw error for progress polling - just log it
    console.error("Failed to fetch progress:", error);
    return { success: false };
  }
};