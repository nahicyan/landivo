import React, { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import PropertyCard from "@/components/PropertyCard/PropertyCard";
import useProperties from "../../components/hooks/useProperties.js";

export default function FinancingSlider() {
  const { data = [], isError, isLoading } = useProperties();
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({ showLeft: false, showRight: false });

  // Card dimensions for scrolling
  const CARD_WIDTH = 384; // w-96 = 24rem = 384px
  const CARD_SPACING = 20; // space-x-5 = 1.25rem = 20px
  const SCROLL_AMOUNT = CARD_WIDTH + CARD_SPACING; // 404px total

  // Filter properties where financing is available
  const financingProperties = data.filter((property) => property.financing === "Available");

  // Function to update scroll state
  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      setScrollState({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft + clientWidth < scrollWidth,
      });
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.removeEventListener("resize", updateScrollState);
    };
  }, [data]);

  useEffect(() => {
    updateScrollState();
  }, [financingProperties.length]);

  // Scroll Handlers
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
      setTimeout(updateScrollState, 300);
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
      setTimeout(updateScrollState, 300);
    }
  };

  if (isError) return <div className="text-center text-red-500 py-4">Error fetching data</div>;
  if (isLoading) return <div className="text-center py-4">Loading properties...</div>;

  return (
    <div className="w-full py-6 sm:py-8 lg:py-12 bg-[#FDF8F2]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-[#324c48]">
            Discover Land with Flexible Financing
          </h2>
          <p className="text-sm sm:text-base text-[#324c48]/80">
            Budget-friendly monthly financing plans.
          </p>
        </div>

        {/* Content */}
        {financingProperties.length > 0 ? (
          <div className="relative">
            {/* Left Scroll Button - Desktop only */}
            {scrollState.showLeft && (
              <button
                onClick={scrollLeft}
                className="hidden lg:block absolute -left-4 xl:-left-6 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 lg:p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gray-50"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-5 h-5 lg:w-6 lg:h-6 text-[#324c48]" />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              className="overflow-y-auto overflow-x-hidden sm:overflow-x-auto sm:overflow-y-hidden no-scrollbar"
              ref={scrollRef}
              onScroll={updateScrollState}
            >
              {/* Mobile: Stack vertically, Desktop: Horizontal scroll */}
              <div className="flex flex-col sm:flex-row space-y-6 sm:space-y-0 sm:space-x-5 py-4 sm:py-6">
                {financingProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex-shrink-0 w-full sm:w-96 transition-transform duration-200 hover:scale-105"
                  >
                    <PropertyCard card={property} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Scroll Button - Desktop only */}
            {scrollState.showRight && (
              <button
                onClick={scrollRight}
                className="hidden lg:block absolute -right-4 xl:-right-6 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-2 lg:p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gray-50"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="w-5 h-5 lg:w-6 lg:h-6 text-[#324c48]" />
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-4 text-sm sm:text-base">
            No properties available with financing.
          </p>
        )}
      </div>
    </div>
  );
}