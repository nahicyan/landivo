// client/src/components/PropertyManagement/QuickEditSections/StatusSection.jsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function StatusSection({ watch, setValue }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="h-4 w-4 rounded-full p-0" />
        <h3 className="text-sm font-medium text-gray-500">Status & Visibility</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Property Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(value) => setValue("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Incomplete">Incomplete</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
              <SelectItem value="Not Available">Not Available</SelectItem>
              <SelectItem value="Testing">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="financing">Financing Available</Label>
          <Select
            value={watch("financing")}
            onValueChange={(value) => setValue("financing", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select financing option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Not-Available">Not Available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Separator />
    </div>
  );
}