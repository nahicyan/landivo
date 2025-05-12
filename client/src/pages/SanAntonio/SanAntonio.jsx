// client/src/pages/SanAntonio/SanAntonio.jsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { PuffLoader } from "react-spinners";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import useProperties from "../../components/hooks/useProperties.js";
import PropertyCard from "@/components/PropertyCard/PropertyCard";
import SearchAreaWithTracking from "@/components/SearchArea/SearchAreaWithTracking";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function SanAntonioProperty() {
  const { data, isError, isLoading } = useProperties();
  const [areaQuery, setAreaQuery] = useState("");
  const scrollRef = useRef(null);
  const featuredScrollRef = useRef(null);
  
  // State for scrolling
  const [scrollState, setScrollState] = useState({ showLeft: false, showRight: false });
  const [featuredScrollState, setFeaturedScrollState] = useState({ showLeft: false, showRight: false });
  
  // State for featured properties
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [featuredPropertyIds, setFeaturedPropertyIds] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Update scroll states
  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      setScrollState({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft + clientWidth < scrollWidth,
      });
    }
  };
  
  const updateFeaturedScrollState = () => {
    if (featuredScrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = featuredScrollRef.current;
      setFeaturedScrollState({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft + clientWidth < scrollWidth,
      });
    }
  };

  // Add event listeners
  useEffect(() => {
    updateScrollState();
    updateFeaturedScrollState();
    window.addEventListener("resize", () => {
      updateScrollState();
      updateFeaturedScrollState();
    });
    return () => {
      window.removeEventListener("resize", updateScrollState);
      window.removeEventListener("resize", updateFeaturedScrollState);
    };
  }, [data]);

  useEffect(() => {
    updateScrollState();
  }, [areaQuery]);
  
 // Fetch featured properties from the SanAntonio row
