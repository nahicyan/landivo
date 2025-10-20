import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Example icons from lucide-react (used in shadcn)
import { Map, DollarSign, Handshake, Sprout } from "lucide-react";

export default function AboutUsContent() {
  return (
    <section className="bg-[#FDF8F2] py-12 sm:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Main Heading */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12">
          {/* Left Column: Label + Heading - centered on mobile */}
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#3f4f24]">
              Why Landivo?
            </p>
            <h2 className="mt-3 text-3xl font-medium leading-tight text-[#384620] sm:text-4xl">
              What Sets Us Apart
            </h2>
          </div>

          {/* Right Column: Paragraph - centered on mobile */}
          <div className="flex items-center">
            <p className="text-center text-base leading-relaxed text-gray-600 sm:text-left sm:text-lg">
              At Landivo, we're passionate about connecting buyers with
              exclusive land opportunities you won't find anywhere else. As a
              dedicated land wholesaling company, we specialize in sourcing
              off-market properties and making them accessible to you through
              flexible, buyer-friendly solutions.
            </p>
          </div>
        </div>

        {/* 4-Card Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:mt-12">
          {/* CARD 1 */}
          <div className="flex flex-col items-start rounded-lg border border-gray-200 bg-[#e8efdc] p-6 shadow-sm">
            {/* Icon and Title Row on mobile, Column on larger screens */}
            <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(212,160,23,0.1)] shadow-md shadow-[rgba(212,160,23,0.2)] sm:mb-4">
                <Map className="h-6 w-6 text-[#D4A017]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Off-Market Expertise
              </h3>
            </div>
            {/* Description */}
            <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-gray-600">
              We uncover hidden land deals, giving you first access to unique
              properties.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="flex flex-col items-start rounded-lg border border-gray-200 bg-[#e8efdc] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(212,160,23,0.1)] shadow-md shadow-[rgba(212,160,23,0.2)] sm:mb-4">
                <DollarSign className="h-6 w-6 text-[#D4A017]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Flexible Financing
              </h3>
            </div>
            <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-gray-600">
              Most deals include seller financing, tailored to your budget,
              with minimal credit checks.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="flex flex-col items-start rounded-lg border border-gray-200 bg-[#e8efdc] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(212,160,23,0.1)] shadow-md shadow-[rgba(212,160,23,0.2)] sm:mb-4">
                <Handshake className="h-6 w-6 text-[#D4A017]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Buyer-First Approach
              </h3>
            </div>
            <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-gray-600">
              From start to finish, we streamline your path to ownership with
              clear terms and fast closings.
            </p>
          </div>

          {/* CARD 4 */}
          <div className="flex flex-col items-start rounded-lg border border-gray-200 bg-[#e8efdc] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 sm:flex-col sm:items-start sm:gap-0">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(212,160,23,0.1)] shadow-md shadow-[rgba(212,160,23,0.2)] sm:mb-4">
                <Sprout className="h-6 w-6 text-[#D4A017]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Let's Build Your Future
              </h3>
            </div>
            <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-gray-600">
              Whether you're a first-time buyer or investor, we'll help you
              find and own the perfect lot.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}