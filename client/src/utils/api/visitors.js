// client/src/utils/api/visitors.js

import { api, handleRequestError } from './config';

/**
 * Get visitor statistics
 * @param {Object} options - Query options
 * @param {string} [options.period='week'] - Time period
 * @param {string} [options.startDate] - Start date
 * @param {string} [options.endDate] - End date
 * @returns {Promise<Object>} Visitor statistics
 */
export const getVisitorStats = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      period: options.period || 'week',
      ...(options.startDate && { startDate: options.startDate }),
      ...(options.endDate && { endDate: options.endDate })
    });
    
    const response = await api.get(`/visitors/stats?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching visitor statistics:", error);
    return {
      dailyStats: [],
      currentPeriod: { uniqueVisitors: 0, totalVisits: 0, newVisitors: 0, returningVisitors: 0 },
      previousPeriod: { uniqueVisitors: 0, totalVisits: 0, newVisitors: 0, returningVisitors: 0 },
      topPages: [],
      deviceBreakdown: []
    };
  }
};

/**
 * Get visitor activity
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Visitor activity data
 */
export const getVisitorActivity = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams(options);
    const response = await api.get(`/visitors/activity?${queryParams}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch visitor activity");
  }
};

/**
 * Get current active visitor count
 * @returns {Promise<Object>} Current visitor count
 */
export const getCurrentVisitorCount = async () => {
  try {
    const response = await api.get('/visitors/current');
    return response.data;
  } catch (error) {
    console.error("Error fetching current visitor count:", error);
    return { currentVisitors: 0 };
  }
};