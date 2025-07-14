import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/hooks/useAuth';
import { useVipBuyer } from '@/utils/VipBuyerContext';
import VipAlreadyMember from '@/components/GetStarted/VipAlreadyMember';

const JoinVip = () => {
  const navigate = useNavigate();
  const [showVipPopup, setShowVipPopup] = useState(false);
  
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    loginWithRedirect 
  } = useAuth();
  
  const { 
    isVipBuyer, 
    isLoading: vipLoading 
  } = useVipBuyer();

  useEffect(() => {
    // Wait for both auth and VIP status to load
    if (authLoading || vipLoading) {
      return;
    }

    // If user is not logged in, redirect to Auth0 signup then back to VIP form
    if (!isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          redirect_uri: `${window.location.origin}/vip-signup`
        },
        appState: { returnTo: '/vip-signup' }
      });
      return;
    }

    // If user is logged in and is VIP, show popup then redirect to home
    if (isAuthenticated && isVipBuyer) {
      setShowVipPopup(true);
      return;
    }

    // If user is logged in but not VIP, go to VIP signup form
    if (isAuthenticated && !isVipBuyer) {
      navigate('/vip-signup');
      return;
    }
  }, [authLoading, vipLoading, isAuthenticated, isVipBuyer, loginWithRedirect, navigate]);

  const handleClosePopup = () => {
    setShowVipPopup(false);
    navigate('/'); // Redirect to home page
  };

  // Show loading while checking auth/VIP status
  if (authLoading || vipLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A017] mx-auto mb-4"></div>
          <p className="text-[#324c48]">Checking VIP status...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#FDF8F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A017] mx-auto mb-4"></div>
          <p className="text-[#324c48]">Processing...</p>
        </div>
      </div>
      
      {/* VIP Already Member Popup */}
      <VipAlreadyMember 
        isOpen={showVipPopup} 
        onClose={handleClosePopup} 
      />
    </>
  );
};

export default JoinVip;