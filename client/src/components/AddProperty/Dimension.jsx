"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dimension({ formData, handleChange, setFormData, setRawValues, errors }) {
  // Add local state to track the current raw input
  const [localAcre, setLocalAcre] = useState(formData.acre || "");
  const [localSqft, setLocalSqft] = useState(formData.sqft || "");
  
  // Update local values when formData changes from outside
  useEffect(() => {
    setLocalAcre(formData.acre || "");
    setLocalSqft(formData.sqft || "");
  }, [formData.acre, formData.sqft]);

  // Handle sqft input changes
  const handleSqftChange = (e) => {
    const value = e.target.value;
    setLocalSqft(value);
    
    // Remove commas from input value
    const rawValue = value.replace(/,/g, "");
    
    if (rawValue === "") {
      setFormData(prev => ({
        ...prev,
        sqft: "",
        acre: ""
      }));
      // Update rawValues if provided (for EditProperty)
      if (setRawValues) {
        setRawValues(prev => ({
          ...prev,
          sqft: null,
          acre: null
        }));
      }
    } else {
      const sqftValue = parseFloat(rawValue);
      if (!isNaN(sqftValue)) {
        const acreValue = sqftValue / 43560;
        
        // Format with commas for display
        setFormData(prev => ({
          ...prev,
          sqft: sqftValue.toLocaleString("en-US"),
          acre: acreValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        }));
        
        // Update rawValues if provided (for EditProperty)
        if (setRawValues) {
          setRawValues(prev => ({
            ...prev,
            sqft: sqftValue.toString(),
            acre: acreValue.toFixed(2)
          }));
        }
      }
    }
  };

  // Handle acre input changes
  const handleAcreChange = (e) => {
    const value = e.target.value;
    // Just update the local state first without conversion
    setLocalAcre(value);
  };
  
  // Handle onBlur for acre to convert to sqft only after the user finishes typing
  const handleAcreBlur = () => {
    const rawValue = localAcre.replace(/,/g, "");
    
    if (rawValue === "") {
      setFormData(prev => ({
        ...prev,
        sqft: "",
        acre: ""
      }));
      // Update rawValues if provided (for EditProperty)
      if (setRawValues) {
        setRawValues(prev => ({
          ...prev,
          sqft: null,
          acre: null
        }));
      }
    } else {
      const acreValue = parseFloat(rawValue);
      if (!isNaN(acreValue)) {
        // Convert acre to sqft (1 acre = 43,560 sqft)
        const sqftValue = Math.round(acreValue * 43560);
        
        // Format with commas
        setFormData(prev => ({
          ...prev,
          sqft: sqftValue.toLocaleString("en-US"),
          acre: acreValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        }));
        
        // Update rawValues if provided (for EditProperty)
        if (setRawValues) {
          setRawValues(prev => ({
            ...prev,
            sqft: sqftValue.toString(),
            acre: acreValue.toFixed(2)
          }));
        }
      }
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Property Size & Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Square Footage */}
        <div>
          <Label className="text-base font-semibold text-gray-700">
            Square Footage (sqft) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder="Enter square footage"
            name="sqft"
            value={localSqft}
            onChange={handleSqftChange}
            className={`w-full border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-md ${
              errors.sqft ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
            }`}
          />
          {errors.sqft && (
            <p className="text-red-500 text-xs mt-1">{errors.sqft}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Enter the total square footage of the property.
          </p>
        </div>

        {/* Acreage (Now Editable) */}
        <div>
          <Label className="text-base font-semibold text-gray-700">Acre</Label>
          <Input
            type="text"
            placeholder="Enter acreage"
            name="acre"
            value={localAcre}
            onChange={handleAcreChange}
            onBlur={handleAcreBlur}
            className="w-full border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter acreage or it will be calculated from square footage (1 acre = 43,560 sqft).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}