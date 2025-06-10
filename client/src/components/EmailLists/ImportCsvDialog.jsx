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
  Users,
  UserCheck,
  Eye
} from "lucide-react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import { getAllBuyers } from "@/utils/api";
import ReviewDuplicatesDialog from "./ReviewDuplicatesDialog";

// Define the available areas
const AREAS = [
  { id: '_none', label: 'None (Empty)' },
  { id: 'DFW', label: 'Dallas Fort Worth' },
  { id: 'Austin', label: 'Austin' },
  { id: 'Houston', label: 'Houston' },
  { id: 'San Antonio', label: 'San Antonio' },
  { id: 'Other Areas', label: 'Other Areas' }
];

// Define buyer types
const BUYER_TYPES = [
  { id: '_none', label: 'None (Empty)' },
  { id: 'CashBuyer', label: 'Cash Buyer' },
  { id: 'Builder', label: 'Builder' },
  { id: 'Developer', label: 'Developer' },
  { id: 'Realtor', label: 'Realtor' },
  { id: 'Investor', label: 'Investor' },
  { id: 'Wholesaler', label: 'Wholesaler' }
];

// Define available fields for mapping
const AVAILABLE_FIELDS = [
  { id: 'firstName', label: 'First Name', required: false },
  { id: 'lastName', label: 'Last Name', required: false },
  { id: 'email', label: 'Email', required: true },
  { id: 'phone', label: 'Phone', required: false },
  { id: 'buyerType', label: 'Buyer Type', required: false },
  { id: 'preferredAreas', label: 'Preferred Areas', required: false },
  { id: 'emailStatus', label: 'Email Status', required: false },
  { id: 'emailPermissionStatus', label: 'Email Permission Status', required: false }
];

