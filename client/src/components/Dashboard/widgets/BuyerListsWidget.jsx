// client/src/components/Dashboard/widgets/BuyerListsWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { getBuyerLists } from "@/utils/api";
import { 
  Users, 
  Mail, 
  MapPin, 
  Tag, 
  ArrowRight,
  UserPlus
} from "lucide-react";

export default function BuyerListsWidget({ isLoading: externalLoading = false }) {
  const navigate = useNavigate();

  // Fetch real buyer lists from API
  const { data: buyerLists, isLoading: listsLoading, error } = useQuery(
    'dashboardBuyerLists',
    async () => {
      const lists = await getBuyerLists();
      // Sort lists by lastEmailDate (most recent first) or by memberCount
      return lists.sort((a, b) => {
        if (a.lastEmailDate && b.lastEmailDate) {
          return new Date(b.lastEmailDate) - new Date(a.lastEmailDate);
        }
        return (b.buyerIds?.length || 0) - (a.buyerIds?.length || 0);
      });
    },
    {
      refetchOnWindowFocus: false,
      enabled: !externalLoading,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  // Combine external loading state with API loading state
  const isLoading = externalLoading || listsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer Lists</CardTitle>
        <CardDescription>
          Segmented buyer audiences for targeted marketing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Error loading buyer lists. Please try again later.
          </div>
        ) : buyerLists && buyerLists.length > 0 ? (
          <div className="space-y-4">
            {buyerLists.slice(0, 4).map((list) => {
              // Calculate member count
              const memberCount = list.buyerIds?.length || 0;
              
              // Extract areas and buyer types from criteria
              const areas = list.criteria?.areas || [];
              const buyerTypes = list.criteria?.buyerTypes || [];
              const isVIP = list.criteria?.isVIP || false;
              
              // Calculate engagement rate (placeholder calculation)
              // In a real implementation, you'd get this from analytics data
              const engagementRate = Math.round(45 + Math.random() * 35); // 45-80%
              
              return (
                <div 
                  key={list.id} 
                  className="p-3 border rounded-lg hover:border-[#324c48] transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/buyer-lists/${list.id}`)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-medium flex items-center">
                        {list.name}
                        {isVIP && (
                          <Badge className="ml-2 bg-[#D4A017] text-white">VIP</Badge>
                        )}
                        {list.isDefault && (
                          <Badge className="ml-2 bg-gray-100 text-gray-700">Default</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground">{list.description || 'No description'}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="flex items-center bg-[#f0f5f4]"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {memberCount}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {areas.slice(0, 3).map((area, idx) => (
                      <Badge key={idx} variant="outline" className="bg-[#f4f7ee] text-xs">
                        <MapPin className="h-2 w-2 mr-1" />
                        {area}
                      </Badge>
                    ))}
                    {areas.length > 3 && (
                      <Badge variant="outline" className="bg-[#f4f7ee] text-xs">
                        +{areas.length - 3} more
                      </Badge>
                    )}
                    {buyerTypes.slice(0, 2).map((type, idx) => (
                      <Badge key={idx} variant="outline" className="bg-[#fcf7e8] text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {type}
                      </Badge>
                    ))}
                    {buyerTypes.length > 2 && (
                      <Badge variant="outline" className="bg-[#fcf7e8] text-xs">
                        +{buyerTypes.length - 2} more
                      </Badge>
                    )}
                  </div>
                  
                  {/* Email engagement stats */}
                  <div className="text-xs text-gray-600 mb-1">
                    Email engagement ({engagementRate}% open rate)
                  </div>
                  <Progress 
                    value={engagementRate} 
                    className="h-1 bg-gray-100" 
                  />
                  
                  {list.lastEmailDate && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last email: {new Date(list.lastEmailDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No buyer lists found. Create your first list to get started.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/buyer-lists")}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create List
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/buyer-lists")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </Button>
      </CardFooter>
    </Card>
  );
}