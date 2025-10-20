// Support.jsx
import React from "react";
import SupportHero from "./SupportHero";
import SupportChannels from "./SupportChannels";
import SupportFAQ from "./SupportFAQ";
import SupportCTA from "./SupportCTA";

export default function Support() {
  return (
    <>
      <div className="w-full bg-[#3f4f24]">
        <SupportHero />
      </div>
      <div className="w-full bg-[#FDF8F2]">
        <SupportChannels />
      </div>
      <div className="w-full bg-[#FDF8F2]">
        <SupportFAQ />
      </div>
      <div className="w-full bg-[#e8efdc]">
        <SupportCTA />
      </div>
    </>
  );
}