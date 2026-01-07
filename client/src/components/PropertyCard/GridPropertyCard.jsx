import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVipBuyer } from "@/utils/VipBuyerContext";
import { formatPrice } from "../../utils/format";
import { useShowAddress } from "../../utils/addressUtils";
const serverURL = import.meta.env.VITE_SERVER_URL;

// Helper function to format county name
const formatCountyName = (county) => {
  if (!county) return "County unavailable";
  if (county.toLowerCase().includes("county")) {
    return county;
  }
  return `${county} County`;
};

// Updated function to get display address with county fallback
const getDisplayAddress = (streetAddress, toggleObscure, showAddress, county) => {
  if (!toggleObscure || showAddress) {
    return streetAddress || "Address unavailable";
  }
  return formatCountyName(county);
};

export default function GridPropertyCard({ card, isMobileGrid = false }) {
  const navigate = useNavigate();
  const { isVipBuyer } = useVipBuyer();
  const showAddress = useShowAddress(card.toggleObscure);

  if (!card) return null;

  const isSold = card.status === "Sold";
  const isPending = card.status?.toLowerCase() === "pending";

  // Parse images safely
  const images = (() => {
    try {
      if (!card.imageUrls) return [];
      return Array.isArray(card.imageUrls) ? card.imageUrls : JSON.parse(card.imageUrls);
    } catch (error) {
      console.error("Error parsing imageUrls:", error);
      return [];
    }
  })();

  const firstImage = images.length > 0 ? `${serverURL}/${images[0]}` : "/default-image.jpg";

  const isDiscounted = Boolean(card.askingPrice && card.disPrice && card.disPrice < card.askingPrice);
  const mainPrice = isVipBuyer && card.disPrice ? card.disPrice : card.askingPrice;
  const formattedMainPrice = mainPrice ? formatPrice(mainPrice) : "0";
  const formattedOriginalPrice = card.askingPrice ? formatPrice(card.askingPrice) : "0";
  const discountPercentage = isDiscounted
    ? Math.round(((card.askingPrice - card.disPrice) / card.askingPrice) * 100)
    : 0;
  const showDiscount = isVipBuyer && isDiscounted;

  // Calculate minimum monthly payment
  const getMonthlyPayment = () => {
    if (!card.financing || card.financing !== "Available") return null;

    const payments = [card.monthlyPaymentOne, card.monthlyPaymentTwo, card.monthlyPaymentThree].filter((payment) => payment && !isNaN(payment));

    if (payments.length === 0) return null;
    const minPayment = Math.min(...payments);
    return Math.floor(minPayment).toLocaleString();
  };

  const monthlyPayment = getMonthlyPayment();

  const displayAddress = getDisplayAddress(card.streetAddress, card.toggleObscure, showAddress, card.county);

  return (
    <Card className="w-full rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white relative">
      <Link to={`/properties/${card.id}`} className="absolute inset-0 z-10" aria-label={displayAddress} />
      {/* Top Row Tags */}
      {(card.ltag || card.rtag || isSold || isPending || (showDiscount && discountPercentage > 0)) && (
        <>
          {!isSold && !isPending && card.ltag && (
            <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg border border-white/30">
              {card.ltag}
            </Badge>
          )}
          {!isSold && !isPending && card.rtag && (
            <Badge className="absolute top-2 left-1/2 -translate-x-1/2 sm:top-3 z-10 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg border border-white/30">
              {card.rtag}
            </Badge>
          )}
          {isSold && (
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
              SOLD
            </Badge>
          )}
          {!isSold && isPending && (
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
              PENDING
            </Badge>
          )}
          {!isSold && !isPending && showDiscount && discountPercentage > 0 && (
            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg border border-white/30">
              {discountPercentage}% OFF
            </Badge>
          )}
        </>
      )}

      {/* Image Section - Increased height for better aspect ratio */}
      <div className="relative w-full h-52 sm:h-60 lg:h-64">
        <img src={firstImage} alt="Property" className="w-full h-full object-cover" />
      </div>

      {/* Content Section */}
      <div className="px-3 sm:px-4 pt-2.5 pb-3 space-y-1">
        {/* Acres and Price Row */}
        <div className="flex justify-between items-center gap-2">
          <span className="text-gray-600 font-normal truncate text-sm sm:text-base">{card.acre || "0"} Acres</span>
          <div className="flex flex-col items-end leading-tight">
            {showDiscount && (
              <span className="text-xs text-gray-500 line-through">${formattedOriginalPrice}</span>
            )}
            <span className={`text-[#517b75] font-semibold whitespace-nowrap leading-tight tracking-tight text-lg sm:text-xl ${isSold ? "filter blur-sm" : ""}`}>
              ${formattedMainPrice}
            </span>
          </div>
        </div>

        {/* Address and Monthly Payment Row */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-gray-800 font-semibold truncate flex-1 text-sm sm:text-base">{displayAddress}</h3>
          {monthlyPayment && <span className={`text-[#D4A017] font-medium tracking-tight whitespace-nowrap text-xs sm:text-sm ${isSold ? "filter blur-sm" : ""}`}>${monthlyPayment}/mo</span>}
        </div>

        {/* City, State, Zip */}
        <p className="text-gray-500 font-medium truncate text-xs sm:text-sm">
          {(() => {
            const parts = [];
            if (card.city) parts.push(card.city);
            if (card.state) parts.push(card.state);

            if (parts.length === 0 && !card.zip) return "Location unavailable";

            let location = parts.join(", ");
            if (card.zip) {
              location = location ? `${location} ${card.zip}` : card.zip;
            }

            return location || "Location unavailable";
          })()}
        </p>
      </div>
    </Card>
  );
}
