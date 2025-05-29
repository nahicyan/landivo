"use client";

import React, { useState, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { useSearchParams, Link } from "react-router-dom";
import useProperties from "../../components/hooks/useProperties.js";
import SearchWithTracking from "@/components/Search/SearchWithTracking";
import DisplayRow, { createFilter } from "@/components/DisplayRow/DisplayRow";
import { Button } from "@/components/ui/button";

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

  // Define the areas and their corresponding routes
  const areas = [
    { name: "DFW", route: "/DFW", displayName: "Dallas Fort Worth" },
    { name: "Austin", route: "/Austin", displayName: "Austin" },
    { name: "Houston", route: "/Houston", displayName: "Houston" },
    { name: "San Antonio", route: "/SanAntonio", displayName: "San Antonio" },
    { name: "Other Areas", route: "/OtherLands", displayName: "Other Areas" }
  ];

  // Helper function to get properties for an area
  const getAreaProperties = (areaName) => {
    return filteredData.filter(property => property.area === areaName);
  };

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

        {/* Location Sections using DisplayRow with Area Buttons */}
        {areas.map((area, index) => {
          const areaProperties = getAreaProperties(area.name);
          
          // Don't render section if no properties
          if (areaProperties.length === 0) return null;

          return (
            <div key={area.name} className="my-12">
              <DisplayRow
                properties={filteredData}
                filter={createFilter.area(area.name)}
                title={`Properties in ${area.displayName}`}
                showDivider={index > 0}
                emptyMessage=""
                className=""
              />
              
              {/* All Properties in Area Button */}
              <div className="flex justify-end mt-4 mb-8">
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
          <p className="text-center text-gray-600 py-4">
            No properties found.
          </p>
        )}
      </div>
    </div>
  );
}