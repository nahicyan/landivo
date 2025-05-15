import React from "react";
import Offer from "../Offer/Offer";
import ContactProfile from "../ContactProfile/ContactProfile";

export default function PropertyDetailsRight({ propertyData }) {
  return (
    <div className="bg-transparent space-y-6">
      <Offer propertyData={propertyData} />
      <ContactProfile profileId={propertyData?.profileId} />
    </div>
  );
}