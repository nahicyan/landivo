import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function EmailVerificationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Check for exact Auth0 email verification callback pattern
    const supportSignUp = params.get('supportSignUp') === 'true';
    const supportForgotPassword = params.get('supportForgotPassword') === 'true';
    const success = params.get('success') === 'true';
    const code = params.get('code') === 'success';
    const message = params.get('message');
    
    // Only show if this is specifically an email verification callback
    if (supportSignUp && supportForgotPassword && success && code && message) {
      const decodedMessage = decodeURIComponent(message);
      const isEmailVerification = decodedMessage.includes('email was verified');
      
      if (isEmailVerification) {
        setVerificationStatus({
          success: true,
          message: decodedMessage
        });
      }
    }
  }, [location]);

  if (!verificationStatus) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-white to-[#FDF8F2] border-[#D4A017]/20 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D4A017] to-[#e3a04f] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircleIcon className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-[#3f4f24] mb-3">
            Email Verified!
          </CardTitle>
          <CardDescription className="text-[#324c48] text-base">
            Your email has been successfully verified. Continue to complete your VIP signup.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2 pb-6">
          <Button 
            onClick={() => loginWithRedirect({
              appState: { returnTo: '/vip-signup' }
            })}
            className="w-full bg-gradient-to-r from-[#3f4f24] to-[#324c48] hover:from-[#324c48] hover:to-[#2a3f3c] text-white py-3 text-lg font-semibold shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Continue to VIP Signup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}