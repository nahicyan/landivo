import { toast } from 'react-toastify';

class TokenValidationService {
  constructor() {
    this.isValidating = false;
    this.lastValidation = null;
    this.validationInterval = 60000; // Check every minute
    this.graceInterval = 5000; // 5 seconds between checks minimum
  }

  async validateToken(getAccessTokenSilently, isAuthenticated) {
    // Prevent validation loops
    if (this.isValidating) return { isValid: true };
    
    const now = Date.now();
    if (this.lastValidation && (now - this.lastValidation) < this.graceInterval) {
      return { isValid: true };
    }

    if (!isAuthenticated) {
      return { isValid: true }; // Not logged in, no need to validate
    }

    this.isValidating = true;
    this.lastValidation = now;

    try {
      await getAccessTokenSilently({ 
        cacheMode: 'off',
        timeoutInSeconds: 5 
      });
      this.isValidating = false;
      return { isValid: true };
    } catch (error) {
      this.isValidating = false;
      
      // Check if it's a refresh token error
      if (error.message?.includes('Missing Refresh Token') || 
          error.error === 'login_required' ||
          error.error === 'consent_required') {
        return { 
          isValid: false, 
          error: 'Your session has expired',
          requiresLogin: true
        };
      }
      
      // Other errors - might be network issues
      return { 
        isValid: true, // Don't force logout on network errors
        error: error.message 
      };
    }
  }

  resetValidation() {
    this.isValidating = false;
    this.lastValidation = null;
  }
}

export default new TokenValidationService();