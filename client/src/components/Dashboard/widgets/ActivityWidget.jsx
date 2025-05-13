// client/src/components/Dashboard/widgets/ActivityWidget.jsx
import React, { useState, useEffect } from "react";
import { format, formatDistance } from "date-fns";
import ActivityDataProvider from "@/services/ActivityDataProvider";
import { api } from "@/utils/api";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Eye,
  MousePointer,
  Navigation,
  Search,
  DollarSign,
  Clock,
  Calendar,
  RefreshCw,
  Filter,
  ChevronRight,
  Loader2,
  User,
  AlertCircle,
  Home,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/utils/format";
import { getAllBuyers } from "@/utils/api";

/**
 * ActivityWidget component
 * Displays recent buyer activity for dashboard
 */
const ActivityWidget = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [offerActivities, setOfferActivities] = useState([]);
  const [buyers, setBuyers] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activityCounts, setActivityCounts] = useState({
    property_view: 0,
    search: 0,
    offer: 0,
    page_visit: 0,
    click: 0,
    total: 0
  });

  // Format property address
  const formatPropertyAddress = (property) => {
    if (!property) return "Unknown property";
    
    const address = property.streetAddress || property.address || "";
    const city = property.city || "";
    const state = property.state || "";
    const zip = property.zip || "";
    
    if (!address) return property.propertyId || "Unknown property";
    
    return `${address}, ${city}${city && state ? ", " : ""}${state}${(city || state) && zip ? " " : ""}${zip}`.trim();
  };

  // Function to fetch offer activity specifically
  const fetchOfferActivity = async () => {
    try {
      // Fetch recent offer activity using the same endpoint as RecentOfferActivity
      const response = await api.get("/offer/activity/recent?limit=5");
      return response.data.activities || [];
    } catch (error) {
      console.error("Error fetching offer activity:", error);
      return [];
    }
  };

  // Get activity icon based on status
  const getOfferStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "COUNTERED":
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case "EXPIRED":
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get offer activity title
  const getOfferActivityTitle = (activity) => {
    if (!activity || !activity.newStatus) return "Unknown activity";
    
    // For new offers
    if (activity.newStatus === "PENDING" && !activity.previousStatus) {
      return `New offer submitted for ${formatPrice(activity.newPrice)}`;
    }
    
    // For updated offers from buyer
    if (activity.newStatus === "PENDING" && activity.previousStatus) {
      return `Offer updated to ${formatPrice(activity.newPrice)}`;
    }
    
    // For counter offers
    if (activity.newStatus === "COUNTERED") {
      return `Counter offer sent for ${formatPrice(activity.counteredPrice)}`;
    }
    
    // For accepted offers
    if (activity.newStatus === "ACCEPTED") {
      return `Offer of ${formatPrice(activity.previousPrice || activity.newPrice)} accepted`;
    }
    
    // For rejected offers
    if (activity.newStatus === "REJECTED") {
      return `Offer of ${formatPrice(activity.previousPrice || activity.newPrice)} rejected`;
    }
    
    // For expired offers
    if (activity.newStatus === "EXPIRED") {
      return `Offer of ${formatPrice(activity.previousPrice || activity.newPrice)} expired`;
    }
    
    return `Offer status changed to ${activity.newStatus}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800";
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

  // Fetch buyers and activity data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all buyers first to get VIP buyers with auth0Id
        const allBuyers = await getAllBuyers();
        
        // Create lookup table for buyers
        const buyersMap = {};
        allBuyers.forEach(buyer => {
          buyersMap[buyer.id] = buyer;
        });
        setBuyers(buyersMap);
        
        // Fetch offer activities - this is new
        if (activeTab === 'offer') {
          const rawOfferActivities = await fetchOfferActivity();
          setOfferActivities(rawOfferActivities);
          setLoading(false);
          return;
        }
        
        // Filter VIP buyers (those with auth0Id)
        const vipBuyers = allBuyers.filter(buyer => buyer.auth0Id);
        
        // Fetch activity for all VIP buyers (limit to top 5 for performance)
        const vipBuyersToFetch = vipBuyers.slice(0, 5);
        
        let allActivities = [];
        const counts = {
          property_view: 0,
          search: 0,
          offer: 0,
          page_visit: 0,
          click: 0,
          total: 0
        };
        
        // For each VIP buyer, fetch their activity and combine it
        for (const buyer of vipBuyersToFetch) {
          try {
            const summary = await ActivityDataProvider.getActivitySummary(buyer.id);
            
            // Combine all activities with buyer information
            const propertyViews = (summary.propertyViews || []).map(item => ({ 
              type: 'property_view', 
              data: item, 
              timestamp: item.timestamp || new Date().toISOString(),
              buyerId: buyer.id 
            }));
            counts.property_view += propertyViews.length;
            
            const searches = (summary.searchHistory || []).map(item => ({ 
              type: 'search', 
              data: item, 
              timestamp: item.timestamp || new Date().toISOString(),
              buyerId: buyer.id 
            }));
            counts.search += searches.length;
            
            const pageVisits = (summary.pageVisits || []).map(item => ({ 
              type: 'page_visit', 
              data: item, 
              timestamp: item.timestamp || new Date().toISOString(),
              buyerId: buyer.id 
            }));
            counts.page_visit += pageVisits.length;
            
            const offers = (summary.offerHistory || []).map(item => ({ 
              type: 'offer', 
              data: item, 
              timestamp: item.timestamp || new Date().toISOString(),
              buyerId: buyer.id 
            }));
            counts.offer += offers.length;
            
            const clicks = (summary.clickEvents || []).map(item => ({ 
              type: 'click', 
              data: item, 
              timestamp: item.timestamp || new Date().toISOString(),
              buyerId: buyer.id 
            }));
            counts.click += clicks.length;
            
            const buyerActivities = [
              ...propertyViews,
              ...searches,
              ...pageVisits,
              ...offers,
              ...clicks
            ];
            
            allActivities = [...allActivities, ...buyerActivities];
          } catch (err) {
            console.warn(`Error fetching activity for buyer ${buyer.id}:`, err);
            // Continue with other buyers even if one fails
          }
        }
        
        counts.total = allActivities.length;
        setActivityCounts(counts);
        
        // Sort all activities by timestamp (newest first)
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setActivities(allActivities);
        setError(null);
      } catch (err) {
        console.error("Error fetching activity data:", err);
        setError("Failed to load activity data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchData();
  }, [activeTab, refreshing]);

  // Function to refresh data
  const handleRefresh = () => {
    setRefreshing(true);
  };

  // Function to get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'property_view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'search':
        return <Search className="h-4 w-4 text-orange-500" />;
      case 'page_visit':
        return <Navigation className="h-4 w-4 text-green-500" />;
      case 'offer':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'click':
        return <MousePointer className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to get activity description
  const getActivityDescription = (activity) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'property_view':
        // Changed from title to address format
        return `Viewed property at ${data.propertyAddress || 'unknown location'}`;
      case 'search':
        return `Searched for "${data.query || 'properties'}"`;
      case 'page_visit':
        return `Visited ${data.url || data.path || 'a page'}`;
      case 'offer':
        // Changed from property title to address format
        return `Made an offer of ${formatPrice(data.amount || data.offeredPrice || 0)}`;
      case 'click':
        return `Clicked on ${data.elementType || data.element || 'an element'}`;
      default:
        return 'Performed an action';
    }
  };

  // Function to get secondary text for activity
  const getActivitySecondaryText = (activity) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'property_view':
        // Already using propertyAddress
        return data.propertyAddress || '';
      case 'search':
        return `${data.resultsCount || 0} results`;
      case 'page_visit':
        return data.duration ? `Spent ${Math.floor(data.duration / 60)}m ${data.duration % 60}s` : '';
      case 'offer':
        // Changed from property title to address format
        return data.propertyAddress || '';
      case 'click':
        return data.page || '';
      default:
        return '';
    }
  };

  // Function to get badge color for activity type
  const getActivityBadgeClass = (type) => {
    switch (type) {
      case 'property_view':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'search':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'page_visit':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'offer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'click':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Filter activities based on active tab
  const filteredActivities = activeTab === 'all' 
    ? activities.slice(0, 5) // Limit to 5 for All tab 
    : activities
        .filter(activity => activity.type === activeTab)
        .slice(0, 5); // Limit to 5 for other tabs

  // Loading skeleton
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Buyer Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Loading activity feed...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2 p-2 border rounded-md">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Buyer Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-red-500">{error}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            size="sm"
            disabled={refreshing}
            className="mx-auto"
          >
            {refreshing ? 
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
              <RefreshCw className="h-4 w-4 mr-2" />
            } 
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-[#f0f5f4] border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">Recent Buyer Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest interactions from VIP buyers</CardDescription>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="w-full sm:w-auto">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-fit">
                <TabsList className="bg-white h-8 p-1">
                  <TabsTrigger value="all" className="text-xs px-2 h-6">
                    All
                    {activityCounts.total > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                        {activityCounts.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="property_view" className="text-xs px-2 h-6">
                    Views
                    {activityCounts.property_view > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                        {activityCounts.property_view}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="search" className="text-xs px-2 h-6">
                    Searches
                    {activityCounts.search > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                        {activityCounts.search}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="offer" className="text-xs px-2 h-6">
                    Offers
                    {activityCounts.offer > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                        {activityCounts.offer}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-3 py-3">
        {/* Special Rendering for Offer Tab */}
        {activeTab === 'offer' ? (
          // New Layout for Offer Tab - Similar to RecentOfferActivity
          <div className="space-y-3">
            {offerActivities.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <AlertCircle className="h-6 w-6 text-gray-400 mb-2 mx-auto" />
                <p className="mb-1">No recent offer activity</p>
                <p className="text-xs">
                  Check back later for updates on buyer offers
                </p>
              </div>
            ) : (
              offerActivities.map((activity, index) => {
                const buyer = buyers[activity.buyerId] || {};
                const initials = buyer.firstName && buyer.lastName 
                  ? `${buyer.firstName[0]}${buyer.lastName[0]}`
                  : '??';
                
                return (
                  <div 
                    key={`offer-activity-${index}`} 
                    className="flex flex-col sm:flex-row gap-3 items-start border-b pb-4 last:border-0 transition-all hover:bg-gray-50/50 p-2 rounded-lg"
                  >
                    <div className="p-2 rounded-full bg-gray-100 flex-shrink-0 sm:mt-0 mt-1">
                      {getOfferStatusIcon(activity.newStatus)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="font-medium text-sm">{getOfferActivityTitle(activity)}</h4>
                        <Badge 
                          className={`${getStatusBadgeClass(activity.newStatus)} text-xs self-start sm:self-auto`}
                        >
                          {activity.newStatus}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap text-xs text-gray-500 gap-x-2 gap-y-1">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1 flex-shrink-0" />
                          {buyer.firstName} {buyer.lastName}
                        </span>
                        
                        <span className="flex items-center">
                          <Home className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[200px]">
                            {activity.propertyAddress 
                              ? `${activity.propertyAddress}, ${activity.propertyCity || ''}, ${activity.propertyState || ''} ${activity.propertyZip || ''}`
                              : (activity.propertyId || 'Unknown property')}
                          </span>
                        </span>
                        
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="whitespace-nowrap">{format(new Date(activity.timestamp), "MMM d, yyyy")}</span>
                        </span>
                      </div>
                      
                      {/* Show messages if present */}
                      {(activity.buyerMessage || activity.sysMessage) && (
                        <div className="mt-2 pt-2 text-xs italic bg-gray-50 p-2 rounded-md">
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
                    
                    <Avatar className="h-10 w-10 bg-primary-100 text-primary-800 hidden sm:flex">
                      <AvatarFallback className="bg-[#324c48] text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                );
              })
            )}
            
            <Button 
              variant="ghost" 
              className="w-full mt-2 text-[#324c48] text-sm"
              onClick={() => window.location.href = "/admin/offers"}
            >
              View All Offers
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          // Original Layout for Other Tabs
          <>
            {filteredActivities.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {activeTab === 'all' ? (
                  <>
                    <p className="mb-2">No recent activity found</p>
                    <p className="text-xs">Activity tracking is available for VIP buyers</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-6 w-6 text-gray-400 mb-2" />
                    <p className="mb-1">No {activeTab.replace('_', ' ')} activity</p>
                    <p className="text-xs">
                      {activeTab === 'property_view' && "No recent property views by VIP buyers"}
                      {activeTab === 'search' && "No recent searches by VIP buyers"}
                      {activeTab === 'offer' && "No recent offers by VIP buyers"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map((activity, index) => {
                  const buyer = buyers[activity.buyerId] || {};
                  const secondaryText = getActivitySecondaryText(activity);
                  const initials = buyer.firstName && buyer.lastName 
                    ? `${buyer.firstName[0]}${buyer.lastName[0]}`
                    : '??';
                    
                  return (
                    <div 
                      key={`${activity.type}-${index}`} 
                      className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors border"
                    >
                      <Avatar className="h-8 w-8 bg-[#324c48] text-white mt-1 flex-shrink-0">
                        <AvatarFallback className="text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-sm font-medium text-[#324c48] line-clamp-1">
                            {getActivityDescription(activity)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs w-fit self-start sm:self-auto ${getActivityBadgeClass(activity.type)}`}
                          >
                            <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        {secondaryText && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {secondaryText}
                          </p>
                        )}
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 mt-1.5">
                          <p className="text-xs font-medium">
                            {buyer.firstName} {buyer.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.timestamp ? 
                              formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true }) : 
                              'Unknown time'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 text-[#324c48] text-sm"
                  onClick={() => window.location.href = "/admin/buyers"}
                >
                  View Buyer Management
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityWidget;