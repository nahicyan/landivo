import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    const interval = setInterval(validateToken, 5000); // Check every 5 Second
    
    return () => clearInterval(interval);
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