export default function ImportCsvDialog({
  open,
  onOpenChange,
  onImport,
  existingLists = []
}) {
  // CSV state
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);

  // Column mapping state
  const [columnMappings, setColumnMappings] = useState({});
  const [showMapping, setShowMapping] = useState(false);

  // Duplicate handling state
  const [duplicatesDialogOpen, setDuplicatesDialogOpen] = useState(false);
  const [duplicateBuyers, setDuplicateBuyers] = useState([]);
  const [newBuyers, setNewBuyers] = useState([]);
  const [existingBuyers, setExistingBuyers] = useState([]);
  const [duplicateActions, setDuplicateActions] = useState(new Map());
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  // Import options
  const [importOptions, setImportOptions] = useState({
    skipFirstRow: true,
    defaultBuyerType: "_none",
    defaultArea: "_none"
  });

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
    setDuplicateBuyers([]);
    setNewBuyers([]);

    // Parse CSV file to get headers
    Papa.parse(file, {
      preview: 5,
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
                (normalized === 'lastname' && field.id === 'lastName') ||
                (normalized === 'emailstatus' && field.id === 'emailStatus') ||
                (normalized === 'emailpermissionstatus' && field.id === 'emailPermissionStatus') ||
                (header.toLowerCase() === 'email address' && field.id === 'email') ||
                (header.toLowerCase() === 'first name' && field.id === 'firstName') ||
                (header.toLowerCase() === 'last name' && field.id === 'lastName')) {
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
      [csvColumn]: fieldId === '_skip' ? null : fieldId
    }));
  };

  const processCsvWithMappings = async () => {
    if (!csvFile) return;
    setLoadingDuplicates(true);

    try {
      // Get all buyers who are members of at least one email list
      const existingBuyersData = await getAllBuyers();
      const buyersInLists = existingBuyersData.filter(buyer =>
        buyer.emailListMemberships && buyer.emailListMemberships.length > 0
      );
      setExistingBuyers(buyersInLists);

      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors = [];
          const validData = [];

          results.data.forEach((row, index) => {
            const mappedRow = {};
            let hasErrors = false;

            // Map CSV columns to fields
            Object.entries(columnMappings).forEach(([csvColumn, fieldId]) => {
              if (fieldId && row[csvColumn] !== undefined) {
                mappedRow[fieldId] = row[csvColumn];
              }
            });

            // Check required fields - only email is required
            if (!mappedRow.email || mappedRow.email.trim() === '') {
              hasErrors = true;
              errors.push(`Row ${index + 2}: Missing email address`);
            }

            if (!hasErrors) {
              // Apply defaults if not mapped
              if (!mappedRow.buyerType && importOptions.defaultBuyerType !== '_none') {
                mappedRow.buyerType = importOptions.defaultBuyerType;
              }

              // Handle preferred areas (comma-separated)
              if (mappedRow.preferredAreas) {
                mappedRow.preferredAreas = mappedRow.preferredAreas.split(',').map(a => a.trim()).filter(a => a);
              } else if (importOptions.defaultArea !== '_none') {
                mappedRow.preferredAreas = [importOptions.defaultArea];
              }

              validData.push(mappedRow);
            }
          });

          // Check for duplicates only against buyers in lists
          const buyersInListsEmails = new Set(buyersInLists.map(buyer => buyer.email.toLowerCase()));
          const allExistingEmails = new Set(existingBuyersData.map(buyer => buyer.email.toLowerCase()));

          const duplicates = [];
          const newBuyersData = [];
          const existingUnlistedBuyers = [];

          validData.forEach(csvBuyer => {
            const email = csvBuyer.email.toLowerCase();

            if (buyersInListsEmails.has(email)) {
              // Buyer exists and is in other lists - treat as duplicate
              const existingBuyer = buyersInLists.find(b => b.email.toLowerCase() === email);
              duplicates.push({
                csvData: csvBuyer,
                existingBuyer: existingBuyer
              });
            } else if (allExistingEmails.has(email)) {
              // Buyer exists but not in any lists - just add to new list
              const existingBuyer = existingBuyersData.find(b => b.email.toLowerCase() === email);
              existingUnlistedBuyers.push({
                ...csvBuyer,
                existingBuyerId: existingBuyer.id,
                isExistingUnlisted: true
              });
            } else {
              // New buyer
              newBuyersData.push(csvBuyer);
            }
          });

          setCsvData(validData);
          setCsvErrors(errors);
          setDuplicateBuyers(duplicates);
          setNewBuyers([...newBuyersData, ...existingUnlistedBuyers]);
        }
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error("Failed to process CSV data");
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Handle option changes
  const handleOptionChange = (name, value) => {
    setImportOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle review duplicates
  const handleReviewDuplicates = () => {
    setDuplicatesDialogOpen(true);
  };

  // Handle duplicate actions completed
  const handleDuplicateActionsCompleted = (actions) => {
    setDuplicateActions(actions);
    setDuplicatesDialogOpen(false);
  };

  // Handle import submission
  const handleImport = () => {
    if (duplicateBuyers.length > 0 && duplicateActions.size !== duplicateBuyers.length) {
      toast.error("Please review and handle all duplicate buyers before importing");
      return;
    }

    if (csvData.length === 0) {
      toast.error("No valid data to import");
      return;
    }

    // Prepare final import data
    const finalImportData = [];

    // Add new buyers
    newBuyers.forEach((buyer, index) => {
      finalImportData.push({
        ...buyer,
        id: `csv-buyer-new-${Date.now()}-${index}`,
        source: "CSV Import",
        isNew: true
      });
    });

    // Add duplicates with their actions
    duplicateBuyers.forEach((duplicate, index) => {
      const action = duplicateActions.get(duplicate.existingBuyer.email);
      if (action) { // Include all actions, even 'skip' for tracking
        finalImportData.push({
          ...duplicate.csvData,
          id: `csv-buyer-duplicate-${Date.now()}-${index}`,
          existingBuyerId: duplicate.existingBuyer.id,
          action: action,
          source: "CSV Import",
          isDuplicate: true,
          originalBuyer: duplicate.existingBuyer // Include the full original buyer data
        });
      }
    });

    console.log('Final import data prepared:', {
      total: finalImportData.length,
      new: finalImportData.filter(b => b.isNew).length,
      duplicates: finalImportData.filter(b => b.isDuplicate).length,
      actions: Array.from(duplicateActions.entries())
    });

    try {
      onImport(finalImportData, {
        ...importOptions,
        duplicateActions: Object.fromEntries(duplicateActions),
        summary: {
          newBuyers: newBuyers.length,
          duplicates: duplicateBuyers.length,
          actions: Object.fromEntries(duplicateActions)
        }
      });
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
      setDuplicateBuyers([]);
      setNewBuyers([]);
      setDuplicateActions(new Map());
      setImportOptions({
        skipFirstRow: true,
        defaultBuyerType: "_none",
        defaultArea: "_none"
      });
    }
    onOpenChange(open);
  };

  const allDuplicatesHandled = duplicateBuyers.length === 0 || duplicateActions.size === duplicateBuyers.length;
  const hasDataToImport = newBuyers.length > 0 || (duplicateBuyers.length > 0 && duplicateActions.size > 0);

  return (
    <>
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
                    setDuplicateBuyers([]);
                    setNewBuyers([]);
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
                        value={columnMappings[header] || "_skip"}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className="w-2/3">
                          <SelectValue placeholder="Skip this column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_skip">Skip this column</SelectItem>
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
                  disabled={loadingDuplicates}
                >
                  {loadingDuplicates ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Process CSV"
                  )}
                </Button>
              </div>
            )}

            {/* Import Summary */}
            {csvData.length > 0 && (
              <div className="bg-[#f0f5f4]/50 p-4 rounded-lg space-y-3">
                <h3 className="font-medium text-[#324c48]">Import Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">New Buyers</p>
                      <p className="text-lg font-bold text-green-900">{newBuyers.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Users className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Duplicates Found</p>
                      <p className="text-lg font-bold text-orange-900">{duplicateBuyers.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Check className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Processed</p>
                      <p className="text-lg font-bold text-blue-900">{csvData.length}</p>
                    </div>
                  </div>
                </div>

                {duplicateBuyers.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-orange-800">
                        {duplicateBuyers.length} duplicate{duplicateBuyers.length !== 1 ? 's' : ''} detected
                      </p>
                      <p className="text-sm text-orange-600">
                        {duplicateActions.size > 0
                          ? `${duplicateActions.size} of ${duplicateBuyers.length} duplicates handled`
                          : "Review duplicates to choose how to handle them"
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReviewDuplicates}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Changes
                    </Button>
                  </div>
                )}

                {!allDuplicatesHandled && duplicateBuyers.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <p className="font-medium text-red-700">Action Required</p>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Please review and handle all duplicate buyers before proceeding with the import.
                    </p>
                  </div>
                )}
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

            {/* CSV Format Information */}
            <div className="p-3 bg-[#f0f5f4] rounded-lg">
              <p className="text-sm font-medium text-[#324c48] mb-2">
                CSV Format Requirements:
              </p>
              <ul className="pl-5 list-disc text-sm text-gray-600 space-y-1">
                <li>Required column: email</li>
                <li>Optional columns: firstName, lastName, phone, buyerType, preferredAreas (comma separated), emailStatus, emailPermissionStatus</li>
                <li>First row should be column headers</li>
              </ul>
              <p className="text-sm mt-2">
                <a href="#" className="text-[#324c48] underline" onClick={(e) => {
                  e.preventDefault();
                  const csv = "email,firstName,lastName,phone,buyerType,preferredAreas,emailStatus,emailPermissionStatus\njohn@example.com,John,Doe,(555) 123-4567,Builder,\"Austin, DFW\",available,subscribed\njane@example.com,Jane,Smith,(555) 987-6543,Investor,Houston,available,subscribed";
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

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#324c48] text-white"
              disabled={!hasDataToImport || !allDuplicatesHandled}
              onClick={handleImport}
            >
              Import {newBuyers.length + Array.from(duplicateActions.values()).filter(action => action !== 'skip').length} Buyers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReviewDuplicatesDialog
        open={duplicatesDialogOpen}
        onOpenChange={setDuplicatesDialogOpen}
        duplicateBuyers={duplicateBuyers}
        onActionsCompleted={handleDuplicateActionsCompleted}
        initialActions={duplicateActions}
      />
    </>
  );
}