// client/src/utils/propertyFilterUtils.js

/**
 * Apply all filters to properties data
 * @param {Array} properties - Array of property objects
 * @param {Object} filters - Filter configuration object
 * @param {string} searchQuery - Text search query
 * @returns {Array} Filtered properties
 */
export const applyPropertyFilters = (properties, filters, searchQuery = "") => {
  if (!properties || !Array.isArray(properties)) return [];

  return properties.filter((property) => {
    // Text search filter (OR logic across multiple fields)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        property.title?.toLowerCase().includes(query) ||
        property.streetAddress?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query) ||
        property.zip?.toLowerCase().includes(query) ||
        property.area?.toLowerCase().includes(query) ||
        property.apnOrPin?.toLowerCase().includes(query) ||
        property.ltag?.toLowerCase().includes(query) ||
        property.rtag?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.county?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Area filter
    if (filters.area !== "all" && property.area !== filters.area) {
      return false;
    }

    // Status filter
    if (filters.status !== "all" && property.status !== filters.status) {
      return false;
    }

    // State filter
    if (filters.state !== "all" && property.state !== filters.state) {
      return false;
    }

    // City filter
    if (filters.city !== "all" && property.city !== filters.city) {
      return false;
    }

    // County filter
    if (filters.county !== "all" && property.county !== filters.county) {
      return false;
    }

    // Price range filter
    const propertyPrice = parseFloat(property.askingPrice || 0);
    if (propertyPrice < filters.priceRange[0] || propertyPrice > filters.priceRange[1]) {
      return false;
    }

    // Acre range filter
    const propertyAcres = parseFloat(property.acre || 0);
    if (propertyAcres < filters.acreRange[0] || propertyAcres > filters.acreRange[1]) {
      return false;
    }

    // Square feet range filter
    if (property.sqft) {
      const propertySqft = parseFloat(property.sqft);
      if (propertySqft < filters.sqftRange[0] || propertySqft > filters.sqftRange[1]) {
        return false;
      }
    }

    // Financing filter
    if (filters.financing !== "all") {
      const propertyFinancing = property.financing?.toLowerCase() || "";
      const filterFinancing = filters.financing.toLowerCase();
      
      // Flexible matching for financing options
      if (!propertyFinancing.includes(filterFinancing) && 
          filterFinancing !== propertyFinancing) {
        return false;
      }
    }

    // Land type filter (array field - at least one match)
    if (filters.landTypes.length > 0) {
      const propertyLandTypes = property.landType || [];
      const hasMatchingLandType = filters.landTypes.some(filterType =>
        propertyLandTypes.includes(filterType)
      );
      if (!hasMatchingLandType) {
        return false;
      }
    }

    // Zoning filter
    if (filters.zoning !== "all" && property.zoning !== filters.zoning) {
      return false;
    }

    // Restrictions filter
    if (filters.restrictions !== "all") {
      const propertyRestrictions = property.restrictions?.toLowerCase() || "";
      const filterRestrictions = filters.restrictions.toLowerCase();
      if (!propertyRestrictions.includes(filterRestrictions)) {
        return false;
      }
    }

    // Utilities filters
    if (filters.water !== "all" && property.water !== filters.water) {
      return false;
    }

    if (filters.sewer !== "all" && property.sewer !== filters.sewer) {
      return false;
    }

    if (filters.electric !== "all" && property.electric !== filters.electric) {
      return false;
    }

    // Road condition filter
    if (filters.roadCondition !== "all" && property.roadCondition !== filters.roadCondition) {
      return false;
    }

    // Floodplain filter
    if (filters.floodplain !== "all" && property.floodplain !== filters.floodplain) {
      return false;
    }

    // HOA/POA filter
    if (filters.hoaPoa !== "all" && property.hoaPoa !== filters.hoaPoa) {
      return false;
    }

    // Mobile Home Friendly filter
    if (filters.mobileHomeFriendly !== "all" && 
        property.mobileHomeFriendly !== filters.mobileHomeFriendly) {
      return false;
    }

    // Featured only filter
    if (filters.featuredOnly && property.featured !== "Featured") {
      return false;
    }

    // If all filters pass, include the property
    return true;
  });
};

/**
 * Get default filter state
 * @returns {Object} Default filter configuration
 */
export const getDefaultFilters = () => ({
  area: "all",
  status: "all",
  state: "all",
  city: "all",
  county: "all",
  priceRange: [0, 10000000],
  acreRange: [0, 1000],
  sqftRange: [0, 500000],
  financing: "all",
  landTypes: [],
  zoning: "all",
  restrictions: "all",
  water: "all",
  sewer: "all",
  electric: "all",
  roadCondition: "all",
  floodplain: "all",
  hoaPoa: "all",
  mobileHomeFriendly: "all",
  featuredOnly: false,
});

/**
 * Reset all filters to default
 * @param {Function} setFilters - State setter function
 * @param {Function} setSearchQuery - Search query setter function (optional)
 */
export const resetAllFilters = (setFilters, setSearchQuery = null) => {
  setFilters(getDefaultFilters());
  if (setSearchQuery) {
    setSearchQuery("");
  }
};