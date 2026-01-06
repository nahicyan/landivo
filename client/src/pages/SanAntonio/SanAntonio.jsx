// client/src/pages/SanAntonio/SanAntonio.jsx

"use client";

import React, { useState, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import useProperties from "../../components/hooks/useProperties.js";
import SearchAreaWithTracking from "@/components/SearchArea/SearchAreaWithTracking";
import DisplayGrid, { createGridFilter } from "@/components/DisplayGrid/DisplayGrid";
import { Button } from "@/components/ui/button";
import { getPropertyRows } from "@/utils/api";

export default function SanAntonioProperty() {
  const { data, isError, isLoading } = useProperties();
  const [areaQuery, setAreaQuery] = useState("");

  // State for featured properties
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch featured properties from the SanAntonio row
  useEffect(() => {
    if (!data || data.length === 0) return;

    const fetchSanAntonioRow = async () => {
      setLoadingFeatured(true);
      try {
        // Use the centralized API function with rowType filter
        const rows = await getPropertyRows("SanAntonio");

        if (Array.isArray(rows) && rows.length > 0) {
          const sanAntonioRow = rows.find((row) => row.rowType === "SanAntonio");

          if (sanAntonioRow && Array.isArray(sanAntonioRow.displayOrder) && sanAntonioRow.displayOrder.length > 0) {
            const orderedIds = sanAntonioRow.displayOrder;
            const propertiesMap = new Map(data.map((p) => [p.id, p]));

            const featuredIds = orderedIds.filter((id) => {
              const property = propertiesMap.get(id);
              return property && property.featured === "Featured" && property.area === "San Antonio";
            });

            setFeaturedPropertyIds(featuredIds);
          }
        }
      } catch (error) {
        console.error("Error fetching SanAntonio row properties:", error);
        setFeaturedPropertyIds([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchSanAntonioRow();
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

  // Filter San Antonio properties
  const sanAntonioProperties = data.filter((property) => property.area === "San Antonio");
  const nonFeaturedSanAntonioProperties = sanAntonioProperties.filter((property) => !featuredPropertyIds.includes(property.id));

  // Apply search filter
  const filteredSanAntonioProperties = nonFeaturedSanAntonioProperties.filter((property) => {
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

  // Fallback to all properties if no San Antonio properties match search
  const fallbackProperties = data.filter((property) => {
        // Exclude San Antonio properties - they're shown in sections above
    if (property.area === "San Antonio") return false;

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
  const hasSanAntonioProperties = filteredSanAntonioProperties.length > 0;
  const showFallback = fallbackProperties.length > 0;

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title, Subtitle & Search */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{hasSanAntonioProperties || hasFeaturedProperties ? "Properties in San Antonio" : "All Properties"}</h1>
          <p className="text-lg mb-6">
            {hasSanAntonioProperties || hasFeaturedProperties
              ? "Browse through properties available in San Antonio."
              : "Sorry! We sold through everything in San Antonio! Maybe you would be interested in these properties:"}
          </p>
          <SearchAreaWithTracking query={areaQuery} setQuery={setAreaQuery} placeholder="Search in this area" area="San Antonio" filteredData={filteredSanAntonioProperties} />
        </div>

        {/* 1. Featured Properties Section - DisplayRow */}
        {hasFeaturedProperties && (
          <DisplayGrid
            properties={data}
            filter={createGridFilter.featured("all", featuredPropertyIds)}
            title="Featured Properties in San Antonio"
            subtitle="Our top picks in the San Antonio area"
            loading={loadingFeatured}
            emptyMessage="No featured properties available at this time."
          />
        )}

        {/* Separating Line */}
        {hasFeaturedProperties && <hr className="my-8 border-t border-[#4b5b4d]/20" />}

        {/* 2. Area Properties Section - DisplayGrid */}
        {hasSanAntonioProperties && (
          <DisplayGrid properties={filteredSanAntonioProperties} filter={{ type: "all" }} title={hasFeaturedProperties ? "Other Properties In San Antonio" : "All Properties in San Antonio"} />
        )}

        {/* No San Antonio Properties Message */}
        {!hasSanAntonioProperties && areaQuery && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">No San Antonio properties match "{areaQuery}".</p>
            {showFallback && <p className="text-sm text-gray-500">Showing all matching properties instead.</p>}
          </div>
        )}

        {/* 3. All Properties Fallback - DisplayGrid */}
        {showFallback && <DisplayGrid properties={fallbackProperties} filter={{ type: "all" }} showDivider={!hasFeaturedProperties} title="Other Properties" emptyMessage="No properties found matching your search." />}

        {/* No Properties At All */}
        {!hasFeaturedProperties && !hasSanAntonioProperties && !showFallback && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">{areaQuery ? `No properties found matching "${areaQuery}".` : "Sorry! We sold through everything in San Antonio!"}</p>
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
