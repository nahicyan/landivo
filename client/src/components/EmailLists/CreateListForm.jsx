// client/src/components/EmailLists/CreateListForm.jsx

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

// Define the available areas
const AREAS = [
  { id: 'DFW', label: 'Dallas Fort Worth' },
  { id: 'Austin', label: 'Austin' },
  { id: 'Houston', label: 'Houston' },
  { id: 'San Antonio', label: 'San Antonio' },
  { id: 'Other Areas', label: 'Other Areas' }
];

// Define buyer types
const BUYER_TYPES = [
  { id: 'CashBuyer', label: 'Cash Buyer' },
  { id: 'Builder', label: 'Builder' },
  { id: 'Developer', label: 'Developer' },
  { id: 'Realtor', label: 'Realtor' },
  { id: 'Investor', label: 'Investor' },
  { id: 'Wholesaler', label: 'Wholesaler' }
];

export default function CreateListForm({ 
  open, 
  onOpenChange, 
  onCreateList,
  onImportCsv,
  importedBuyers,
  onClearImportedBuyers
}) {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    criteria: {
      areas: [],
      buyerTypes: [],
      isVIP: false
    }
  });

  // Loading state
  const [isCreating, setIsCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle criteria changes
  const handleCriteriaChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [field]: value
      }
    }));
  };

  // Reset form when dialog closes
  const handleOpenChange = (open) => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        criteria: {
          areas: [],
          buyerTypes: [],
          isVIP: false
        }
      });
      // Clear imported buyers when closing
      if (onClearImportedBuyers) {
        onClearImportedBuyers();
      }
      // Reset loading states
      setIsCreating(false);
      setCreationSuccess(false);
    }
    onOpenChange(open);
  };

  // Validation function
  const validateForm = () => {
    const errors = [];

    // Check list name
    if (!formData.name.trim()) {
      errors.push("List name is required");
    }

    // Check areas - mandatory for both regular and imported lists
    if (formData.criteria.areas.length === 0) {
      errors.push("At least one area must be selected");
    }

    // Check buyer types - mandatory for both regular and imported lists
    if (formData.criteria.buyerTypes.length === 0) {
      errors.push("At least one buyer type must be selected");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    try {
      // Show loading dialog
      setIsCreating(true);
      setCreationSuccess(false);

      // Determine source based on whether buyers are imported from CSV
      const source = importedBuyers && importedBuyers.length > 0 ? "CSV" : "Manual";
      
      // If importing buyers, include them in the list data
      const listData = importedBuyers && importedBuyers.length > 0
        ? {
            name: formData.name,
            description: formData.description,
            criteria: formData.criteria,
            source: source,
            buyerIds: importedBuyers.map(b => b.id)
          }
        : {
            ...formData,
            source: source,
            buyerIds: []
          };
      
      await onCreateList(listData);
      
      // Show success state
      setCreationSuccess(true);
      
      // Close dialog after a brief moment to show success
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error("Create list error:", error);
      setIsCreating(false);
      setCreationSuccess(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Email List</DialogTitle>
            <DialogDescription>
              Define a new list of buyers based on area and type criteria
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">List Details</TabsTrigger>
              <TabsTrigger value="import">
                Import Buyers
                {importedBuyers && importedBuyers.length > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {importedBuyers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    List Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Austin Builders"
                    className="border-[#324c48]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="What is this list for?"
                    className="border-[#324c48]/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>
                    Area Criteria <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {AREAS.map(area => (
                      <Badge
                        key={area.id}
                        variant={formData.criteria.areas.includes(area.id) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.criteria.areas.includes(area.id) 
                            ? "bg-[#324c48]" 
                            : "hover:bg-[#324c48]/10"
                        }`}
                        onClick={() => {
                          const updatedAreas = formData.criteria.areas.includes(area.id)
                            ? formData.criteria.areas.filter(a => a !== area.id)
                            : [...formData.criteria.areas, area.id];
                          handleCriteriaChange("areas", updatedAreas);
                        }}
                      >
                        {area.label}
                      </Badge>
                    ))}
                  </div>
                  {formData.criteria.areas.length === 0 ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">Please select at least one area</p>
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">
                      {formData.criteria.areas.length} area{formData.criteria.areas.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>
                    Buyer Type Criteria <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {BUYER_TYPES.map(type => (
                      <Badge
                        key={type.id}
                        variant={formData.criteria.buyerTypes.includes(type.id) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.criteria.buyerTypes.includes(type.id) 
                            ? "bg-[#324c48]" 
                            : "hover:bg-[#324c48]/10"
                        }`}
                        onClick={() => {
                          const updatedTypes = formData.criteria.buyerTypes.includes(type.id)
                            ? formData.criteria.buyerTypes.filter(t => t !== type.id)
                            : [...formData.criteria.buyerTypes, type.id];
                          handleCriteriaChange("buyerTypes", updatedTypes);
                        }}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                  {formData.criteria.buyerTypes.length === 0 ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">Please select at least one buyer type</p>
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">
                      {formData.criteria.buyerTypes.length} type{formData.criteria.buyerTypes.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isVip"
                    checked={formData.criteria.isVIP}
                    onCheckedChange={(checked) => handleCriteriaChange("isVIP", checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#324c48] focus:ring-[#324c48]"
                  />
                  <Label htmlFor="isVip">VIP Buyers Only</Label>
                </div>

                {/* Requirements notice */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Requirements</p>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• List name is required</li>
                    <li>• At least one area must be selected</li>
                    <li>• At least one buyer type must be selected</li>
                    <li>• These criteria will be used to automatically include matching buyers</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="import" className="py-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="csv-file">Import buyers from CSV</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-[#324c48] text-[#324c48]"
                    onClick={onImportCsv}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Select CSV File
                  </Button>
                </div>
                
                {importedBuyers && importedBuyers.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700">
                      {importedBuyers.length} buyers imported and ready to be added to this list
                    </p>
                  </div>
                )}

                {/* Import requirements notice */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-800">Import Requirements</p>
                  </div>
                  <p className="text-sm text-orange-700">
                    Even when importing buyers from CSV, you must still select at least one area and one buyer type. 
                    These criteria will be used to automatically include additional matching buyers beyond your imported list.
                  </p>
                </div>
                
                <div className="p-3 bg-[#f0f5f4] rounded-lg">
                  <p className="text-sm font-medium text-[#324c48] mb-2">
                    CSV Format Requirements:
                  </p>
                  <ul className="pl-5 list-disc text-sm text-gray-600 space-y-1">
                    <li>Required columns: firstName, lastName, email, phone</li>
                    <li>Optional columns: buyerType, preferredAreas (comma separated)</li>
                    <li>First row should be column headers</li>
                  </ul>
                  <p className="text-sm mt-2">
                    <a href="#" className="text-[#324c48] underline" onClick={(e) => {
                      e.preventDefault();
                      const csv = "firstName,lastName,email,phone,buyerType,preferredAreas\nJohn,Doe,john@example.com,(555) 123-4567,Builder,\"Austin, DFW\"\nJane,Smith,jane@example.com,(555) 987-6543,Investor,Houston";
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'buyer_list_template.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      Download template
                    </a>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-[#324c48] text-white"
              disabled={
                !formData.name.trim() || 
                formData.criteria.areas.length === 0 || 
                formData.criteria.buyerTypes.length === 0 ||
                isCreating
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create List
                  {importedBuyers && importedBuyers.length > 0 && 
                    ` with ${importedBuyers.length} buyers`
                  }
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Dialog */}
      <Dialog open={isCreating} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-center">
              {creationSuccess ? "List Created!" : "Creating Email List"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-8">
            {creationSuccess ? (
              <>
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-sm text-gray-600">
                  Your email list has been created successfully!
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 text-[#324c48] animate-spin mb-4" />
                <p className="text-center text-sm text-gray-600 mb-2">
                  Please wait while we create your email list...
                </p>
                {importedBuyers && importedBuyers.length > 0 && (
                  <p className="text-center text-xs text-gray-500">
                    Adding {importedBuyers.length} buyers to the list
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}