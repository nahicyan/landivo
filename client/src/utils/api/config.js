// client/src/utils/api/config.js

import axios from 'axios';

/**
 * Main API instance for backend calls
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
});

/**
 * Mailivo API instance for campaign calls
 */
export const mailivoApi = axios.create({
  baseURL: import.meta.env.VITE_MAILIVO_API_URL || import.meta.env.VITE_MAILIVO_URL,
  withCredentials: true,
});

/**
 * Centralized error handler for API requests
 * @param {Error} error - The error object
 * @param {string} message - Custom error message
 */
export const handleRequestError = (error, message) => {
  console.error(`${message}:`, error);
  throw error;
};