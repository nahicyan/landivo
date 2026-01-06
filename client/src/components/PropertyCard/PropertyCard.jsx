import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
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

export default function PropertyCard({ card, isMobileGrid = false }) {
  const navigate = useNavigate();
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

  const formattedPrice = card.askingPrice ? formatPrice(card.askingPrice) : "0";

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
    <Card
      className={`
        ${
          isMobileGrid
            ? "w-full" // Full width in grid cell for mobile
            : "w-full max-w-sm sm:max-w-md lg:w-96 mx-auto" // Original sizing for desktop
        }
        rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white relative
      `}
    >
      <Link to={`/properties/${card.id}`} className="absolute inset-0 z-10" aria-label={displayAddress} />
      {/* Left Tag - Only show if not sold & Pending */}
      {!isSold && !isPending && card.ltag && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
          {card.ltag}
        </div>
      )}

      {/* Right Tag - Only show if not sold & pending */}
      {!isSold && !isPending && card.rtag && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
          {card.rtag}
        </div>
      )}

      {/* SOLD Badge - Show when property is sold */}
      {isSold && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
          SOLD
        </div>
      )}
      {/* PENDING Badge - Show when property is pending */}
      {isPending && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs sm:text-sm font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-lg">
          PENDING
        </div>
      )}

      {/* Image Section */}
      <div className={`relative w-full ${isMobileGrid ? "h-40 sm:h-48" : "h-48 sm:h-56 lg:h-64"}`}>
        <img src={firstImage} alt="Property" className="w-full h-full object-cover" />
      </div>

      {/* Content Section */}
      <div className="px-2.5 sm:px-3 lg:px-4 pt-2 pb-2.5 sm:pt-2.5 sm:pb-3.5 space-y-0.5 sm:space-y-1">
        {/* Acres and Price Row */}
        <div className="flex justify-between items-center gap-1">
          <span className={`text-gray-600 font-normal truncate ${isMobileGrid ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>{card.acre || "0"} Acres</span>
          <span
            className={`text-[#517b75] font-semibold whitespace-nowrap leading-tight tracking-tight ${isSold ? "filter blur-sm" : ""} ${
              isMobileGrid ? "text-base sm:text-lg" : "text-lg sm:text-xl"
            }`}
          >
            ${formattedPrice}
          </span>
        </div>

        {/* Address and Monthly Payment Row */}
        <div className="flex justify-between items-center gap-1 sm:gap-2">
          <h3 className={`text-gray-800 font-semibold truncate flex-1 ${isMobileGrid ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>{displayAddress}</h3>
          {monthlyPayment && (
            <span className={`text-[#D4A017] font-medium tracking-tight whitespace-nowrap ${isSold ? "filter blur-sm" : ""} ${isMobileGrid ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
              ${monthlyPayment}/mo
            </span>
          )}
        </div>

        {/* City, State, Zip */}
        <p className={`text-gray-500 font-medium truncate ${isMobileGrid ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
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
