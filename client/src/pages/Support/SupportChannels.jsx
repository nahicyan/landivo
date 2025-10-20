// SupportChannels.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, Clock } from "lucide-react";

export default function SupportChannels() {
  const supportChannels = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with a real agent to get instant support and answers to your questions.",
      availability: "Mon-Fri, 9AM-6PM EST",
      cta: "Start Chat",
      link: "https://landivo.com/chat",
      color: "bg-[#00D084]",
      hoverColor: "hover:bg-[#00B373]",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our land experts for personalized help and guidance.",
      availability: "Mon-Fri, 9AM-6PM EST",
      cta: "Call Us",
      link: "tel:+18001234567",
      color: "bg-[#3f4f24]",
      hoverColor: "hover:bg-[#2c3b18]",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours with detailed answers.",
      availability: "24/7 - Response within 24hrs",
      cta: "Email Us",
      link: "mailto:support@landivo.com",
      color: "bg-[#D4A017]",
      hoverColor: "hover:bg-[#b88915]",
    },
  ];

  return (
    <section className="w-full bg-[#FDF8F2] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 lg:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#D4A017]">
            Get In Touch
          </p>
          <h2 className="text-3xl font-medium leading-tight text-[#384620] sm:text-4xl lg:text-5xl">
            Contact Our Support Team
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            We offer multiple channels to ensure your questions are answered
            promptly and professionally.
          </p>
        </div>

        {/* Support Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {supportChannels.map((channel, idx) => {
            const IconComponent = channel.icon;
            return (
              <Card
                key={idx}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                {/* Card Content */}
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  {/* Icon */}
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8efdc]">
                    <IconComponent className="h-7 w-7 text-[#3f4f24]" />
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-xl font-semibold text-[#384620] sm:text-2xl">
                    {channel.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                    {channel.description}
                  </p>

                  {/* Availability */}
                  <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{channel.availability}</span>
                  </div>

                  {/* Button */}
                  <Button
                    className={`w-full ${channel.color} ${channel.hoverColor} text-white transition-colors`}
                    size="lg"
                    onClick={() => (window.location.href = channel.link)}
                  >
                    {channel.cta}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Additional Help Section */}
        <div className="mt-12 rounded-xl bg-[#e8efdc] p-6 text-center sm:mt-16 sm:p-8">
          <h3 className="text-xl font-semibold text-[#384620] sm:text-2xl">
            Need Immediate Assistance?
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            For urgent matters, please call our priority support line at{" "}
            <a
              href="tel:+18001234567"
              className="font-semibold text-[#3f4f24] hover:text-[#D4A017] transition-colors"
            >
              (800) 123-4567
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}