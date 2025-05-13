// client/src/components/PropertyManagement/QuickEditSections/UtilitiesSection.jsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

export default function UtilitiesSection({ watch, setValue }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#324c48]" />
        <h3 className="text-sm font-medium text-gray-500">Quick Utilities</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hoaPoa">HOA / POA</Label>
          <Select
            value={watch("hoaPoa")}
            onValueChange={(value) => setValue("hoaPoa", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="water">Water</Label>
          <Select
            value={watch("water")}
            onValueChange={(value) => setValue("water", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select water option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Unavailable">Unavailable</SelectItem>
              <SelectItem value="Well Needed">Well Needed</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
              <SelectItem value="Active Well">Active Well</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sewer">Sewer</Label>
          <Select
            value={watch("sewer")}
            onValueChange={(value) => setValue("sewer", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sewer option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Unavailable">Unavailable</SelectItem>
              <SelectItem value="Septic Needed">Septic Needed</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
              <SelectItem value="Active Septic">Active Septic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="electric">Electric</Label>
          <Select
            value={watch("electric")}
            onValueChange={(value) => setValue("electric", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select electric option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Unavailable">Unavailable</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
              <SelectItem value="On Property">On Property</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}