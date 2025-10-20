// client/src/utils/api/campaigns.js

import axios from 'axios';
import { mailivoApi, handleRequestError } from './config';

// Direct Mailivo API URL for templates and campaigns history
const MAILIVO_API_URL = 'https://api.mailivo.landivo.com';

// ============================================================================
// CAMPAIGN SENDING
// ============================================================================

/**
 * Send property upload campaign via Mailivo
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<Object>} Campaign response
 */
export const sendPropertyUploadCampaign = async (campaignData) => {
  try {
    const response = await mailivoApi.post('/automation-landivo/propertyUpload', campaignData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to send property upload campaign");
  }
};

/**
 * Send property discount campaign via Mailivo
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<Object>} Campaign response
 */
export const sendPropertyDiscountCampaign = async (campaignData) => {
  try {
    const response = await mailivoApi.post('/automation-landivo/propertyUpdate/discount', campaignData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to send discount campaign");
  }
};

// ============================================================================
// TEMPLATES & CAMPAIGN HISTORY
// ============================================================================

/**
 * Get email subject line templates from Mailivo
 * @returns {Promise<Object>} Templates data with success flag
 */
export const getSubjectTemplates = async () => {
  try {
    const response = await axios.get(`${MAILIVO_API_URL}/subject-templates`);
    return response.data;
  } catch (error) {
    console.error("Error loading subject templates:", error);
    throw error;
  }
};

/**
 * Get past campaign subjects for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Object>} Past campaign subjects with success flag
 */
export const getPastCampaignSubjects = async (propertyId) => {
  try {
    const response = await axios.get(`${MAILIVO_API_URL}/campaigns/subjects/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error loading past campaigns:", error);
    throw error;
  }
};