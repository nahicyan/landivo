// client/src/pages/DFW/DFW.jsx

"use client";

import React, { useState, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import useProperties from "../../components/hooks/useProperties.js";
import SearchAreaWithTracking from "@/components/SearchArea/SearchAreaWithTracking";
import DisplayRow, { createFilter } from "@/components/DisplayRow/DisplayRow";
import DisplayGrid from "@/components/DisplayGrid/DisplayGrid";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function DFWProperty() {
  const { data, isError, isLoading } = useProperties();
  const [areaQuery, setAreaQuery] = useState("");
  
  // State for featured properties
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Fetch featured properties from the DFW row
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const fetchDFWRow = async () => {
      setLoadingFeatured(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows?rowType=DFW`);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          const dfwRow = response.data.find(row => row.rowType === "DFW");
          
          if (dfwRow && Array.isArray(dfwRow.displayOrder) && dfwRow.displayOrder.length > 0) {
            const orderedIds = dfwRow.displayOrder;
            const propertiesMap = new Map(data.map(p => [p.id, p]));
            
            const featuredIds = orderedIds.filter(id => {
              const property = propertiesMap.get(id);
              return property && property.featured === "Featured" && property.area === "DFW";
            });
            
            setFeaturedPropertyIds(featuredIds);
          }
        }
      } catch (error) {
        console.error("Error fetching DFW row properties:", error);
        setFeaturedPropertyIds([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchDFWRow();
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

  // Filter and sort DFW properties
  const dfwProperties = data.filter(property => property.area === "DFW");
  const nonFeaturedDFWProperties = dfwProperties.filter(
    property => !featuredPropertyIds.includes(property.id)
  );

  // Apply search filter
  const filteredDFWProperties = nonFeaturedDFWProperties.filter(property => {
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

  // Fallback to all properties if no DFW properties match search
  const fallbackProperties = data.filter(property => {
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
  const hasDFWProperties = filteredDFWProperties.length > 0;
  const showFallback = !hasDFWProperties && fallbackProperties.length > 0;

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title, Subtitle & Search */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Properties in Dallas Fort Worth
          </h1>
          <p className="text-lg mb-6">
            Browse through properties available in Dallas Fort Worth.
          </p>
          <SearchAreaWithTracking
            query={areaQuery}
            setQuery={setAreaQuery}
            placeholder="Search in this area"
            area="DFW"
            filteredData={filteredDFWProperties}
          />
        </div>
        
        {/* 1. Featured Properties Section - DisplayRow */}
        {hasFeaturedProperties && (
          <DisplayRow
            properties={data}
            filter={createFilter.featured('DFW', featuredPropertyIds)}
            title="Featured Properties in Dallas Fort Worth"
            subtitle="Our top picks in the Dallas Fort Worth area"
            loading={loadingFeatured}
            emptyMessage="No featured properties available at this time."
          />
        )}

        {/* Separating Line */}
        {hasFeaturedProperties && <hr className="my-8 border-t border-[#4b5b4d]/20" />}

        {/* 2. Area Properties Section - DisplayGrid */}
        {hasDFWProperties && (
          <DisplayGrid
            properties={filteredDFWProperties}
            filter={{ type: 'all' }}
            title={hasFeaturedProperties ? "Other Properties" : "All Properties in Dallas Fort Worth"}
            showSorting={true}
            initialSort="default"
          />
        )}

        {/* No DFW Properties Message */}
        {!hasDFWProperties && areaQuery && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 mb-4">
              No Dallas Fort Worth properties match "{areaQuery}".
            </p>
            {showFallback && (
              <p className="text-sm text-gray-500">
                Showing all matching properties instead.
              </p>
            )}
          </div>
        )}

        {/* 3. All Properties Fallback - DisplayRow */}
        {showFallback && (
          <DisplayRow
            properties={fallbackProperties}
            filter={createFilter.all()}
            title={areaQuery ? `All Properties Matching "${areaQuery}"` : "All Properties"}
            subtitle="Maybe you would be interested in these properties"
            showDivider={true}
            emptyMessage="No properties found matching your search."
          />
        )}

        {/* No Properties At All */}
        {!hasFeaturedProperties && !hasDFWProperties && !showFallback && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">
              {areaQuery 
                ? `No properties found matching "${areaQuery}".`
                : "Sorry! We sold through everything in Dallas Fort Worth!"
              }
            </p>
          </div>
        )}

        {/* "All Properties" Button */}
        <div className="mt-10 text-center">
          <Button
            onClick={() => (window.location.href = "/properties")}
            className="bg-[#324c48] hover:bg-[#3f4f24] text-white px-6 py-3 text-lg font-semibold rounded-lg shadow transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#3f4f24] focus:ring-offset-2"
          >
            All Properties
          </Button>
        </div>
      </div>
    </div>
  );
}