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

// For Email List
import { 
  handleOfferEmailList, 
  getOfferEmailLists 
} from './offerEmailListService.js';

// Export all controller functions and services
export {
  makeOffer,
  getOffersOnProperty,
  getOffersByBuyer,
  updateOfferStatus,
  getOfferHistory,
  getAllOffers,
  getRecentOfferActivity,
  // Add these exports
  handleOfferEmailList,
  getOfferEmailLists
};