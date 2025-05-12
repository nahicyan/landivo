// client/src/components/Dashboard/widgets/OffersWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice } from "@/utils/format";
import { format } from "date-fns";
import { useQuery } from "react-query";
import { api } from "@/utils/api";
import { 
  DollarSign, 
  Check,
  X,
  Clock,
  RefreshCw,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OffersWidget({ isLoading: externalLoading = false }) {
  const navigate = useNavigate();

  // Fetch recent offers data
  const { data, isLoading: offersLoading, error } = useQuery(
    'recentOffers',
    async () => {
      const response = await api.get('/offer/activity/recent?limit=5');
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      enabled: !externalLoading,
      staleTime: 5 * 60 * 1000,
    }
  );

  const isLoading = externalLoading || offersLoading;
  const offers = data?.activities || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <Check className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <X className="h-4 w-4 text-red-500" />;
      case "COUNTERED":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "EXPIRED":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "COUNTERED":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get activity title based on status change
  const getActivityTitle = (activity) => {
    if (!activity || !activity.newStatus) return "Unknown activity";
    
    if (activity.newStatus === "PENDING" && !activity.previousStatus) {
      return `New offer: ${formatPrice(activity.newPrice)}`;
    }
    
    if (activity.newStatus === "PENDING" && activity.previousStatus) {
      return `Updated offer: ${formatPrice(activity.newPrice)}`;
    }
    
    if (activity.newStatus === "COUNTERED") {
      return `Counter offer: ${formatPrice(activity.counteredPrice)}`;
    }
    
    if (activity.newStatus === "ACCEPTED") {
      return `Accepted: ${formatPrice(activity.previousPrice || activity.newPrice)}`;
    }
    
    if (activity.newStatus === "REJECTED") {
      return `Rejected: ${formatPrice(activity.previousPrice || activity.newPrice)}`;
    }
    
    if (activity.newStatus === "EXPIRED") {
      return `Expired: ${formatPrice(activity.previousPrice || activity.newPrice)}`;
    }
    
    return `Status: ${activity.newStatus}`;
  };

  // Get buyer initials
  const getBuyerInitials = (activity) => {
    if (activity.buyerFirstName && activity.buyerLastName) {
      return `${activity.buyerFirstName[0]}${activity.buyerLastName[0]}`;
    }
    if (activity.buyerName) {
      const parts = activity.buyerName.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    }
    return '??';
  };

  // Calculate summary stats
  const calculateStats = () => {
    if (!offers.length) return { total: 0, average: 0, acceptance: 0 };
    
    const total = offers.length;
    const totalAmount = offers.reduce((sum, offer) => sum + (offer.newPrice || offer.previousPrice || 0), 0);
    const average = total > 0 ? totalAmount / total : 0;
    
    // Note: This is a simplified calculation for recent offers only
    const accepted = offers.filter(o => o.newStatus === "ACCEPTED").length;
    const acceptance = total > 0 ? (accepted / total) * 100 : 0;
    
    return { total, average, acceptance };
  };

  const stats = calculateStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Offers</CardTitle>
        <CardDescription>
          Latest offer submissions and status changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 p-2 rounded-lg">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Failed to load offers. Please try again later.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-[#f4f7ee] p-2 rounded-lg">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-[#3f4f24]">{stats.total}</p>
              </div>
              <div className="bg-[#f0f5f4] p-2 rounded-lg">
                <p className="text-xs text-gray-500">Avg. Value</p>
                <p className="text-lg font-bold text-[#324c48]">{formatPrice(stats.average)}</p>
              </div>
              <div className="bg-[#fcf7e8] p-2 rounded-lg">
                <p className="text-xs text-gray-500">Acceptance</p>
                <p className="text-lg font-bold text-[#D4A017]">{stats.acceptance.toFixed(1)}%</p>
              </div>
            </div>
            
            <ScrollArea className="h-[200px]">
              {offers.length > 0 ? (
                <div className="space-y-3">
                  {offers.map((activity, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#324c48] text-white">
                          {getBuyerInitials(activity)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium truncate">{activity.buyerName || "Unknown Buyer"}</p>
                          <Badge className={`ml-2 ${getStatusClass(activity.newStatus)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(activity.newStatus)}
                              <span className="capitalize">{activity.newStatus}</span>
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getActivityTitle(activity)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.propertyAddress || `Property ${activity.propertyId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center justify-end">
                          <DollarSign className="h-3 w-3 inline-block mr-1" />
                          {formatPrice(activity.newPrice || activity.previousPrice)}
                        </p>
                        {activity.counteredPrice && (
                          <p className="text-xs text-blue-600">
                            Counter: {formatPrice(activity.counteredPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No recent offer activity to display
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => navigate("/admin/offers")}
        >
          View All Offers
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}