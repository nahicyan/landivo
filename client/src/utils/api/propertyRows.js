// client/src/utils/api/propertyRows.js

import { api, handleRequestError } from './config';
import { getLogger } from '../logger';

const log = getLogger('propertyRowsApi');

/**
 * Get all property rows
 * @returns {Promise<Array>} List of property rows
 */
export const getAllPropertyRows = async () => {
  try {
    log.info('[propertyRows:getAllPropertyRows] > [Request]: GET /property-rows');
    const response = await api.get('/property-rows');
    log.info(
      `[propertyRows:getAllPropertyRows] > [Response]: received=${
        Array.isArray(response.data) ? response.data.length : 'unknown'
      }`
    );
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to fetch property rows");
  }
};

/**
 * Get property rows with optional filtering by row type
 * @param {string} [rowType] - Optional row type to filter by
 * @returns {Promise<Array>} Property rows data
 */
export const getPropertyRows = async (rowType) => {
  try {
    log.info(
      `[propertyRows:getPropertyRows] > [Request]: rowType=${rowType || '<none>'}`
    );
    const queryParams = rowType ? `?rowType=${encodeURIComponent(rowType)}` : '';
    const response = await api.get(`/property-rows${queryParams}`);
    log.info(
      `[propertyRows:getPropertyRows] > [Response]: rows=${
        Array.isArray(response.data) ? response.data.length : 'non-array'
      }`
    );
    return response.data;
  } catch (error) {
    log.error(`[propertyRows:getPropertyRows] > [Error]: ${error.message}`);
    throw error;
  }
};

/**
 * Get a specific property row
 * @param {string} id - Property row ID
 * @returns {Promise<Object>} Property row data
 */
export const getPropertyRowById = async (id) => {
  try {
    log.info(`[propertyRows:getPropertyRowById] > [Request]: id=${id}`);
    const response = await api.get(`/property-rows/${id}`);
    log.info(`[propertyRows:getPropertyRowById] > [Response]: id=${id}`);
    return response.data;
  } catch (error) {
    log.error(`[propertyRows:getPropertyRowById] > [Error]: ${error.message}`);
    throw error;
  }
};

/**
 * Get the featured properties row with property details
 * @returns {Promise<Object>} Featured property row with ordered properties
 */
export const getFeaturedPropertiesRow = async () => {
  try {
    log.info('[propertyRows:getFeaturedPropertiesRow] > [Request]: featured row');
    const response = await api.get('/property-rows?rowType=featured');
    log.info('[propertyRows:getFeaturedPropertiesRow] > [Response]: fetched featured row');
    return response.data;
  } catch (error) {
    log.error(`[propertyRows:getFeaturedPropertiesRow] > [Error]: ${error.message}`);
    throw error;
  }
};

/**
 * Create a new property row
 * @param {Object} rowData - Property row data
 * @returns {Promise<Object>} Created property row
 */
export const createPropertyRow = async (rowData) => {
  try {
    log.info('[propertyRows:createPropertyRow] > [Request]: POST /property-rows');
    const response = await api.post('/property-rows', rowData);
    log.info('[propertyRows:createPropertyRow] > [Response]: created row');
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to create property row");
  }
};

/**
 * Update property row
 * @param {string} id - Property row ID
 * @param {Object} rowData - Updated row data
 * @returns {Promise<Object>} Updated property row
 */
export const updatePropertyRow = async (id, rowData) => {
  try {
    log.info(`[propertyRows:updatePropertyRow] > [Request]: id=${id}`);
    const response = await api.put(`/property-rows/${id}`, rowData);
    log.info(`[propertyRows:updatePropertyRow] > [Response]: id=${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to update property row");
  }
};

/**
 * Delete property row
 * @param {string} id - Property row ID
 * @returns {Promise<Object>} Response data
 */
export const deletePropertyRow = async (id) => {
  try {
    log.info(`[propertyRows:deletePropertyRow] > [Request]: id=${id}`);
    const response = await api.delete(`/property-rows/${id}`);
    log.info(`[propertyRows:deletePropertyRow] > [Response]: id=${id}`);
    return response.data;
  } catch (error) {
    handleRequestError(error, "Failed to delete property row");
  }
};

/**
 * Get property row associations for a specific property
 * Returns which rows contain this property and its position in each row
 * @param {string} propertyId - Property ID to search for
 * @returns {Promise<Array>} Array of row associations with rowId, rowName, and position
 */
export const getPropertyRowAssociations = async (propertyId) => {
  try {
    const rows = await getAllPropertyRows();
    
    const propertyAssociations = [];
    
    for (const row of rows) {
      if (row.displayOrder && Array.isArray(row.displayOrder) && row.displayOrder.includes(propertyId)) {
        propertyAssociations.push({
          rowId: row.id,
          rowName: row.name || row.rowType || "Unnamed Row",
          position: row.displayOrder.indexOf(propertyId)
        });
      }
    }
    
    return propertyAssociations;
  } catch (error) {
    log.error(`[propertyRows:getPropertyRowAssociations] > [Error]: ${error.message}`);
    return [];
  }
};
