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
import { Plus, X, ChevronDown, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

export default function SystemInfoCard({ formData, handleChange, errors }) {
  const { getAccessTokenSilently } = useAuth0();
  const [propertyRows, setPropertyRows] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  const [loadingPropertyRows, setLoadingPropertyRows] = useState(false);
  const [allowedProfiles, setAllowedProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // State for managing property rows
  const [selectedRowEntries, setSelectedRowEntries] = useState([]);
  const [currentRowSelection, setCurrentRowSelection] = useState({
    rowId: "",
    rowName: "",
    position: 0
  });

  // State for row properties (to show in dropdown)
  const [rowProperties, setRowProperties] = useState([]);
  const [allRowProperties, setAllRowProperties] = useState([]); // Store full list including current property
  const [loadingRowProperties, setLoadingRowProperties] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Detect if we're in edit mode
  useEffect(() => {
    if (formData.id) {
      setIsEditing(true);
    }
  }, [formData.id]);

  // Fetch all property rows when component mounts
  useEffect(() => {
    fetchPropertyRows();
  }, []);

  // Fetch user's allowed profiles
  useEffect(() => {
    const fetchUserProfiles = async () => {
      setLoadingProfiles(true);
      try {
        // Get the auth token
        const token = await getAccessTokenSilently();
        
        // Fetch user profile
        const userProfile = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Check if user has allowedProfiles
        if (userProfile.data && userProfile.data.allowedProfiles && Array.isArray(userProfile.data.allowedProfiles)) {
          // Map the profile IDs to objects with name and id
          // In a real app, you might want to fetch profile details from another endpoint
          const profiles = userProfile.data.allowedProfiles.map(profileId => ({
            id: profileId,
            name: `Profile ${profileId.substr(0, 6)}` // Show shortened ID for readability
          }));
          setAllowedProfiles(profiles);
        } else {
          // Fallback with empty array
          setAllowedProfiles([]);
        }
      } catch (error) {
        console.error("Error fetching user profiles:", error);
        setAllowedProfiles([]); // Ensure allowedProfiles is always an array
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchUserProfiles();
  }, [getAccessTokenSilently]);

  // If we're editing a property, load its existing row associations
  useEffect(() => {
    if (formData.id) {
      // We're in edit mode, fetch the property's row associations
      fetchPropertyRowAssociations(formData.id);
    }
  }, [formData.id]);

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
      // Find which rows include this property
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows`);
      const rows = response.data || [];

      const propertyAssociations = [];

      // Look through each row to find if it includes the property
      for (const row of rows) {
        if (row.displayOrder && Array.isArray(row.displayOrder) && row.displayOrder.includes(propertyId)) {
          // Found property in this row
          propertyAssociations.push({
            rowId: row.id,
            rowName: row.name || row.rowType || "Unnamed Row",
            position: row.displayOrder.indexOf(propertyId)
          });
        }
      }

      // Set the selected rows
      setSelectedRowEntries(propertyAssociations);

      // Update form data with selected rows
      if (propertyAssociations.length > 0) {
        updateFormDataWithRows(propertyAssociations);
      }

    } catch (error) {
      console.error("Error fetching property row associations:", error);
    } finally {
      setLoadingPropertyRows(false);
    }
  };

  // Fetch properties in the selected row to show position options
  const fetchRowProperties = async (rowId) => {
    if (!rowId) return;

    setLoadingRowProperties(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/property-rows/${rowId}`);

      if (response.data && response.data.propertyDetails) {
        // Store complete list of properties in this row
        const allProperties = response.data.propertyDetails || [];
        setAllRowProperties(allProperties);

        // Filter out the current property if we're in edit mode
        let filteredProperties = allProperties;
        if (formData.id) {
          filteredProperties = allProperties.filter(p => p.id !== formData.id);
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

  // Handle row selection
  const handleRowSelect = (rowId) => {
    // Find the row name
    const selectedRow = propertyRows.find(row => row.id === rowId);
    const rowName = selectedRow ? (selectedRow.name || selectedRow.rowType || "Unnamed Row") : "";

    // Check if this property is already in this row (for edit mode)
    const existingEntry = selectedRowEntries.find(entry => entry.rowId === rowId);

    setCurrentRowSelection({
      ...currentRowSelection,
      rowId,
      rowName,
      // If we're editing and already in this row, use the existing position
      position: existingEntry ? existingEntry.position : 0
    });

    // Fetch properties in this row
    fetchRowProperties(rowId);
  };

  // Add current row selection to the list
  const addRowToSelection = () => {
    if (!currentRowSelection.rowId) return;

    // Check if row already exists
    const exists = selectedRowEntries.some(entry => entry.rowId === currentRowSelection.rowId);

    if (exists) {
      // If it exists, update the position
      const updatedEntries = selectedRowEntries.map(entry =>
        entry.rowId === currentRowSelection.rowId
          ? { ...entry, position: currentRowSelection.position }
          : entry
      );
      setSelectedRowEntries(updatedEntries);
      updateFormDataWithRows(updatedEntries);
    } else {
      // Add new entry
      const newEntry = { ...currentRowSelection };
      const updatedEntries = [...selectedRowEntries, newEntry];
      setSelectedRowEntries(updatedEntries);
      updateFormDataWithRows(updatedEntries);
    }

    // Close the dialog after adding
    setShowFeaturedDialog(false);

    // Reset selection
    setCurrentRowSelection({
      rowId: "",
      rowName: "",
      position: 0
    });
  };

  // Remove a row from selection
  const removeRowFromSelection = (rowId) => {
    // First make sure this is a valid operation
    if (!rowId || !selectedRowEntries.some(entry => entry.rowId === rowId)) {
      return;
    }

    // Create a new array without the specified row
    const updatedEntries = selectedRowEntries.filter(entry => entry.rowId !== rowId);

    // Update the state
    setSelectedRowEntries(updatedEntries);

    // Update form data with the new list
    updateFormDataWithRows(updatedEntries);

    console.log(`Removed property from row ${rowId}. Updated entries:`, updatedEntries);
  };

  const updateFormDataWithRows = (entries) => {
    // Make sure entries is an array
    const dataToStore = Array.isArray(entries) ? entries : [];

    // Use a clean object for each entry to avoid circular references
    const cleanedEntries = dataToStore.map(entry => ({
      rowId: entry.rowId,
      rowName: entry.rowName,
      position: entry.position
    }));

    // Convert to string with explicit JSON.stringify
    const jsonString = JSON.stringify(cleanedEntries);

    // Store using handleChange to update parent component state
    handleChange({
      target: {
        name: "propertyRows",
        value: jsonString
      }
    });

    console.log("Updated form data with rows:", cleanedEntries);
    console.log("JSON string for propertyRows:", jsonString);
  };

  // Format property address for display
  const formatPropertyAddress = (property) => {
    if (!property) return "Unknown Address";

    let address = property.streetAddress || "";
    if (property.city) address += `, ${property.city}`;
    if (property.state && property.zip) address += `, ${property.state}-${property.zip}`;
    else if (property.state) address += `, ${property.state}`;
    else if (property.zip) address += `, ${property.zip}`;

    return address || "Unknown Address";
  };

  // Generate position options for the selected row
  const generatePositionOptions = () => {
    // If no properties in the row, just show "1. First position"
    if (rowProperties.length === 0) {
      return [
        <SelectItem key={0} value="0">
          1. First position
        </SelectItem>
      ];
    }

    // Generate before options for each property
    const beforeOptions = rowProperties.map((property, index) => (
      <SelectItem key={index} value={index.toString()}>
        {index + 1}. Before {formatPropertyAddress(property)}
      </SelectItem>
    ));

    // Add "End of list" option
    beforeOptions.push(
      <SelectItem key={rowProperties.length} value={rowProperties.length.toString()}>
        {rowProperties.length + 1}. End of list
      </SelectItem>
    );

    return beforeOptions;
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

        {/* Profile Selector */}
        {allowedProfiles.length > 0 && (
          <div className="flex flex-col space-y-1">
            <Label htmlFor="profileId" className="text-gray-700 font-semibold">
              Profile
            </Label>
            <Select
              name="profileId"
              value={formData.profileId || ""}
              onValueChange={(value) => handleChange({ target: { name: "profileId", value } })}
            >
              <SelectTrigger
                className="w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]"
              >
                <SelectValue placeholder={loadingProfiles ? "Loading profiles..." : "Select Profile"} />
              </SelectTrigger>
              <SelectContent>
                {allowedProfiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name || "Unnamed Profile"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
            className={errors && errors.ownerId ? "border-red-500" : ""}
          />
          {errors && errors.ownerId && (
            <span className="text-red-500 text-sm">{errors.ownerId}</span>
          )}
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
            <SelectTrigger
              className={`w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48] ${errors && errors.area ? "border-red-500" : ""}`}
            >
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
          {errors && errors.area && (
            <span className="text-red-500 text-sm">{errors.area}</span>
          )}
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
            <SelectTrigger
              className={`w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48] ${errors && errors.status ? "border-red-500" : ""}`}
            >
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
          {errors && errors.status && (
            <span className="text-red-500 text-sm">{errors.status}</span>
          )}
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

            {/* Loading indicator when fetching property row associations */}
            {loadingPropertyRows && (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-5 w-5 text-[#324c48] animate-spin mr-2" />
                <span>Loading property lists...</span>
              </div>
            )}

            {/* Show selected rows */}
            {selectedRowEntries.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-gray-700">
                  {isEditing ? "Property is in these lists:" : "Selected Featured Lists:"}
                </Label>
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

            {/* Position Selection */}
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

          {/* Properties in selected row */}
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

          {/* Current property's row selection status */}
          {isEditing && currentRowSelection.rowId && (
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
    </Card>
  );
}