useEffect(() => {
  if (!data || data.length === 0) return;
  
  const fetchSanAntonioRow = async () => {
    setLoadingFeatured(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows?rowType=SanAntonio`);
      
      console.log("SanAntonio row API response:", response.data);
      
      // Check if we have an array response with at least one row
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Find the SanAntonio row
        const sanAntonioRow = response.data.find(row => row.rowType === "SanAntonio");
        
        if (sanAntonioRow && Array.isArray(sanAntonioRow.displayOrder) && sanAntonioRow.displayOrder.length > 0) {
          // Get the IDs from the displayOrder array
          const orderedIds = sanAntonioRow.displayOrder;
          console.log("Property IDs in SanAntonio row:", orderedIds);
          
          // Create a map for faster property lookup
          const propertiesMap = new Map(data.map(p => [p.id, p]));
          
          // Get properties in order, filtering for featured properties in San Antonio
          const orderedProperties = orderedIds
            .map(id => propertiesMap.get(id))
            .filter(property => property && property.featured === "Featured" && property.area === "San Antonio");
          
          console.log("Final featured properties:", orderedProperties);
          
          setFeaturedProperties(orderedProperties);
          setFeaturedPropertyIds(orderedProperties.map(property => property.id));
        } else {
          console.log("No displayOrder array in SanAntonio row");
          setFeaturedProperties([]);
          setFeaturedPropertyIds([]);
        }
      } else {
        console.log("No SanAntonio row found in response");
        setFeaturedProperties([]);
        setFeaturedPropertyIds([]);
      }
    } catch (error) {
      console.error("Error fetching SanAntonio row properties:", error);
      setFeaturedProperties([]);
      setFeaturedPropertyIds([]);
    } finally {
      setLoadingFeatured(false);
      setTimeout(updateFeaturedScrollState, 100);
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

  // Filter properties
  const sanAntonioProperties = data.filter(property => property.area === "San Antonio");
  
  // Explicitly exclude the featured property IDs from regular properties
  const nonFeaturedSanAntonioProperties = sanAntonioProperties.filter(
    property => !featuredPropertyIds.includes(property.id)
  );

  // Apply search filter to non-featured San Antonio properties
  const filteredSanAntonioProperties = nonFeaturedSanAntonioProperties.filter(property => {
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

  // Apply search filter to all properties EXCEPT featured San Antonio properties
  const filteredAllProperties = data.filter(property => {
    // Skip featured San Antonio properties
    if (featuredPropertyIds.includes(property.id)) {
      return false;
    }
    
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

  // Set current area and determine which properties to display
  const currentArea = "San Antonio";
  const displayProperties = filteredSanAntonioProperties.length > 0
    ? filteredSanAntonioProperties
    : filteredAllProperties;

  // Set header text and subtitle
  const headerText = featuredProperties.length > 0 
    ? "Other Properties" 
    : (filteredSanAntonioProperties.length > 0 ? "Properties in San Antonio" : "All Properties");

  const subtitleText = filteredSanAntonioProperties.length > 0
    ? "Browse through properties available in San Antonio."
    : nonFeaturedSanAntonioProperties.length > 0 
      ? `No San Antonio properties match "${areaQuery}". Showing all matching properties instead.`
      : "Sorry! We sold through everything in San Antonio! Maybe you would be interested in these properties:";

  // Scroll handlers
  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -380, behavior: "smooth" });
      setTimeout(updateScrollState, 300);
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 380, behavior: "smooth" });
      setTimeout(updateScrollState, 300);
    }
  };
  
  const handleFeaturedScrollLeft = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: -380, behavior: "smooth" });
      setTimeout(updateFeaturedScrollState, 300);
    }
  };

  const handleFeaturedScrollRight = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: 380, behavior: "smooth" });
      setTimeout(updateFeaturedScrollState, 300);
    }
  };

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-12 text-[#4b5b4d]">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Title, Subtitle & Search */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {featuredProperties.length > 0 ? "Properties in San Antonio" : headerText}
          </h1>
          <p className="text-lg mb-6">{subtitleText}</p>
          <SearchAreaWithTracking
            query={areaQuery}
            setQuery={setAreaQuery}
            placeholder="Search in this area"
            area={currentArea}
            filteredData={filteredSanAntonioProperties}
          />
        </div>
        
        {/* Featured Properties in San Antonio */}
        {loadingFeatured ? (
          <div className="flex justify-center items-center h-40">
            <PuffLoader size={50} color="#D4A017" />
          </div>
        ) : featuredProperties.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Featured Properties in San Antonio</h2>
              <div className="mx-auto w-16 h-1 bg-[#D4A017] mb-3"></div>
              <p className="text-[#324c48]/80">Our top picks in the San Antonio area</p>
            </div>
            
            <div className="relative">
              {featuredScrollState.showLeft && (
                <button
                  onClick={handleFeaturedScrollLeft}
                  className="hidden sm:block sm:absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
              )}

              <div
                className="px-2 py-4 overflow-y-auto overflow-x-hidden sm:overflow-x-auto sm:overflow-y-hidden no-scrollbar"
                ref={featuredScrollRef}
                onScroll={updateFeaturedScrollState}
              >
                <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-20">
                  {featuredProperties.map((card) => (
                    <div
                      key={card.id}
                      className="w-72 flex-shrink-0 transition hover:scale-105"
                    >
                      <PropertyCard card={card} />
                    </div>
                  ))}
                </div>
              </div>

              {featuredScrollState.showRight && (
                <button
                  onClick={handleFeaturedScrollRight}
                  className="hidden sm:block sm:absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Separating Line */}
        <hr className="my-8 border-t border-[#4b5b4d]/20" />

        {/* Other Properties heading */}
        {featuredProperties.length > 0 && displayProperties.length > 0 && (
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{headerText}</h2>
            <div className="mx-auto w-16 h-1 bg-[#324c48] mb-3"></div>
          </div>
        )}

        {/* Regular Properties */}
        {displayProperties.length > 0 ? (
          <div className="relative">
            {scrollState.showLeft && (
              <button
                onClick={handleScrollLeft}
                className="hidden sm:block sm:absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}

            <div
              className="px-2 py-4 overflow-y-auto overflow-x-hidden sm:overflow-x-auto sm:overflow-y-hidden no-scrollbar"
              ref={scrollRef}
              onScroll={updateScrollState}
            >
              <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-20">
                {displayProperties.map((card) => (
                  <div
                    key={card.id}
                    className="w-72 flex-shrink-0 transition hover:scale-105"
                  >
                    <PropertyCard card={card} />
                  </div>
                ))}
              </div>
            </div>

            {scrollState.showRight && (
              <button
                onClick={handleScrollRight}
                className="hidden sm:block sm:absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-4">No properties found matching your search.</p>
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