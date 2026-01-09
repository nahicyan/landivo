// client/src/utils/api/config.js
import axios from 'axios';
import { getLogger } from '../logger';

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

const apiLog = getLogger('apiConfig');
const mailivoLog = getLogger('mailivoApi');

const logRequest = (log, config) => {
  log.info(
    `[${log.context}] > [Request]: ${config.method?.toUpperCase()} ${config.url}`
  );
  return config;
};

const logResponse = (log, response) => {
  log.info(
    `[${log.context}] > [Response]: ${response.status} ${response.config?.url}`
  );
  return response;
};

const logError = (log, error) => {
  log.error(
    `[${log.context}] > [Error]: ${error?.response?.status || 'unknown'} ${error?.config?.url || ''} ${error.message}`
  );
  return Promise.reject(error);
};

api.interceptors.request.use((config) => logRequest(apiLog, config));
api.interceptors.response.use(
  (response) => logResponse(apiLog, response),
  (error) => logError(apiLog, error)
);

mailivoApi.interceptors.request.use((config) => logRequest(mailivoLog, config));
mailivoApi.interceptors.response.use(
  (response) => logResponse(mailivoLog, response),
  (error) => logError(mailivoLog, error)
);

/**
 * Centralized error handler for API requests
 * @param {Error} error - The error object
 * @param {string} message - Custom error message
 */
export const handleRequestError = (error, message) => {
  apiLog.error(`[handleRequestError] > [Error]: ${message} ${error.message}`);
  throw error;
};

// ============================================================================
// URL HELPER FUNCTIONS
// ============================================================================

/**
 * Get full server URL
 * @returns {string} Server base URL
 */
export const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || 'https://api.landivo.com';
};

/**
 * Get full avatar URL from relative path
 * @param {string} avatarPath - Relative avatar path (e.g., 'uploads/avatars/avatar.jpg')
 * @returns {string} Full avatar URL
 */
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  // If already a full URL, return as is
  if (avatarPath.startsWith('http')) return avatarPath;
  // Otherwise construct full URL
  return `${getServerUrl()}/${avatarPath}`;
};

/**
 * Get full upload URL from relative path
 * @param {string} uploadPath - Relative upload path
 * @returns {string} Full upload URL
 */
export const getUploadUrl = (uploadPath) => {
  if (!uploadPath) return null;
  if (uploadPath.startsWith('http')) return uploadPath;
  return `${getServerUrl()}/${uploadPath}`;
};

/**
 * Get Mailivo API URL
 * @returns {string} Mailivo API base URL
 */
export const getMailivoApiUrl = () => {
  return import.meta.env.VITE_MAILIVO_API_URL || 
         import.meta.env.VITE_MAILIVO_URL || 
         'https://api.mailivo.landivo.com';
};
