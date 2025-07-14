import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/hooks/useAuth';
import { useVipBuyer } from '@/utils/VipBuyerContext';
import VipAlreadyMember from './VipAlreadyMember';

const GetStarted = () => {
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

  const handleGetStarted = async () => {
    if (authLoading || vipLoading) return;

    if (!isAuthenticated) {
      await loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup',
          redirect_uri: `${window.location.origin}/vip-signup`
        },
        appState: { returnTo: '/vip-signup' }
      });
      return;
    }

    if (isAuthenticated && isVipBuyer) {
      setShowVipPopup(true);
      return;
    }

    if (isAuthenticated && !isVipBuyer) {
      navigate('/vip-signup');
    }
  };

  return (
    <>
      <section className="py-12 bg-gradient-to-br from-[#FDF8F2] via-[#FDF8F2] to-[#F5F0E8]">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D4A017]/10"
          >
            <div className="grid md:grid-cols-2">
              {/* Left Side */}
              <div className="bg-gradient-to-br from-white to-[#FDF8F2] p-8 md:p-10">
                <h2 className="text-3xl md:text-4xl font-bold text-[#3f4f24] mb-4 leading-tight">
                  Join Our Exclusive<br />Buyers List
                </h2>
                
                <p className="text-[#324c48] mb-8 leading-relaxed font-medium">
                  Get notified before everyone else, receive instant discounts on 
                  properties, and stay up to date with notifications only in the 
                  areas you care about.
                </p>

                <Button
                  onClick={handleGetStarted}
                  disabled={authLoading || vipLoading}
                  className="w-full bg-gradient-to-r from-[#3f4f24] to-[#324c48] hover:from-[#324c48] hover:to-[#2a3f3c] text-white py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-4"
                >
                  {authLoading || vipLoading ? "Loading..." : "Get Started"}
                </Button>

                <p className="text-sm text-[#324c48]/70 text-center">
                  Your email is 100% confidential and we won't spam you.
                </p>
              </div>

              {/* Right Side */}
              <div className="bg-gradient-to-br from-[#3f4f24] via-[#324c48] to-[#2a3f3c] p-8 md:p-10 flex flex-col justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-32 h-32 bg-[#D4A017] rounded-full blur-3xl"></div>
                  <div className="absolute bottom-4 left-4 w-24 h-24 bg-[#D4A017] rounded-full blur-2xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <span className="text-red-400 line-through text-lg font-medium bg-white/10 px-3 py-1 rounded-full">
                      Listed Price
                    </span>
                  </div>

                  <h3 className="text-4xl md:text-5xl font-bold text-[#D4A017] mb-8 text-center drop-shadow-lg">
                    Big Discount
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg"></div>
                      <span className="text-white font-medium">
                        Early access to new listings
                      </span>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg"></div>
                      <span className="text-white font-medium">
                        Member-only special pricing
                      </span>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg"></div>
                      <span className="text-white font-medium">
                        Exclusive property alerts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <VipAlreadyMember 
        isOpen={showVipPopup} 
        onClose={() => setShowVipPopup(false)} 
      />
    </>
  );
};

export default GetStarted;