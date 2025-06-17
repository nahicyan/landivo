import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, LogIn, X } from 'lucide-react';

const TokenExpiryNotification = ({ onClose }) => {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();
  const { loginWithRedirect, logout } = useAuth0();
  const currentPath = window.location.pathname;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRelogin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRelogin = () => {
    loginWithRedirect({
      appState: { returnTo: currentPath }
    });
  };

  const handleLogout = async () => {
    await logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      }
    });
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-[60] max-w-md animate-in slide-in-from-top-2">
      <Alert className="border-amber-200 bg-amber-50 shadow-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800">Session Expired</AlertTitle>
        <AlertDescription className="mt-2 text-amber-700">
          Your session has expired. You'll be redirected to login in {countdown} seconds.
        </AlertDescription>
        
        <Progress 
          value={(10 - countdown) * 10} 
          className="mt-3 h-2 bg-amber-100"
        />
        
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            onClick={handleRelogin}
            className="bg-primary hover:bg-primary-600"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login Now
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleLogout}
            className="border-amber-300 hover:bg-amber-100"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default TokenExpiryNotification;