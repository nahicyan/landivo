import asyncHandler from "express-async-handler";
import mongoose from "../config/mongoose.js";
import { connectMongo } from "../config/mongoose.js";
import { getLogger } from "../utils/logger.js";
import {
  ActivityLog,
  Buyer,
  Deal,
  Qualification,
  Property,
  User,
} from "../models/index.js";

const log = getLogger("auditMiddleware");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

/**
 * Middleware to track activity for auditing purposes
 * Records actions in the ActivityLog table
 */
export const trackActivity = asyncHandler(async (req, res, next) => {
  // Get original response end method
  const originalEnd = res.end;
  
  // Replace end method to capture after request is processed
  res.end = async function(chunk, encoding) {
    // Get the authenticated user's database ID
    const userId = req.userId;
    
    // Only track activities for authenticated users
    if (userId) {
      try {
        await connectMongo();
        // Extract information from request
        const { method, originalUrl, body } = req;
        const entityType = getEntityTypeFromUrl(originalUrl);
        const entityId = getEntityIdFromUrl(originalUrl);
        const actionType = getActionTypeFromMethod(method);
        
        if (entityType && actionType) {
          // Create activity log entry
          const userObjectId = toObjectId(userId);
          if (userObjectId) {
            await ActivityLog.create({
              entityType,
              entityId: entityId || "unknown",
              actionType,
              userId: userObjectId,
              previousData: req.previousData || null,
              newData: method !== "GET" ? body : null,
              details: `${actionType} ${entityType}${
                entityId ? ` with ID ${entityId}` : ""
              }`,
              ipAddress: req.ip || req.connection?.remoteAddress,
              userAgent: req.headers["user-agent"],
            });
          }
        }
      } catch (error) {
        log.error(
          `[auditMiddleware:trackActivity] > [Error]: ${error?.message || error}`
        );
        // Don't block the response if logging fails
      }
    }
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

/**
 * Middleware to track modifications to specific entity types
 * Adds modification history to entities that support it
 */
export const trackModifications = (entityType) => {
  return async (req, res, next) => {
    try {
      // Only track for write operations (POST, PUT, PATCH)
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const userId = req.userId;
        
        if (!userId) {
          // Skip modification tracking if no user ID
          return next();
        }
        await connectMongo();
        
        // Handle entity updates with ID
        if (req.params.id && (req.method === 'PUT' || req.method === 'PATCH')) {
          const id = req.params.id;
          let previousData = null;
          const objectId = toObjectId(id);
          
          // Get previous data for comparison
          switch (entityType) {
            case 'Property':
              previousData = objectId ? await Property.findById(objectId).lean() : null;
              break;
            case 'Buyer':
              previousData = objectId ? await Buyer.findById(objectId).lean() : null;
              break;
            case 'Deal':
              previousData = objectId ? await Deal.findById(objectId).lean() : null;
              break;
            case 'User':
              previousData = objectId ? await User.findById(objectId).lean() : null;
              break;
            case 'Qualification':
              previousData = objectId ? await Qualification.findById(objectId).lean() : null;
              break;
            // Add other entity types as needed
          }
          
          if (previousData) {
            // Store for activity log
            req.previousData = previousData;
            
            // Create modification record
            const modification = {
              timestamp: new Date(),
              userId,
              action: req.method === 'PUT' ? 'update' : 'patch',
              changes: {}
            };
            
            // Track changes for each field
            Object.keys(req.body).forEach(key => {
              if (JSON.stringify(previousData[key]) !== JSON.stringify(req.body[key])) {
                modification.changes[key] = {
                  from: previousData[key],
                  to: req.body[key]
                };
              }
            });
            
            // Only add to history if there are changes
            if (Object.keys(modification.changes).length > 0) {
              // Get existing history
              const existingHistory = previousData.modificationHistory || [];
              
              // Add to request body for controller to save
              req.body.modificationHistory = [...existingHistory, modification];
              
              // Add updatedById field
              req.body.updatedById = userId;
            }
          }
        } 
        // Handle new entity creation
        else if (req.method === 'POST') {
          // Set createdById for new entities
          req.body.createdById = userId;
          
          // Also set as updatedById since it's the same for new records
          req.body.updatedById = userId;
          
          // Initialize empty modification history
          req.body.modificationHistory = [];
        }
      }
    } catch (error) {
      log.error(
        `[auditMiddleware:trackModifications] > [Error]: entity=${entityType}, ${error?.message || error}`
      );
      // Don't block the request if tracking fails
    }
    
    next();
  };
};

/**
 * Helper function to extract entity type from URL
 */
function getEntityTypeFromUrl(url) {
  if (url.includes('/property')) return 'Property';
  if (url.includes('/buyer')) return 'Buyer';
  if (url.includes('/deal')) return 'Deal';
  if (url.includes('/user')) return 'User';
  if (url.includes('/qualification')) return 'Qualification';
  if (url.includes('/email-list')) return 'EmailList';
  return null;
}

/**
 * Helper function to extract entity ID from URL
 */
function getEntityIdFromUrl(url) {
  // Match patterns like /entity/ID or /entity/action/ID
  const match = url.match(/\/[^\/]+\/([^\/]+)$/) || 
                url.match(/\/[^\/]+\/[^\/]+\/([^\/]+)$/);
  
  if (match && match[1] && !['create', 'all', 'profile', 'sync'].includes(match[1])) {
    return match[1];
  }
  
  return null;
}

/**
 * Helper function to determine action type from HTTP method
 */
function getActionTypeFromMethod(method) {
  switch (method) {
    case 'POST': return 'create';
    case 'PUT': return 'update';
    case 'PATCH': return 'patch';
    case 'DELETE': return 'delete';
    case 'GET': return 'view';
    default: return 'unknown';
  }
}

export default { trackActivity, trackModifications };
