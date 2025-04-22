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
import UserSubmit from "@/components/AddProperty/UserSubmit"; 
import axios from "axios";

export default function SystemInfoCard({ formData, handleChange }) {
  const [featuredPositionOptions, setFeaturedPositionOptions] = useState([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Function to format property address properly
  const formatPropertyAddress = (property) => {
    if (!property.streetAddress) return "Unknown Address";
    
    let address = property.streetAddress;
    if (property.city) address += `, ${property.city}`;
    if (property.state) address += `, ${property.state}`;
    if (property.zip) address += ` - ${property.zip}`;
    
    return address;
  };

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
      </CardContent>
    </Card>
  );
}