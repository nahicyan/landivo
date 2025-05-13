// client/src/components/Dashboard/widgets/PropertiesWidget.jsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Home, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/utils/format";
import { useQuery } from "react-query";
import { getAllProperties } from "@/utils/api";

export default function PropertiesWidget({ isLoading: externalLoading = false, fullSize = false }) {
  const navigate = useNavigate();
  
  // Fetch real properties from API
  const { data: properties, isLoading: apiLoading, error } = useQuery(
    'dashboardProperties',
    async () => {
      const response = await getAllProperties();
      return response
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 4); // Limit to 4 properties for the widget
    },
    {
      refetchOnWindowFocus: false,
      enabled: !externalLoading,
    }
  );
  
  // Combine external loading state with API loading state
  const isLoading = externalLoading || apiLoading;

  const getStatusClass = (status) => {
    const classes = {
      Active: "bg-green-100 text-green-800",
      Available: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Sold: "bg-blue-100 text-blue-800",
      Expired: "bg-red-100 text-red-800"
    };
    return classes[status] || "bg-gray-100 text-gray-800";
  };
  
  // Helper function to get server URL for images
  const getImageUrl = (property) => {
    const serverURL = import.meta.env.VITE_SERVER_URL;
    
    if (!property.imageUrls) return "/default-property.jpg";
    
    let images = [];
    try {
      // Handle both string and array formats
      images = Array.isArray(property.imageUrls) 
        ? property.imageUrls 
        : JSON.parse(property.imageUrls);
    } catch (e) {
      console.error("Error parsing image URLs:", e);
      return "/default-property.jpg";
    }
    
    if (!images.length) return "/default-property.jpg";
    
    // Return the full URL to the first image
    return `${serverURL}/${images[0]}`;
  };

  return (
    <Card className={fullSize ? "col-span-full" : ""}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
        <div>
          <CardTitle className="text-base sm:text-lg">Recent Properties</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Latest property listings and performance metrics
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/properties")}
          className="h-8 self-end sm:self-auto"
        >
          <Eye className="mr-2 h-4 w-4" />
          <span className="text-xs sm:text-sm">View All</span>
        </Button>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 mb-2 border rounded-md">
                <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-md flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-[150px] mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-8 w-[80px] flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Error loading properties. Please try again later.
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={getImageUrl(property)} 
                    alt={property.title || "Property"} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Render title as rich text */}
                  <p 
                    className="text-sm font-medium line-clamp-1"
                    dangerouslySetInnerHTML={{ __html: property.title || "Untitled Property" }}
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    {property.streetAddress}, {property.city}, {property.state} {property.zip}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Badge className={`${getStatusClass(property.status)} text-xs`}>
                      {property.status || "Status Unknown"}
                    </Badge>
                    {(property.featured === "Yes" || property.featured === "Featured") && (
                      <Badge className="bg-accent-50 text-accent-800 border-accent-200 text-xs">
                        Featured
                      </Badge>
                    )}
                    <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                      {property.views || 0} views
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                      {property.numOffers || 0} offers
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium whitespace-nowrap">${formatPrice(property.askingPrice || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No properties found. Add some properties to see them here.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col xs:flex-row gap-2 justify-between pt-2 border-t px-2 sm:px-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/admin/add-property")}
          className="w-full xs:w-auto text-xs sm:text-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/properties")}
          className="w-full xs:w-auto text-xs sm:text-sm"
        >
          <Home className="mr-2 h-4 w-4" />
          All Properties
        </Button>
      </CardFooter>
    </Card>
  );
}