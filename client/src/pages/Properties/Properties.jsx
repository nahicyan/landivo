// client/src/pages/Properties/Properties.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useSearchParams, Link } from "react-router-dom";
import useProperties from "../../components/hooks/useProperties.js";
import SearchWithTracking from "@/components/Search/SearchWithTracking";
import DisplayGrid, { createGridFilter } from "@/components/DisplayGrid/DisplayGrid";
import { PropertyFilterPanel } from "@/components/PropertyFilters/PropertyFilterPanel";
import { Button } from "@/components/ui/button";
import { 
  applyPropertyFilters, 
  getDefaultFilters, 
  resetAllFilters 
} from "@/utils/propertyFilterUtils";

export default function Properties() {
  const { data, isError, isLoading } = useProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(getDefaultFilters());

  // Track how many properties to show for each area (initially 9)
  const [visibleCounts, setVisibleCounts] = useState({
    DFW: 9,
    Austin: 9,
    Houston: 9,
    "San Antonio": 9,
    "Other Areas": 9,
  });

  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    setSearchQuery(searchFromUrl);
  }, [searchParams]);

  // Load more properties for a specific area
  const loadMore = (areaName) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [areaName]: prev[areaName] + 9,
    }));
  };

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data) return [];
    return applyPropertyFilters(data, filters, searchQuery);
  }, [data, filters, searchQuery]);

  // Clear all filters
  const handleClearAllFilters = () => {
    resetAllFilters(setFilters, setSearchQuery);
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-red-600 text-xl font-semibold">Error fetching data.</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#404040" />
      </div>
    );
  }

  // Define the areas and their corresponding routes
  const areas = [
    { name: "DFW", route: "/DFW", displayName: "Dallas Fort Worth" },
    { name: "Austin", route: "/Austin", displayName: "Austin" },
    { name: "Houston", route: "/Houston", displayName: "Houston" },
    { name: "San Antonio", route: "/SanAntonio", displayName: "San Antonio" },
    { name: "Other Areas", route: "/OtherLands", displayName: "Other Areas" },
  ];

  // Helper function to get properties for an area
  const getAreaProperties = (areaName) => {
    return filteredData.filter((property) => property.area === areaName);
  };

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      {/* Hero Section */}
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title & Subtitle */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#324c48]">
            Find Your Dream Property
          </h1>
          <p className="text-lg mb-6 text-[#4b5b4d]">
            Browse through a wide selection of properties with detailed filters to help you find the perfect fit.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchWithTracking 
            query={searchQuery} 
            setQuery={setSearchQuery} 
            context="properties"
            filteredData={filteredData}
            filters={filters}
          />
        </div>

        {/* Filter Panel */}
        <div className="mb-8">
          <PropertyFilterPanel
            filters={filters}
            setFilters={setFilters}
            onClearAll={handleClearAllFilters}
            propertiesData={data}
            resultsCount={filteredData.length}
          />
        </div>

        {/* Small Separating Line */}
        <hr className="my-8 border-t border-[#4b5b4d]/20" />

        {/* Location Sections using DisplayGrid with Load More */}
        {areas.map((area, index) => {
          const areaProperties = getAreaProperties(area.name);

          // Don't render section if no properties
          if (areaProperties.length === 0) return null;

          // Get the number of properties to show for this area
          const visibleCount = visibleCounts[area.name];
          const hasMore = areaProperties.length > visibleCount;

          return (
            <div key={area.name} className="my-12">
              <DisplayGrid
                properties={areaProperties}
                filter={createGridFilter.all()}
                title={`Properties in ${area.displayName}`}
                showDivider={index > 0}
                emptyMessage=""
                maxProperties={visibleCount}
                className=""
              />

              {/* Load More and All Properties Buttons */}
              <div className="flex justify-between items-center mt-4 mb-8">
                {/* Load More Button */}
                {hasMore && (
                  <Button
                    onClick={() => loadMore(area.name)}
                    className="bg-[#324c48] hover:bg-[#3f4f24] text-white px-6 py-2 rounded-lg shadow transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#3f4f24] focus:ring-offset-2"
                  >
                    Load More
                  </Button>
                )}

                {/* Spacer if no load more button */}
                {!hasMore && <div />}

                {/* All Properties in Area Button */}
                <Link to={area.route}>
                  <Button className="bg-[#324c48] hover:bg-[#3f4f24] text-white px-6 py-2 rounded-lg shadow transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#3f4f24] focus:ring-offset-2">
                    All Properties in {area.displayName}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}

        {/* No matching properties */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No properties found matching your criteria.</p>
            <Button
              onClick={handleClearAllFilters}
              className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}