// client/src/components/PropertyManagement/QuickEditSections/FeaturedRowsDialog.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function FeaturedRowsDialog({
  showFeaturedDialog,
  setShowFeaturedDialog,
  selectedRowEntries,
  setSelectedRowEntries,
  updateFormDataWithRows,
  propertyId
}) {
  const [propertyRows, setPropertyRows] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [currentRowSelection, setCurrentRowSelection] = useState({
    rowId: "",
    rowName: "",
    position: 0
  });
  const [rowProperties, setRowProperties] = useState([]);
  const [loadingRowProperties, setLoadingRowProperties] = useState(false);

  // Fetch property rows on mount
  useEffect(() => {
    if (showFeaturedDialog) {
      fetchPropertyRows();
    }
  }, [showFeaturedDialog]);

  // Fetch property rows
  const fetchPropertyRows = async () => {
    setIsLoadingRows(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/property-rows`);
      setPropertyRows(response.data || []);
    } catch (error) {
      console.error("Error fetching property rows:", error);
    } finally {
      setIsLoadingRows(false);
    }
  };

  // Fetch row properties
  const fetchRowProperties = async (rowId) => {
    if (!rowId) return;
    
    setLoadingRowProperties(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/property-rows/${rowId}`);
      
      if (response.data && response.data.propertyDetails) {
        const allProperties = response.data.propertyDetails || [];
        
        // Filter out the current property
        const filteredProperties = propertyId ? 
          allProperties.filter(p => p.id !== propertyId) : 
          allProperties;
        
        setRowProperties(filteredProperties);
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

  // Add row to selection
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

  // Format property address
  const formatPropertyAddress = (property) => {
    if (!property) return "Unknown Address";
    
    let address = property.streetAddress || "";
    if (property.city) address += `, ${property.city}`;
    if (property.state) address += `, ${property.state}`;
    
    return address || "Unknown Address";
  };

  // Generate position options
  const generatePositionOptions = () => {
    if (rowProperties.length === 0) {
      return [
        <SelectItem key={0} value="0">
          1. First position
        </SelectItem>
      ];
    }

    const options = rowProperties.map((property, index) => (
      <SelectItem key={index} value={index.toString()}>
        {index + 1}. Before {formatPropertyAddress(property)}
      </SelectItem>
    ));

    options.push(
      <SelectItem key={rowProperties.length} value={rowProperties.length.toString()}>
        {rowProperties.length + 1}. End of list
      </SelectItem>
    );

    return options;
  };

  return (
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
  );
}