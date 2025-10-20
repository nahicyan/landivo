// SupportFAQ.jsx
import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function SupportFAQ() {
  const faqs = [
    {
      question: "How do I finance my land purchase?",
      answer:
        "We offer multiple financing options, including owner financing with low down payments and flexible payment plans. Most of our properties include seller financing options that don't require traditional bank approval. Visit our Financing page for complete details on terms, rates, and payment structures.",
    },
    {
      question: "What if I have bad credit?",
      answer:
        "We provide owner financing with minimal or no credit check required for most properties. We believe everyone deserves a chance to own land, regardless of their credit history. Our flexible terms are designed to work with your financial situation.",
    },
    {
      question: "How long does it take to close on land?",
      answer:
        "Closing can be as quick as 7-14 days once all paperwork is in order. For properties with seller financing, the process is often even faster. Our experienced team will guide you through each step and keep you informed throughout the entire process.",
    },
    {
      question: "Can I visit the property before purchasing?",
      answer:
        "Absolutely! We encourage all buyers to visit the property before making a purchase decision. Contact our team and we'll provide you with the exact location, access information, and arrange a convenient time for you to view the land.",
    },
    {
      question: "What documents do I need to purchase land?",
      answer:
        "You'll typically need a valid ID, proof of income (for financing), and funds for the down payment. Our team will provide a complete checklist during your consultation and help you gather all necessary documentation for a smooth transaction.",
    },
    {
      question: "Do you offer property management services?",
      answer:
        "While we specialize in land sales, we can connect you with trusted property management partners in your area. Our network includes professionals who can help with land maintenance, tax management, and future development planning.",
    },
    {
      question: "What happens if I need to sell my land?",
      answer:
        "We offer buyback options on select properties and can assist with reselling your land through our network. Contact our team to discuss your specific situation and explore the best options for your needs.",
    },
    {
      question: "Are there any hidden fees?",
      answer:
        "No hidden fees! We believe in complete transparency. All costs, including closing costs, monthly payments, and any additional fees, are clearly outlined in your purchase agreement. Our team will review everything with you upfront.",
    },
  ];

  return (
    <section className="w-full bg-[#FDF8F2] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 lg:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#D4A017]">
            FAQ
          </p>
          <h2 className="text-3xl font-medium leading-tight text-[#384620] sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            Find quick answers to common questions about buying land with Landivo
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm transition-shadow hover:shadow-md"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-[#384620] hover:text-[#3f4f24] sm:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-center sm:mt-16">
          <p className="text-base text-gray-600 sm:text-lg">
            Can't find what you're looking for?{" "}
            <a
              href="/contact"
              className="font-semibold text-[#3f4f24] transition-colors hover:text-[#D4A017] underline decoration-[#D4A017] underline-offset-4"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}