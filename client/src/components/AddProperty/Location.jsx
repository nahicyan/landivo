"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import AddressAutocomplete from "@/components/AddressAutocomplete/AddressAutocomplete";

export default function Location({ formData, handleChange, setFormData }) {
  // Handle landId selection
  const handleLandIdChange = (value) => {
    setFormData({
      ...formData,
      landId: value === "Available" // true if Available, false if Not Available
    });
  };

  return (
    <Card className="border border-gray-200 shadow-md rounded-lg w-full">
      <CardHeader className="px-4 py-2">
        <CardTitle className="text-xl font-bold text-gray-800">
          Location & Identification
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-2">
        {/* Search Property Box (Autocomplete) */}
        <div className="flex flex-col">
          <AddressAutocomplete formData={formData} setFormData={setFormData} />
        </div>

        {/* Full Row: Street Address (auto-populated but editable) */}
        <div className="flex flex-col">
          <Label htmlFor="streetAddress" className="text-sm font-semibold text-gray-700">
            Street Address
          </Label>
          <Input
            id="streetAddress"
            type="text"
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleChange}
            placeholder="Enter street address"
            className="mt-1"
          />
        </div>

        {/* City & County */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex flex-col">
            <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
              City
            </Label>
            <Input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              className="mt-1"
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="county" className="text-sm font-semibold text-gray-700">
              County
            </Label>
            <Input
              id="county"
              type="text"
              name="county"
              value={formData.county}
              onChange={handleChange}
              placeholder="Enter county"
              className="mt-1"
            />
          </div>
        </div>

        {/* ZIP & State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex flex-col">
            <Label htmlFor="zip" className="text-sm font-semibold text-gray-700">
              ZIP Code
            </Label>
            <Input
              id="zip"
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              placeholder="Enter ZIP code"
              className="mt-1"
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
              State
            </Label>
            <Input
              id="state"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state"
              className="mt-1"
            />
          </div>
        </div>

        {/* Latitude & Longitude (if needed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex flex-col">
            <Label htmlFor="latitude" className="text-sm font-semibold text-gray-700">
              Latitude
            </Label>
            <Input
              id="latitude"
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="Enter latitude"
              className="mt-1"
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="longitude" className="text-sm font-semibold text-gray-700">
              Longitude
            </Label>
            <Input
              id="longitude"
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="Enter longitude"
              className="mt-1"
            />
          </div>
        </div>
        
        {/* Direction Field */}
        <div className="flex flex-col">
          <Label htmlFor="direction" className="text-sm font-semibold text-gray-700">
            Direction
          </Label>
          <Input
            id="direction"
            type="text"
            name="direction"
            value={formData.direction || ""}
            onChange={handleChange}
            placeholder="Enter property direction"
            className="mt-1"
          />
        </div>

        {/* APN or PIN */}
        <div className="flex flex-col">
          <Label htmlFor="apnOrPin" className="text-sm font-semibold text-gray-700">
            APN or PIN
          </Label>
          <Input
            id="apnOrPin"
            type="text"
            name="apnOrPin"
            value={formData.apnOrPin}
            onChange={handleChange}
            placeholder="Enter APN or PIN"
            className="mt-1"
          />
        </div>

        {/* Land ID and Link Field - Side by Side */}
        <div className="sm:grid sm:grid-cols-2 sm:gap-4">
          {/* Land ID dropdown - 50% */}
          <div className="flex flex-col mb-2 sm:mb-0">
            <Label htmlFor="landId" className="text-sm font-semibold text-gray-700 mb-1">
              Land ID Availability
            </Label>
            <Select
              value={formData.landId ? "Available" : "Not Available"}
              onValueChange={handleLandIdChange}
              defaultValue="Not Available"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not Available" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Not Available">Not Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Land ID Link - 50%, only shown when landId is true */}
          {formData.landId && (
            <div className="flex flex-col">
              <Label htmlFor="landIdLink" className="text-sm font-semibold text-gray-700 mb-1">
                Land ID Link
              </Label>
              <Input
                id="landIdLink"
                type="text"
                name="landIdLink"
                value={formData.landIdLink || ""}
                onChange={handleChange}
                placeholder="Enter Land ID Link"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}