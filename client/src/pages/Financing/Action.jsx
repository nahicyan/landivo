import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Action() {
  return (
    <section className="w-full py-8 sm:py-12 lg:py-16 bg-[#FDF8F2]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Large, rounded, dark card */}
        <Card className="rounded-2xl sm:rounded-3xl lg:rounded-[2rem] bg-[#546930] text-white shadow-lg shadow-black/20 p-6 sm:p-10 md:flex md:items-center md:justify-between md:p-20">
          
          {/* Left side: small label, big headline, subtext */}
          <div className="md:max-w-[60%]">
            <p className="text-xs uppercase tracking-wide text-white/70 text-center md:text-left">
              TRY IT NOW
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-normal leading-tight sm:leading-snug text-center md:text-left">
              Ready To Own Your Land With Seller Financing?
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-white/80 sm:tracking-tight text-center md:text-left">
              See if you qualify for seller financing—takes just minutes.
            </p>
          </div>

          {/* Right side: two buttons */}
          <div className="mt-6 sm:mt-8 md:mt-0 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4">
            {/* Primary button: white background, teal text */}
            <Button className="w-full sm:w-auto bg-[#d1dfb9] text-[#0A2F3C] hover:bg-white/90 text-base sm:text-lg px-6 py-5 sm:py-6">
              Get Started Now
            </Button>
            {/* Secondary button: outline style with arrow */}
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent text-white hover:bg-white/30 border-white/30 hover:border-white/50 text-base sm:text-lg px-6 py-5 sm:py-6"
            >
              Learn More
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}