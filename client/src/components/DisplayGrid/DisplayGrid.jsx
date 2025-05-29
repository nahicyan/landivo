import React, { useState, useEffect } from "react";
import PropertyCard from "../PropertyCard/PropertyCard";
import { PuffLoader } from "react-spinners";

/**
 * DisplayGrid Component
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
 * @param {number} props.maxProperties - Maximum number of properties to display (optional)
 * @param {string} props.gridCols - Custom grid columns class (optional)
 * @param {boolean} props.showSorting - Show sorting dropdown (optional)
 * @param {boolean} props.showCount - Show property count (optional)
 */
const DisplayGrid = ({
  properties = [],
  filter = { type: 'all' },
  title,
  subtitle,
  showDivider = false,
  loading = false,
  emptyMessage = "No properties found.",
  onPropertyClick,
  maxProperties,
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  showSorting = false,
  showCount = false,
  className = ""
}) => {
  const [sortBy, setSortBy] = useState("default");
  // Sort properties based on sortBy value
  const sortProperties = (props) => {
    if (!props || props.length === 0) return [];
    
    const sorted = [...props];
    
    switch (sortBy) {
      case "price-low-high":
        return sorted.sort((a, b) => {
          const priceA = a.disPrice || a.askingPrice || 0;
          const priceB = b.disPrice || b.askingPrice || 0;
          return priceA - priceB;
        });
        
      case "price-high-low":
        return sorted.sort((a, b) => {
          const priceA = a.disPrice || a.askingPrice || 0;
          const priceB = b.disPrice || b.askingPrice || 0;
          return priceB - priceA;
        });
        
      case "acres-low-high":
        return sorted.sort((a, b) => {
          const acresA = parseFloat(a.acre) || 0;
          const acresB = parseFloat(b.acre) || 0;
          return acresA - acresB;
        });
        
      case "acres-high-low":
        return sorted.sort((a, b) => {
          const acresA = parseFloat(a.acre) || 0;
          const acresB = parseFloat(b.acre) || 0;
          return acresB - acresA;
        });
        
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
      case "oldest":
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
      default:
        return sorted;
    }
  };

  // Filter properties based on filter configuration
  const getFilteredProperties = () => {
    if (!properties || properties.length === 0) return [];

    let filtered = [];

    // Handle different filter types
    switch (filter.type) {
      case 'all':
        filtered = properties;
        break;

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
          filtered = orderedProperties;
        } else {
          // Filter by featured status and optionally by gridType
          filtered = properties.filter(p => {
            const isFeatured = p.featured === "Featured";
            
            // If gridType is specified, also check for it
            if (filter.gridType && filter.gridType !== 'all') {
              return isFeatured && p.gridType === filter.gridType;
            }
            
            return isFeatured;
          });
        }
        break;

      case 'area':
        filtered = properties.filter(p => p.area === filter.value);
        break;

      case 'landType':
        filtered = properties.filter(p => 
          Array.isArray(p.landType) 
            ? p.landType.includes(filter.value)
            : p.landType === filter.value
        );
        break;

      case 'custom':
        // Handle custom filter function
        if (typeof filter.filterFn === 'function') {
          filtered = properties.filter(filter.filterFn);
        } else {
          filtered = properties;
        }
        break;

      case 'combination':
        // Handle combination filters (AND/OR operations)
        filtered = handleCombinationFilter(properties, filter.filters, filter.operator);
        break;

      case 'exclude':
        // Exclude specific property IDs
        if (filter.excludeIds && Array.isArray(filter.excludeIds)) {
          filtered = properties.filter(p => !filter.excludeIds.includes(p.id));
        } else {
          filtered = properties;
        }
        break;

      default:
        filtered = properties;
    }

    // Apply maxProperties limit if specified
    if (maxProperties && maxProperties > 0) {
      filtered = filtered.slice(0, maxProperties);
    }

    return filtered;
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
        const isFeatured = property.featured === "Featured";
        if (filter.gridType && filter.gridType !== 'all') {
          return isFeatured && property.gridType === filter.gridType;
        }
        return isFeatured;
        
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
    <div className={`display-grid-section ${className}`}>
      {/* Divider */}
      {showDivider && <hr className="my-8 border-t border-[#4b5b4d]/20" />}

      {/* Title Section */}
      {title && (
        <div className="mb-6">
          {/* Title and Sort Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
              {filter.type === 'featured' && (
                <div className="mx-auto sm:mx-0 w-16 h-1 bg-[#D4A017] mb-3"></div>
              )}
              {subtitle && <p className="text-[#324c48]/80">{subtitle}</p>}
            </div>
            
            {/* Sort and Count Section */}
            {(showSorting || showCount) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {showCount && (
                  <p className="text-sm text-gray-600 text-center sm:text-right">
                    {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
                  </p>
                )}
                
                {showSorting && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Sort by:
                    </label>
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="block w-full sm:w-auto px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#324c48] focus:border-[#324c48] bg-white"
                    >
                      <option value="default">Default</option>
                      <option value="price-low-high">Price: Low to High</option>
                      <option value="price-high-low">Price: High to Low</option>
                      <option value="acres-low-high">Acres: Low to High</option>
                      <option value="acres-high-low">Acres: High to Low</option>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <PuffLoader size={50} color="#D4A017" />
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className={`grid ${gridCols} gap-5 py-8`}>
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="transition hover:scale-105 cursor-pointer"
              onClick={() => handlePropertyClick(property)}
            >
              <PropertyCard card={property} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-4">{emptyMessage}</p>
      )}
    </div>
  );
};

export default DisplayGrid;

// Export filter helper functions for easier usage
export const createGridFilter = {
  all: () => ({ type: 'all' }),
  
  featured: (gridType = 'all', rowIds = null) => ({
    type: 'featured',
    gridType,
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