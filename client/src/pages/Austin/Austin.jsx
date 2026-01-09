// client/src/pages/Austin/Austin.jsx

"use client";

import React, { useState, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import useProperties from "../../components/hooks/useProperties.js";
import SearchAreaWithTracking from "@/components/SearchArea/SearchAreaWithTracking";
import DisplayGrid, { createGridFilter } from "@/components/DisplayGrid/DisplayGrid";
import { Button } from "@/components/ui/button";
import { getPropertyRows } from "@/utils/api";
import { getLogger } from "@/utils/logger";

const log = getLogger("AustinProperty");

export default function AustinProperty() {
  const { data, isError, isLoading } = useProperties();
  const [areaQuery, setAreaQuery] = useState("");

  // State for featured properties
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch featured properties from the Austin row
  useEffect(() => {
    if (!data || data.length === 0) return;

    const fetchAustinRow = async () => {
      setLoadingFeatured(true);
      try {
        // Use the centralized API function with rowType filter
        const rows = await getPropertyRows("Austin");

        if (Array.isArray(rows) && rows.length > 0) {
          const austinRow = rows.find((row) => row.rowType === "Austin");

          if (austinRow && Array.isArray(austinRow.displayOrder) && austinRow.displayOrder.length > 0) {
            const orderedIds = austinRow.displayOrder;
            const propertiesMap = new Map(data.map((p) => [p.id, p]));

            const featuredIds = orderedIds.filter((id) => {
              const property = propertiesMap.get(id);
              return property && property.featured === "Featured" && property.area === "Austin";
            });

            setFeaturedPropertyIds(featuredIds);
          }
        }
      } catch (error) {
        log.error(`[AustinProperty:fetchAustinRow] > [Error]: ${error.message}`);
        setFeaturedPropertyIds([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchAustinRow();
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

  // Filter Austin properties
  const austinProperties = data.filter((property) => property.area === "Austin");
  const nonFeaturedAustinProperties = austinProperties.filter((property) => !featuredPropertyIds.includes(property.id));

  // Apply search filter
  const filteredAustinProperties = nonFeaturedAustinProperties.filter((property) => {
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

  // Fallback to all properties if no Austin properties match search
  const fallbackProperties = data.filter((property) => {
    // Exclude Austin properties - they're shown in sections above
    if (property.area === "Austin") return false;

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
  const hasAustinProperties = filteredAustinProperties.length > 0;
  const showFallback = fallbackProperties.length > 0;

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title, Subtitle & Search */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{hasAustinProperties || hasFeaturedProperties ? "Properties in Austin" : "All Properties"}</h1>
          <p className="text-lg mb-6">
            {hasAustinProperties || hasFeaturedProperties
              ? "Browse through properties available in Austin."
              : "Sorry! We sold through everything in Austin! Maybe you would be interested in these properties:"}
          </p>
          <SearchAreaWithTracking query={areaQuery} setQuery={setAreaQuery} placeholder="Search in this area" area="Austin" filteredData={filteredAustinProperties} />
        </div>

        {/* 1. Featured Properties Section - DisplayRow */}
        {hasFeaturedProperties && (
          <DisplayGrid
            properties={data}
            filter={createGridFilter.featured("all", featuredPropertyIds)}
            title="Featured Properties in Austin"
            subtitle="Our top picks in the Austin area"
            loading={loadingFeatured}
            emptyMessage="No featured properties available at this time."
          />
        )}

        {/* Separating Line */}
        {hasFeaturedProperties && <hr className="my-8 border-t border-[#4b5b4d]/20" />}

        {/* 2. Area Properties Section - DisplayGrid */}
        {hasAustinProperties && (
          <DisplayGrid properties={filteredAustinProperties} filter={{ type: "all" }} title={hasFeaturedProperties ? "Other Properties In Austin" : "All Properties in Austin"} />
        )}

        {/* No Austin Properties Message */}
        {!hasAustinProperties && areaQuery && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">No Austin properties match "{areaQuery}".</p>
            {showFallback && <p className="text-sm text-gray-500">Showing all matching properties instead.</p>}
          </div>
        )}

        {/* 3. All Properties Fallback - DisplayGrid */}
        {showFallback && <DisplayGrid properties={fallbackProperties} filter={{ type: "all" }} showDivider={!hasFeaturedProperties} title="Other Properties" emptyMessage="No properties found matching your search." />}

        {/* No Properties At All */}
        {!hasFeaturedProperties && !hasAustinProperties && !showFallback && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">{areaQuery ? `No properties found matching "${areaQuery}".` : "Sorry! We sold through everything in Austin!"}</p>
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
