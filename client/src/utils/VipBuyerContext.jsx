// client/src/utils/VipBuyerContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getBuyerByAuth0Id } from "@/utils/api"; // ✅ Import API function

// Create a context for VIP buyer information
export const VipBuyerContext = createContext(null);

export const VipBuyerProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth0(); // ✅ Removed getAccessTokenSilently
  const [isVipBuyer, setIsVipBuyer] = useState(false);
  const [vipBuyerData, setVipBuyerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized function to check VIP buyer status
  const checkVipBuyerStatus = useCallback(async () => {
    // Reset state when auth status changes
    setIsVipBuyer(false);
    setVipBuyerData(null);
    
    // Only proceed if user is authenticated and we have a user object
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // ✅ Use API function instead of manual axios call
      const buyerData = await getBuyerByAuth0Id(user.sub);
      
      // If we got buyer data (function returns null for 404)
      if (buyerData) {
        setIsVipBuyer(true);
        setVipBuyerData(buyerData);
        setError(null);
      } else {
        // No buyer found (404) - user is not a VIP
        setIsVipBuyer(false);
        setVipBuyerData(null);
        setError(null);
      }
    } catch (err) {
      // For other errors (non-404), log them but don't disrupt the application
      console.error("Error checking VIP buyer status:", err);
      setError("Failed to verify VIP status");
      setIsVipBuyer(false);
      setVipBuyerData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]); // ✅ Removed getAccessTokenSilently from dependencies

  // Check VIP status on initial load and when dependencies change
  useEffect(() => {
    checkVipBuyerStatus();
  }, [checkVipBuyerStatus]);

  // The context value that will be provided
  const value = {
    isVipBuyer,
    vipBuyerData,
    isLoading,
    error,
    refreshVipStatus: checkVipBuyerStatus, // Expose the refresh function
  };

  return (
    <VipBuyerContext.Provider value={value}>
      {children}
    </VipBuyerContext.Provider>
  );
};

// Custom hook for using the VIP buyer context
export const useVipBuyer = () => {
  const context = useContext(VipBuyerContext);
  if (context === null) {
    throw new Error("useVipBuyer must be used within a VipBuyerProvider");
  }
  return context;
};