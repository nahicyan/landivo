// client/src/components/Search/SearchWithTracking.jsx
import React, { useEffect } from 'react';
import Search from './Search';
import { useActivityTrackingContext } from '@/components/ActivityTracking/ActivityTrackingProvider';
import { useVipBuyer } from '@/utils/VipBuyerContext';

const SearchWithTracking = (props) => {
  const { trackSearch, trackEvent } = useActivityTrackingContext();
  const { isVipBuyer } = useVipBuyer();
  
  // Track when search query or filters change
  useEffect(() => {
    // Only track for VIP buyers
    if (!isVipBuyer || !props.query) return;
    
    // Debounce tracking to avoid excessive events on rapid typing
    const debounceTimer = setTimeout(() => {
      // Only track non-empty searches
      if (props.query.trim()) {
        trackSearch(
          props.query,
          props.filteredData?.length || 0,
          { type: 'standard', ...props.filters || {} }
        );
        
        // Track additional search metadata
        trackEvent('search_query', {
          searchType: 'standard',
          query: props.query,
          resultsCount: props.filteredData?.length || 0,
          timestamp: new Date().toISOString(),
          context: props.context || 'properties',
          filters: props.filters || {}
        });
      }
    }, 800); // 800ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [isVipBuyer, props.query, props.filteredData, props.filters, props.context, trackSearch, trackEvent]);

  // Track filter changes separately
  useEffect(() => {
    if (!isVipBuyer || !props.filters) return;
    
    const debounceTimer = setTimeout(() => {
      trackEvent('filter_change', {
        filters: props.filters,
        resultsCount: props.filteredData?.length || 0,
        timestamp: new Date().toISOString(),
        context: props.context || 'properties'
      });
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }, [isVipBuyer, props.filters, props.filteredData, props.context, trackEvent]);

  // Render the original Search component with all props
  return <Search {...props} />;
};

export default SearchWithTracking;