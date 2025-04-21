// client/src/pages/AdminOffer/RecentOfferActivity.jsx
import React from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  User, 
  Home, 
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

const RecentOfferActivity = ({ activities = [] }) => {
  const navigate = useNavigate();

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Get activity icon based on status
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

  // Get default avatar content from name
  const getAvatarInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  // Get activity title based on type
  const getActivityTitle = (activity) => {
    if (!activity || !activity.newStatus) return "Unknown activity";
    
    // For new offers
    if (activity.newStatus === "PENDING" && !activity.previousStatus) {
      return `New offer submitted for ${formatCurrency(activity.newPrice)}`;
    }
    
    // For updated offers from buyer
    if (activity.newStatus === "PENDING" && activity.previousStatus) {
      return `Offer updated to ${formatCurrency(activity.newPrice)}`;
    }
    
    // For counter offers
    if (activity.newStatus === "COUNTERED") {
      return `Counter offer sent for ${formatCurrency(activity.counteredPrice)}`;
    }
    
    // For accepted offers
    if (activity.newStatus === "ACCEPTED") {
      return `Offer of ${formatCurrency(activity.previousPrice || activity.newPrice)} accepted`;
    }
    
    // For rejected offers
    if (activity.newStatus === "REJECTED") {
      return `Offer of ${formatCurrency(activity.previousPrice || activity.newPrice)} rejected`;
    }
    
    // For expired offers
    if (activity.newStatus === "EXPIRED") {
      return `Offer of ${formatCurrency(activity.previousPrice || activity.newPrice)} expired`;
    }
    
    return `Offer status changed to ${activity.newStatus}`;
  };

  // View property details
  const handleViewProperty = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Offer Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity to display
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex gap-4 items-start border-b pb-4 last:border-0">
                <div className="p-2 rounded-full bg-gray-100">
                  {getActivityIcon(activity.newStatus)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{getActivityTitle(activity)}</h4>
                    <Badge 
                      className={`
                        ${activity.newStatus === "PENDING" ? "bg-amber-100 text-amber-800" : ""}
                        ${activity.newStatus === "ACCEPTED" ? "bg-green-100 text-green-800" : ""}
                        ${activity.newStatus === "REJECTED" ? "bg-red-100 text-red-800" : ""}
                        ${activity.newStatus === "COUNTERED" ? "bg-blue-100 text-blue-800" : ""}
                        ${activity.newStatus === "EXPIRED" ? "bg-gray-100 text-gray-800" : ""}
                      `}
                    >
                      {activity.newStatus}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{activity.buyerName || "Unknown buyer"}</span>
                    
                    <Home className="h-4 w-4 mr-1" />
                    <span 
                      className="mr-4 cursor-pointer hover:text-blue-600"
                      onClick={() => handleViewProperty(activity.propertyId)}
                    >
                      {activity.propertyAddress || activity.propertyId}
                    </span>
                    
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{format(new Date(activity.timestamp), "MMM d, yyyy")}</span>
                  </div>
                  
                  {/* Show messages if present */}
                  {(activity.buyerMessage || activity.sysMessage) && (
                    <div className="mt-2 pt-2 text-sm italic bg-gray-50 p-2 rounded-md">
                      {activity.buyerMessage && (
                        <div className="mb-1">
                          <span className="font-semibold text-xs">Buyer says:</span> {activity.buyerMessage}
                        </div>
                      )}
                      
                      {activity.sysMessage && (
                        <div>
                          <span className="font-semibold text-xs">Admin says:</span> {activity.sysMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Avatar className="h-10 w-10 bg-primary-100 text-primary-800">
                  <AvatarFallback className="bg-[#324c48] text-white">
                    {getAvatarInitials(activity.buyerFirstName, activity.buyerLastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOfferActivity;