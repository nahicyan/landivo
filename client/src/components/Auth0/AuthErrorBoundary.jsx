import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    if (error.message?.includes('Missing Refresh Token') || 
        error.message?.includes('login_required')) {
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    console.error('Auth error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <AlertTitle className="text-red-800">Authentication Error</AlertTitle>
            <AlertDescription className="mt-2 text-red-700">
              Your session has expired. Please log in again to continue.
            </AlertDescription>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;