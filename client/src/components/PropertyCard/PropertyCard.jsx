import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { formatPrice } from "../../utils/format";
import { useShowAddress } from "../../utils/addressUtils";
const serverURL = import.meta.env.VITE_SERVER_URL;

// Helper function to format county name
const formatCountyName = (county) => {
  if (!county) return "County unavailable";

  // Check if county already contains "County" (case insensitive)
  if (county.toLowerCase().includes("county")) {
    return county;
  }

  // Add "County" to the name
  return `${county} County`;
};

// Updated function to get display address with county fallback
const getDisplayAddress = (
  streetAddress,
  toggleObscure,
  showAddress,
  county
) => {
  if (!toggleObscure || showAddress) {
    return streetAddress || "Address unavailable";
  }

  return formatCountyName(county);
};

export default function PropertyCard({ card }) {
  const navigate = useNavigate();
  const showAddress = useShowAddress(card.toggleObscure);

  if (!card) return null;

  // Check if property is sold
  const isSold = card.status === "Sold";

  // Parse images safely
  const images = (() => {
    try {
      if (!card.imageUrls) return [];
      return Array.isArray(card.imageUrls)
        ? card.imageUrls
        : JSON.parse(card.imageUrls);
    } catch (error) {
      console.error("Error parsing imageUrls:", error);
      return [];
    }
  })();

  const firstImage =
    images.length > 0 ? `${serverURL}/${images[0]}` : "/default-image.jpg";

  // Format prices
  const formattedPrice = card.askingPrice ? formatPrice(card.askingPrice) : "0";

  // Calculate minimum monthly payment
  const getMonthlyPayment = () => {
    if (!card.financing || card.financing !== "Available") return null;

    const payments = [
      card.monthlyPaymentOne,
      card.monthlyPaymentTwo,
      card.monthlyPaymentThree,
    ].filter((payment) => payment && !isNaN(payment));

    if (payments.length === 0) return null;
    const minPayment = Math.min(...payments);
    return Math.floor(minPayment).toLocaleString();
  };

  const monthlyPayment = getMonthlyPayment();

  // Get display address based on permissions (with county fallback)
  const displayAddress = getDisplayAddress(
    card.streetAddress,
    card.toggleObscure,
    showAddress,
    card.county
  );

  return (
    <Card
      onClick={() => navigate(`/properties/${card.id}`)}
      className="w-full w-96 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white relative"
    >
      {/* Left Tag - Only show if not sold */}
      {!isSold && card.ltag && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
          {card.ltag}
        </div>
      )}

      {/* Right Tag - Only show if not sold */}
      {!isSold && card.rtag && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
          {card.rtag}
        </div>
      )}

      {/* SOLD Badge - Show when property is sold */}
      {isSold && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
          SOLD
        </div>
      )}

      {/* Image Section */}
      <div className="relative w-full h-64">
        <img
          src={firstImage}
          alt="Property"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="px-3 pt-1.5 pb-2.5 space-y-0.5">
        {/* Acres and Price Row */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-lg font-normal truncate">
            {card.acre || "0"} Acres
          </span>
          <span
            className={`text-[#517b75] text-xl font-semibold whitespace-nowrap leading-tight tracking-tight ${
              isSold ? "filter blur-sm" : ""
            }`}
          >
            ${formattedPrice}
          </span>
        </div>

        {/* Address and Monthly Payment Row */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-gray-800 text-base font-semibold truncate flex-1">
            {displayAddress}
          </h3>
          {monthlyPayment && (
            <span
              className={`text-[#D4A017] text-base font-medium tracking-tight whitespace-nowrap ${
                isSold ? "filter blur-sm" : ""
              }`}
            >
              ${monthlyPayment}/mo
            </span>
          )}
        </div>

        {/* City, State, Zip */}
        <p className="text-gray-500 text-base font-medium truncate">
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
