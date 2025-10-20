// client/src/utils/api.js

/**
 * Central API Export File
 * =======================
 * This file acts as a barrel export - importing all API functions from modular files
 * and re-exporting them for easy consumption by components.
 * 
 * Usage:
 * import { getAllProperties, createBuyer, getSystemSettings, getAvatarUrl } from '@/utils/api';
 */

// ============================================================================
// CONFIGURATION & CORE
// ============================================================================

// Export axios instances, config, and URL helpers
export { 
  api, 
  mailivoApi, 
  handleRequestError,
  getServerUrl,
  getAvatarUrl,
  getUploadUrl,
  getMailivoApiUrl
} from './api/config';

// ============================================================================
// PROPERTIES API
// ============================================================================

export {
  getAllProperties,
  getProperty,
  createProperty,
  createResidencyWithFiles,
  updateProperty,
  deleteProperty,
  requestPropertyDeletion,
  deletePropertyDirect,
  approvePropertyDeletion
} from './api/properties';

// ============================================================================
// BUYERS API
// ============================================================================

export {
  getAllBuyers,
  getBuyerById,
  getBuyerByAuth0Id,
  getBuyersByArea,
  createBuyer,
  createVipBuyer,
  updateBuyer,
  deleteBuyer,
  importBuyers,
  getBuyerStats,
  sendEmailToBuyers
} from './api/buyers';

// ============================================================================
// BUYER ACTIVITY API
// ============================================================================

export {
  recordBuyerActivity,
  getBuyerActivity,
  getBuyerActivitySummary,
  deleteBuyerActivity
} from './api/buyerActivity';

// ============================================================================
// OFFERS API
// ============================================================================

export {
  makeOffer,
  getOfferById,
  getOfferHistory,
  getPropertyOffers,
  getBuyerOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounterOffer,
  withdrawOffer
} from './api/offers';

// ============================================================================
// EMAIL LISTS API
// ============================================================================

export {
  getAllEmailLists,
  getEmailLists,
  getEmailList,
  createEmailList,
  updateEmailList,
  deleteEmailList,
  addBuyersToList,
  removeBuyersFromList,
  sendEmailToList
} from './api/emailLists';

// ============================================================================
// QUALIFICATIONS API
// ============================================================================

export {
  submitQualification,
  getPropertyQualifications,
  getAllQualifications
} from './api/qualifications';

// ============================================================================
// DEALS API
// ============================================================================

export {
  createDeal,
  getAllDeals,
  getDealById,
  updateDeal,
  recordPayment,
  getDealFinancialSummary
} from './api/deals';

// ============================================================================
// USERS API
// ============================================================================

export {
  // Basic CRUD
  getAllUsers,
  getAllUserAccounts,
  getUserById,
  getUserAccountById,
  updateUser,
  deleteUser,
  updateUserStatus,
  
  // User Existence & Sync
  checkUserExists,
  syncAuth0User,
  
  // Property Profiles
  getUserPropertyProfiles,
  updateUserProfilesById,
  updateUserProfiles,
  
  // Authenticated Profile Hook
  useUserProfileApi
} from './api/users';

// ============================================================================
// SETTINGS API
// ============================================================================

export {
  getSystemSettings,
  updateSystemSettings,
  testSmtpConnection
} from './api/settings';

// ============================================================================
// VISITORS API
// ============================================================================

export {
  getVisitorStats,
  getVisitorActivity,
  getCurrentVisitorCount
} from './api/visitors';

// ============================================================================
// PROPERTY ROWS API
// ============================================================================

export {
  getAllPropertyRows,
  getPropertyRows,
  getPropertyRowById,
  getFeaturedPropertiesRow,
  createPropertyRow,
  updatePropertyRow,
  deletePropertyRow
} from './api/propertyRows';

// ============================================================================
// PDF MERGE API
// ============================================================================

export {
  getPdfMergeTemplates,
  getPdfMergeTemplateById,
  createPdfMergeTemplate,
  deletePdfMergeTemplate,
  analyzePdfMergeFiles,
  generateMergedPdf,
  getPdfMergeProgress
} from './api/pdfMerge';

// ============================================================================
// CAMPAIGNS API
// ============================================================================

export {
  sendPropertyUploadCampaign,
  sendPropertyDiscountCampaign,
  getSubjectTemplates,
  getPastCampaignSubjects
} from './api/campaigns';