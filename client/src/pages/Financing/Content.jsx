import React from "react";
import { FaBolt, FaChartBar, FaWallet } from "react-icons/fa";

export default function Content() {
  return (
    <section className="bg-[#FDF8F2] py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Outer Card */}
        <div className="rounded-lg sm:rounded-xl bg-[#e8efdc] p-5 sm:p-8 lg:p-12 shadow-lg">
          {/* Top Row: 2 columns */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-12 md:grid-cols-2">
            {/* Left Column: Label + Heading */}
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#3f4f24] text-center md:text-left">
                Our Financing
              </p>
              <h2 className="mt-2 sm:mt-3 text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight text-[#384620] text-center md:text-left">
                Why Choose Seller Financing with Landivo?
              </h2>
            </div>
            
            {/* Right Column: Paragraph */}
            <div className="flex items-center">
              <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-600">
                We make it easy to buy land with flexible terms. Access your
                property quickly, with minimal checks or waiting.
              </p>
            </div>
          </div>

          {/* Bottom Row: Three Feature Cards */}
          <div className="mt-8 sm:mt-12 lg:mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-8">
            {/* 1) Flexible Options */}
            <div className="flex flex-col items-start p-4 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none">
              <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-auto lg:h-auto bg-[#3f4f24]/10 rounded-xl sm:bg-transparent sm:rounded-none sm:mb-4 flex-shrink-0">
                  <FaBolt className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#3f4f24]" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-800 tracking-tight">
                  Flexible Options
                </h3>
              </div>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                Minimal credit checks for most deals, with tailored terms for
                all buyers
              </p>
            </div>

            {/* 2) Affordable Payments */}
            <div className="flex flex-col items-start p-4 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none">
              <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-auto lg:h-auto bg-[#3f4f24]/10 rounded-xl sm:bg-transparent sm:rounded-none sm:mb-4 flex-shrink-0">
                  <FaChartBar className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#3f4f24]" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-800 tracking-tight">
                  Affordable Payments
                </h3>
              </div>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                Low down payments and competitive rates keep land within reach.
              </p>
            </div>

            {/* 3) Full Control */}
            <div className="flex flex-col items-start p-4 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 lg:w-auto lg:h-auto bg-[#3f4f24]/10 rounded-xl sm:bg-transparent sm:rounded-none sm:mb-4 flex-shrink-0">
                  <FaWallet className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#3f4f24]" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-800 tracking-tight">
                  Full Control
                </h3>
              </div>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                Own your land outright once payments are complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}