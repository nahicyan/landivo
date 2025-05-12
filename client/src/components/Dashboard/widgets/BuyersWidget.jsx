// client/src/components/Dashboard/widgets/BuyersWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, TrendingUp, Eye, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/utils/format";
import { useQuery } from "react-query";
import { getAllBuyers, getBuyerActivitySummary } from "@/utils/api";

export default function BuyersWidget({ isLoading: externalLoading = false, fullSize = false }) {
  const navigate = useNavigate();
  
  // Fetch real buyers from API
  const { data: allBuyers, isLoading: buyersLoading, error } = useQuery(
    'dashboardBuyers',
    async () => {
      const buyers = await getAllBuyers();
      
      // Process buyers to get top performers
      const processedBuyers = await Promise.all(
        buyers.slice(0, 10).map(async (buyer) => {
          try {
            // Get the latest offer for this buyer
            let lastOffer = null;
            let totalOfferValue = 0;
            let offerCount = 0;
            
            if (buyer.offers && buyer.offers.length > 0) {
              // Sort offers by date (newest first)
              const sortedOffers = buyer.offers.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
              );
              
              lastOffer = sortedOffers[0];
              totalOfferValue = buyer.offers.reduce((sum, offer) => sum + (offer.offeredPrice || 0), 0);
              offerCount = buyer.offers.length;
            }
            
            // Calculate activity score based on various factors
            let activityScore = 50; // Base score
            
            // Add points for recent offers
            if (lastOffer) {
              const daysSinceLastOffer = (new Date() - new Date(lastOffer.timestamp)) / (1000 * 60 * 60 * 24);
              if (daysSinceLastOffer <= 7) activityScore += 30;
              else if (daysSinceLastOffer <= 30) activityScore += 20;
              else if (daysSinceLastOffer <= 90) activityScore += 10;
            }
            
            // Add points for multiple offers
            activityScore += Math.min(offerCount * 5, 20);
            
            // Add points for VIP status
            if (buyer.auth0Id || buyer.source === 'VIP Buyers List') {
              activityScore += 15;
            }
            
            // Cap at 100
            activityScore = Math.min(activityScore, 100);
            
            // Calculate potential profit (simplified estimate)
            const estimatedProfit = totalOfferValue * 0.15; // Assume 15% profit margin
            
            return {
              id: buyer.id,
              name: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'Unnamed Buyer',
              email: buyer.email,
              type: buyer.buyerType || 'Unknown',
              activity: Math.round(activityScore),
              lastOffer: lastOffer ? formatPrice(lastOffer.offeredPrice) : 'No offers',
              profit: estimatedProfit > 0 ? `+${formatPrice(estimatedProfit)}` : '+$0',
              offerCount,
              lastOfferDate: lastOffer ? lastOffer.timestamp : null,
              isVip: !!(buyer.auth0Id || buyer.source === 'VIP Buyers List')
            };
          } catch (error) {
            console.error(`Error processing buyer ${buyer.id}:`, error);
            return {
              id: buyer.id,
              name: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'Unnamed Buyer',
              email: buyer.email,
              type: buyer.buyerType || 'Unknown',
              activity: 0,
              lastOffer: 'No offers',
              profit: '+$0',
              offerCount: 0,
              lastOfferDate: null,
              isVip: false
            };
          }
        })
      );
      
      // Sort by activity score (highest first)
      return processedBuyers.sort((a, b) => b.activity - a.activity);
    },
    {
      refetchOnWindowFocus: false,
      enabled: !externalLoading,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
  
  // Combine external loading state with API loading state
  const isLoading = externalLoading || buyersLoading;
  
  // Get top 4 buyers for the widget
  const topBuyers = allBuyers ? allBuyers.slice(0, 4) : [];

  const getBuyerTypeClass = (type) => {
    const classes = {
      CashBuyer: "bg-green-100 text-green-800",
      Investor: "bg-blue-100 text-blue-800",
      Developer: "bg-purple-100 text-purple-800",
      Realtor: "bg-orange-100 text-orange-800",
      Builder: "bg-yellow-100 text-yellow-800",
      Wholesaler: "bg-indigo-100 text-indigo-800"
    };
    return classes[type] || "bg-gray-100 text-gray-800";
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'UB';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={fullSize ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Top Buyers</CardTitle>
          <CardDescription>
            Most active buyers with highest potential
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/admin/buyers")}
        >
          <Eye className="mr-2 h-4 w-4" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-[120px] mb-2" />
                <Skeleton className="h-3 w-[180px]" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Error loading buyers. Please try again later.
          </div>
        ) : topBuyers && topBuyers.length > 0 ? (
          <div className="space-y-1">
            {topBuyers.map((buyer) => (
              <div 
                key={buyer.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/buyers/${buyer.id}`)}
              >
                <Avatar className="h-10 w-10 relative">
                  <AvatarFallback className="bg-[#324c48] text-white">
                    {getInitials(buyer.name)}
                  </AvatarFallback>
                  {buyer.isVip && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">★</span>
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{buyer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{buyer.email}</p>
                  <div className="flex items-center mt-1">
                    <Badge className={`mr-2 ${getBuyerTypeClass(buyer.type)}`}>
                      {buyer.type}
                    </Badge>
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          buyer.activity >= 80 ? 'bg-green-500' :
                          buyer.activity >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${buyer.activity}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">{buyer.activity}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{buyer.lastOffer}</p>
                  <p className="text-xs text-green-600 flex items-center justify-end">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {buyer.profit}
                  </p>
                  <p className="text-xs text-gray-500">
                    {buyer.offerCount} {buyer.offerCount === 1 ? 'offer' : 'offers'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No buyers found. Add some buyers to see them here.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/admin/buyers/create")}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Buyer
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/buyers")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email All
        </Button>
      </CardFooter>
    </Card>
  );
}