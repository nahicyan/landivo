// client/src/components/PropertyFilters/PropertyFilterPopover.jsx
import React, { useState } from "react";
import { SlidersHorizontal, RotateCcw, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const PropertyFilterPopover = ({
  filters,
  setFilters,
  onClearAll,
  propertiesData = [],
  activeFilterCount = 0,
}) => {
  const [sizeUnit, setSizeUnit] = useState("acres");
  const [isOpen, setIsOpen] = useState(false);

  // Get unique values from data
  const getUniqueValues = (field) => {
    if (!propertiesData) return [];
    return propertiesData
      .map((prop) => prop[field])
      .filter((val) => val && val !== "")
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  };

  const areas = ["DFW", "Austin", "Houston", "San Antonio", "Other Areas"];
  const statuses = ["Available", "Pending", "Sold", "Not Available", "Testing"];
  const states = getUniqueValues("state");
  const cities = getUniqueValues("city");
  const counties = getUniqueValues("county");
  const zoningOptions = getUniqueValues("zoning");
  const financingOptions = ["Owner Finance", "Cash Only", "Traditional", "Flexible"];
  const restrictionOptions = ["None", "Minimal", "Moderate", "Restrictive"];
  const utilities = ["Available", "Not Available", "Unknown"];

  // Format numbers
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseFormattedNumber = (str) => {
    return parseFloat(str.replace(/,/g, "")) || 0;
  };

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white relative"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-[#3f4f24] text-white h-5 min-w-5 px-1.5"
            >
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[375px] p-0 bg-[#ebebeb]" 
        align="start"
        sideOffset={5}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-400 bg-[#ebebeb]">
          <h3 className="font-semibold text-sm text-[#324c48] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClearAll();
              setIsOpen(false);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-100 h-7 text-xs px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[500px]">
          <div className="p-3 space-y-3">
            {/* Price and Size Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Price Section */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#324c48]">Price</Label>
                <div className="text-[10px] text-gray-700 flex justify-between px-0.5">
                  <span>${formatNumber(filters.priceRange[0])}</span>
                  <span>${formatNumber(filters.priceRange[1])}</span>
                </div>
              </div>

              {/* Size Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#324c48]">Size</Label>
                  <Tabs value={sizeUnit} onValueChange={setSizeUnit} className="h-6">
                    <TabsList className="h-5 p-0.5 bg-white border border-gray-300">
                      <TabsTrigger value="acres" className="text-[10px] h-4 px-1.5">
                        Acres
                      </TabsTrigger>
                      <TabsTrigger value="sqft" className="text-[10px] h-4 px-1.5">
                        Sqft
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="text-[10px] text-gray-700 flex justify-between px-0.5">
                  {sizeUnit === "acres" ? (
                    <>
                      <span>{filters.acreRange[0]} ac</span>
                      <span>{filters.acreRange[1]} ac</span>
                    </>
                  ) : (
                    <>
                      <span>{formatNumber(filters.sqftRange[0])}</span>
                      <span>{formatNumber(filters.sqftRange[1])}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sliders Row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Price Slider */}
              <div className="space-y-1.5">
                <Slider
                  value={filters.priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={0}
                  max={10000000}
                  step={10000}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-1">
                  <Input
                    type="text"
                    value={formatNumber(filters.priceRange[0])}
                    onChange={(e) => handlePriceInputChange(e.target.value, true)}
                    className="h-6 text-[10px] px-1.5 bg-white"
                    placeholder="Min"
                  />
                  <Input
                    type="text"
                    value={formatNumber(filters.priceRange[1])}
                    onChange={(e) => handlePriceInputChange(e.target.value, false)}
                    className="h-6 text-[10px] px-1.5 bg-white"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Size Slider */}
              <div className="space-y-1.5">
                {sizeUnit === "acres" ? (
                  <>
                    <Slider
                      value={filters.acreRange}
                      onValueChange={handleAcreRangeChange}
                      min={0}
                      max={1000}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="number"
                        value={filters.acreRange[0]}
                        onChange={(e) => handleAcreInputChange(e.target.value, true)}
                        className="h-6 text-[10px] px-1.5 bg-white"
                        step="0.1"
                      />
                      <Input
                        type="number"
                        value={filters.acreRange[1]}
                        onChange={(e) => handleAcreInputChange(e.target.value, false)}
                        className="h-6 text-[10px] px-1.5 bg-white"
                        step="0.1"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Slider
                      value={filters.sqftRange}
                      onValueChange={handleSqftRangeChange}
                      min={0}
                      max={500000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="text"
                        value={formatNumber(filters.sqftRange[0])}
                        onChange={(e) => handleSqftInputChange(e.target.value, true)}
                        className="h-6 text-[10px] px-1.5 bg-white"
                      />
                      <Input
                        type="text"
                        value={formatNumber(filters.sqftRange[1])}
                        onChange={(e) => handleSqftInputChange(e.target.value, false)}
                        className="h-6 text-[10px] px-1.5 bg-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator className="bg-gray-400" />

            {/* Basic Filters */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-[#324c48]">Area</Label>
                  <Select
                    value={filters.area}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, area: value }))}
                  >
                    <SelectTrigger className="h-7 text-[11px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-[#324c48]">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-7 text-[11px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] font-medium text-[#324c48]">Payment</Label>
                  <Select
                    value={filters.financing}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, financing: value }))}
                  >
                    <SelectTrigger className="h-7 text-[11px] bg-white w-[90%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Options</SelectItem>
                      {financingOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-400" />

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#324c48]">Location</Label>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">State</Label>
                  <Select
                    value={filters.state}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">City</Label>
                  <Select
                    value={filters.city}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">County</Label>
                  <Select
                    value={filters.county}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, county: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {counties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-400" />

            {/* Property Details */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#324c48]">Details</Label>
              <div className="grid grid-cols-2 gap-2">
                {zoningOptions.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[9px] text-gray-700">Zoning</Label>
                    <Select
                      value={filters.zoning}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, zoning: value }))}
                    >
                      <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {zoningOptions.map((zoning) => (
                          <SelectItem key={zoning} value={zoning}>
                            {zoning}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Restrictions</Label>
                  <Select
                    value={filters.restrictions}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, restrictions: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {restrictionOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Mobile Home</Label>
                  <Select
                    value={filters.mobileHomeFriendly}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, mobileHomeFriendly: value }))
                    }
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Maybe">Maybe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">HOA/POA</Label>
                  <Select
                    value={filters.hoaPoa}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, hoaPoa: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-400" />

            {/* Utilities */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#324c48]">Utilities</Label>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Water</Label>
                  <Select
                    value={filters.water}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, water: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {utilities.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Sewer</Label>
                  <Select
                    value={filters.sewer}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sewer: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {utilities.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Electric</Label>
                  <Select
                    value={filters.electric}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, electric: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {utilities.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-400" />

            {/* Additional */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#324c48]">Additional</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Road</Label>
                  <Select
                    value={filters.roadCondition}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, roadCondition: value }))
                    }
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Paved">Paved</SelectItem>
                      <SelectItem value="Gravel">Gravel</SelectItem>
                      <SelectItem value="Dirt">Dirt</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-gray-700">Floodplain</Label>
                  <Select
                    value={filters.floodplain}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, floodplain: value }))}
                  >
                    <SelectTrigger className="h-6 text-[10px] bg-white w-[80%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-400" />

            {/* Featured Only */}
            <div className="flex items-center space-x-2 p-2 bg-yellow-100 rounded border border-yellow-300">
              <Checkbox
                id="featured-only"
                checked={filters.featuredOnly}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, featuredOnly: checked }))
                }
                className="h-3.5 w-3.5"
              />
              <Label htmlFor="featured-only" className="text-[10px] font-medium cursor-pointer text-[#324c48]">
                Featured Only
              </Label>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-400 bg-[#ebebeb]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-[10px] h-6 px-3 bg-white hover:bg-gray-100"
          >
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};