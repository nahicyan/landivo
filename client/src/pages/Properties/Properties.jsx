// client/src/pages/Properties/Properties.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useSearchParams, useNavigate } from "react-router-dom";
import useProperties from "../../components/hooks/useProperties.js";
import SearchWithTracking from "@/components/Search/SearchWithTracking";
import DisplayGridHorizontal from "@/components/DisplayGrid/DisplayGridHorizontal";
import MultiPropertyMap from "@/components/MultiPropertyMap/MultiPropertyMap";
import { PropertyFilterPanel } from "@/components/PropertyFilters/PropertyFilterPanel";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/PropertyCard/PropertyCard";
import { 
  applyPropertyFilters, 
  getDefaultFilters, 
  resetAllFilters 
} from "@/utils/propertyFilterUtils";
import { MapIcon, Grid3x3 } from "lucide-react";

export default function Properties() {
  const { data, isError, isLoading } = useProperties();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(getDefaultFilters());
  const [viewMode, setViewMode] = useState("map"); // "map" or "grid"

  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    setSearchQuery(searchFromUrl);
  }, [searchParams]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data) return [];
    return applyPropertyFilters(data, filters, searchQuery);
  }, [data, filters, searchQuery]);

  // Clear all filters
  const handleClearAllFilters = () => {
    resetAllFilters(setFilters, setSearchQuery);
  };

  // Handle property click
  const handlePropertyClick = (property) => {
    navigate(`/properties/${property.id}`);
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FDF8F2]">
        <h2 className="text-red-600 text-xl font-semibold">Error fetching data.</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FDF8F2]">
        <PuffLoader size={80} color="#404040" />
      </div>
    );
  }

  // Define the areas
  const areas = [
    { name: "DFW", displayName: "Dallas Fort Worth" },
    { name: "Austin", displayName: "Austin" },
    { name: "Houston", displayName: "Houston" },
    { name: "San Antonio", displayName: "San Antonio" },
    { name: "Other Areas", displayName: "Other Areas" },
  ];

  // Helper function to get properties for an area
  const getAreaProperties = (areaName) => {
    return filteredData.filter((property) => property.area === areaName);
  };

  // Map View - Split Layout (50-50)
  if (viewMode === "map") {
    return (
      <div className="flex h-screen bg-[#FDF8F2] overflow-hidden">
        {/* LEFT HALF - Fixed Map */}
        <div className="w-1/2 h-full p-2 flex items-top">
          <div className="w-full h-[90vh] rounded-lg overflow-hidden shadow-xl border border-gray-200">
            <MultiPropertyMap properties={filteredData} />
          </div>
        </div>

        {/* RIGHT HALF - Scrollable Content */}
        <div className="w-1/2 h-full overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              {/* Title & Subtitle */}
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-[#324c48]">
                  Find Your Dream Property
                </h1>
                <p className="text-base text-[#4b5b4d]">
                  Browse through {filteredData.length} properties with detailed filters
                </p>
              </div>

              {/* Search Bar */}
              <div>
                <SearchWithTracking 
                  query={searchQuery} 
                  setQuery={setSearchQuery} 
                  context="properties"
                  filteredData={filteredData}
                  filters={filters}
                />
              </div>

              {/* Filter Panel */}
              <div>
                <PropertyFilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onClearAll={handleClearAllFilters}
                  propertiesData={data}
                  resultsCount={filteredData.length}
                />
              </div>

              {/* View Toggle */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setViewMode("map")}
                  variant="default"
                  size="sm"
                  className="bg-[#324c48] hover:bg-[#3f4f24]"
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  Map View
                </Button>
                <Button
                  onClick={() => setViewMode("grid")}
                  variant="outline"
                  size="sm"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Grid View
                </Button>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-t border-[#4b5b4d]/20" />

            {/* Properties by Area */}
            {filteredData.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-4">
                  No properties found matching your criteria.
                </p>
                <Button
                  onClick={handleClearAllFilters}
                  className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {areas.map((area) => {
                  const areaProperties = getAreaProperties(area.name);
                  if (areaProperties.length === 0) return null;

                  return (
                    <div key={area.name} className="space-y-4">
                      <DisplayGridHorizontal
                        properties={areaProperties}
                        title={area.displayName}
                        subtitle={`${areaProperties.length} properties available`}
                        onPropertyClick={handlePropertyClick}
                        showCount={false}
                      />
                      <hr className="border-t border-[#4b5b4d]/20" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid View - Full Width (Original Layout)
  return (
    <div className="bg-[#FDF8F2] min-h-screen text-[#4b5b4d]">
      {/* Header Section */}
      <div className="sticky top-0 z-20 bg-[#FDF8F2] shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          {/* Title & Subtitle */}
          <div className="mb-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-[#324c48]">
              Find Your Dream Property
            </h1>
            <p className="text-base text-[#4b5b4d]">
              Browse through {filteredData.length} properties with detailed filters
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <SearchWithTracking 
              query={searchQuery} 
              setQuery={setSearchQuery} 
              context="properties"
              filteredData={filteredData}
              filters={filters}
            />
          </div>

          {/* Filter Panel */}
          <div className="mb-4">
            <PropertyFilterPanel
              filters={filters}
              setFilters={setFilters}
              onClearAll={handleClearAllFilters}
              propertiesData={data}
              resultsCount={filteredData.length}
            />
          </div>

          {/* View Toggle */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setViewMode("map")}
              variant="outline"
              size="sm"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </Button>
            <Button
              onClick={() => setViewMode("grid")}
              variant="default"
              size="sm"
              className="bg-[#324c48] hover:bg-[#3f4f24]"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid View
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4">
        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg mb-4">
              No properties found matching your criteria.
            </p>
            <Button
              onClick={handleClearAllFilters}
              className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="py-8">
            {areas.map((area, index) => {
              const areaProperties = getAreaProperties(area.name);
              if (areaProperties.length === 0) return null;

              return (
                <div key={area.name} className="my-12">
                  {index > 0 && <hr className="my-8 border-t border-[#4b5b4d]/20" />}
                  
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[#324c48]">
                      Properties in {area.displayName}
                    </h2>
                    <p className="text-[#324c48]/80">
                      {areaProperties.length} properties available
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {areaProperties.map((property) => (
                      <div
                        key={property.id}
                        className="transition hover:scale-105 cursor-pointer"
                        onClick={() => handlePropertyClick(property)}
                      >
                        <PropertyCard card={property} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}