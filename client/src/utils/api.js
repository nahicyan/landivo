// client/src/utils/api.js

/**
 * Central API export file
 * This file acts as a barrel export - importing all API functions from modular files
 * and re-exporting them for easy consumption by components
 */

// Export axios instances and config
export { api, mailivoApi, handleRequestError } from './api/config';

// Properties API
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

// Buyers API
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

// Buyer Activity API
export {
  recordBuyerActivity,
  getBuyerActivity,
  getBuyerActivitySummary,
  deleteBuyerActivity
} from './api/buyerActivity';

// Offers API
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

// Email Lists API
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

// Qualifications API
export {
  submitQualification,
  getPropertyQualifications,
  getAllQualifications
} from './api/qualifications';

// Deals API
export {
  createDeal,
  getAllDeals,
  getDealById,
  updateDeal,
  recordPayment,
  getDealFinancialSummary
} from './api/deals';

// Users API
export {
  getAllUsers,
  getAllUserAccounts,
  getUserById,
  getUserAccountById,
  updateUser,
  deleteUser,
  updateUserStatus,
  checkUserExists,
  syncAuth0User,
  useUserProfileApi
} from './api/users';

// Settings API
export {
  getSystemSettings,
  updateSystemSettings,
  testSmtpConnection
} from './api/settings';

// Visitors API
export {
  getVisitorStats,
  getVisitorActivity,
  getCurrentVisitorCount
} from './api/visitors';

// Property Rows API
export {
  getAllPropertyRows,
  getPropertyRows,
  getPropertyRowById,
  getFeaturedPropertiesRow,
  createPropertyRow,
  updatePropertyRow,
  deletePropertyRow
} from './api/propertyRows';

// PDF Merge API
export {
  getPdfMergeTemplates,
  getPdfMergeTemplateById,
  createPdfMergeTemplate,
  deletePdfMergeTemplate,
  analyzePdfMergeFiles,
  generateMergedPdf,
  getPdfMergeProgress
} from './api/pdfMerge';

// Campaigns API
export {
  sendPropertyUploadCampaign,
  sendPropertyDiscountCampaign
} from './api/campaigns';