import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, CheckCircle2, AlertCircle, Type, Database, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper function to check if a variable name suggests it's a date field
const isDateVariable = (variableName) => {
  const lower = variableName.toLowerCase();
  const datePatterns = ["date", "mailing_date", "mailingdate", "Mailing_Date", "MalingDate"];
  return datePatterns.some((pattern) => lower.includes(pattern));
};

export default function VariableMappingDialog({ open, onOpenChange, templateVariables = [], csvHeaders = [], onConfirmMapping, isGenerating = false }) {
  // mapping structure: { variableName: { type: 'csv' | 'custom' | 'date', value: 'column_name' | 'custom_text' | Date } }
  const [mapping, setMapping] = useState({});
  const [unmappedCount, setUnmappedCount] = useState(0);

  // Initialize mapping with automatic CSV matches and date defaults
  useEffect(() => {
    if (templateVariables.length > 0) {
      const autoMapping = {};
      const csvHeadersLower = csvHeaders.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

      templateVariables.forEach((variable) => {
        const varLower = variable.toLowerCase();

        // Check if it's a date variable first
        if (isDateVariable(variable)) {
          // Set default to today's date at 5PM
          const today = new Date();
          today.setHours(17, 0, 0, 0);
          autoMapping[variable] = {
            type: "date",
            value: today.toISOString(),
          };
        } else {
          // Try to auto-match with CSV columns
          const matchIndex = csvHeadersLower.findIndex((h) => h === varLower);
          if (matchIndex !== -1) {
            autoMapping[variable] = {
              type: "csv",
              value: csvHeaders[matchIndex],
            };
          }
        }
      });

      setMapping(autoMapping);
    }
  }, [templateVariables, csvHeaders]);

  // Count unmapped variables
  useEffect(() => {
    const unmapped = templateVariables.filter((v) => !mapping[v] || !mapping[v].value).length;
    setUnmappedCount(unmapped);
  }, [mapping, templateVariables]);

  const handleTypeChange = (variable, type) => {
    const today = new Date();
    today.setHours(17, 0, 0, 0);

    setMapping((prev) => ({
      ...prev,
      [variable]: {
        type,
        value: type === "date" ? today.toISOString() : "",
      },
    }));
  };

  const handleValueChange = (variable, value) => {
    setMapping((prev) => ({
      ...prev,
      [variable]: {
        ...prev[variable],
        value: value === "none" ? "" : value,
      },
    }));
  };

  const handleDateSelect = (variable, date) => {
    if (!date) {
      setMapping((prev) => ({
        ...prev,
        [variable]: {
          type: "date",
          value: "",
        },
      }));
      return;
    }

    // Set the time to 5PM (17:00:00) of the selected day
    const dateAt5PM = new Date(date);
    dateAt5PM.setHours(17, 0, 0, 0);

    setMapping((prev) => ({
      ...prev,
      [variable]: {
        type: "date",
        value: dateAt5PM.toISOString(),
      },
    }));
  };

  const handleConfirm = () => {
    // Convert to backend-friendly format
    const backendMapping = {};
    Object.keys(mapping).forEach((variable) => {
      if (mapping[variable] && mapping[variable].value) {
        backendMapping[variable] = mapping[variable];
      }
    });
    onConfirmMapping(backendMapping);
  };

  const getMappedCount = () => {
    return Object.values(mapping).filter((m) => m && m.value).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Map Variables to Data Sources</DialogTitle>
          <DialogDescription>Map each template variable to a CSV column, enter a custom value, or select a date</DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          <Badge variant="outline" className="bg-blue-50">
            {templateVariables.length} Variables Found
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {csvHeaders.length} CSV Columns
          </Badge>
          <Badge variant="outline" className={getMappedCount() === templateVariables.length ? "bg-green-50" : "bg-orange-50"}>
            {getMappedCount()}/{templateVariables.length} Mapped
          </Badge>
        </div>

        {/* Status Alert */}
        {unmappedCount > 0 ? (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {unmappedCount} variable{unmappedCount !== 1 ? "s" : ""} still unmapped. Unmapped variables will be left as-is in the output.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">All variables are mapped! Ready to generate PDF.</AlertDescription>
          </Alert>
        )}

        {/* Mapping List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {templateVariables.map((variable) => {
            const mappingType = mapping[variable]?.type || "csv";
            const mappingValue = mapping[variable]?.value || "";
            const isDate = isDateVariable(variable);

            return (
              <div key={variable} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {/* Type Selector - Top Row */}
                <div className="flex items-center justify-end">
                  <RadioGroup value={mappingType} onValueChange={(type) => handleTypeChange(variable, type)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csv" id={`${variable}-csv`} />
                      <Label htmlFor={`${variable}-csv`} className="text-sm cursor-pointer flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        CSV Column
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id={`${variable}-custom`} />
                      <Label htmlFor={`${variable}-custom`} className="text-sm cursor-pointer flex items-center gap-1">
                        <Type className="h-3 w-3" />
                        Custom Value
                      </Label>
                    </div>
                    {isDate && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="date" id={`${variable}-date`} />
                        <Label htmlFor={`${variable}-date`} className="text-sm cursor-pointer flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Date Picker
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {/* Template Variable + Input - Same Row */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">
                      Template Variable
                      {isDate && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Date Field
                        </Badge>
                      )}
                    </Label>
                    <code className="px-3 py-2 bg-white border border-[#324c48]/30 rounded text-[#324c48] font-mono text-sm inline-block">&lt;&lt;{variable}&gt;&gt;</code>
                  </div>

                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-8" />

                  <div className="flex-1">
                    {mappingType === "csv" ? (
                      <>
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">Select CSV Column</Label>
                        <Select value={mappingValue || "none"} onValueChange={(value) => handleValueChange(variable, value)}>
                          <SelectTrigger className="w-full border-[#324c48]/30">
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-gray-400">-- Not Mapped --</span>
                            </SelectItem>
                            {csvHeaders.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : mappingType === "date" ? (
                      <>
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">Select Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-[#324c48]/30", !mappingValue && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {mappingValue ? format(new Date(mappingValue), "MM/dd/yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            <style>{`
                .compact-calendar * {
                  margin: 0 !important;
                }
                .compact-calendar table {
                  border-collapse: collapse !important;
                  width: auto !important;
                }
                .compact-calendar td,
                .compact-calendar th {
                  padding: 2px !important;
                  width: 28px !important;
                  height: 28px !important;
                }
                .compact-calendar button {
                  width: 24px !important;
                  height: 24px !important;
                  font-size: 0.875rem !important;
                  padding: 0 !important;
                }
                .compact-calendar .rdp-day_button {
                  width: 24px !important;
                  height: 24px !important;
                }
                .compact-calendar .rdp-weekday {
                  font-size: 0.75rem !important;
                  padding: 2px !important;
                }
                .compact-calendar .rdp-month {
                  margin: 0.5rem !important;
                }
                .compact-calendar .rdp-month_caption {
                  margin-bottom: 0.5rem !important;
                }
              `}</style>
                            <div className="border border-gray-200 rounded-md">
                              <DayPicker
                                mode="single"
                                selected={mappingValue ? new Date(mappingValue) : undefined}
                                onSelect={(date) => handleDateSelect(variable, date)}
                                initialFocus
                                className="compact-calendar p-2"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </>
                    ) : (
                      <>
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">Enter Custom Value</Label>
                        <Input
                          placeholder="Type your custom value here..."
                          value={mappingValue}
                          onChange={(e) => handleValueChange(variable, e.target.value)}
                          className="border-[#324c48]/30"
                        />
                      </>
                    )}
                  </div>
                </div>
                {/* Preview */}
                {mappingValue && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Preview:</p>
                    <p className="text-sm font-medium text-gray-700">
                      {mappingType === "csv" ? (
                        <>
                          Will use data from <code className="text-[#324c48]">{mappingValue}</code> column
                        </>
                      ) : mappingType === "date" ? (
                        <>
                          Will insert: <code className="text-[#324c48]">{format(new Date(mappingValue), "MM/dd/yyyy")}</code>
                        </>
                      ) : (
                        <>
                          Will insert: <code className="text-[#324c48]">"{mappingValue}"</code>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {templateVariables.length === 0 && <div className="text-center py-8 text-gray-500">No variables found in template</div>}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Use <strong>CSV Column</strong> for dynamic data that changes per row. Use <strong>Custom Value</strong> for static text that stays the same across all
            generated PDFs. Use <strong>Date Picker</strong> for date fields (automatically detected and set to today by default).
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-[#324c48] text-white hover:bg-[#243a36]" disabled={isGenerating || getMappedCount() === 0}>
            {isGenerating ? "Generating..." : `Generate PDF with ${getMappedCount()} Mapping${getMappedCount() !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
