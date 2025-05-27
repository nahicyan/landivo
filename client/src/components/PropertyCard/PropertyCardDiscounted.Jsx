import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { formatPrice } from "../../utils/format";
const serverURL = import.meta.env.VITE_SERVER_URL;

export default function PropertyCardDiscounted({ card }) {
  const navigate = useNavigate();
  if (!card) return null;

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

  const firstImage = images.length > 0
    ? `${serverURL}/${images[0]}`
    : "/default-image.jpg";

  // Format prices - FIXED: Using disPrice instead of discountedPrice
  const formattedOriginalPrice = card.askingPrice
    ? formatPrice(card.askingPrice)
    : "0";
    
  const formattedDiscountedPrice = card.disPrice
    ? formatPrice(card.disPrice)
    : formattedOriginalPrice;

  // Calculate discount percentage - FIXED: Using disPrice instead of discountedPrice
  const discountPercentage = card.askingPrice && card.disPrice
    ? Math.round(((card.askingPrice - card.disPrice) / card.askingPrice) * 100)
    : 0;

  // Calculate minimum monthly payment
  const getMonthlyPayment = () => {
    if (!card.financing || card.financing !== "Available") return null;
    const payments = [
      card.monthlyPaymentOne,
      card.monthlyPaymentTwo,
      card.monthlyPaymentThree
    ].filter(payment => payment && !isNaN(payment));
    if (payments.length === 0) return null;
    const minPayment = Math.min(...payments);
    return Math.floor(minPayment).toLocaleString();
  };

  const monthlyPayment = getMonthlyPayment();

  return (
    <Card
      onClick={() => navigate(`/properties/${card.id}`)}
      className="w-full w-96 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white relative"
    >
      {/* Left Tag */}
      {card.ltag && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
          {card.ltag}
        </div>
      )}
      
      {/* Right Tag (Middle Position) */}
      {card.rtag && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
          {card.rtag}
        </div>
      )}
      
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg">
          {discountPercentage}% OFF
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
          <div className="text-right">
            {card.disPrice && card.disPrice < card.askingPrice && (
              <div className="text-gray-600 text-sm line-through">
                ${formattedOriginalPrice}
              </div>
            )}
            <span className="text-[#517b75] text-xl font-semibold whitespace-nowrap leading-tight tracking-tight">
              ${formattedDiscountedPrice}
            </span>
          </div>
        </div>
        
        {/* Address and Monthly Payment Row */}
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-gray-800 text-base font-semibold truncate flex-1">
            {card.streetAddress || "Address unavailable"}
          </h3>
          {monthlyPayment && (
            <span className="text-[#D4A017] text-base font-medium tracking-tight whitespace-nowrap">
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