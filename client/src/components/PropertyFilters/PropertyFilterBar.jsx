// client/src/components/PropertyFilters/PropertyFilterBar.jsx
import React, { useState } from "react";
import { Filter, RotateCcw, DollarSign, Maximize2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PropertyFilterPopover } from "./PropertyFilterPopover";

export const PropertyFilterBar = ({
  filters,
  setFilters,
  onClearAll,
  resultsCount,
  activeFilterCount,
  propertiesData,
}) => {
  const [sizeUnit, setSizeUnit] = useState("acres");
  const [priceOpen, setPriceOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  // Format numbers
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseFormattedNumber = (str) => {
    return parseFloat(str.replace(/,/g, "")) || 0;
  };

  // Check if price filter is active
  const isPriceActive = filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000;

  // Check if size filter is active
  const isSizeActive =
    filters.acreRange[0] > 0 ||
    filters.acreRange[1] < 1000 ||
    filters.sqftRange[0] > 0 ||
    filters.sqftRange[1] < 500000;

  // Handlers
  const handlePriceRangeChange = (values) => {
    setFilters((prev) => ({ ...prev, priceRange: values }));
  };

  const handleAcreRangeChange = (values) => {
    setFilters((prev) => ({ ...prev, acreRange: values }));
  };

  const handleSqftRangeChange = (values) => {
    setFilters((prev) => ({ ...prev, sqftRange: values }));
  };

  const handlePriceInputChange = (value, isMin) => {
    const numValue = parseFormattedNumber(value);
    setFilters((prev) => ({
      ...prev,
      priceRange: isMin
        ? [Math.min(numValue, prev.priceRange[1]), prev.priceRange[1]]
        : [prev.priceRange[0], Math.max(numValue, prev.priceRange[0])],
    }));
  };

  const handleAcreInputChange = (value, isMin) => {
    const numValue = parseFloat(value) || 0;
    setFilters((prev) => ({
      ...prev,
      acreRange: isMin
        ? [Math.min(numValue, prev.acreRange[1]), prev.acreRange[1]]
        : [prev.acreRange[0], Math.max(numValue, prev.acreRange[0])],
    }));
  };

  const handleSqftInputChange = (value, isMin) => {
    const numValue = parseFormattedNumber(value);
    setFilters((prev) => ({
      ...prev,
      sqftRange: isMin
        ? [Math.min(numValue, prev.sqftRange[1]), prev.sqftRange[1]]
        : [prev.sqftRange[0], Math.max(numValue, prev.sqftRange[0])],
    }));
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border border-[#324c48]/20 shadow-sm">
      {/* Left Side - Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-[#324c48]" />

        {/* Price Filter */}
        <Popover open={priceOpen} onOpenChange={setPriceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 text-sm ${
                isPriceActive
                  ? "border-[#3f4f24] text-[#3f4f24] bg-[#3f4f24]/5"
                  : "border-[#324c48]/30 text-[#324c48]"
              } hover:bg-[#f6ece0]`}
            >
              <DollarSign className="w-4 h-4 mr-1.5" />
              Price
              {isPriceActive && (
                <Badge variant="secondary" className="ml-2 bg-[#3f4f24] text-white text-xs h-4 px-1">
                  ✓
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-[#ebebeb]" align="start">
            <div className="p-3 space-y-2">
              <Label className="text-xs font-semibold text-[#324c48]">Price Range</Label>
              <div className="text-[10px] text-gray-700 flex justify-between px-0.5">
                <span>${formatNumber(filters.priceRange[0])}</span>
                <span>${formatNumber(filters.priceRange[1])}</span>
              </div>
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                min={0}
                max={10000000}
                step={10000}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <Label className="text-[9px] text-gray-600 mb-1">Min</Label>
                  <Input
                    type="text"
                    value={formatNumber(filters.priceRange[0])}
                    onChange={(e) => handlePriceInputChange(e.target.value, true)}
                    className="h-7 text-xs bg-white"
                    placeholder="$0"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600 mb-1">Max</Label>
                  <Input
                    type="text"
                    value={formatNumber(filters.priceRange[1])}
                    onChange={(e) => handlePriceInputChange(e.target.value, false)}
                    className="h-7 text-xs bg-white"
                    placeholder="$10M"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setPriceOpen(false)}
                  className="h-7 text-xs bg-[#324c48] hover:bg-[#3f4f24] text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Size Filter */}
        <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 text-sm ${
                isSizeActive
                  ? "border-[#3f4f24] text-[#3f4f24] bg-[#3f4f24]/5"
                  : "border-[#324c48]/30 text-[#324c48]"
              } hover:bg-[#f6ece0]`}
            >
              <Maximize2 className="w-4 h-4 mr-1.5" />
              Size
              {isSizeActive && (
                <Badge variant="secondary" className="ml-2 bg-[#3f4f24] text-white text-xs h-4 px-1">
                  ✓
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 bg-[#ebebeb]" align="start">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#324c48]">Property Size</Label>
                <Tabs value={sizeUnit} onValueChange={setSizeUnit} className="h-6">
                  <TabsList className="h-5 p-0.5 bg-white border">
                    <TabsTrigger value="acres" className="text-[10px] h-4 px-2">
                      Acres
                    </TabsTrigger>
                    <TabsTrigger value="sqft" className="text-[10px] h-4 px-2">
                      Sq Ft
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {sizeUnit === "acres" ? (
                <>
                  <div className="text-[10px] text-gray-700 flex justify-between px-0.5">
                    <span>{filters.acreRange[0]} acres</span>
                    <span>{filters.acreRange[1]} acres</span>
                  </div>
                  <Slider
                    value={filters.acreRange}
                    onValueChange={handleAcreRangeChange}
                    min={0}
                    max={1000}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[9px] text-gray-600 mb-1">Min</Label>
                      <Input
                        type="number"
                        value={filters.acreRange[0]}
                        onChange={(e) => handleAcreInputChange(e.target.value, true)}
                        className="h-7 text-xs bg-white"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-gray-600 mb-1">Max</Label>
                      <Input
                        type="number"
                        value={filters.acreRange[1]}
                        onChange={(e) => handleAcreInputChange(e.target.value, false)}
                        className="h-7 text-xs bg-white"
                        step="0.1"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] text-gray-700 flex justify-between px-0.5">
                    <span>{formatNumber(filters.sqftRange[0])} sqft</span>
                    <span>{formatNumber(filters.sqftRange[1])} sqft</span>
                  </div>
                  <Slider
                    value={filters.sqftRange}
                    onValueChange={handleSqftRangeChange}
                    min={0}
                    max={500000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[9px] text-gray-600 mb-1">Min</Label>
                      <Input
                        type="text"
                        value={formatNumber(filters.sqftRange[0])}
                        onChange={(e) => handleSqftInputChange(e.target.value, true)}
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-gray-600 mb-1">Max</Label>
                      <Input
                        type="text"
                        value={formatNumber(filters.sqftRange[1])}
                        onChange={(e) => handleSqftInputChange(e.target.value, false)}
                        className="h-7 text-xs bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => setSizeOpen(false)}
                  className="h-7 text-xs bg-[#324c48] hover:bg-[#3f4f24] text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* More Filters */}
        <PropertyFilterPopover
          filters={filters}
          setFilters={setFilters}
          onClearAll={onClearAll}
          propertiesData={propertiesData}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Right Side - Results & Clear */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#324c48]">
          <span className="font-bold text-[#3f4f24] text-lg">{resultsCount}</span>{" "}
          {resultsCount === 1 ? "property" : "properties"} found
        </span>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};