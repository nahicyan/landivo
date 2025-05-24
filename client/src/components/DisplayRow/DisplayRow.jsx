import React, { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import PropertyCard from "../PropertyCard/PropertyCard";
import { PuffLoader } from "react-spinners";

/**
 * DisplayRow Component
 * 
 * @param {Object} props
 * @param {Array} props.properties - All properties data
 * @param {Object} props.filter - Filter configuration
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle (optional)
 * @param {boolean} props.showDivider - Show divider line above section (optional)
 * @param {boolean} props.loading - Loading state (optional)
 * @param {string} props.emptyMessage - Message when no properties found (optional)
 * @param {Function} props.onPropertyClick - Callback when property clicked (optional)
 */
const DisplayRow = ({
  properties = [],
  filter = { type: 'all' },
  title,
  subtitle,
  showDivider = false,
  loading = false,
  emptyMessage = "No properties found.",
  onPropertyClick,
  className = ""
}) => {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({ showLeft: false, showRight: false });

  // Filter properties based on filter configuration
  const getFilteredProperties = () => {
    if (!properties || properties.length === 0) return [];

    // Handle different filter types
    switch (filter.type) {
      case 'all':
        return properties;

      case 'featured':
        // If specific rowIds are provided, use those as the primary filter
        if (filter.rowIds && filter.rowIds.length > 0) {
          // Get properties in the order specified by rowIds
          const orderedProperties = [];
          filter.rowIds.forEach(id => {
            const property = properties.find(p => p.id === id);
            if (property) {
              orderedProperties.push(property);
            }
          });
          return orderedProperties;
        }
        
        // Otherwise, filter by featured status
        return properties.filter(p => p.featured === "Featured");

      case 'area':
        return properties.filter(p => p.area === filter.value);

      case 'landType':
        return properties.filter(p => 
          Array.isArray(p.landType) 
            ? p.landType.includes(filter.value)
            : p.landType === filter.value
        );

      case 'custom':
        // Handle custom filter function
        if (typeof filter.filterFn === 'function') {
          return properties.filter(filter.filterFn);
        }
        return properties;

      case 'combination':
        // Handle combination filters (AND/OR operations)
        return handleCombinationFilter(properties, filter.filters, filter.operator);

      case 'exclude':
        // Exclude specific property IDs
        if (filter.excludeIds && Array.isArray(filter.excludeIds)) {
          return properties.filter(p => !filter.excludeIds.includes(p.id));
        }
        return properties;

      default:
        return properties;
    }
  };

  // Handle combination filters with AND/OR operators
  const handleCombinationFilter = (props, filters, operator = 'AND') => {
    if (!filters || !Array.isArray(filters)) return props;

    if (operator === 'AND') {
      return props.filter(property => {
        return filters.every(f => matchesFilter(property, f));
      });
    } else if (operator === 'OR') {
      // For OR, we need to get unique properties that match any filter
      const matchedIds = new Set();
      const matchedProperties = [];

      filters.forEach(f => {
        const filtered = props.filter(p => matchesFilter(p, f));
        filtered.forEach(p => {
          if (!matchedIds.has(p.id)) {
            matchedIds.add(p.id);
            matchedProperties.push(p);
          }
        });
      });

      return matchedProperties;
    }

    return props;
  };

  // Check if a property matches a single filter
  const matchesFilter = (property, filter) => {
    switch (filter.type) {
      case 'featured':
        return property.featured === "Featured";
      case 'area':
        return property.area === filter.value;
      case 'landType':
        return Array.isArray(property.landType) 
          ? property.landType.includes(filter.value)
          : property.landType === filter.value;
      case 'custom':
        return typeof filter.filterFn === 'function' ? filter.filterFn(property) : true;
      default:
        return true;
    }
  };

  const filteredProperties = getFilteredProperties();

  // Update scroll state
  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      setScrollState({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft + clientWidth < scrollWidth,
      });
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  // Update scroll state when properties or filter changes
  useEffect(() => {
    updateScrollState();
  }, [properties.length, filter]);

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

  // Handle property click
  const handlePropertyClick = (property) => {
    if (onPropertyClick) {
      onPropertyClick(property);
    }
  };

  // Don't render section if no properties and hideWhenEmpty is true
  if (!loading && filteredProperties.length === 0 && filter.hideWhenEmpty) {
    return null;
  }

  return (
    <div className={`display-row-section ${className}`}>
      {/* Divider */}
      {showDivider && <hr className="my-8 border-t border-[#4b5b4d]/20" />}

      {/* Title Section */}
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
          {filter.type === 'featured' && (
            <div className="mx-auto w-16 h-1 bg-[#D4A017] mb-3"></div>
          )}
          {subtitle && <p className="text-[#324c48]/80">{subtitle}</p>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <PuffLoader size={50} color="#D4A017" />
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="relative">
          {/* Left Scroll Button */}
          {scrollState.showLeft && (
            <button
              onClick={handleScrollLeft}
              className="hidden sm:block sm:absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            className="px-2 py-4 overflow-y-auto overflow-x-hidden sm:overflow-x-auto sm:overflow-y-hidden no-scrollbar"
            ref={scrollRef}
            onScroll={updateScrollState}
          >
            <div className="flex flex-col sm:flex-row space-y-5 sm:space-y-0 sm:space-x-5">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex-shrink-0 transition hover:scale-105"
                  onClick={() => handlePropertyClick(property)}
                >
                  <PropertyCard card={property} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Scroll Button */}
          {scrollState.showRight && (
            <button
              onClick={handleScrollRight}
              className="hidden sm:block sm:absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-4">{emptyMessage}</p>
      )}
    </div>
  );
};

export default DisplayRow;

// Export filter helper functions for easier usage
export const createFilter = {
  all: () => ({ type: 'all' }),
  
  featured: (rowType = null, rowIds = null) => ({
    type: 'featured',
    rowType,
    rowIds
  }),
  
  area: (areaName) => ({
    type: 'area',
    value: areaName
  }),
  
  landType: (type) => ({
    type: 'landType',
    value: type
  }),
  
  custom: (filterFn) => ({
    type: 'custom',
    filterFn
  }),
  
  exclude: (propertyIds) => ({
    type: 'exclude',
    excludeIds: propertyIds
  }),
  
  // Combination filters
  and: (...filters) => ({
    type: 'combination',
    operator: 'AND',
    filters
  }),
  
  or: (...filters) => ({
    type: 'combination',
    operator: 'OR',
    filters
  })
};