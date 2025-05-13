// client/src/components/PropertyManagement/QuickEditSections/BasicInfoSection.jsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Home } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor/RichTextEditor";

export default function BasicInfoSection({ 
  titleValue, 
  setTitleValue, 
  descriptionValue, 
  setDescriptionValue, 
  watch, 
  setValue, 
  errors 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-[#324c48]" />
        <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Property Title *</Label>
          <RichTextEditor
            value={titleValue}
            onChange={setTitleValue}
            placeholder="Enter property title..."
          />
          {!titleValue && (
            <p className="text-sm text-red-500">Title is required</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <RichTextEditor
            value={descriptionValue}
            onChange={setDescriptionValue}
            placeholder="Enter property description..."
          />
          {!descriptionValue && (
            <p className="text-sm text-red-500">Description is required</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <Select
            value={watch("area")}
            onValueChange={(value) => setValue("area", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DFW">DFW</SelectItem>
              <SelectItem value="Austin">Austin</SelectItem>
              <SelectItem value="Houston">Houston</SelectItem>
              <SelectItem value="San Antonio">San Antonio</SelectItem>
              <SelectItem value="Other Areas">Other Areas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Separator />
    </div>
  );
}