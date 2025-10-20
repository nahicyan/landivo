// SupportCTA.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Phone } from "lucide-react";

export default function SupportCTA() {
  return (
    <section className="w-full bg-[#e8efdc] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#3f4f24] px-6 py-12 text-center sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          {/* Heading */}
          <h2 className="text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
            Still Have Questions?
          </h2>
          
          {/* Description */}
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:mt-6 sm:text-lg lg:text-xl">
            Our dedicated support team is ready to assist you. Reach out through
            your preferred channel and we'll get back to you as soon as possible.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row sm:gap-6">
            <Button
              className="w-full bg-[#D4A017] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#b88915] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              size="lg"
              onClick={() => (window.location.href = "mailto:support@landivo.com")}
            >
              <Mail className="mr-2 h-5 w-5" />
              Email Us
            </Button>
            
            <Button
              className="w-full border-2 border-white bg-transparent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[#3f4f24] sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              size="lg"
              onClick={() => (window.location.href = "tel:+18001234567")}
            >
              <Phone className="mr-2 h-5 w-5" />
              Call Now
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 sm:mt-10">
            <p className="text-sm text-white/80 sm:text-base">
              Average response time: <span className="font-semibold text-white">Less than 2 hours</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}