// client/src/components/PropertyFilters/PropertyFilterPanel.jsx
import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  SlidersHorizontal,
  Filter,
  RotateCcw,
  DollarSign,
  Maximize2
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const PropertyFilterPanel = ({ 
  filters, 
  setFilters, 
  onClearAll,
  propertiesData = [],
  resultsCount = 0
}) => {
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [sizeUnit, setSizeUnit] = useState("acres"); // "acres" or "sqft"

  // Get unique values from data for dropdowns
  const getUniqueValues = (field) => {
    if (!propertiesData) return [];
    const values = propertiesData
      .map(prop => prop[field])
      .filter(val => val && val !== "")
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return values;
  };

  // Get unique landType values (array field)
  const getUniqueLandTypes = () => {
    if (!propertiesData) return [];
    const allLandTypes = propertiesData
      .flatMap(prop => prop.landType || [])
      .filter(val => val && val !== "")
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return allLandTypes;
  };

  const areas = ["DFW", "Austin", "Houston", "San Antonio", "Other Areas"];
  const statuses = ["Available", "Pending", "Sold", "Not Available", "Testing"];
  const states = getUniqueValues("state");
  const cities = getUniqueValues("city");
  const counties = getUniqueValues("county");
  const zoningOptions = getUniqueValues("zoning");
  const financingOptions = ["Owner Finance", "Cash Only", "Traditional", "Flexible"];
  const landTypes = getUniqueLandTypes();
  const restrictionOptions = ["None", "Minimal", "Moderate", "Restrictive"];
  const utilities = ["Available", "Not Available", "Unknown"];

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse formatted number
  const parseFormattedNumber = (str) => {
    return parseFloat(str.replace(/,/g, "")) || 0;
  };

  // Handle price range changes
  const handlePriceRangeChange = (values) => {
    setFilters(prev => ({ ...prev, priceRange: values }));
  };

  // Handle acre range changes
  const handleAcreRangeChange = (values) => {
    setFilters(prev => ({ ...prev, acreRange: values }));
  };

  // Handle sqft range changes
  const handleSqftRangeChange = (values) => {
    setFilters(prev => ({ ...prev, sqftRange: values }));
  };

  // Handle direct input for price
  const handlePriceInputChange = (value, isMin) => {
    const numValue = parseFormattedNumber(value);
    setFilters(prev => ({
      ...prev,
      priceRange: isMin 
        ? [Math.min(numValue, prev.priceRange[1]), prev.priceRange[1]]
        : [prev.priceRange[0], Math.max(numValue, prev.priceRange[0])]
    }));
  };

  // Handle direct input for acres
  const handleAcreInputChange = (value, isMin) => {
    const numValue = parseFloat(value) || 0;
    setFilters(prev => ({
      ...prev,
      acreRange: isMin 
        ? [Math.min(numValue, prev.acreRange[1]), prev.acreRange[1]]
        : [prev.acreRange[0], Math.max(numValue, prev.acreRange[0])]
    }));
  };

  // Handle direct input for sqft
  const handleSqftInputChange = (value, isMin) => {
    const numValue = parseFormattedNumber(value);
    setFilters(prev => ({
      ...prev,
      sqftRange: isMin 
        ? [Math.min(numValue, prev.sqftRange[1]), prev.sqftRange[1]]
        : [prev.sqftRange[0], Math.max(numValue, prev.sqftRange[0])]
    }));
  };

  // Handle land type selection
  const handleLandTypeToggle = (landType) => {
    setFilters(prev => ({
      ...prev,
      landTypes: prev.landTypes.includes(landType)
        ? prev.landTypes.filter(t => t !== landType)
        : [...prev.landTypes, landType]
    }));
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.area !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.state !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
    if (filters.acreRange[0] > 0 || filters.acreRange[1] < 1000) count++;
    if (filters.sqftRange[0] > 0 || filters.sqftRange[1] < 500000) count++;
    if (filters.city !== "all") count++;
    if (filters.county !== "all") count++;
    if (filters.zoning !== "all") count++;
    if (filters.financing !== "all") count++;
    if (filters.landTypes.length > 0) count++;
    if (filters.restrictions !== "all") count++;
    if (filters.water !== "all") count++;
    if (filters.sewer !== "all") count++;
    if (filters.electric !== "all") count++;
    if (filters.roadCondition !== "all") count++;
    if (filters.floodplain !== "all") count++;
    if (filters.hoaPoa !== "all") count++;
    if (filters.mobileHomeFriendly !== "all") count++;
    if (filters.featuredOnly) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  // Check if price filter is active
  const isPriceActive = filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000;
  
  // Check if size filter is active
  const isSizeActive = filters.acreRange[0] > 0 || filters.acreRange[1] < 1000 || 
                       filters.sqftRange[0] > 0 || filters.sqftRange[1] < 500000;

  return (
    <Card className="w-full bg-white shadow-sm border-[#324c48]/20">
      <CardContent className="p-4">
        {/* Single Row Header with Filter Icon, Buttons, Results, and Clear */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Left Side: Filter Icon + Buttons */}
          <div className="flex items-center gap-2">
            {/* Filter Icon */}
            <Filter className="w-4 h-4 text-[#324c48] flex-shrink-0" />
            
            {/* Price Button */}
            <Button
              variant={isPriceOpen ? "default" : "outline"}
              onClick={() => {
                setIsPriceOpen(!isPriceOpen);
                setIsSizeOpen(false);
                setIsAdvancedOpen(false);
              }}
              className={`h-9 text-sm ${
                isPriceOpen 
                  ? "bg-[#324c48] text-white hover:bg-[#3f4f24]" 
                  : isPriceActive
                  ? "border-[#3f4f24] text-[#3f4f24] bg-[#3f4f24]/5"
                  : "border-[#324c48]/30 text-[#324c48] hover:bg-[#f6ece0]"
              }`}
            >
              <DollarSign className="w-4 h-4 mr-1.5" />
              Price
              {isPriceActive && !isPriceOpen && (
                <Badge variant="secondary" className="ml-2 bg-[#3f4f24] text-white text-xs h-4 px-1">
                  ✓
                </Badge>
              )}
            </Button>

            {/* Size Button */}
            <Button
              variant={isSizeOpen ? "default" : "outline"}
              onClick={() => {
                setIsSizeOpen(!isSizeOpen);
                setIsPriceOpen(false);
                setIsAdvancedOpen(false);
              }}
              className={`h-9 text-sm ${
                isSizeOpen 
                  ? "bg-[#324c48] text-white hover:bg-[#3f4f24]" 
                  : isSizeActive
                  ? "border-[#3f4f24] text-[#3f4f24] bg-[#3f4f24]/5"
                  : "border-[#324c48]/30 text-[#324c48] hover:bg-[#f6ece0]"
              }`}
            >
              <Maximize2 className="w-4 h-4 mr-1.5" />
              Size
              {isSizeActive && !isSizeOpen && (
                <Badge variant="secondary" className="ml-2 bg-[#3f4f24] text-white text-xs h-4 px-1">
                  ✓
                </Badge>
              )}
            </Button>

            {/* More Filters Button */}
            <Button
              variant={isAdvancedOpen ? "default" : "outline"}
              onClick={() => {
                setIsAdvancedOpen(!isAdvancedOpen);
                setIsPriceOpen(false);
                setIsSizeOpen(false);
              }}
              className={`h-9 text-sm ${
                isAdvancedOpen 
                  ? "bg-[#324c48] text-white hover:bg-[#3f4f24]" 
                  : activeFilterCount > (isPriceActive ? 1 : 0) + (isSizeActive ? 1 : 0)
                  ? "border-[#3f4f24] text-[#3f4f24] bg-[#3f4f24]/5"
                  : "border-[#324c48]/30 text-[#324c48] hover:bg-[#f6ece0]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              More Filters
              {activeFilterCount > (isPriceActive ? 1 : 0) + (isSizeActive ? 1 : 0) && !isAdvancedOpen && (
                <Badge variant="secondary" className="ml-2 bg-[#3f4f24] text-white text-xs h-4 px-1">
                  {activeFilterCount - (isPriceActive ? 1 : 0) - (isSizeActive ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Right Side: Results Count + Clear Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-[#324c48] whitespace-nowrap">
              <span className="font-bold text-[#3f4f24]">{resultsCount}</span> found
            </span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs px-2"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Price Panel */}
        {isPriceOpen && (
          <div className="p-4 bg-[#f6ece0]/30 rounded-lg border border-[#324c48]/20 mb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[#324c48]">Price Range</Label>
                <span className="text-xs text-gray-600">
                  ${formatNumber(filters.priceRange[0])} - ${formatNumber(filters.priceRange[1])}
                </span>
              </div>
              
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                min={0}
                max={10000000}
                step={10000}
                className="w-full"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Min Price</Label>
                  <Input
                    type="text"
                    value={formatNumber(filters.priceRange[0])}
                    onChange={(e) => handlePriceInputChange(e.target.value, true)}
                    className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24]"
                    placeholder="$0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Max Price</Label>
                  <Input
                    type="text"
                    value={formatNumber(filters.priceRange[1])}
                    onChange={(e) => handlePriceInputChange(e.target.value, false)}
                    className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24]"
                    placeholder="$10,000,000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Size Panel */}
        {isSizeOpen && (
          <div className="p-4 bg-[#f6ece0]/30 rounded-lg border border-[#324c48]/20 mb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[#324c48]">Property Size</Label>
                <Tabs value={sizeUnit} onValueChange={setSizeUnit} className="w-auto">
                  <TabsList className="h-8 p-0.5 bg-white border border-[#324c48]/20">
                    <TabsTrigger 
                      value="acres" 
                      className="text-xs h-7 px-3 data-[state=active]:bg-[#3f4f24] data-[state=active]:text-white"
                    >
                      Acres
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sqft" 
                      className="text-xs h-7 px-3 data-[state=active]:bg-[#3f4f24] data-[state=active]:text-white"
                    >
                      Sq Ft
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {sizeUnit === "acres" ? (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-600">
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1">Min Acres</Label>
                      <Input
                        type="number"
                        value={filters.acreRange[0]}
                        onChange={(e) => handleAcreInputChange(e.target.value, true)}
                        className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24]"
                        placeholder="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1">Max Acres</Label>
                      <Input
                        type="number"
                        value={filters.acreRange[1]}
                        onChange={(e) => handleAcreInputChange(e.target.value, false)}
                        className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24]"
                        placeholder="1000"
                        step="0.1"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-600">
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1">Min Sqft</Label>
                      <Input
                        type="text"
                        value={formatNumber(filters.sqftRange[0])}
                        onChange={(e) => handleSqftInputChange(e.target.value, true)}
                        className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1">Max Sqft</Label>
                      <Input
                        type="text"
                        value={formatNumber(filters.sqftRange[1])}
                        onChange={(e) => handleSqftInputChange(e.target.value, false)}
                        className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24]"
                        placeholder="500,000"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {isAdvancedOpen && (
          <div className="p-4 bg-[#f6ece0]/30 rounded-lg border border-[#324c48]/20">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#324c48] mb-3">Advanced Filters</h4>

              {/* Area and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#324c48]">Area</Label>
                  <Select
                    value={filters.area}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, area: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {areas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-[#324c48]">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Plan */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#324c48]">Payment Plan</Label>
                <Select
                  value={filters.financing}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, financing: value }))}
                >
                  <SelectTrigger className="h-9 text-sm border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                    <SelectValue placeholder="All Options" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Options</SelectItem>
                    {financingOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-[#324c48]/20" />

              {/* Location Filters */}
              <div>
                <Label className="text-xs font-bold text-[#324c48] mb-2 block">Location</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">State</Label>
                    <Select
                      value={filters.state}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {states.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">City</Label>
                    <Select
                      value={filters.city}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">County</Label>
                    <Select
                      value={filters.county}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, county: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {counties.map(county => (
                          <SelectItem key={county} value={county}>{county}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#324c48]/20" />

              {/* Property Details */}
              <div>
                <Label className="text-xs font-bold text-[#324c48] mb-2 block">Property Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  {zoningOptions.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs text-[#324c48]">Zoning</Label>
                      <Select
                        value={filters.zoning}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, zoning: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {zoningOptions.map(zoning => (
                            <SelectItem key={zoning} value={zoning}>{zoning}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">Restrictions</Label>
                    <Select
                      value={filters.restrictions}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, restrictions: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {restrictionOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">Mobile Home</Label>
                    <Select
                      value={filters.mobileHomeFriendly}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, mobileHomeFriendly: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Land Type */}
              {landTypes.length > 0 && (
                <>
                  <Separator className="bg-[#324c48]/20" />
                  <div>
                    <Label className="text-xs font-bold text-[#324c48] mb-2 block">Land Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {landTypes.slice(0, 6).map(landType => (
                        <div key={landType} className="flex items-center space-x-1.5">
                          <Checkbox
                            id={`landtype-${landType}`}
                            checked={filters.landTypes.includes(landType)}
                            onCheckedChange={() => handleLandTypeToggle(landType)}
                            className="border-[#324c48]/30 h-3.5 w-3.5"
                          />
                          <Label
                            htmlFor={`landtype-${landType}`}
                            className="text-xs font-normal cursor-pointer leading-none"
                          >
                            {landType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-[#324c48]/20" />

              {/* Utilities */}
              <div>
                <Label className="text-xs font-bold text-[#324c48] mb-2 block">Utilities</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">Water</Label>
                    <Select
                      value={filters.water}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, water: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {utilities.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">Sewer</Label>
                    <Select
                      value={filters.sewer}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sewer: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {utilities.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">Electric</Label>
                    <Select
                      value={filters.electric}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, electric: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {utilities.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#324c48]/20" />

              {/* Additional Filters */}
              <div>
                <Label className="text-xs font-bold text-[#324c48] mb-2 block">Additional</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">Road</Label>
                    <Select
                      value={filters.roadCondition}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, roadCondition: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
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
                    <Label className="text-xs text-[#324c48]">Floodplain</Label>
                    <Select
                      value={filters.floodplain}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, floodplain: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
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

                  <div className="space-y-1">
                    <Label className="text-xs text-[#324c48]">HOA/POA</Label>
                    <Select
                      value={filters.hoaPoa}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, hoaPoa: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs border-[#324c48]/30 focus:border-[#3f4f24] bg-white">
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

              {/* Featured Only */}
              <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <Checkbox
                  id="featured-only"
                  checked={filters.featuredOnly}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, featuredOnly: checked }))
                  }
                  className="border-[#324c48]/30 h-3.5 w-3.5"
                />
                <Label
                  htmlFor="featured-only"
                  className="text-xs font-semibold cursor-pointer text-[#324c48] leading-none"
                >
                  Show Featured Properties Only
                </Label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};