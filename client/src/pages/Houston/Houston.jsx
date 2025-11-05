// client/src/pages/Houston/Houston.jsx

"use client";

import React, { useState, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import useProperties from "../../components/hooks/useProperties.js";
import SearchAreaWithTracking from "@/components/SearchArea/SearchAreaWithTracking";
import DisplayGrid, { createGridFilter } from "@/components/DisplayGrid/DisplayGrid";
import { Button } from "@/components/ui/button";
import { getPropertyRows } from "@/utils/api";

export default function HoustonProperty() {
  const { data, isError, isLoading } = useProperties();
  const [areaQuery, setAreaQuery] = useState("");

  // State for featured properties
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch featured properties from the Houston row
  useEffect(() => {
    if (!data || data.length === 0) return;

    const fetchHoustonRow = async () => {
      setLoadingFeatured(true);
      try {
        // Use the centralized API function with rowType filter
        const rows = await getPropertyRows("Houston");

        if (Array.isArray(rows) && rows.length > 0) {
          const houstonRow = rows.find((row) => row.rowType === "Houston");

          if (houstonRow && Array.isArray(houstonRow.displayOrder) && houstonRow.displayOrder.length > 0) {
            const orderedIds = houstonRow.displayOrder;
            const propertiesMap = new Map(data.map((p) => [p.id, p]));

            const featuredIds = orderedIds.filter((id) => {
              const property = propertiesMap.get(id);
              return property && property.featured === "Featured" && property.area === "Houston";
            });

            setFeaturedPropertyIds(featuredIds);
          }
        }
      } catch (error) {
        console.error("Error fetching Houston row properties:", error);
        setFeaturedPropertyIds([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchHoustonRow();
  }, [data]);

  // Error and Loading states
  if (isError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-red-600 text-xl font-semibold">Error fetching properties.</h2>
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

  // Filter Houston properties
  const houstonProperties = data.filter((property) => property.area === "Houston");
  const nonFeaturedHoustonProperties = houstonProperties.filter((property) => !featuredPropertyIds.includes(property.id));

  // Apply search filter
  const filteredHoustonProperties = nonFeaturedHoustonProperties.filter((property) => {
    const query = areaQuery.toLowerCase();
    if (!query) return true;

    return (
      property.title?.toLowerCase().includes(query) ||
      property.streetAddress?.toLowerCase().includes(query) ||
      property.state?.toLowerCase().includes(query) ||
      property.zip?.toLowerCase().includes(query) ||
      property.area?.toLowerCase().includes(query) ||
      property.apnOrPin?.toLowerCase().includes(query) ||
      property.ltag?.toLowerCase().includes(query) ||
      property.rtag?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.county?.toLowerCase().includes(query)
    );
  });

  // Fallback to all properties if no Houston properties match search
  const fallbackProperties = data.filter((property) => {
    if (featuredPropertyIds.includes(property.id)) return false;

    const query = areaQuery.toLowerCase();
    if (!query) return true;

    return (
      property.title?.toLowerCase().includes(query) ||
      property.streetAddress?.toLowerCase().includes(query) ||
      property.state?.toLowerCase().includes(query) ||
      property.zip?.toLowerCase().includes(query) ||
      property.area?.toLowerCase().includes(query) ||
      property.apnOrPin?.toLowerCase().includes(query) ||
      property.ltag?.toLowerCase().includes(query) ||
      property.rtag?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query) ||
      property.county?.toLowerCase().includes(query)
    );
  });

  const hasFeaturedProperties = featuredPropertyIds.length > 0;
  const hasHoustonProperties = filteredHoustonProperties.length > 0;
  const showFallback = !hasHoustonProperties && fallbackProperties.length > 0;

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title, Subtitle & Search */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{hasHoustonProperties || hasFeaturedProperties ? "Properties in Houston" : "All Properties"}</h1>
          <p className="text-lg mb-6">
            {hasHoustonProperties || hasFeaturedProperties
              ? "Browse through properties available in Houston."
              : "Sorry! We sold through everything in Houston! Maybe you would be interested in these properties:"}
          </p>
          <SearchAreaWithTracking query={areaQuery} setQuery={setAreaQuery} placeholder="Search in this area" area="Houston" filteredData={filteredHoustonProperties} />
        </div>

        {/* 1. Featured Properties Section - DisplayRow */}
        {hasFeaturedProperties && (
          <DisplayGrid
            properties={data}
            filter={createGridFilter.featured("all", featuredPropertyIds)}
            title="Featured Properties in Houston"
            subtitle="Our top picks in the Houston area"
            loading={loadingFeatured}
            emptyMessage="No featured properties available at this time."
          />
        )}

        {/* Separating Line */}
        {hasFeaturedProperties && <hr className="my-8 border-t border-[#4b5b4d]/20" />}

        {/* 2. Area Properties Section - DisplayGrid */}
        {hasHoustonProperties && (
          <DisplayGrid properties={filteredHoustonProperties} filter={{ type: "all" }} title={hasFeaturedProperties ? "Other Properties In Houston" : "All Properties in Houston"} />
        )}

        {/* No Houston Properties Message */}
        {!hasHoustonProperties && areaQuery && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">No Houston properties match "{areaQuery}".</p>
            {showFallback && <p className="text-sm text-gray-500">Showing all matching properties instead.</p>}
          </div>
        )}

        {/* 3. All Properties Fallback - DisplayGrid */}
        {showFallback && <DisplayGrid properties={fallbackProperties} filter={{ type: "all" }} showDivider={true} emptyMessage="No properties found matching your search." />}

        {/* No Properties At All */}
        {!hasFeaturedProperties && !hasHoustonProperties && !showFallback && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">{areaQuery ? `No properties found matching "${areaQuery}".` : "Sorry! We sold through everything in Houston!"}</p>
          </div>
        )}

        {/* "All Properties" Button */}
        <div className="mt-10 text-center">
          <Button
            onClick={() => (window.location.href = "/properties")}
            className="bg-[#324c48] hover:bg-[#3f4f24] text-white px-6 py-3 text-lg font-semibold rounded-lg shadow transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#3f4f24] focus:ring-offset-2">
            All Properties
          </Button>
        </div>
      </div>
    </div>
  );
}
