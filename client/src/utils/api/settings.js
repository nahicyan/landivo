// client/src/utils/api/settings.js

import { api, handleRequestError } from './config';

/**
 * Get system settings
 * @returns {Promise<Object>} System settings
 */
export const getSystemSettings = async () => {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return null;
  }
};

/**
 * Update system settings
 * @param {Object} settingsData - Updated settings
 * @returns {Promise<Object>} Updated settings
 */
export const updateSystemSettings = async (settingsData) => {
  try {
    const response = await api.put('/settings', settingsData);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update system settings");
  }
};

/**
 * Test SMTP connection
 * @param {Object} smtpData - SMTP configuration
 * @returns {Promise<Object>} Test results
 */
export const testSmtpConnection = async (smtpData) => {
  try {
    const response = await api.post('/settings/test-smtp', smtpData);
    return response.data;
  } catch (error) {
    console.error("SMTP test failed:", error.response?.data || error);
    throw error;
  }
};