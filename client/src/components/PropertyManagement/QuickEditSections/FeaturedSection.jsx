// client/src/components/PropertyManagement/QuickEditSections/FeaturedSection.jsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Plus, X } from "lucide-react";

export default function FeaturedSection({ 
  isFeatured, 
  setValue, 
  setShowFeaturedDialog, 
  selectedRowEntries, 
  setSelectedRowEntries
}) {
  const handleFeaturedChange = (checked) => {
    setValue("featured", checked);
  };
  
  const removeRowFromSelection = (rowId) => {
    if (!rowId || !selectedRowEntries.some(entry => entry.rowId === rowId)) {
      return;
    }
    
    const updatedEntries = selectedRowEntries.filter(entry => entry.rowId !== rowId);
    setSelectedRowEntries(updatedEntries);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-[#D4A017]" />
        <h3 className="text-sm font-medium text-gray-500">Featured Settings</h3>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="featured">Featured Property</Label>
          <p className="text-sm text-gray-500">Mark this property as featured on the homepage</p>
        </div>
        <Switch
          id="featured"
          checked={isFeatured}
          onCheckedChange={handleFeaturedChange}
        />
      </div>
      
      {isFeatured && (
        <div className="pt-2">
          <Button 
            type="button" 
            onClick={() => setShowFeaturedDialog(true)}
            className="w-full bg-[#324c48] hover:bg-[#3f4f24] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add to Featured Lists
          </Button>
          
          {selectedRowEntries.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-gray-700">Property is in these lists:</Label>
              <div className="space-y-2">
                {selectedRowEntries.map((entry, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-[#f0f5f4] p-2 rounded-md"
                  >
                    <div>
                      <span className="font-medium text-[#324c48]">{entry.rowName}</span>
                      <span className="text-sm text-gray-500 ml-2">- Position: {entry.position + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRowFromSelection(entry.rowId)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Remove from ${entry.rowName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <Separator />
    </div>
  );
}