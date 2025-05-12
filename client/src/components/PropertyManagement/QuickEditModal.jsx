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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "@/components/RichTextEditor/RichTextEditor";
import { 
  Loader2, 
  DollarSign, 
  Home, 
  MapPin, 
  FileText,
  Star,
  Zap,
  Plus,
  X,
  ChevronDown
} from "lucide-react";

export function QuickEditModal({ property, isOpen, onClose, onSave }) {
  // Property rows state
  const [propertyRows, setPropertyRows] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  const [loadingPropertyRows, setLoadingPropertyRows] = useState(false);
  
  // State for managing property rows
  const [selectedRowEntries, setSelectedRowEntries] = useState([]);
  const [currentRowSelection, setCurrentRowSelection] = useState({
    rowId: "",
    rowName: "",
    position: 0
  });

  // State for row properties
  const [rowProperties, setRowProperties] = useState([]);
  const [allRowProperties, setAllRowProperties] = useState([]);
  const [loadingRowProperties, setLoadingRowProperties] = useState(false);
  
  // Rich text states
  const [titleValue, setTitleValue] = useState(property.title || "");
  const [descriptionValue, setDescriptionValue] = useState(property.description || "");
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: property.title || "",
      description: property.description || "",
      status: property.status || "Available",
      area: property.area || "",
      askingPrice: property.askingPrice || "",
      minPrice: property.minPrice || "",
      disPrice: property.disPrice || "",
      financing: property.financing || "Not-Available",
      featured: property.featured === "Yes" || property.featured === "Featured",
      hoaPoa: property.hoaPoa || "No",
      water: property.water || "",
      sewer: property.sewer || "",
      electric: property.electric || "",
      propertyRows: property.propertyRows || "",
    },
  });
  
  // Watch featured state
  const isFeatured = watch("featured");
  const hoaPoa = watch("hoaPoa");

  // Fetch all property rows when component mounts
  useEffect(() => {
    fetchPropertyRows();
  }, []);
  
  // If we're editing a property, load its existing row associations
  useEffect(() => {
    if (property.id) {
      fetchPropertyRowAssociations(property.id);
    }
  }, [property.id]);

  // Reset form when property changes
  useEffect(() => {
    if (property) {
      setTitleValue(property.title || "");
      setDescriptionValue(property.description || "");
      reset({
        title: property.title || "",
        description: property.description || "",
        status: property.status || "Available",
        area: property.area || "",
        askingPrice: property.askingPrice || "",
        minPrice: property.minPrice || "",
        disPrice: property.disPrice || "",
        financing: property.financing || "Not-Available",
        featured: property.featured === "Yes" || property.featured === "Featured",
        hoaPoa: property.hoaPoa || "No",
        water: property.water || "",
        sewer: property.sewer || "",
        electric: property.electric || "",
        propertyRows: property.propertyRows || "",
      });
    }
  }, [property, reset]);

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
  
  const fetchPropertyRowAssociations = async (propertyId) => {
    if (!propertyId) return;
    
    setLoadingPropertyRows(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows`);
      const rows = response.data || [];
      
      const propertyAssociations = [];
      
      for (const row of rows) {
        if (row.displayOrder && Array.isArray(row.displayOrder) && row.displayOrder.includes(propertyId)) {
          propertyAssociations.push({
            rowId: row.id,
            rowName: row.name || row.rowType || "Unnamed Row",
            position: row.displayOrder.indexOf(propertyId)
          });
        }
      }
      
      setSelectedRowEntries(propertyAssociations);
      
      if (propertyAssociations.length > 0) {
        updateFormDataWithRows(propertyAssociations);
      }
      
    } catch (error) {
      console.error("Error fetching property row associations:", error);
    } finally {
      setLoadingPropertyRows(false);
    }
  };

  const fetchRowProperties = async (rowId) => {
    if (!rowId) return;
    
    setLoadingRowProperties(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows/${rowId}`);
      
      if (response.data && response.data.propertyDetails) {
        const allProperties = response.data.propertyDetails || [];
        setAllRowProperties(allProperties);
        
        let filteredProperties = allProperties;
        if (property.id) {
          filteredProperties = allProperties.filter(p => p.id !== property.id);
        }
        
        setRowProperties(filteredProperties);
      } else {
        setRowProperties([]);
        setAllRowProperties([]);
      }
    } catch (error) {
      console.error("Error fetching row properties:", error);
      setRowProperties([]);
      setAllRowProperties([]);
    } finally {
      setLoadingRowProperties(false);
    }
  };

  const handleRowSelect = (rowId) => {
    const selectedRow = propertyRows.find(row => row.id === rowId);
    const rowName = selectedRow ? (selectedRow.name || selectedRow.rowType || "Unnamed Row") : "";
    
    const existingEntry = selectedRowEntries.find(entry => entry.rowId === rowId);
    
    setCurrentRowSelection({
      ...currentRowSelection,
      rowId,
      rowName,
      position: existingEntry ? existingEntry.position : 0
    });
    
    fetchRowProperties(rowId);
  };

  const addRowToSelection = () => {
    if (!currentRowSelection.rowId) return;
    
    const exists = selectedRowEntries.some(entry => entry.rowId === currentRowSelection.rowId);
    
    if (exists) {
      const updatedEntries = selectedRowEntries.map(entry => 
        entry.rowId === currentRowSelection.rowId 
          ? { ...entry, position: currentRowSelection.position }
          : entry
      );
      setSelectedRowEntries(updatedEntries);
      updateFormDataWithRows(updatedEntries);
    } else {
      const newEntry = { ...currentRowSelection };
      const updatedEntries = [...selectedRowEntries, newEntry];
      setSelectedRowEntries(updatedEntries);
      updateFormDataWithRows(updatedEntries);
    }
    
    setShowFeaturedDialog(false);
    
    setCurrentRowSelection({
      rowId: "",
      rowName: "",
      position: 0
    });
  };

  const removeRowFromSelection = (rowId) => {
    if (!rowId || !selectedRowEntries.some(entry => entry.rowId === rowId)) {
      return;
    }
    
    const updatedEntries = selectedRowEntries.filter(entry => entry.rowId !== rowId);
    setSelectedRowEntries(updatedEntries);
    updateFormDataWithRows(updatedEntries);
  };

  const updateFormDataWithRows = (entries) => {
    const dataToStore = Array.isArray(entries) ? entries : [];
    
    const cleanedEntries = dataToStore.map(entry => ({
      rowId: entry.rowId,
      rowName: entry.rowName,
      position: entry.position
    }));
    
    const jsonString = JSON.stringify(cleanedEntries);
    setValue("propertyRows", jsonString);
  };

  const formatPropertyAddress = (property) => {
    if (!property) return "Unknown Address";
    
    let address = property.streetAddress || "";
    if (property.city) address += `, ${property.city}`;
    if (property.state && property.zip) address += `, ${property.state}-${property.zip}`;
    else if (property.state) address += `, ${property.state}`;
    else if (property.zip) address += `, ${property.zip}`;
    
    return address || "Unknown Address";
  };

  const generatePositionOptions = () => {
    if (rowProperties.length === 0) {
      return [
        <SelectItem key={0} value="0">
          1. First position
        </SelectItem>
      ];
    }

    const beforeOptions = rowProperties.map((property, index) => (
      <SelectItem key={index} value={index.toString()}>
        {index + 1}. Before {formatPropertyAddress(property)}
      </SelectItem>
    ));

    beforeOptions.push(
      <SelectItem key={rowProperties.length} value={rowProperties.length.toString()}>
        {rowProperties.length + 1}. End of list
      </SelectItem>
    );

    return beforeOptions;
  };

  const handleFeaturedChange = (checked) => {
    setValue("featured", checked);
    
    if (checked) {
      // Fetch property rows when featured is enabled
      fetchPropertyRows();
    } else {
      // Clear selected rows when featured is disabled
      setSelectedRowEntries([]);
      setValue("propertyRows", "");
    }
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePriceChange = (field) => (e) => {
    const value = e.target.value.replace(/,/g, "");
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setValue(field, formatPrice(value));
    }
  };

  const onSubmit = async (data) => {
    try {
      // Create form data object
      const formData = new FormData();
      
      // Add basic fields
      formData.append("title", titleValue);
      formData.append("description", descriptionValue);
      formData.append("status", data.status);
      formData.append("area", data.area);
      formData.append("financing", data.financing);
      formData.append("hoaPoa", data.hoaPoa);
      formData.append("water", data.water);
      formData.append("sewer", data.sewer);
      formData.append("electric", data.electric);
      
      // Handle prices
      if (data.askingPrice) {
        formData.append("askingPrice", data.askingPrice.toString().replace(/,/g, ""));
      }
      if (data.minPrice) {
        formData.append("minPrice", data.minPrice.toString().replace(/,/g, ""));
      }
      if (data.disPrice) {
        formData.append("disPrice", data.disPrice.toString().replace(/,/g, ""));
      }
      
      // Handle featured status
      formData.append("featured", data.featured ? "Featured" : "Not Featured");
      
      // Handle property rows
      if (selectedRowEntries.length > 0) {
        formData.append("propertyRows", JSON.stringify(selectedRowEntries));
      }

      await updateProperty(property.id, formData);
      
      toast.success("Property updated successfully!");
      onSave({
        ...data,
        title: titleValue,
        description: descriptionValue,
        propertyRows: selectedRowEntries
      });
      onClose();
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#D4A017]" />
            Quick Edit Property
          </DialogTitle>
          <DialogDescription>
            Quickly update the most common property fields
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Basic Information */}
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
          </div>

          <Separator />

          {/* Status */}
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
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
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
          </div>

          <Separator />

          {/* Pricing */}
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
          </div>

          <Separator />

          {/* Featured Settings */}
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
                
                {loadingPropertyRows && (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-5 w-5 text-[#324c48] animate-spin mr-2" />
                    <span>Loading property lists...</span>
                  </div>
                )}
                
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
          </div>

          <Separator />

          {/* Quick Utilities */}
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
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={isSubmitting}
            className="bg-[#324c48] hover:bg-[#3f4f24] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Property"
            )}
          </Button>
        </DialogFooter>

        {/* Featured Lists Dialog */}
        <Dialog open={showFeaturedDialog} onOpenChange={setShowFeaturedDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add to Featured Lists</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
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
                    {generatePositionOptions()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
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
            
            {currentRowSelection.rowId && (
              <div className="py-2">
                {selectedRowEntries.some(entry => entry.rowId === currentRowSelection.rowId) ? (
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      This property is already in this list. Adding again will update its position.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Adding the property to this list at the selected position.
                    </p>
                  </div>
                )}
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
                {selectedRowEntries.some(entry => entry.rowId === currentRowSelection.rowId) ? 
                  "Update Position" : "Add to List"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}