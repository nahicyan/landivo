import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  AlertCircle, 
  Check,
  Plus
} from "lucide-react";
import { toast } from "react-toastify";
import Papa from "papaparse";

// Define the available areas
const AREAS = [
  { id: '', label: 'None (Empty)' }, // Add blank option
  { id: 'DFW', label: 'Dallas Fort Worth' },
  { id: 'Austin', label: 'Austin' },
  { id: 'Houston', label: 'Houston' },
  { id: 'San Antonio', label: 'San Antonio' },
  { id: 'Other Areas', label: 'Other Areas' }
];

// Define buyer types
const BUYER_TYPES = [
  { id: '', label: 'None (Empty)' }, // Add blank option
  { id: 'CashBuyer', label: 'Cash Buyer' },
  { id: 'Builder', label: 'Builder' },
  { id: 'Developer', label: 'Developer' },
  { id: 'Realtor', label: 'Realtor' },
  { id: 'Investor', label: 'Investor' },
  { id: 'Wholesaler', label: 'Wholesaler' }
];

// Define available fields for mapping
const AVAILABLE_FIELDS = [
  { id: 'firstName', label: 'First Name', required: true },
  { id: 'lastName', label: 'Last Name', required: true },
  { id: 'email', label: 'Email', required: true },
  { id: 'phone', label: 'Phone', required: true },
  { id: 'buyerType', label: 'Buyer Type', required: false },
  { id: 'preferredAreas', label: 'Preferred Areas', required: false },
  { id: 'emailStatus', label: 'Email Status', required: false },
  { id: 'emailPermissionStatus', label: 'Email Permission Status', required: false },
  { id: 'emailLists', label: 'Email Lists', required: false }
];

