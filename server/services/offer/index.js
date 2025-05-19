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

// Export all controller functions from a single point
export {
  makeOffer,
  getOffersOnProperty,
  getOffersByBuyer,
  updateOfferStatus,
  getOfferHistory,
  getAllOffers,
  getRecentOfferActivity
};