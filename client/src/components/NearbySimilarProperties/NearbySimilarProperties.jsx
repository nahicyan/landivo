import React from "react";
import DisplayGrid from "../../components/DisplayGrid/DisplayGrid";

const NearbySimilarProperties = ({ 
  currentProperty,
  allProperties,
  navigate 
}) => {
  // Validate inputs before processing
  if (!currentProperty || !allProperties || !Array.isArray(allProperties)) {
    console.warn("NearbySimilarProperties: Missing or invalid props");
    return null;
  }
  
  // Helper function to count matching landTypes
  const countMatchingLandTypes = (property) => {
    if (!currentProperty.landType || !property.landType) return 0;
    
    const currentLandTypes = Array.isArray(currentProperty.landType) 
      ? currentProperty.landType 
      : [currentProperty.landType];
    const propertyLandTypes = Array.isArray(property.landType) 
      ? property.landType 
      : [property.landType];
    
    return currentLandTypes.filter(type => propertyLandTypes.includes(type)).length;
  };
  
  // Filter and sort properties based on priority system
  const getSimilarProperties = () => {
    // 1. First make sure we're only working with valid properties (All properties except this one)
    const validProperties = allProperties.filter(property => {
      return property && property.id && property.id !== currentProperty.id;
    });
    
    // Create priority-based filtering
    const prioritizedProperties = validProperties
      .map(property => {
        const areaMatch = property.area && currentProperty.area && property.area === currentProperty.area;
        const zoningMatch = property.zoning && currentProperty.zoning && property.zoning === currentProperty.zoning;
        const isFeatured = property.featured === "Featured";
        const matchingLandTypes = countMatchingLandTypes(property);
        
        let priority = 7; // Default lowest priority
        
        // Priority 2: Match area with landType array items
        if (areaMatch && matchingLandTypes > 0) {
          priority = 2;
        }
        // Priority 3: Match both area and zoning
        else if (areaMatch && zoningMatch) {
          priority = 3;
        }
        // Priority 4: Match area and featured property
        else if (areaMatch && isFeatured) {
          priority = 4;
        }
        // Priority 5: Match only area
        else if (areaMatch) {
          priority = 5;
        }
        // Priority 6: Match only featured in all other areas
        else if (isFeatured) {
          priority = 6;
        }
        
        return {
          ...property,
          _priority: priority,
          _matchingLandTypes: matchingLandTypes
        };
      })
      .sort((a, b) => {
        if (a._priority !== b._priority) {
          return a._priority - b._priority;
        }
        // Within same priority, sort by matching landTypes (descending)
        return b._matchingLandTypes - a._matchingLandTypes;
      });
    
    return prioritizedProperties.slice(0, 20);
  };

  const similarProperties = getSimilarProperties();

  // If no similar properties, don't render
  if (!similarProperties.length) return null;

  return (
    <div className="w-full bg-[#FDF8F2] py-12">
      <div className="mx-auto max-w-screen-xl px-4">
        <DisplayGrid
          properties={similarProperties}
          filter={{ type: 'all' }}
          title="Nearby Similar Properties"
          subtitle="Properties you might be interested in"
          gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          emptyMessage="No similar properties found."
          onPropertyClick={(property) => {
            if (navigate) {
              navigate(`/properties/${property.id}`);
            }
          }}
        />
      </div>
    </div>
  );
};

export default NearbySimilarProperties;