export default function ImportCsvDialog({ 
  open, 
  onOpenChange, 
  onImport,
  existingLists = [] // Pass existing email lists
}) {
  // CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  
  // Column mapping state
  const [columnMappings, setColumnMappings] = useState({});
  const [showMapping, setShowMapping] = useState(false);
  
  // Import options
  const [importOptions, setImportOptions] = useState({
    skipFirstRow: true,
    defaultBuyerType: "",
    defaultArea: ""
  });

  // Multi-list assignment state
  const [multiListBuyers, setMultiListBuyers] = useState([]);
  const [selectedListsForBuyers, setSelectedListsForBuyers] = useState({});

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvData([]);
    setCsvHeaders([]);
    setCsvErrors([]);
    setColumnMappings({});
    setShowMapping(false);
    
    // Parse CSV file to get headers
    Papa.parse(file, {
      preview: 5, // Only parse first 5 rows to get headers
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          
          // Auto-map columns with matching names
          const autoMappings = {};
          headers.forEach(header => {
            const normalized = header.toLowerCase().replace(/\s+/g, '');
            AVAILABLE_FIELDS.forEach(field => {
              const fieldNormalized = field.label.toLowerCase().replace(/\s+/g, '');
              if (normalized === fieldNormalized || 
                  (normalized === 'emailaddress' && field.id === 'email') ||
                  (normalized === 'firstname' && field.id === 'firstName') ||
                  (normalized === 'lastname' && field.id === 'lastName')) {
                autoMappings[header] = field.id;
              }
            });
          });
          
          setColumnMappings(autoMappings);
          setShowMapping(true);
        }
      },
      header: true,
      skipEmptyLines: true
    });
  };

  // Handle column mapping change
  const handleMappingChange = (csvColumn, fieldId) => {
    setColumnMappings(prev => ({
      ...prev,
      [csvColumn]: fieldId
    }));
  };

  // Process CSV with mappings
  const processCsvWithMappings = () => {
    if (!csvFile) return;
    
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors = [];
        const validData = [];
        const buyersWithMultipleLists = [];
        
        results.data.forEach((row, index) => {
          const mappedRow = {};
          let hasRequiredFields = true;
          
          // Map CSV columns to fields
          Object.entries(columnMappings).forEach(([csvColumn, fieldId]) => {
            if (fieldId && row[csvColumn] !== undefined) {
              mappedRow[fieldId] = row[csvColumn];
            }
          });
          
          // Check required fields
          AVAILABLE_FIELDS.filter(f => f.required).forEach(field => {
            if (!mappedRow[field.id] || mappedRow[field.id].trim() === '') {
              hasRequiredFields = false;
              errors.push(`Row ${index + 2}: Missing ${field.label}`);
            }
          });
          
          if (hasRequiredFields) {
            // Apply defaults if not mapped
            if (!mappedRow.buyerType && importOptions.defaultBuyerType) {
              mappedRow.buyerType = importOptions.defaultBuyerType;
            }
            
            // Handle email lists (comma-separated)
            if (mappedRow.emailLists) {
              const lists = mappedRow.emailLists.split(',').map(l => l.trim()).filter(l => l);
              if (lists.length > 1) {
                buyersWithMultipleLists.push({
                  ...mappedRow,
                  rowIndex: index,
                  suggestedLists: lists
                });
              }
              mappedRow.emailLists = lists;
            }
            
            validData.push(mappedRow);
          }
        });
        
        setCsvData(validData);
        setCsvErrors(errors);
        setMultiListBuyers(buyersWithMultipleLists);
        
        // Initialize selected lists for buyers with multiple lists
        const initialSelections = {};
        buyersWithMultipleLists.forEach(buyer => {
          initialSelections[buyer.rowIndex] = buyer.suggestedLists;
        });
        setSelectedListsForBuyers(initialSelections);
      }
    });
  };

  // Handle option changes
  const handleOptionChange = (name, value) => {
    setImportOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle list selection for a buyer
  const toggleListForBuyer = (buyerIndex, listName) => {
    setSelectedListsForBuyers(prev => {
      const current = prev[buyerIndex] || [];
      if (current.includes(listName)) {
        return {
          ...prev,
          [buyerIndex]: current.filter(l => l !== listName)
        };
      } else {
        return {
          ...prev,
          [buyerIndex]: [...current, listName]
        };
      }
    });
  };

  // Handle import submission
  const handleImport = () => {
    if (csvData.length === 0) {
      toast.error("No valid data to import");
      return;
    }

    // Format CSV data to buyer objects with selected lists
    const formattedData = csvData.map((row, index) => {
      const buyer = {
        id: `csv-buyer-${Date.now()}-${index}`,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email.toLowerCase(),
        phone: row.phone,
        buyerType: row.buyerType || importOptions.defaultBuyerType || null,
        preferredAreas: row.preferredAreas ? 
          row.preferredAreas.split(",").map(a => a.trim()) : 
          (importOptions.defaultArea ? [importOptions.defaultArea] : []),
        emailStatus: row.emailStatus || null,
        emailPermissionStatus: row.emailPermissionStatus || null,
        emailLists: selectedListsForBuyers[index] || row.emailLists || [],
        source: "CSV Import"
      };
      
      return buyer;
    });

    try {
      onImport(formattedData, importOptions);
      toast.success(`${formattedData.length} buyers ready for import`);
      handleOpenChange(false);
    } catch (error) {
      console.error("Error formatting import data:", error);
      toast.error("Failed to prepare import data");
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (open) => {
    if (!open) {
      setCsvFile(null);
      setCsvHeaders([]);
      setCsvData([]);
      setCsvErrors([]);
      setColumnMappings({});
      setShowMapping(false);
      setMultiListBuyers([]);
      setSelectedListsForBuyers({});
      setImportOptions({
        skipFirstRow: true,
        defaultBuyerType: "",
        defaultArea: ""
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Buyers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to buyer fields
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <Label htmlFor="csv-upload-file">Select CSV File</Label>
            <Button 
              type="button" 
              variant="outline" 
              className="border-[#324c48] text-[#324c48]"
              onClick={() => document.getElementById('csv-upload-file').click()}
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
            <input
              id="csv-upload-file"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          
          {csvFile && (
            <div className="flex items-center gap-2 p-2 bg-[#f0f5f4] rounded-lg">
              <FileText className="h-5 w-5 text-[#324c48]" />
              <span className="font-medium">{csvFile.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-8 w-8 p-0"
                onClick={() => {
                  setCsvFile(null);
                  setCsvHeaders([]);
                  setShowMapping(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Column Mapping */}
          {showMapping && csvHeaders.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Map CSV Columns to Fields</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {csvHeaders.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <Label className="w-1/3 text-sm">{header}</Label>
                    <Select
                      value={columnMappings[header] || ""}
                      onValueChange={(value) => handleMappingChange(header, value)}
                    >
                      <SelectTrigger className="w-2/3">
                        <SelectValue placeholder="Skip this column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Skip this column</SelectItem>
                        {AVAILABLE_FIELDS.map(field => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label} {field.required && "*"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={processCsvWithMappings}
                className="w-full bg-[#324c48] text-white"
              >
                Process CSV
              </Button>
            </div>
          )}
          
          {/* Import Options */}
          {csvData.length > 0 && (
            <div className="bg-[#f0f5f4]/50 p-3 rounded-lg space-y-3">
              <p className="text-sm font-medium text-[#324c48]">
                Default values for missing fields:
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="defaultBuyerType" className="text-sm">Default Buyer Type</Label>
                  <Select
                    value={importOptions.defaultBuyerType}
                    onValueChange={(value) => handleOptionChange("defaultBuyerType", value)}
                  >
                    <SelectTrigger id="defaultBuyerType" className="text-sm h-8">
                      <SelectValue placeholder="Select default type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUYER_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="defaultArea" className="text-sm">Default Area</Label>
                  <Select
                    value={importOptions.defaultArea}
                    onValueChange={(value) => handleOptionChange("defaultArea", value)}
                  >
                    <SelectTrigger id="defaultArea" className="text-sm h-8">
                      <SelectValue placeholder="Select default area" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* Multi-list Buyers */}
          {multiListBuyers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-[#324c48]">
                Buyers with Multiple Lists
              </h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {multiListBuyers.map((buyer, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {buyer.firstName} {buyer.lastName} ({buyer.email})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {buyer.suggestedLists.map((list, listIdx) => (
                        <Badge
                          key={listIdx}
                          variant={selectedListsForBuyers[buyer.rowIndex]?.includes(list) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleListForBuyer(buyer.rowIndex, list)}
                        >
                          {list}
                          {selectedListsForBuyers[buyer.rowIndex]?.includes(list) && (
                            <Check className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Errors */}
          {csvErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="font-medium text-red-700">Import Errors</p>
              </div>
              <ul className="pl-5 list-disc text-sm text-red-600 space-y-1 max-h-20 overflow-y-auto">
                {csvErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Success Message */}
          {csvData.length > 0 && csvErrors.length === 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-700">
                  {csvData.length} buyers ready to import
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-[#324c48] text-white"
            disabled={csvData.length === 0}
            onClick={handleImport}
          >
            Import {csvData.length} Buyers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}