"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useSearchParams, useNavigate } from "react-router-dom";
import useProperties from "../../components/hooks/useProperties.js";
import SearchWithTracking from "@/components/Search/SearchWithTracking";
import MultiPropertyMap from "@/components/MultiPropertyMap/MultiPropertyMap";
import { PropertyFilterBar } from "@/components/PropertyFilters/PropertyFilterBar";
import { Button } from "@/components/ui/button";
import GridPropertyCard from "@/components/PropertyCard/GridPropertyCard";
import {
  applyPropertyFilters,
  getDefaultFilters,
  resetAllFilters,
} from "@/utils/propertyFilterUtils";
import { MapIcon, Grid3x3, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Properties() {
  const { data, isError, isLoading } = useProperties();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(getDefaultFilters());
  const [viewMode, setViewMode] = useState("map");
  const [sortBy, setSortBy] = useState("price-desc");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Force grid view on mobile
      if (window.innerWidth < 768) {
        setViewMode("grid");
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    setSearchQuery(searchFromUrl);
  }, [searchParams]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data) return [];
    return applyPropertyFilters(data, filters, searchQuery);
  }, [data, filters, searchQuery]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    
    switch (sortBy) {
      case "price-desc":
        return sorted.sort((a, b) => (b.askingPrice || 0) - (a.askingPrice || 0));
      case "price-asc":
        return sorted.sort((a, b) => (a.askingPrice || 0) - (b.askingPrice || 0));
      case "size-desc":
        return sorted.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));
      case "size-asc":
        return sorted.sort((a, b) => (a.sqft || 0) - (b.sqft || 0));
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return sorted;
    }
  }, [filteredData, sortBy]);

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.area !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.state !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
    if (filters.acreRange[0] > 0 || filters.acreRange[1] < 1000) count++;
    if (filters.sqftRange[0] > 0 || filters.sqftRange[1] < 500000) count++;
    if (filters.city !== "all") count++;
    if (filters.county !== "all") count++;
    if (filters.zoning !== "all") count++;
    if (filters.financing !== "all") count++;
    if (filters.restrictions !== "all") count++;
    if (filters.water !== "all") count++;
    if (filters.sewer !== "all") count++;
    if (filters.electric !== "all") count++;
    if (filters.roadCondition !== "all") count++;
    if (filters.floodplain !== "all") count++;
    if (filters.hoaPoa !== "all") count++;
    if (filters.mobileHomeFriendly !== "all") count++;
    if (filters.featuredOnly) count++;
    return count;
  };

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

  // Map View - Split Layout (50-50) - Desktop only with unified scroll
  if (viewMode === "map" && !isMobile) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen">
        <div className="flex">
          {/* LEFT HALF - Sticky Map */}
          <div className="w-1/2 h-screen sticky top-0 p-3 flex items-top">
            <div className="w-full h-[90vh] rounded-lg overflow-hidden shadow-xl border border-gray-200">
              <MultiPropertyMap properties={sortedData} />
            </div>
          </div>

          {/* RIGHT HALF - Natural scrolling content */}
          <div className="w-1/2 min-h-screen">
            <div className="p-4 space-y-3">
              {/* Compact Header */}
              <div className="space-y-2">
                {/* Title */}
                <h1 className="text-xl font-bold text-[#324c48]">
                  Find Your Dream Property
                </h1>

                {/* Search */}
                <div className="[&_input]:h-9 [&_button]:h-9">
                  <SearchWithTracking
                    query={searchQuery}
                    setQuery={setSearchQuery}
                    context="properties"
                    filteredData={sortedData}
                    filters={filters}
                  />
                </div>

                {/* Filter Bar */}
                <div className="[&>div]:p-2">
                  <PropertyFilterBar
                    filters={filters}
                    setFilters={setFilters}
                    onClearAll={handleClearAllFilters}
                    resultsCount={sortedData.length}
                    activeFilterCount={countActiveFilters()}
                    propertiesData={data}
                  />
                </div>

                {/* View Toggle & Sort */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setViewMode("map")}
                      variant="default"
                      size="sm"
                      className="bg-[#324c48] hover:bg-[#3f4f24] h-8 text-xs"
                    >
                      <MapIcon className="w-3 h-3 mr-1" />
                      Map
                    </Button>
                    <Button 
                      onClick={() => setViewMode("grid")} 
                      variant="outline" 
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Grid3x3 className="w-3 h-3 mr-1" />
                      Grid
                    </Button>
                  </div>

                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <ArrowUpDown className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="size-desc">Size: Large to Small</SelectItem>
                      <SelectItem value="size-asc">Size: Small to Large</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <hr className="border-t border-[#4b5b4d]/20 my-2" />

              {/* Properties Grid */}
              {sortedData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-base mb-3">
                    No properties found matching your criteria.
                  </p>
                  <Button
                    onClick={handleClearAllFilters}
                    className="bg-[#324c48] hover:bg-[#3f4f24] text-white h-9 text-sm"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-4">
                  {sortedData.map((property) => (
                    <div
                      key={property.id}
                      className="transition hover:scale-[1.02] cursor-pointer"
                      onClick={() => handlePropertyClick(property)}
                    >
                      <GridPropertyCard card={property} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View - Full Width (also used on mobile)
  return (
    <div className="bg-[#FDF8F2] min-h-screen text-[#4b5b4d]">
      {/* Header - Compact */}
      <div className="sticky top-0 z-20 bg-[#FDF8F2] shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="space-y-2">
            {/* Title */}
            <h1 className="text-xl font-bold text-[#324c48]">
              Find Your Dream Property
            </h1>

            {/* Search */}
            <div className="[&_input]:h-9 [&_button]:h-9">
              <SearchWithTracking
                query={searchQuery}
                setQuery={setSearchQuery}
                context="properties"
                filteredData={sortedData}
                filters={filters}
              />
            </div>

            {/* Filter Bar */}
            <div className="[&>div]:p-2">
              <PropertyFilterBar
                filters={filters}
                setFilters={setFilters}
                onClearAll={handleClearAllFilters}
                resultsCount={sortedData.length}
                activeFilterCount={countActiveFilters()}
                propertiesData={data}
              />
            </div>

            {/* View Toggle & Sort - Hide map button on mobile */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {!isMobile && (
                  <Button 
                    onClick={() => setViewMode("map")} 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <MapIcon className="w-3 h-3 mr-1" />
                    Map
                  </Button>
                )}
                <Button
                  onClick={() => setViewMode("grid")}
                  variant="default"
                  size="sm"
                  className="bg-[#324c48] hover:bg-[#3f4f24] h-8 text-xs"
                >
                  <Grid3x3 className="w-3 h-3 mr-1" />
                  Grid
                </Button>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="size-desc">Size: Large to Small</SelectItem>
                  <SelectItem value="size-asc">Size: Small to Large</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        {sortedData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-base mb-3">
              No properties found matching your criteria.
            </p>
            <Button
              onClick={handleClearAllFilters}
              className="bg-[#324c48] hover:bg-[#3f4f24] text-white h-9 text-sm"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedData.map((property) => (
              <div
                key={property.id}
                className="transition hover:scale-[1.02] cursor-pointer"
                onClick={() => handlePropertyClick(property)}
              >
                <GridPropertyCard card={property} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}