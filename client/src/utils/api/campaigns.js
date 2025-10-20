// client/src/utils/api/campaigns.js

import { mailivoApi, handleRequestError } from './config';

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