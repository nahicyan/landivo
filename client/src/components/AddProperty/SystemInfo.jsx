// client/src/components/AddProperty/SystemInfo.jsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import UserSubmit from "@/components/AddProperty/UserSubmit"; 
import { Plus, X, ChevronDown } from "lucide-react";
import axios from "axios";

export default function SystemInfoCard({ formData, handleChange }) {
  const [propertyRows, setPropertyRows] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  
  // State for managing property rows
  const [selectedRowEntries, setSelectedRowEntries] = useState([]);
  const [currentRowSelection, setCurrentRowSelection] = useState({
    rowId: "",
    rowName: "",
    position: 0
  });

  // State for row properties (to show in dropdown)
  const [rowProperties, setRowProperties] = useState([]);
  const [loadingRowProperties, setLoadingRowProperties] = useState(false);

  // Fetch all property rows when component mounts
  useEffect(() => {
    fetchPropertyRows();
  }, []);

  const fetchPropertyRows = async () => {
    setIsLoadingRows(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows`);
      setPropertyRows(response.data || []);
    } catch (error) {
      console.error("Error fetching property rows:", error);
    } finally {
      setIsLoadingRows(false);
    }
  };

  // Fetch properties in the selected row to show position options
  const fetchRowProperties = async (rowId) => {
    if (!rowId) return;
    
    setLoadingRowProperties(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows/${rowId}`);
      
      if (response.data && response.data.propertyDetails) {
        setRowProperties(response.data.propertyDetails);
      } else {
        setRowProperties([]);
      }
    } catch (error) {
      console.error("Error fetching row properties:", error);
      setRowProperties([]);
    } finally {
      setLoadingRowProperties(false);
    }
  };

  // Handle row selection
  const handleRowSelect = (rowId) => {
    // Find the row name
    const selectedRow = propertyRows.find(row => row.id === rowId);
    const rowName = selectedRow ? (selectedRow.name || selectedRow.rowType || "Unnamed Row") : "";
    
    setCurrentRowSelection({
      ...currentRowSelection,
      rowId,
      rowName
    });
    
    // Fetch properties in this row
    fetchRowProperties(rowId);
  };

  // Add current row selection to the list
  const addRowToSelection = () => {
    if (!currentRowSelection.rowId) return;
    
    // Check if row already exists
    const exists = selectedRowEntries.some(entry => entry.rowId === currentRowSelection.rowId);
    
    if (!exists) {
      const newEntry = {
        ...currentRowSelection
      };
      
      setSelectedRowEntries(prev => [...prev, newEntry]);
      
      // Update the form data with selected rows
      updateFormDataWithRows([...selectedRowEntries, newEntry]);
    }
    
    // Reset selection
    setCurrentRowSelection({
      rowId: "",
      rowName: "",
      position: 0
    });
  };

  // Remove a row from selection
  const removeRowFromSelection = (rowId) => {
    const updatedEntries = selectedRowEntries.filter(entry => entry.rowId !== rowId);
    setSelectedRowEntries(updatedEntries);
    
    // Update form data
    updateFormDataWithRows(updatedEntries);
  };

  // Update form data with selected rows - FIXED VERSION WITH JSON.stringify
  const updateFormDataWithRows = (entries) => {
    handleChange({
      target: {
        name: "propertyRows",
        value: JSON.stringify(entries) // Properly stringify the array
      }
    });
  };

  // Format property address for display
  const formatPropertyAddress = (property) => {
    if (!property) return "Unknown Address";
    
    let address = property.streetAddress || "";
    if (property.city) address += property.city ? `, ${property.city}` : "";
    if (property.state) address += property.state ? `, ${property.state}` : "";
    if (property.zip) address += property.zip ? ` - ${property.zip}` : "";
    
    return address || "Unknown Address";
  };

  return (
    <Card className="mb-6 shadow-sm border border-gray-200 w-full">
      <CardHeader>
        <CardTitle>System Information</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Please fill out the following details.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Display the authenticated user information */}
        <UserSubmit />

        {/* Owner ID */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="ownerId" className="text-gray-700 font-semibold">
            Owner ID
          </Label>
          <Input
            id="ownerId"
            name="ownerId"
            value={formData.ownerId}
            onChange={handleChange}
            placeholder="Enter Owner ID"
          />
        </div>

        {/* Area Selection */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="area" className="text-gray-700 font-semibold">
            Area
          </Label>
          <Select
            name="area"
            value={formData.area}
            onValueChange={(value) => handleChange({ target: { name: "area", value } })}
          >
            <SelectTrigger className="w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]">
              <SelectValue placeholder="Select Area" />
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

        {/* Status Selection */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="status" className="text-gray-700 font-semibold">
            Status
          </Label>
          <Select
            name="status"
            value={formData.status}
            onValueChange={(value) => handleChange({ target: { name: "status", value } })}
          >
            <SelectTrigger className="w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
              <SelectItem value="Not Available">Not Available</SelectItem>
              <SelectItem value="Testing">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured Selection */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="featured" className="text-gray-700 font-semibold">
            Featured
          </Label>
          <Select
            name="featured"
            value={formData.featured}
            onValueChange={(value) => handleChange({ target: { name: "featured", value } })}
          >
            <SelectTrigger className="w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]">
              <SelectValue placeholder="Select Featured Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Featured">Featured</SelectItem>
              <SelectItem value="Not Featured">Not Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add to Featured Lists button - Only show if property is featured */}
        {formData.featured === "Featured" && (
          <div className="pt-2">
            <Button 
              type="button" 
              onClick={() => setShowFeaturedDialog(true)}
              className="w-full bg-[#324c48] hover:bg-[#3f4f24] text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Add to Featured Lists
            </Button>
            
            {/* Show selected rows */}
            {selectedRowEntries.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-gray-700">Selected Featured Lists:</Label>
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
      </CardContent>

      {/* Featured Lists Dialog */}
      <Dialog open={showFeaturedDialog} onOpenChange={setShowFeaturedDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add to Featured Lists</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Row Selection */}
            <div className="space-y-2">
              <Label htmlFor="row-list">Featured List</Label>
              <Select
                value={currentRowSelection.rowId}
                onValueChange={handleRowSelect}
                disabled={isLoadingRows}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingRows ? "Loading lists..." : "Select a list"} />
                </SelectTrigger>
                <SelectContent>
                  {propertyRows.map(row => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name || row.rowType || "Unnamed Row"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Position Selection - FIXED to show "Before" instead of "After" */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={currentRowSelection.position?.toString()}
                onValueChange={(value) => setCurrentRowSelection(prev => ({
                  ...prev,
                  position: parseInt(value, 10)
                }))}
                disabled={!currentRowSelection.rowId || loadingRowProperties}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingRowProperties ? "Loading..." : "Select position"} />
                </SelectTrigger>
                <SelectContent>
                  {/* Show positions with "Before" text instead of "After" */}
                  {[...Array(rowProperties.length + 1)].map((_, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {index + 1}. {index < rowProperties.length ? 
                        `Before ${formatPropertyAddress(rowProperties[index])}` : 
                        "End of list"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Properties in selected row - UPDATED to show address instead of title */}
          {currentRowSelection.rowId && rowProperties.length > 0 && (
            <div className="py-2">
              <h4 className="text-sm font-medium mb-2">Current Properties in List:</h4>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1">
                {rowProperties.map((property, index) => (
                  <div key={property.id} className="text-sm py-1 border-b last:border-0">
                    <span className="font-medium">{index + 1}. {formatPropertyAddress(property)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setShowFeaturedDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={addRowToSelection}
              disabled={!currentRowSelection.rowId}
              className="bg-[#324c48] hover:bg-[#3f4f24]"
            >
              Add to List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}