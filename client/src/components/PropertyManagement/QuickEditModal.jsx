// client/src/components/PropertyManagement/QuickEditModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateProperty } from "@/utils/api";
import { toast } from "react-toastify";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Star, ChevronDown } from "lucide-react";

// Sub-components (imported)
import BasicInfoSection from "./QuickEditSections/BasicInfoSection";
import StatusSection from "./QuickEditSections/StatusSection";
import PricingSection from "./QuickEditSections/PricingSection";
import FeaturedSection from "./QuickEditSections/FeaturedSection";
import UtilitiesSection from "./QuickEditSections/UtilitiesSection";
import FeaturedRowsDialog from "./QuickEditSections/FeaturedRowsDialog";

export function QuickEditModal({ property, isOpen, onClose, onSave }) {
  const [titleValue, setTitleValue] = useState(property?.title || "");
  const [descriptionValue, setDescriptionValue] = useState(property?.description || "");
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  const [selectedRowEntries, setSelectedRowEntries] = useState([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: property?.title || "",
      description: property?.description || "",
      status: property?.status || "Available",
      area: property?.area || "",
      askingPrice: property?.askingPrice || "",
      minPrice: property?.minPrice || "",
      disPrice: property?.disPrice || "",
      financing: property?.financing || "Not-Available",
      featured: property?.featured === "Yes" || property?.featured === "Featured",
      hoaPoa: property?.hoaPoa || "No",
      water: property?.water || "",
      sewer: property?.sewer || "",
      electric: property?.electric || "",
      propertyRows: property?.propertyRows || "",
    },
  });
  
  // Watch featured state
  const isFeatured = watch("featured");
  const hoaPoa = watch("hoaPoa");

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
      
      // Load property row associations if any
      fetchPropertyRowAssociations(property.id);
    }
  }, [property, reset]);

  // Fetch property row associations
  const fetchPropertyRowAssociations = async (propertyId) => {
    if (!propertyId) return;
    
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
    }
  };

  // Update form data with rows
  const updateFormDataWithRows = (entries) => {
    const cleanedEntries = Array.isArray(entries) ? entries.map(entry => ({
      rowId: entry.rowId,
      rowName: entry.rowName,
      position: entry.position
    })) : [];
    
    setValue("propertyRows", JSON.stringify(cleanedEntries));
  };

  // Format price with commas
  const formatPrice = (price) => {
    if (!price) return "";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle price changes
  const handlePriceChange = (field) => (e) => {
    const value = e.target.value.replace(/,/g, "");
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setValue(field, formatPrice(value));
    }
  };

  // Handle form submission
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
      
      // CRITICAL FIX: Preserve existing media URLs
      if (property.imageUrls) {
        formData.append("imageUrls", JSON.stringify(property.imageUrls));
      }
      
      if (property.videoUrls) {
        formData.append("videoUrls", JSON.stringify(property.videoUrls));
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
            <Star className="h-5 w-5 text-[#D4A017]" />
            Quick Edit Property
          </DialogTitle>
          <DialogDescription>
            Quickly update the most common property fields
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Basic Information */}
          <BasicInfoSection 
            titleValue={titleValue}
            setTitleValue={setTitleValue}
            descriptionValue={descriptionValue}
            setDescriptionValue={setDescriptionValue}
            watch={watch}
            setValue={setValue}
            register={register}
            errors={errors}
          />

          {/* Status */}
          <StatusSection 
            watch={watch}
            setValue={setValue}
          />

          {/* Pricing */}
          <PricingSection 
            register={register}
            errors={errors}
            handlePriceChange={handlePriceChange}
          />

          {/* Featured Settings */}
          <FeaturedSection 
            isFeatured={isFeatured}
            setValue={setValue}
            setShowFeaturedDialog={setShowFeaturedDialog}
            selectedRowEntries={selectedRowEntries}
            setSelectedRowEntries={setSelectedRowEntries}
          />

          {/* Quick Utilities */}
          <UtilitiesSection 
            watch={watch}
            setValue={setValue}
          />
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
        <FeaturedRowsDialog 
          showFeaturedDialog={showFeaturedDialog}
          setShowFeaturedDialog={setShowFeaturedDialog}
          selectedRowEntries={selectedRowEntries}
          setSelectedRowEntries={setSelectedRowEntries}
          updateFormDataWithRows={updateFormDataWithRows}
          propertyId={property?.id}
        />
      </DialogContent>
    </Dialog>
  );
}