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
      <section className="py-8 sm:py-10 lg:py-12 bg-gradient-to-br from-[#FDF8F2] via-[#FDF8F2] to-[#F5F0E8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-[#D4A017]/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side */}
              <div className="bg-gradient-to-br from-white to-[#FDF8F2] p-6 sm:p-8 lg:p-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3f4f24] mb-3 sm:mb-4 leading-tight text-center sm:text-left">
                  Join Our Exclusive<br className="sm:hidden" /> <span className="hidden sm:inline"><br /></span>Buyers List
                </h2>
                
                <p className="text-sm sm:text-base text-[#324c48] mb-6 sm:mb-8 leading-relaxed font-medium">
                  Get notified before everyone else, receive instant discounts on 
                  properties, and stay up to date with notifications only in the 
                  areas you care about.
                </p>

                <Button
                  onClick={handleGetStarted}
                  disabled={authLoading || vipLoading}
                  className="w-full bg-gradient-to-r from-[#3f4f24] to-[#324c48] hover:from-[#324c48] hover:to-[#2a3f3c] text-white py-3 sm:py-4 rounded-lg sm:rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-3 sm:mb-4"
                >
                  {authLoading || vipLoading ? "Loading..." : "Get Started"}
                </Button>

                <p className="text-xs sm:text-sm text-[#324c48]/70 text-center">
                  Your email is 100% confidential and we won't spam you.
                </p>
              </div>

              {/* Right Side */}
              <div className="bg-gradient-to-br from-[#3f4f24] via-[#324c48] to-[#2a3f3c] p-6 sm:p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-24 h-24 sm:w-32 sm:h-32 bg-[#D4A017] rounded-full blur-3xl"></div>
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-20 h-20 sm:w-24 sm:h-24 bg-[#D4A017] rounded-full blur-2xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="text-center mb-4 sm:mb-6">
                    <span className="text-red-400 line-through text-sm sm:text-base lg:text-lg font-medium bg-white/10 px-3 py-1 rounded-full inline-block">
                      Listed Price
                    </span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#D4A017] mb-6 sm:mb-8 text-center drop-shadow-lg">
                    Big Discount
                  </h3>

                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-1.5 sm:mt-2 mr-2.5 sm:mr-3 flex-shrink-0 shadow-lg"></div>
                      <span className="text-white font-medium text-sm sm:text-base">
                        Early access to new listings
                      </span>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-1.5 sm:mt-2 mr-2.5 sm:mr-3 flex-shrink-0 shadow-lg"></div>
                      <span className="text-white font-medium text-sm sm:text-base">
                        Member-only special pricing
                      </span>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-[#D4A017] rounded-full mt-1.5 sm:mt-2 mr-2.5 sm:mr-3 flex-shrink-0 shadow-lg"></div>
                      <span className="text-white font-medium text-sm sm:text-base">
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