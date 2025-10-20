import React from "react";
import { Accordion } from "@/components/ui/accordion";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <section className="w-full bg-[#FDF8F2] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10 sm:mb-12 lg:mb-16 text-center md:text-left">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#D4A017]">
            FAQ
          </p>
          <h2 className="text-3xl font-medium leading-tight text-[#384620] sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-gray-600 sm:text-lg lg:max-w-2xl">
            Find answers to common questions about buying land with Landivo
          </p>
        </div>

        {/* FAQ Accordion - Centered Container */}
        <div className="mx-auto max-w-4xl">
          <Accordion type="single" collapsible className="w-full space-y-4">
            
            {/* Question 1 */}
            <AccordionItem 
              value="item-1" 
              className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-[#384620] hover:text-[#3f4f24] sm:text-lg">
                How does seller financing work at Landivo?
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                Seller financing allows you to purchase land directly from us 
                with flexible terms—no bank required. Most deals require low 
                down payments, and some may include a quick credit check to 
                offer you the best terms.
              </AccordionContent>
            </AccordionItem>

            {/* Question 2 */}
            <AccordionItem 
              value="item-2" 
              className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-[#384620] hover:text-[#3f4f24] sm:text-lg">
                Do I need a credit check to buy land?
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                Most of our properties do not require credit checks. However, 
                for certain deals, we may conduct a brief credit check to 
                tailor the best financing terms for you.
              </AccordionContent>
            </AccordionItem>

            {/* Question 3 */}
            <AccordionItem 
              value="item-3" 
              className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-[#384620] hover:text-[#3f4f24] sm:text-lg">
                What are the payment options?
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                We offer multiple payment plans, including monthly installments 
                starting as low as $200/month, making land ownership accessible 
                for everyone.
              </AccordionContent>
            </AccordionItem>

            {/* Question 4 */}
            <AccordionItem 
              value="item-4" 
              className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-[#384620] hover:text-[#3f4f24] sm:text-lg">
                How soon can I take ownership of my land?
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                Once the down payment is processed and paperwork is completed, 
                you can take control of your land immediately. Full ownership 
                is granted upon completion of payments.
              </AccordionContent>
            </AccordionItem>

            {/* Question 5 */}
            <AccordionItem 
              value="item-5" 
              className="rounded-xl border border-gray-200 bg-white px-6 py-2 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-[#384620] hover:text-[#3f4f24] sm:text-lg">
                Can I visit the land before buying?
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                Yes! We encourage buyers to visit the property before making a 
                purchase. Contact us for location details and access information.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Call to Action Footer */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-base text-gray-600 sm:text-lg">
            Still have questions?{" "}
            <a 
              href="/contact" 
              className="font-semibold text-[#3f4f24] hover:text-[#D4A017] transition-colors underline decoration-[#D4A017] underline-offset-4"
            >
              Contact our team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}