// client/src/components/DisplayGrid/DisplayGridHorizontal.jsx
import React from "react";
import PropertyCard from "../PropertyCard/PropertyCard";
import { PuffLoader } from "react-spinners";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * DisplayGridHorizontal Component
 * Displays properties in a horizontally scrollable layout
 */
const DisplayGridHorizontal = ({
  properties = [],
  loading = false,
  emptyMessage = "No properties found.",
  onPropertyClick,
  title,
  subtitle,
  showCount = false,
  className = "",
}) => {
  const scrollContainerRef = React.useRef(null);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -420,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 420,
        behavior: "smooth",
      });
    }
  };

  // Handle property click
  const handlePropertyClick = (property) => {
    if (onPropertyClick) {
      onPropertyClick(property);
    }
  };

  return (
    <div className={`display-grid-horizontal ${className}`}>
      {/* Title Section */}
      {title && (
        <div className="mb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-[#324c48]">{title}</h2>
              {subtitle && <p className="text-sm text-[#324c48]/70">{subtitle}</p>}
            </div>
            
            {showCount && (
              <p className="text-sm text-gray-600 font-medium">
                {properties.length} {properties.length === 1 ? "property" : "properties"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <PuffLoader size={50} color="#D4A017" />
        </div>
      ) : properties.length > 0 ? (
        <div className="relative">
          {/* Scroll Buttons - Only show if there are multiple properties */}
          {properties.length > 1 && (
            <>
              <Button
                type="button"
                onClick={scrollLeft}
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 shadow-lg border-2 border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5 text-[#324c48]" />
              </Button>
              <Button
                type="button"
                onClick={scrollRight}
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 shadow-lg border-2 border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="h-5 w-5 text-[#324c48]" />
              </Button>
            </>
          )}

          {/* Scrollable Container */}
          <div className="group relative px-1 py-2">
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 scroll-smooth"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#324c48 #e5e7eb",
              }}
            >
              {properties.map((property, index) => (
                <div
                  key={property.id}
                  className="flex-shrink-0 w-[340px] transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => handlePropertyClick(property)}
                  style={{
                    // Ensure proper spacing and no overlap
                    minWidth: "340px",
                    maxWidth: "340px",
                  }}
                >
                  <PropertyCard card={property} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-600 py-8">{emptyMessage}</p>
      )}

      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        div[ref] {
          scrollbar-width: thin;
          scrollbar-color: #324c48 #e5e7eb;
        }

        div[ref]::-webkit-scrollbar {
          height: 10px;
        }
        
        div[ref]::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 8px;
          margin: 0 8px;
        }
        
        div[ref]::-webkit-scrollbar-thumb {
          background: #324c48;
          border-radius: 8px;
          border: 2px solid #f3f4f6;
        }
        
        div[ref]::-webkit-scrollbar-thumb:hover {
          background: #3f4f24;
        }

        /* Prevent text selection during scroll */
        div[ref] {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Smooth momentum scrolling on iOS */
        div[ref] {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};

export default DisplayGridHorizontal;