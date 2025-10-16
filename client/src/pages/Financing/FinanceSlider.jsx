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

  // Scroll Handlers - Now scrolls exactly one card width + spacing
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
    <div className="w-full py-6 bg-[#FDF8F2]">
      <div className="max-w-screen-xl mx-auto">
        {/* Title Section - Matching DisplayRow style */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Discover Land with Flexible Financing
          </h2>
          <p className="text-[#324c48]/80">
            Budget-friendly monthly financing plans.
          </p>
        </div>

        {/* Content */}
        {financingProperties.length > 0 ? (
          <div className="relative">
            {/* Left Scroll Button - Matching DisplayRow style */}
            {scrollState.showLeft && (
              <button
                onClick={scrollLeft}
                className="hidden sm:block sm:absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}

            {/* Scrollable Container - Matching DisplayRow style */}
            <div
              className="px-2 py-4 overflow-y-auto overflow-x-hidden sm:overflow-x-auto sm:overflow-y-hidden no-scrollbar"
              ref={scrollRef}
              onScroll={updateScrollState}
            >
              <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-5 py-8">
                {financingProperties.map((property, index) => (
                  <div
                    key={property.id}
                    className={`flex-shrink-0 transition hover:scale-105 ${index === 0 ? 'ml-3' : ''}`}
                  >
                    <PropertyCard card={property} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Scroll Button - Matching DisplayRow style */}
            {scrollState.showRight && (
              <button
                onClick={scrollRight}
                className="hidden sm:block sm:absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full p-3 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-4">
            No properties available with financing.
          </p>
        )}
      </div>
    </div>
  );
}