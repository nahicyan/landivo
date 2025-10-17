import React from "react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section
      className="w-full py-8 sm:py-10 lg:py-12"
      style={{
        "--text": "#030001",
        "--background": "#FDF8F2",
        "--primary": "#3f4f24",
        "--secondary": "#324c48",
        "--accent": "#D4A017",
      }}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Flex container for Left Text + Right Grid */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 lg:gap-12">
          {/* LEFT TEXT CONTENT */}
          <div className="md:w-1/2">
            <p className="text-[var(--primary)] font-semibold uppercase tracking-wide text-xs sm:text-sm text-center md:text-left">
              We make owning land simple and affordable
            </p>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight text-[var(--secondary)] text-center md:text-left">
              Unlock Your Land with 
              <br />
              <span className="text-[var(--accent)]">Flexible Financing</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-gray-600 text-center md:text-left">
              Buy Off-Market Land with Seller Financing
            </p>
            <div className="mt-5 sm:mt-6">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[var(--primary)] text-base sm:text-lg text-white hover:bg-[var(--secondary)] px-6 sm:px-8 py-5 sm:py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => {
                  const sliderElement =
                    document.getElementById("financing-slider");
                  if (sliderElement) {
                    sliderElement.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Explore Financing
              </Button>
            </div>
            
            {/* Star Ratings */}
            <div className="mt-4 sm:mt-5 flex items-center justify-center sm:justify-start">
              <div className="flex text-[var(--accent)] text-lg sm:text-xl">
                <span>⭐⭐⭐⭐⭐</span>
              </div>
              <p className="ml-2 text-xs sm:text-sm text-gray-600">
                4.9 from 200+ Buyers
              </p>
            </div>
          </div>

          {/* RIGHT 2×2 GRID with 3 Cards */}
          <div className="w-full md:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* 1) TOP CARD (spans 2 columns): Farmland aerial image */}
              <div className="relative col-span-1 sm:col-span-2 rounded-lg sm:rounded-xl bg-gray-100 overflow-hidden shadow-md">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/finance.jpg"
                  alt="Land Financing"
                  className="w-full h-48 sm:h-56 lg:h-64 object-cover"
                />
              </div>

              {/* 2) BOTTOM-LEFT CARD: Grow Your Savings */}
              <div className="relative rounded-lg sm:rounded-xl bg-[#546930] p-4 sm:p-5 lg:p-6 shadow-md text-white">
                {/* Top row: Amount + Up Arrow */}
                <div className="flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                    Grow Your Savings
                  </span>
                  <span className="ml-2 text-lg sm:text-xl font-semibold">&#8593;</span>
                </div>

                {/* Label: Saving */}
                <p className="mt-1 text-xs sm:text-sm">
                  Build wealth with land ownership
                </p>

                {/* Line Chart */}
                <div className="mt-3 sm:mt-4 flex h-16 sm:h-20 items-center justify-center">
                  <svg
                    viewBox="0 0 100 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-full w-5/6 text-white"
                  >
                    {/* Simple upward path */}
                    <path d="M5 40 L20 30 L35 35 L50 20 L65 25 L80 10" />
                  </svg>
                </div>
              </div>

              {/* 3) BOTTOM-RIGHT CARD: Multiple Payment Plans */}
              <div className="relative rounded-lg sm:rounded-xl bg-[#e8efdc] p-4 sm:p-5 lg:p-6 shadow-md">
                <div className="flex items-center justify-between gap-3 md:block">
                  {/* Text Group */}
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#384620]">
                      Multiple Payment Plans
                    </h3>
                    <p className="mt-1.5 sm:mt-2 text-base sm:text-lg text-[#384620]">
                      Starts from $200/mo
                    </p>
                    <p className="text-sm sm:text-base text-[#546930]">
                      Fits any budget
                    </p>
                  </div>
                  
                  {/* Mini bar chart */}
                  <div className="flex items-end space-x-1.5 sm:space-x-2 md:mt-3 lg:mt-4">
                    <div className="h-3 sm:h-4 w-2 rounded bg-[#bacf96]" />
                    <div className="h-5 sm:h-6 w-2 rounded bg-[#a3bf73]" />
                    <div className="h-6 sm:h-8 w-2 rounded bg-[#8caf50]" />
                    <div className="h-2.5 sm:h-3 w-2 rounded bg-[#bacf96]" />
                    <div className="h-4 sm:h-5 w-2 rounded bg-[#a3bf73]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}