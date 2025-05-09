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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import UserSubmit from "@/components/AddProperty/UserSubmit"; 
import axios from "axios";

export default function SystemInfoCard({ formData, handleChange, errors }) {
  const [featuredPositionOptions, setFeaturedPositionOptions] = useState([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [propertyRows, setPropertyRows] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  
  // New state for handling multiple row selections
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentRowSelection, setCurrentRowSelection] = useState({
    rowId: "",
    position: 0
  });

  // Function to format property address properly
  const formatPropertyAddress = (property) => {
    if (!property.streetAddress) return "Unknown Address";
    
    let address = property.streetAddress;
    if (property.city) address += `, ${property.city}`;
    if (property.state) address += `, ${property.state}`;
    if (property.zip) address += ` - ${property.zip}`;
    
    return address;
  };

  // Fetch all property rows when component mounts
  useEffect(() => {
    const fetchPropertyRows = async () => {
      setIsLoadingRows(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows`);
        setPropertyRows(response.data);
      } catch (error) {
        console.error("Error fetching property rows:", error);
      } finally {
        setIsLoadingRows(false);
      }
    };

    fetchPropertyRows();
  }, []);

  // Fetch featured property row when component mounts
  useEffect(() => {
    const fetchFeaturedRow = async () => {
      if (formData.featured !== "Featured") return;
      
      setIsLoadingPositions(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows?rowType=featured`);
        
        if (response.data && response.data.propertyDetails) {
          // Create options with position numbers and property addresses
          const options = response.data.propertyDetails.map((property, index) => ({
            position: index,
            label: `${index + 1}. ${formatPropertyAddress(property)}`,
            propertyId: property.id
          }));
          
          // Add an option for the end of the list
          options.push({
            position: options.length,
            label: `${options.length + 1}. End of list`,
            propertyId: null
          });
          
          setFeaturedPositionOptions(options);
        } else {
          // If no featured row exists yet, just offer position 1
          setFeaturedPositionOptions([
            { position: 0, label: "1. First featured property", propertyId: null }
          ]);
        }
      } catch (error) {
        console.error("Error fetching featured property row:", error);
        setFeaturedPositionOptions([
          { position: 0, label: "1. First featured property", propertyId: null }
        ]);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    fetchFeaturedRow();
  }, [formData.featured]);

  // Handle when featured status changes
  const handleFeaturedChange = (value) => {
    handleChange({ target: { name: "featured", value } });
    
    // If changing to featured, fetch position options
    if (value === "Featured") {
      const fetchFeaturedRow = async () => {
        setIsLoadingPositions(true);
        try {
          const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows?rowType=featured`);
          
          if (response.data && response.data.propertyDetails) {
            // Create options with position numbers and property addresses
            const options = response.data.propertyDetails.map((property, index) => ({
              position: index,
              label: `${index + 1}. ${formatPropertyAddress(property)}`,
              propertyId: property.id
            }));
            
            // Add an option for the end of the list
            options.push({
              position: options.length,
              label: `${options.length + 1}. End of list`,
              propertyId: null
            });
            
            setFeaturedPositionOptions(options);
          } else {
            // If no featured row exists yet, just offer position 1
            setFeaturedPositionOptions([
              { position: 0, label: "1. First featured property", propertyId: null }
            ]);
          }
        } catch (error) {
          console.error("Error fetching featured property row:", error);
          setFeaturedPositionOptions([
            { position: 0, label: "1. First featured property", propertyId: null }
          ]);
        } finally {
          setIsLoadingPositions(false);
        }
      };
      
      fetchFeaturedRow();
    }
  };

  // Handle when a row is selected
  const handleRowSelection = (rowId) => {
    setCurrentRowSelection(prev => ({ ...prev, rowId }));
    
    // Fetch position options for the selected row
    if (rowId) {
      fetchPositionOptions(rowId);
    }
  };

  // Fetch position options for a selected row
  const fetchPositionOptions = async (rowId) => {
    setIsLoadingRows(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows/${rowId}`);
      
      if (response.data && response.data.displayOrder) {
        // Reset position to 0 (first position)
        setCurrentRowSelection(prev => ({ ...prev, position: 0 }));
      }
    } catch (error) {
      console.error("Error fetching row details:", error);
    } finally {
      setIsLoadingRows(false);
    }
  };

  // Add current row selection to the list of selected rows
  const addRowSelection = () => {
    if (!currentRowSelection.rowId) return;
    
    // Find the row details
    const selectedRow = propertyRows.find(row => row.id === currentRowSelection.rowId);
    if (!selectedRow) return;
    
    // Check if this row is already selected
    const existingRowIndex = selectedRows.findIndex(r => r.rowId === currentRowSelection.rowId);
    
    if (existingRowIndex >= 0) {
      // Update existing selection
      const updatedRows = [...selectedRows];
      updatedRows[existingRowIndex] = {
        ...currentRowSelection,
        rowName: selectedRow.name || selectedRow.rowType || "Unknown Row"
      };
      setSelectedRows(updatedRows);
    } else {
      // Add new selection
      setSelectedRows(prev => [...prev, {
        ...currentRowSelection,
        rowName: selectedRow.name || selectedRow.rowType || "Unknown Row"
      }]);
    }
    
    // Reset current selection
    setCurrentRowSelection({
      rowId: "",
      position: 0
    });
    
    // Update form data with the selected rows
    handleChange({
      target: {
        name: "propertyRows",
        value: [...selectedRows, {
          ...currentRowSelection,
          rowName: selectedRow.name || selectedRow.rowType || "Unknown Row"
        }]
      }
    });
  };

  // Remove a row from the selected rows
  const removeRowSelection = (rowId) => {
    const updatedRows = selectedRows.filter(row => row.rowId !== rowId);
    setSelectedRows(updatedRows);
    
    // Update form data
    handleChange({
      target: {
        name: "propertyRows",
        value: updatedRows
      }
    });
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
          <Label htmlFor="ownerId" className={`text-gray-700 font-semibold ${errors.ownerId ? "text-red-500" : ""}`}>
            Owner ID
          </Label>
          <Input
            id="ownerId"
            name="ownerId"
            value={formData.ownerId}
            onChange={handleChange}
            placeholder="Enter Owner ID"
            className={errors.ownerId ? "border-red-500" : ""}
          />
          {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId}</p>}
        </div>

        {/* Area Selection */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="area" className={`text-gray-700 font-semibold ${errors.area ? "text-red-500" : ""}`}>
            Area
          </Label>
          <Select
            name="area"
            value={formData.area}
            onValueChange={(value) => handleChange({ target: { name: "area", value } })}
          >
            <SelectTrigger className={`w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48] ${errors.area ? "border-red-500" : ""}`}>
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
          {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
        </div>

        {/* Status Selection */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="status" className={`text-gray-700 font-semibold ${errors.status ? "text-red-500" : ""}`}>
            Status
          </Label>
          <Select
            name="status"
            value={formData.status}
            onValueChange={(value) => handleChange({ target: { name: "status", value } })}
          >
            <SelectTrigger className={`w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48] ${errors.status ? "border-red-500" : ""}`}>
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
          {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
        </div>

        {/* Featured Selection */}
        <div className="flex flex-col space-y-1">
          <Label htmlFor="featured" className="text-gray-700 font-semibold">
            Featured
          </Label>
          <Select
            name="featured"
            value={formData.featured}
            onValueChange={handleFeaturedChange}
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

        {/* Featured Position Selection - Only show if property is featured */}
        {formData.featured === "Featured" && (
          <div className="flex flex-col space-y-1">
            <Label htmlFor="featuredPosition" className="text-gray-700 font-semibold">
              Featured Position
            </Label>
            <Select
              name="featuredPosition"
              value={formData.featuredPosition !== undefined ? formData.featuredPosition.toString() : ""}
              onValueChange={(value) => handleChange({ target: { name: "featuredPosition", value: parseInt(value, 10) } })}
              disabled={isLoadingPositions}
            >
              <SelectTrigger className="w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]">
                <SelectValue placeholder={isLoadingPositions ? "Loading positions..." : "Select position"} />
              </SelectTrigger>
              <SelectContent>
                {featuredPositionOptions.map((option) => (
                  <SelectItem key={option.position} value={option.position.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Select where this property should appear in the featured properties list.
            </p>
          </div>
        )}

        {/* Property Rows Section */}
        <div className="border rounded-md p-4 space-y-4">
          <h3 className="font-semibold text-[#324c48]">Add to Property Rows</h3>
          
          {/* Display currently selected rows */}
          {selectedRows.length > 0 && (
            <div className="space-y-2 mb-4">
              <Label className="text-gray-700">Selected Rows:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedRows.map((row, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-[#f0f5f4] text-[#324c48] px-3 py-1 rounded-md"
                  >
                    <span className="text-sm">{row.rowName} (Position: {row.position + 1})</span>
                    <button
                      type="button"
                      onClick={() => removeRowSelection(row.rowId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Row selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <Label htmlFor="row-selection" className="text-gray-700">
                Select Row
              </Label>
              <Select
                value={currentRowSelection.rowId}
                onValueChange={handleRowSelection}
                disabled={isLoadingRows}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a row" />
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
            
            <div className="col-span-3 sm:col-span-1">
              <Label htmlFor="position-selection" className="text-gray-700">
                Position
              </Label>
              <Input
                type="number"
                min="0"
                value={currentRowSelection.position}
                onChange={(e) => setCurrentRowSelection(prev => ({ 
                  ...prev, 
                  position: parseInt(e.target.value) || 0 
                }))}
                disabled={!currentRowSelection.rowId || isLoadingRows}
                className="w-full"
              />
            </div>
            
            <div className="col-span-3 sm:col-span-1 flex items-end">
              <Button
                type="button"
                onClick={addRowSelection}
                disabled={!currentRowSelection.rowId || isLoadingRows}
                className="bg-[#324c48] hover:bg-[#3f4f24] w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Add to Row
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}