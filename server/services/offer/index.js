// server/services/offer/index.js
import {
  makeOffer,
  getOffersOnProperty,
  getOffersByBuyer,
  updateOfferStatus,
  getOfferHistory,
  getAllOffers,
  getRecentOfferActivity
} from './offerController.js';

// For Admin Email Notifications
import { 
  sendOfferNotification,
  newOfferTemplate,
  updatedOfferTemplate,
  lowOfferTemplate
} from './offerEmailService.js';

// For Buyer Email Notifications - NEW
import {
  sendBuyerOfferNotification,
  acceptedOfferTemplate,
  rejectedOfferTemplate,
  counterOfferTemplate,
  expiredOfferTemplate
} from './offerBuyerEmailService.js';

// For Email List Management
import { 
  handleOfferEmailList, 
  getOfferEmailLists 
} from './offerEmailListService.js';

// Export all controller functions and services
export {
  // Controller functions
  makeOffer,
  getOffersOnProperty,
  getOffersByBuyer,
  updateOfferStatus,
  getOfferHistory,
  getAllOffers,
  getRecentOfferActivity,
  
  // Admin email services
  sendOfferNotification,
  newOfferTemplate,
  updatedOfferTemplate,
  lowOfferTemplate,
  
  // Buyer email services - NEW
  sendBuyerOfferNotification,
  acceptedOfferTemplate,
  rejectedOfferTemplate,
  counterOfferTemplate,
  expiredOfferTemplate,
  
  // Email list management
  handleOfferEmailList,
  getOfferEmailLists
};