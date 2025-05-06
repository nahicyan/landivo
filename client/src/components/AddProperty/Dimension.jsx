"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, CheckSquare } from "lucide-react";

export default function Dimension({ formData, handleChange, setFormData }) {
  const [isAcreEditable, setIsAcreEditable] = useState(false);

  const toggleAcreEdit = () => {
    setIsAcreEditable(!isAcreEditable);
  };

  // Direct update function that bypasses formatting restrictions
  const handleAcreDirectChange = (e) => {
    const { name, value } = e.target;
    // Allow direct editing of the acre field
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
            Square Footage (sqft)
          </Label>
          <Input
            type="text"
            placeholder="Enter square footage"
            name="sqft"
            value={formData.sqft}
            onChange={handleChange}
            className="w-full border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the total square footage of the property.
          </p>
        </div>

        {/* Acreage (Conditionally Editable) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label className="text-base font-semibold text-gray-700">Acre</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {isAcreEditable ? "Override" : "Auto"}
              </span>
              <Button 
                type="button"
                onClick={toggleAcreEdit} 
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-[#D4A017] h-8 w-8 p-0"
                title={isAcreEditable ? "Return to auto-calculation" : "Edit manually"}
              >
                {isAcreEditable ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Edit className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={isAcreEditable ? "Enter acreage (e.g. 1.25)" : "Auto-calculated Acre"}
            name="acre"
            value={formData.acre}
            onChange={isAcreEditable ? handleAcreDirectChange : handleChange}
            readOnly={!isAcreEditable}
            className={`w-full border-gray-300 ${
              isAcreEditable 
                ? "focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]" 
                : "bg-gray-100"
            } rounded-md`}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isAcreEditable 
              ? "Manually enter the acreage value (decimal values allowed, e.g. 1.25)" 
              : "This value is auto-calculated based on square footage."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}