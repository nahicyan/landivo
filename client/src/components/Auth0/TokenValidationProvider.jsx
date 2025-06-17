import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router-dom';
import TokenValidationService from '@/services/TokenValidationService';
import TokenExpiryNotification from './TokenExpiryNotification';

const TokenValidationContext = createContext({});

export const TokenValidationProvider = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
  const [showExpiryNotification, setShowExpiryNotification] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const location = useLocation();
  const intervalRef = useRef(null);

  const validateToken = useCallback(async () => {
    if (isLoading || !isAuthenticated || showExpiryNotification) {
      return;
    }

    setIsValidatingToken(true);
    
    try {
      const result = await TokenValidationService.validateToken(
        getAccessTokenSilently,
        isAuthenticated
      );
      
      if (!result.isValid && result.requiresLogin) {
        setShowExpiryNotification(true);
        
        // If token is about to expire, increase check frequency
        if (result.timeUntilExpiry && result.timeUntilExpiry < 2 * 60 * 1000) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(validateToken, 30000); // Check every 30s when close to expiry
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
    } finally {
      setIsValidatingToken(false);
    }
  }, [getAccessTokenSilently, isAuthenticated, isLoading, showExpiryNotification]);

  // Validate on mount and route changes
  useEffect(() => {
    if (!isLoading) {
      validateToken();
    }
  }, [location.pathname, isLoading, validateToken]);

  // Periodic validation
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    intervalRef.current = setInterval(validateToken, 300000); // Check every 5 minutes normally
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, isLoading, validateToken]);

  // Validate on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && !isLoading) {
        validateToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, isLoading, validateToken]);

  const handleCloseNotification = () => {
    setShowExpiryNotification(false);
    TokenValidationService.resetValidation();
    
    // Reset to normal check interval
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(validateToken, 300000);
  };

  return (
    <TokenValidationContext.Provider value={{ validateToken, isValidatingToken }}>
      {children}
      {showExpiryNotification && (
        <TokenExpiryNotification onClose={handleCloseNotification} />
      )}
    </TokenValidationContext.Provider>
  );
};

export const useTokenValidation = () => useContext(TokenValidationContext);