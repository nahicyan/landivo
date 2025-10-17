import React from "react";

export default function Story() {
  return (
    <section className="bg-[#FDF8F2] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 px-4 sm:px-6 lg:px-8 md:grid-cols-2">
        {/* LEFT COLUMN */}
        <div>
          {/* Small label */}
          <p className="mb-2 text-sm sm:text-base lg:text-lg font-semibold uppercase tracking-wide text-[#D4A017]">
            Our Story
          </p>
          
          {/* Large Heading */}
          <h2 className="mb-4 sm:mb-5 lg:mb-6 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-[#3f4f24] text-center md:text-left">
            Landivo Was Born From A Vision To Rethink How Land Changes Hands
          </h2>
          
          {/* Main paragraphs */}
          <div className="space-y-4 sm:space-y-5 text-sm sm:text-base lg:text-lg leading-relaxed text-[#324c48]">
            <p>
              Landivo was born from a vision to rethink how land changes hands.
              Tired of seeing buyers boxed out by high prices and rigid
              financing, we set out to create a better way. Today, we're proud
              to serve buyers across Texas, Arkansas and other states delivering wholesale land deals that turn possibilities
              into realities.
            </p>
            <p>
              Whether you're a first-time buyer or a seasoned investor, we're
              here to help you find and own the perfect lot. Explore our
              properties, pre-qualify for financing, and join the Landivo
              family—where land ownership starts with you.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats with lines */}
        <div className="flex flex-col justify-center mt-6 md:mt-0">
          {/* Stat 1 */}
          <div className="flex items-center border-b border-[#324c48]/30 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <span className="mr-4 sm:mr-6 text-3xl sm:text-4xl lg:text-5xl font-light text-[#3f4f24] min-w-[60px] sm:min-w-[80px]">
              5
            </span>
            <span className="text-sm sm:text-base text-[#324c48] leading-snug">
              States <br /> Served
            </span>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center border-b border-[#324c48]/30 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <span className="mr-4 sm:mr-6 text-3xl sm:text-4xl lg:text-5xl font-light text-[#3f4f24] min-w-[60px] sm:min-w-[80px]">
              6
            </span>
            <span className="text-sm sm:text-base text-[#324c48] leading-snug">
              Years <br /> in Business
            </span>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center border-b border-[#324c48]/30 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <span className="mr-4 sm:mr-6 text-3xl sm:text-4xl lg:text-5xl font-light text-[#3f4f24] min-w-[60px] sm:min-w-[80px]">
              25+
            </span>
            <span className="text-sm sm:text-base text-[#324c48] leading-snug">
              Passionate <br /> Employees
            </span>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center border-b border-[#324c48]/30 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <span className="mr-4 sm:mr-6 text-3xl sm:text-4xl lg:text-5xl font-light text-[#3f4f24] min-w-[60px] sm:min-w-[80px]">
              500+
            </span>
            <span className="text-sm sm:text-base text-[#324c48] leading-snug">
              Thriving <br /> Land Owners
            </span>
          </div>

          {/* Stat 5 */}
          <div className="flex items-center border-b border-[#324c48]/30 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <span className="mr-4 sm:mr-6 text-3xl sm:text-4xl lg:text-5xl font-light text-[#3f4f24] min-w-[60px] sm:min-w-[80px]">
              30
            </span>
            <span className="text-sm sm:text-base text-[#324c48] leading-snug">
              Monthly <br /> Deals
            </span>
          </div>

          {/* Stat 6 */}
          <div className="flex items-center border-b border-[#324c48]/30 pb-3 sm:pb-4 mb-3 sm:mb-4">
            <span className="mr-4 sm:mr-6 text-3xl sm:text-4xl lg:text-5xl font-light text-[#3f4f24] min-w-[60px] sm:min-w-[80px]">
              $5M
            </span>
            <span className="text-sm sm:text-base text-[#324c48] leading-snug">
              Financed <br /> to Date
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}