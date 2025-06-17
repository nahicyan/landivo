import { toast } from 'react-toastify';

class TokenValidationService {
  constructor() {
    this.isValidating = false;
    this.lastValidation = null;
    this.validationInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.graceInterval = 30000; // 30 seconds between checks
    this.expiryWarningTime = 2 * 60 * 1000; // Warn 2 minutes before expiry
  }

  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
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
      // First try with cache to check expiry
      const token = await getAccessTokenSilently({ 
        cacheMode: 'cache-only',
        timeoutInSeconds: 5 
      });
      
      // Check if token is about to expire
      const payload = this.parseJwt(token);
      if (payload && payload.exp) {
        const expiryTime = payload.exp * 1000;
        const timeUntilExpiry = expiryTime - now;
        
        // If token expires in less than 2 minutes, show warning
        if (timeUntilExpiry < this.expiryWarningTime && timeUntilExpiry > 0) {
          this.isValidating = false;
          return {
            isValid: false,
            error: 'Your session will expire soon',
            requiresLogin: true,
            timeUntilExpiry
          };
        }
      }
      
      this.isValidating = false;
      return { isValid: true };
    } catch (cacheError) {
      // Only if cache fails, try without cache
      try {
        const token = await getAccessTokenSilently({ 
          timeoutInSeconds: 10 
        });
        
        // Check expiry on fresh token too
        const payload = this.parseJwt(token);
        if (payload && payload.exp) {
          const expiryTime = payload.exp * 1000;
          const timeUntilExpiry = expiryTime - now;
          
          if (timeUntilExpiry < this.expiryWarningTime && timeUntilExpiry > 0) {
            this.isValidating = false;
            return {
              isValid: false,
              error: 'Your session will expire soon',
              requiresLogin: true,
              timeUntilExpiry
            };
          }
        }
        
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