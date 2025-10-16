"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth0 } from "@auth0/auth0-react";
import { useVipBuyer } from "@/utils/VipBuyerContext";
import { useNavigate } from "react-router-dom";
import { useShowAddress } from "@/utils/addressUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Function to assign status colors
function getStatusClasses(status) {
  switch (status) {
    case "Available":
      return { circle: "bg-green-500", text: "text-green-500" };
    case "Pending":
      return { circle: "bg-yellow-500", text: "text-yellow-500" };
    case "Not Available":
    case "Sold":
      return { circle: "bg-red-500", text: "text-red-500" };
    case "Testing":
      return { circle: "bg-blue-500", text: "text-blue-500" };
    default:
      return { circle: "bg-gray-400", text: "text-gray-400" };
  }
}

export default function PropertyHeaderRight({ propertyData }) {
  const { isAuthenticated } = useAuth0();
  const { isVipBuyer } = useVipBuyer();
  const navigate = useNavigate();
  const showAddress = useShowAddress(propertyData?.toggleObscure);

  // State for email dialog
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { status, disPrice, askingPrice, acre, streetAddress, city, state, zip, toggleObscure } = propertyData || {};

  const { circle, text } = getStatusClasses(status);

  // Check if property is sold
  const isSold = status === "Sold";

  // Determine which price to show as main price
  const mainPrice = isVipBuyer && disPrice ? disPrice : askingPrice;

  // Email validation function
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Show dialog for discount
  const handleDiscountClick = () => {
    setShowDialog(true);
  };

  // Handle contact button click
  const handleContactClick = () => {
    navigate("/support");
  };

  // Handle dialog submission
  const handleDialogSubmit = () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setShowDialog(false);
    // Navigate to subscription page with email parameter
    navigate(`/subscription?email=${encodeURIComponent(email)}`);
  };

  return (
    <Card className="border-0 bg-transparent shadow-none p-0">
      {/* Top Row: Status */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`w-3 h-3 rounded-full animate-pulse-slow ${circle}`} />
        <span className={`text-lg capitalize ${text}`}>{status || "Unknown Status"}</span>
      </div>

      {/* Price Row with blur effect for sold properties */}
      <div className="relative mb-4 group">
        <div className={`flex items-center text-3xl font-bold text-gray-900 ${isSold ? "filter blur-sm group-hover:blur-xl transition-all duration-200" : ""}`}>
          {/* Main Price */}
          <span className="flex-shrink-0">{mainPrice ? `$${mainPrice.toLocaleString()}` : "$0"}</span>

          {/* Wrapper for all discount/VIP sections with consistent spacing */}
          {disPrice && (
            <div className="ml-3 flex items-center flex-shrink-0">
              {/* Not logged in OR logged in but not VIP: Show blurred price with overlay button */}
              {(!isAuthenticated || !isVipBuyer) && (
                <div className="relative inline-flex items-center min-w-[220px] justify-center">
                  {/* Overlay Button with conditional text */}
                  <button
                    className="absolute inset-0 z-10 bg-transparent text-sm font-semibold hover:bg-gray-200 transition-colors px-3 py-1 rounded-md flex items-center justify-center whitespace-nowrap text-gray-900"
                    onClick={handleDiscountClick}>
                    {!isAuthenticated ? "Login For Discount" : "Subscribe For Discount"}
                  </button>

                  {/* Blurred Discount Price (centered) */}
                  <span className="filter blur-[2px] text-3xl text-gray-400 font-thin whitespace-nowrap">${disPrice.toLocaleString()}</span>
                </div>
              )}

              {/* VIP user: Show crossed out original price next to the plain discount price */}
              {isVipBuyer && <span className="text-gray-500 line-through text-xl whitespace-nowrap">${askingPrice?.toLocaleString()}</span>}
            </div>
          )}
        </div>

        {/* SOLD Overlay - Only visible on hover when property is sold */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-left opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-default">
            <span className="text-2xl font-bold text-gray-800">SOLD</span>
          </div>
        )}
      </div>

      {/* Acre Row */}
      {acre && <div className="text-2xl font-normal text-gray-500 mb-4">{acre} Acre Lot</div>}

      {/* Address Row */}
      {(streetAddress || city || state || zip) && (
        <div className="text-lg text-gray-700 mt-1">
          {toggleObscure && !showAddress ? (
            <div className="flex items-center gap-3">
              <span>{[city, state, zip].filter(Boolean).join(", ")}</span>
              <Button onClick={handleContactClick} className="bg-[#324c48] hover:bg-[#3f4f24] text-white text-base font-medium px-4 py-2 rounded-md transition-colors">
                Contact For Full Details
              </Button>
            </div>
          ) : (
            `${streetAddress}, ${city}, ${state} ${zip}`
          )}
        </div>
      )}

      {/* Email Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white p-6 rounded-lg border border-[#324c48]/20 shadow-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#3f4f24]">Enter Your Email</DialogTitle>
            <DialogDescription className="text-[#324c48] mt-2">
              Please provide your email address to join our exclusive VIP buyers list and access special property discounts.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full p-4 text-[#3f4f24] border border-[#324c48] rounded-md focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]"
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          <DialogFooter className="mt-6 flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-[#324c48] text-[#324c48]">
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit} className="bg-[#324c48] text-white hover:bg-[#3f4f24]">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
