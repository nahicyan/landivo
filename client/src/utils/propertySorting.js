/**
 * Sort properties to ensure Pending status always appears last
 * @param {Array} properties - Array of property objects
 * @returns {Array} Sorted array with pending properties at the end
 */
export const sortPropertiesWithPendingLast = (properties) => {
  if (!properties || !Array.isArray(properties)) return properties;
  
  // Separate pending from non-pending properties
  const nonPending = properties.filter(property => property.status !== 'Pending');
  const pending = properties.filter(property => property.status === 'Pending');
  
  // Return non-pending first, then pending
  return [...nonPending, ...pending];
};