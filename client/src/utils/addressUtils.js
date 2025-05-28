// client/src/utils/addressUtils.js
import { usePermissions } from '@/components/Auth0/PermissionsContext';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Hook to determine if street address should be displayed
 * @param {boolean} toggleObscure - Property's toggleObscure setting
 * @returns {boolean} - Whether to show the street address
 */
export const useShowAddress = (toggleObscure) => {
  const { isAuthenticated } = useAuth0();
  const { check } = usePermissions();
  
  // If property is not set to be obscured, always show address
  if (!toggleObscure) {
    return true;
  }
  
  // If property is obscured, only show if user is authenticated and has permission
  return isAuthenticated && check.canObscureProperties;
};

/**
 * Get display address based on permissions and obscure settings
 * @param {string} streetAddress - The actual street address
 * @param {boolean} toggleObscure - Property's toggleObscure setting
 * @param {boolean} showAddress - Result from useShowAddress hook
 * @returns {string} - Address to display
 */
export const getDisplayAddress = (streetAddress, toggleObscure, showAddress) => {
  if (!toggleObscure || showAddress) {
    return streetAddress || "Address unavailable";
  }
  
  return "Address Hidden";
};