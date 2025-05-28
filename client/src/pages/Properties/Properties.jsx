"use client";

import React, { useState, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { useSearchParams } from "react-router-dom";
import useProperties from "../../components/hooks/useProperties.js";
import SearchWithTracking from "@/components/Search/SearchWithTracking";
import DisplayRow, { createFilter } from "@/components/DisplayRow/DisplayRow";

export default function Properties() {
  const { data, isError, isLoading } = useProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    setSearchQuery(searchFromUrl);
  }, [searchParams]);

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h2 className="text-red-600 text-xl font-semibold">
          Error fetching data.
        </h2>
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

  // Filter properties using OR logic across multiple fields
  const filteredData = data.filter((property) => {
    const query = searchQuery.toLowerCase();
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

  // Define the areas you want separate sections for
  const areas = ["DFW", "Austin", "Houston", "San Antonio", "Other Areas"];

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      {/* Hero Section */}
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title, Subtitle & Search */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-lg mb-6">
            Browse through a wide selection of properties with detailed filters
            to help you find the perfect fit.
          </p>
          <SearchWithTracking
            query={searchQuery}
            setQuery={setSearchQuery}
            context="properties"
          />
        </div>

        {/* Small Separating Line */}
        <hr className="my-8 border-t border-[#4b5b4d]/20" />

        {/* Location Sections using DisplayRow */}
        {areas.map((area, index) => (
          <DisplayRow
            key={area}
            properties={filteredData}
            filter={{ ...createFilter.area(area), hideWhenEmpty: true }}
            title={`Properties in ${area}`}
            showDivider={index > 0}
            emptyMessage=""
            className="my-12"
          />
        ))}

        {/* No matching properties */}
        {filteredData.length === 0 && (
          <p className="text-center text-gray-600 py-4">
            No properties found.
          </p>
        )}
      </div>
    </div>
  );
}