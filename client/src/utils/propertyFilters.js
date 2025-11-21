import { PERMISSIONS } from './permissions';

/**
 * Determine which property statuses should be filtered based on user permissions and settings
 */
export const shouldFilterByStatus = (userPermissions, settings) => {
  if (!settings) {
    return {
      filterIncomplete: true,
      filterSold: true,
      filterNotAvailable: true,
      filterTesting: true
    };
  }

  const hasPermission = userPermissions?.includes(PERMISSIONS.STATUS_PROPERTIES);
  
  return {
    filterIncomplete: !(hasPermission && settings.displayIncomplete),
    filterSold: !(hasPermission && settings.displaySold),
    filterNotAvailable: !(hasPermission && settings.displayNotAvailable),
    filterTesting: !(hasPermission && settings.displayNotTesting)
  };
};

/**
 * Filter properties array based on status filter flags
 */
export const filterPropertiesByStatus = (properties, filterFlags) => {
  if (!properties || !Array.isArray(properties)) return [];
  
  return properties.filter(property => {
    if (filterFlags.filterIncomplete && property.status === 'Incomplete') return false;
    if (filterFlags.filterSold && property.status === 'Sold') return false;
    if (filterFlags.filterNotAvailable && property.status === 'Not Available') return false;
    if (filterFlags.filterTesting && property.status === 'Testing') return false;
    return true;
  });
};