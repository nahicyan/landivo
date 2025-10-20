// SupportHero.jsx
import React from "react";
import { HelpCircle } from "lucide-react";

export default function SupportHero() {
  return (
    <section className="w-full bg-[#3f4f24] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A017]/20 sm:h-20 sm:w-20">
              <HelpCircle className="h-8 w-8 text-[#D4A017] sm:h-10 sm:w-10" />
            </div>
          </div>
          
          {/* Heading */}
          <h1 className="text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
            How Can We Help You?
          </h1>
          
          {/* Description */}
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg lg:text-xl">
            We're here to support you every step of the way. Whether you have
            questions about land ownership, financing, or just need guidance,
            our dedicated team is ready to help.
          </p>
        </div>
      </div>
    </section>
  );
}