import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Mission() {
  const navigate = useNavigate();
  return (
    <section className="w-full bg-[#0A2F3C] py-12 md:py-16 lg:py-20">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-8 px-4 sm:px-6 md:flex-row md:gap-10 lg:gap-12 lg:px-8">
        {/* LEFT COLUMN: Text Content */}
        <div className="w-full space-y-4 text-white md:w-1/2 md:space-y-6">
          {/* Small label, uppercase - centered on mobile */}
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#D4A017] sm:text-base md:text-left">
            We've Helped Countless Buyers Secure Off-Market Land
          </p>
          
          {/* Large heading - centered on mobile */}
          <h1 className="text-center text-3xl font-medium leading-tight sm:text-4xl md:text-left md:text-4xl lg:text-5xl">
            Our Mission
          </h1>
          
          {/* Paragraph - centered on mobile */}
          <p className="text-center text-sm leading-relaxed text-white/90 sm:text-base md:text-left md:text-lg">
            We believe land ownership should be simple, affordable, and within
            reach for everyone. That's why we cut through the noise of
            traditional real estate, offering hand-picked parcels at wholesale
            prices. With our seller financing options, we empower you to secure
            your dream property—whether it's for building, investing, or simply
            owning a piece of the earth—without the headaches of bank loans.
          </p>
          
          {/* Call to Action Button - centered on mobile */}
          <div className="flex justify-center pt-2 md:justify-start">
            <Button
              className="w-full bg-[#00D084] px-6 py-3 text-base font-semibold text-black transition-colors hover:bg-[#00B373] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              size="lg"
              onClick={() => navigate("/properties")}
            >
              Explore Properties
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Illustration/Card */}
        <div className="flex w-full items-center justify-center md:w-1/2">
          <Card className="w-full overflow-hidden rounded-2xl bg-white p-3 shadow-lg sm:p-4 md:p-6">
            <img
              src="https://cdn.landivo.com/wp-content/uploads/2025/04/Mission.jpg"
              alt="Land illustration"
              className="h-auto w-full rounded-xl object-cover"
            />
          </Card>
        </div>
      </div>
    </section>
  );
}