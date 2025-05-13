// client/src/components/PropertyManagement/QuickEditSections/PricingSection.jsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DollarSign } from "lucide-react";

export default function PricingSection({ register, errors, handlePriceChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-[#D4A017]" />
        <h3 className="text-sm font-medium text-gray-500">Pricing</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="askingPrice">Asking Price</Label>
          <Input
            id="askingPrice"
            {...register("askingPrice", { 
              required: "Asking price is required",
              onChange: handlePriceChange("askingPrice")
            })}
            placeholder="Enter asking price"
          />
          {errors.askingPrice && (
            <p className="text-sm text-red-500">{errors.askingPrice.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minPrice">Minimum Price</Label>
          <Input
            id="minPrice"
            {...register("minPrice", { 
              required: "Minimum price is required",
              onChange: handlePriceChange("minPrice")
            })}
            placeholder="Enter minimum price"
          />
          {errors.minPrice && (
            <p className="text-sm text-red-500">{errors.minPrice.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="disPrice">Discount Price</Label>
          <Input
            id="disPrice"
            {...register("disPrice", { 
              onChange: handlePriceChange("disPrice")
            })}
            placeholder="Enter discount price"
          />
        </div>
      </div>
      
      <Separator />
    </div>
  );
}