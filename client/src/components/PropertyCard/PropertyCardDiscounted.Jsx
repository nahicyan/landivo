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

  // Format prices
  const formattedOriginalPrice = card.askingPrice 
    ? formatPrice(card.askingPrice) 
    : "0";
    
  const formattedDiscountedPrice = card.discountedPrice 
    ? formatPrice(card.discountedPrice) 
    : formattedOriginalPrice;

  // Calculate discount percentage
  const discountPercentage = card.askingPrice && card.discountedPrice
    ? Math.round(((card.askingPrice - card.discountedPrice) / card.askingPrice) * 100)
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
      className="w-full max-w-[360px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white relative"
    >
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          {discountPercentage}% OFF
        </div>
      )}

      {/* Image Section */}
      <div className="relative w-full h-48">
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
          <span className="text-gray-600 text-base font-normal truncate">
            {card.acre || "0"} Acres
          </span>
          <div className="text-right">
            {card.discountedPrice && card.discountedPrice < card.askingPrice && (
              <div className="text-gray-400 text-xs line-through">
                ${formattedOriginalPrice}
              </div>
            )}
            <span className="text-[#517b75] text-lg font-semibold whitespace-nowrap leading-tight tracking-tight">
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
            <span className="text-[#D4A017] text-sm font-medium tracking-tight whitespace-nowrap">
              ${monthlyPayment}/mo
            </span>
          )}
        </div>

        {/* City, State, Zip */}
        <p className="text-gray-500 text-sm font-medium truncate">
          {[card.city, card.state, card.zip]
            .filter(Boolean)
            .join(card.state && card.zip ? ", " : " ")
            .trim() || "Location unavailable"}
        </p>
      </div>
    </Card>
  );
}