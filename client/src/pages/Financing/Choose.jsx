import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function Choose() {
  return (
    <section className="w-full bg-[#243834] py-12 sm:py-16 lg:py-20 text-[#FDF8F2]">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Large heading - Centered on all screens */}
        <h2 className="mb-3 text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-center">
          How It Works?
        </h2>
        {/* Small label - Centered on all screens */}
        <p className="text-base sm:text-lg lg:text-xl uppercase tracking-tight text-white/70 text-center">
          Get Your Land in 3 Easy Steps
        </p>

        {/* Three cards in a row (stacked on mobile) */}
        <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 md:grid-cols-3">
          {/* CARD 1 */}
          <Card className="bg-[#2a413d] p-8 sm:p-10 lg:p-12 text-white/90 border-none shadow-sm shadow-black/30">
            <CardHeader className="p-0">
              {/* Mobile/Tablet: Number and Title side by side, Desktop: Stacked */}
              <div className="flex md:block items-center gap-4 mb-3 md:mb-0">
                {/* Faded step number */}
                <CardTitle className="text-5xl sm:text-6xl md:text-8xl font-light leading-none bg-gradient-to-b from-white/50 to-white/0 bg-clip-text text-transparent flex-shrink-0">
                  1
                </CardTitle>
                {/* Step title - on same line for mobile, separate for desktop */}
                <p className="text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-white md:mt-1 md:mb-4">
                  Find Your Land
                </p>
              </div>
              {/* Step details - always on separate line */}
              <CardDescription className="text-sm sm:text-base lg:text-lg font-thin leading-relaxed text-white/70 mt-2">
                Explore our exclusive off-market properties
              </CardDescription>
            </CardHeader>
          </Card>

          {/* CARD 2 */}
          <Card className="bg-[#2a413d] p-8 sm:p-10 lg:p-12 text-white/90 border-none shadow-sm shadow-black/30">
            <CardHeader className="p-0">
              {/* Mobile/Tablet: Number and Title side by side, Desktop: Stacked */}
              <div className="flex md:block items-center gap-4 mb-3 md:mb-0">
                {/* Faded step number */}
                <CardTitle className="text-5xl sm:text-6xl md:text-8xl font-light leading-none bg-gradient-to-b from-white/50 to-white/0 bg-clip-text text-transparent flex-shrink-0">
                  2
                </CardTitle>
                {/* Step title - on same line for mobile, separate for desktop */}
                <p className="text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-white md:mt-1 md:mb-4">
                  Set Your Terms
                </p>
              </div>
              {/* Step details - always on separate line */}
              <CardDescription className="text-sm sm:text-base lg:text-lg font-thin leading-relaxed text-white/70 mt-2">
                We customize down payments and monthly plans to match your
                budget
              </CardDescription>
            </CardHeader>
          </Card>

          {/* CARD 3 */}
          <Card className="bg-[#2a413d] p-8 sm:p-10 lg:p-12 text-white/90 border-none shadow-sm shadow-black/30">
            <CardHeader className="p-0">
              {/* Mobile/Tablet: Number and Title side by side, Desktop: Stacked */}
              <div className="flex md:block items-center gap-4 mb-3 md:mb-0">
                {/* Faded step number */}
                <CardTitle className="text-5xl sm:text-6xl md:text-8xl font-light leading-none bg-gradient-to-b from-white/50 to-white/0 bg-clip-text text-transparent flex-shrink-0">
                  3
                </CardTitle>
                {/* Step title - on same line for mobile, separate for desktop */}
                <p className="text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-white md:mt-1 md:mb-4">
                  Start Owning
                </p>
              </div>
              {/* Step details - always on separate line */}
              <CardDescription className="text-sm sm:text-base lg:text-lg font-thin leading-relaxed text-white/70 mt-2">
                Move forward with or without a credit check, based on the deal,
                and take control of your land
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}