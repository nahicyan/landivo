import React from "react";

export default function Content() {
  return (
    <section className="bg-[#243834] py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Small label, uppercase */}
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#D4A017]">
          Our Mission
        </p>
        
        {/* Main heading, bold & large */}
        <h2 className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white max-w-3xl mx-auto">
          We've Helped Countless Buyers Secure Off-Market Land
        </h2>
        
        {/* Subtext */}
        <p className="mt-4 sm:mt-6 lg:mt-10 text-sm sm:text-base lg:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
          At Landivo, our mission is to put land ownership within everyone's reach.
          We offer flexible seller financing on most of our off-market
          properties, letting you skip the usual bank hurdles. Our focus is on making
          your path to owning land fast, simple and stress-free.
        </p>
      </div>
    </section>
  );
}