import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardHeader, 
  CardContent 
} from "@/components/ui/card";
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  MessageCircle
} from "lucide-react";

/**
 * Get activity icon based on status
 * @param {string} status - Offer status
 * @returns {JSX.Element} - Icon component
 */
const getActivityIcon = (status) => {
  switch (status) {
    case "PENDING":
      return <Clock className="h-6 w-6 text-amber-500" />;
    case "ACCEPTED":
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case "REJECTED":
      return <XCircle className="h-6 w-6 text-red-500" />;
    case "COUNTERED":
      return <RefreshCw className="h-6 w-6 text-blue-500" />;
    case "EXPIRED":
      return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    default:
      return <Clock className="h-6 w-6 text-gray-500" />;
  }
};

/**
 * Get activity title based on type
 * @param {Object} activity - Activity data
 * @returns {string} - Activity title
 */
const getActivityTitle = (activity) => {
  if (!activity) return "Unknown activity";
  
  // For new offers
  if (activity.newStatus === "PENDING" && !activity.previousStatus) {
    return `New offer submitted for $${formatNumber(activity.newPrice)}`;
  }
  
  // For updated offers from buyer
  if (activity.newStatus === "PENDING" && activity.previousStatus) {
    return `Offer updated to $${formatNumber(activity.newPrice)}`;
  }
  
  // For counter offers
  if (activity.newStatus === "COUNTERED") {
    return `Counter offer sent for $${formatNumber(activity.counteredPrice)}`;
  }
  
  // For accepted offers
  if (activity.newStatus === "ACCEPTED") {
    const price = activity.previousPrice || activity.newPrice;
    return `Offer of $${formatNumber(price)} accepted`;
  }
  
  // For rejected offers
  if (activity.newStatus === "REJECTED") {
    const price = activity.previousPrice || activity.newPrice;
    return `Offer of $${formatNumber(price)} rejected`;
  }
  
  // For expired offers
  if (activity.newStatus === "EXPIRED") {
    const price = activity.previousPrice || activity.newPrice;
    return `Offer of $${formatNumber(price)} expired`;
  }
  
  return `Offer status changed to ${activity.newStatus}`;
};

/**
 * Format number with commas
 * @param {number} value - Number to format
 * @returns {string} - Formatted number
 */
const formatNumber = (value) => {
  if (!value && value !== 0) return "0";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
};

/**
 * Enhanced Offer History component - Displays offer history with detailed status changes
 */
const OfferHistory = ({ offers = [] }) => {
  if (!offers || !Array.isArray(offers) || offers.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500 mb-2">No offer history found for this buyer.</p>
        <p className="text-sm text-gray-400">This may happen if the buyer hasn't made any offers yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {offers.map((offer, offerIndex) => (
        <Card key={offer.id || offerIndex} className="overflow-hidden">
          <CardHeader className="py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{offer.propertyAddress || 'Unknown property'}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span className="font-medium">${formatNumber(offer.amount)}</span>
                  <Clock className="h-4 w-4 ml-3 mr-1" />
                  <span>{format(new Date(offer.timestamp), "MMM d, yyyy")}</span>
                </div>
              </div>
              <Badge 
                className={`
                  ${offer.status === "PENDING" ? "bg-amber-100 text-amber-800" : ""}
                  ${offer.status === "ACCEPTED" ? "bg-green-100 text-green-800" : ""}
                  ${offer.status === "REJECTED" ? "bg-red-100 text-red-800" : ""}
                  ${offer.status === "COUNTERED" ? "bg-blue-100 text-blue-800" : ""}
                  ${offer.status === "EXPIRED" ? "bg-gray-100 text-gray-800" : ""}
                `}
              >
                {offer.status}
              </Badge>
            </div>
            
            {/* Offer messages */}
            {(offer.buyerMessage || offer.sysMessage) && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                {offer.buyerMessage && (
                  <div className="flex items-start text-sm mb-1">
                    <User className="h-3.5 w-3.5 mt-0.5 mr-1 text-gray-600" />
                    <div>
                      <span className="font-semibold text-gray-700">Buyer message: </span>
                      <span className="text-gray-600">{offer.buyerMessage}</span>
                    </div>
                  </div>
                )}
                {offer.sysMessage && (
                  <div className="flex items-start text-sm">
                    <MessageCircle className="h-3.5 w-3.5 mt-0.5 mr-1 text-gray-600" />
                    <div>
                      <span className="font-semibold text-gray-700">Admin message: </span>
                      <span className="text-gray-600">{offer.sysMessage}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          
          {/* Offer history timeline */}
          <CardContent className="py-4">
            {Array.isArray(offer.history) && offer.history.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-600" />
                  Offer Timeline
                </h4>
                <div className="space-y-4">
                  {offer.history.map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="mt-0.5">
                        <div className="p-1 rounded-full bg-gray-100">
                          {getActivityIcon(entry.newStatus)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{getActivityTitle(entry)}</div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>{format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}</span>
                          {entry.updatedByName && (
                            <>
                              <User className="h-3.5 w-3.5 ml-2 mr-1" />
                              <span>{entry.updatedByName}</span>
                            </>
                          )}
                        </div>
                        
                        {/* History entry messages */}
                        {(entry.buyerMessage || entry.sysMessage) && (
                          <div className="mt-1.5 pl-2 border-l-2 border-gray-200">
                            {entry.buyerMessage && (
                              <div className="text-xs">
                                <span className="font-semibold text-gray-600">Buyer: </span>
                                <span className="italic">{entry.buyerMessage}</span>
                              </div>
                            )}
                            {entry.sysMessage && (
                              <div className="text-xs mt-0.5">
                                <span className="font-semibold text-gray-600">Admin: </span>
                                <span className="italic">{entry.sysMessage}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-center text-gray-500">
                No detailed history available for this offer.
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OfferHistory;