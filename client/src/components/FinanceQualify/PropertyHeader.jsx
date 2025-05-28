import React from "react";
import { useShowAddress } from "@/utils/addressUtils";

const PropertyHeader = ({ propertyData }) => {
  const showAddress = useShowAddress(propertyData?.toggleObscure);
  
  if (!propertyData) return null;
  
  // Get address display based on permissions
  const getAddressDisplay = () => {
    if (propertyData.toggleObscure && !showAddress) {
      // Show county, city, state, zip when address is obscured
      const parts = [];
      if (propertyData.county) parts.push(propertyData.county);
      if (propertyData.city) parts.push(propertyData.city);
      if (propertyData.state) parts.push(propertyData.state);
      if (propertyData.zip) parts.push(propertyData.zip);
      return parts.join(", ");
    }
    
    // Show full address when not obscured or user has permission
    return `${propertyData.streetAddress}, ${propertyData.city}, ${propertyData.state}`;
  };
  
  return (
    <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h1 
        className="text-lg font-semibold text-[#3f4f24]"
        dangerouslySetInnerHTML={{ __html: propertyData.title }}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-gray-600">
          {getAddressDisplay()}
        </p>
        <p className="font-semibold text-[#D4A017]">
          ${propertyData.askingPrice?.toLocaleString() || "N/A"}
        </p>
      </div>
    </div>
  );
};

export default PropertyHeader;