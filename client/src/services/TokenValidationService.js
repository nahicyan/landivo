import { toast } from 'react-toastify';

class TokenValidationService {
  constructor() {
    this.isValidating = false;
    this.lastValidation = null;
    this.validationInterval = 5 * 60 * 1000; // Check every 5 minutes instead of 1
    this.graceInterval = 30000; // 30 seconds between checks
  }

  async validateToken(getAccessTokenSilently, isAuthenticated) {
    if (this.isValidating) return { isValid: true };
    
    const now = Date.now();
    if (this.lastValidation && (now - this.lastValidation) < this.graceInterval) {
      return { isValid: true };
    }

    if (!isAuthenticated) {
      return { isValid: true };
    }

    this.isValidating = true;
    this.lastValidation = now;

    try {
      // First try with cache to avoid unnecessary API calls
      await getAccessTokenSilently({ 
        cacheMode: 'cache-only',
        timeoutInSeconds: 5 
      });
      
      this.isValidating = false;
      return { isValid: true };
    } catch (cacheError) {
      // Only if cache fails, try without cache
      try {
        await getAccessTokenSilently({ 
          timeoutInSeconds: 10 
        });
        this.isValidating = false;
        return { isValid: true };
      } catch (error) {
        this.isValidating = false;
        
        if (error.message?.includes('Missing Refresh Token') || 
            error.error === 'login_required' ||
            error.error === 'consent_required' ||
            error.error === 'invalid_grant') {
          return { 
            isValid: false, 
            error: 'Your session has expired',
            requiresLogin: true
          };
        }
        
        // Don't invalidate on network/timeout errors
        return { isValid: true };
      }
    }
  }

  resetValidation() {
    this.isValidating = false;
    this.lastValidation = null;
  }
}

export default new TokenValidationService();