import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MainContent() {
  return (
    <section className="bg-[#FDF8F2] py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Single Card Covering Text & Image */}
        <Card className="overflow-hidden rounded-xl sm:rounded-2xl bg-[#e8efdc] shadow-lg border-0">
          {/* Two-Column Layout inside the Card */}
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 p-0">
            {/* Left Column: Text & CTA */}
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
              <h2 className="mb-4 sm:mb-6 lg:mb-8 text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight text-[#384620] text-center lg:text-left">
                Your Path To Land Ownership
              </h2>
              <p className="mb-6 text-sm sm:text-base lg:text-lg font-medium text-gray-600 leading-relaxed">
                At Landivo, we're committed to making land ownership accessible
                through seller financing. For most of our off-market properties,
                we offer flexible terms without the hassle of traditional bank
                loans. Depending on the deal, some transactions may involve a
                quick credit check to ensure the best fit—but our focus remains
                on your ability to own land.
              </p>
              {/* Uncomment if you want the CTA button */}
              {/* <Button className="rounded-full bg-green-600 px-6 py-3 text-sm sm:text-base text-white hover:bg-green-700 transition-colors">
                Learn More
              </Button> */}
            </div>

            {/* Right Column: Image */}
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[300px] lg:min-h-[400px]">
              <img
                src="https://cdn.landivo.com/wp-content/uploads/2025/04/mainfinance.jpg"
                alt="Land financing example"
                className="absolute inset-0 h-full w-full object-cover lg:rounded-r-xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}