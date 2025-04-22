// client/src/components/PropertyManagement/QuickEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateProperty } from "@/utils/api";
import { toast } from "react-toastify";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function QuickEditModal({ property, isOpen, onClose, onSave }) {
  const [featuredPositionOptions, setFeaturedPositionOptions] = useState([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      title: property.title || "",
      description: property.description || "",
      status: property.status || "Available",
      askingPrice: property.askingPrice || "",
      minPrice: property.minPrice || "",
      financing: property.financing || "Not-Available",
      featured: property.featured === "Yes" || property.featured === "Featured",
      featuredPosition: 0, // Default - will be updated after fetching positions
    },
  });
  
  // Watch featured state to conditionally show featured position
  const isFeatured = watch("featured");

  // Function to format property address properly
  const formatPropertyAddress = (p) => {
    if (!p.streetAddress) return "Unknown Address";
    
    let address = p.streetAddress;
    if (p.city) address += `, ${p.city}`;
    if (p.state) address += `, ${p.state}`;
    if (p.zip) address += ` - ${p.zip}`;
    
    return address;
  };

  // Fetch featured property row when component mounts
  useEffect(() => {
    const fetchFeaturedRow = async () => {
      if (!isFeatured) return;
      
      setIsLoadingPositions(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows?rowType=featured`);
        
        if (response.data && response.data.propertyDetails) {
          // Find current property position
          const currentIndex = response.data.propertyDetails.findIndex(
            p => p.id === property.id
          );
          
          // Create options with position numbers and property addresses
          const options = response.data.propertyDetails.map((p, index) => ({
            position: index,
            label: `${index + 1}. ${p.id === property.id ? '(Current)' : ''} ${formatPropertyAddress(p)}`,
            propertyId: p.id
          }));
          
          // Add an option for the end of the list if property is not already in the list
          if (currentIndex === -1) {
            options.push({
              position: options.length,
              label: `${options.length + 1}. End of list`,
              propertyId: null
            });
          }
          
          setFeaturedPositionOptions(options);
          
          // Set the current position if the property is already in the list
          if (currentIndex !== -1) {
            setValue("featuredPosition", currentIndex);
          } else {
            setValue("featuredPosition", options.length - 1); // End of list
          }
        } else {
          // If no featured row exists yet, just offer position 1
          setFeaturedPositionOptions([
            { position: 0, label: "1. First featured property", propertyId: null }
          ]);
          setValue("featuredPosition", 0);
        }
      } catch (error) {
        console.error("Error fetching featured property row:", error);
        setFeaturedPositionOptions([
          { position: 0, label: "1. First featured property", propertyId: null }
        ]);
        setValue("featuredPosition", 0);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    fetchFeaturedRow();
  }, [isFeatured, property.id, setValue]);

  // Handle featured state change
  const handleFeaturedChange = (checked) => {
    setValue("featured", checked);
    
    if (checked) {
      // Fetch position options when changing to featured
      const fetchFeaturedRow = async () => {
        setIsLoadingPositions(true);
        try {
          const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows?rowType=featured`);
          
          if (response.data && response.data.propertyDetails) {
            // Find current property position
            const currentIndex = response.data.propertyDetails.findIndex(
              p => p.id === property.id
            );
            
            // Create options with position numbers and property addresses
            const options = response.data.propertyDetails.map((p, index) => ({
              position: index,
              label: `${index + 1}. ${p.id === property.id ? '(Current)' : ''} ${formatPropertyAddress(p)}`,
              propertyId: p.id
            }));
            
            // Add an option for the end of the list if property is not already in the list
            if (currentIndex === -1) {
              options.push({
                position: options.length,
                label: `${options.length + 1}. End of list`,
                propertyId: null
              });
            }
            
            setFeaturedPositionOptions(options);
            
            // Set the current position if the property is already in the list
            if (currentIndex !== -1) {
              setValue("featuredPosition", currentIndex);
            } else {
              setValue("featuredPosition", options.length - 1); // End of list
            }
          } else {
            // If no featured row exists yet, just offer position 1
            setFeaturedPositionOptions([
              { position: 0, label: "1. First featured property", propertyId: null }
            ]);
            setValue("featuredPosition", 0);
          }
        } catch (error) {
          console.error("Error fetching featured property row:", error);
          setFeaturedPositionOptions([
            { position: 0, label: "1. First featured property", propertyId: null }
          ]);
          setValue("featuredPosition", 0);
        } finally {
          setIsLoadingPositions(false);
        }
      };
      
      fetchFeaturedRow();
    }
  };

  const onSubmit = async (data) => {
    try {
      // Format data before sending
      const formattedData = {
        ...data,
        askingPrice: parseFloat(data.askingPrice),
        minPrice: parseFloat(data.minPrice),
        featured: data.featured ? "Featured" : "Not Featured",
        // Only include featuredPosition if featured is true
        ...(data.featured && { featuredPosition: parseInt(data.featuredPosition, 10) })
      };

      // Call API to update property
      await updateProperty(property.id, formattedData);
      
      toast.success("Property updated successfully!");
      
      // Close modal and call onSave
      onSave(formattedData);
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property");
    }
  };

  // Add the new Featured Position field to the JSX within the Featured Settings section
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {/* Dialog header remains the same */}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Other form sections remain the same */}

          {/* Featured Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Featured Settings</h3>
            
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
            
            {/* Add Featured Position Selection */}
            {isFeatured && (
              <div className="space-y-2">
                <Label htmlFor="featuredPosition">Featured Position</Label>
                <Select
                  value={watch("featuredPosition")?.toString() || "0"}
                  onValueChange={(value) => setValue("featuredPosition", parseInt(value, 10))}
                  disabled={isLoadingPositions}
                >
                  <SelectTrigger className="w-full">
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
                <p className="text-xs text-gray-500">
                  Select where this property should appear in the featured properties list.
                </p>
              </div>
            )}
          </div>

          {/* Dialog footer remains the same */}
        </form>
      </DialogContent>
    </Dialog>
  );
}