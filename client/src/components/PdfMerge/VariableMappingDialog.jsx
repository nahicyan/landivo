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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VariableMappingDialog({
  open,
  onOpenChange,
  templateVariables = [],
  csvHeaders = [],
  onConfirmMapping,
  isGenerating = false,
}) {
  const [mapping, setMapping] = useState({});
  const [unmappedCount, setUnmappedCount] = useState(0);

  // Initialize mapping with automatic matches
  useEffect(() => {
    if (templateVariables.length > 0 && csvHeaders.length > 0) {
      const autoMapping = {};
      const csvHeadersLower = csvHeaders.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      
      templateVariables.forEach(variable => {
        const varLower = variable.toLowerCase();
        const matchIndex = csvHeadersLower.findIndex(h => h === varLower);
        
        if (matchIndex !== -1) {
          autoMapping[variable] = csvHeaders[matchIndex];
        }
      });
      
      setMapping(autoMapping);
    }
  }, [templateVariables, csvHeaders]);

  // Count unmapped variables
  useEffect(() => {
    const unmapped = templateVariables.filter(v => !mapping[v]).length;
    setUnmappedCount(unmapped);
  }, [mapping, templateVariables]);

  const handleMappingChange = (variable, csvColumn) => {
    setMapping(prev => ({
      ...prev,
      [variable]: csvColumn === "none" ? undefined : csvColumn,
    }));
  };

  const handleConfirm = () => {
    onConfirmMapping(mapping);
  };

  const getMappedCount = () => {
    return Object.values(mapping).filter(v => v).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Map Variables to CSV Columns</DialogTitle>
          <DialogDescription>
            Match each template variable with the corresponding CSV column
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          <Badge variant="outline" className="bg-blue-50">
            {templateVariables.length} Variables Found
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {csvHeaders.length} CSV Columns
          </Badge>
          <Badge 
            variant="outline" 
            className={getMappedCount() === templateVariables.length ? "bg-green-50" : "bg-orange-50"}
          >
            {getMappedCount()}/{templateVariables.length} Mapped
          </Badge>
        </div>

        {/* Status Alert */}
        {unmappedCount > 0 ? (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {unmappedCount} variable{unmappedCount !== 1 ? 's' : ''} still unmapped. 
              Unmapped variables will be left as-is in the output.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All variables are mapped! Ready to generate PDF.
            </AlertDescription>
          </Alert>
        )}

        {/* Mapping List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {templateVariables.map((variable) => (
            <div
              key={variable}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Template Variable */}
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                  Template Variable
                </Label>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-white border border-[#324c48]/30 rounded text-[#324c48] font-mono text-sm">
                    &lt;&lt;{variable}&gt;&gt;
                  </code>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />

              {/* CSV Column Selector */}
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                  CSV Column
                </Label>
                <Select
                  value={mapping[variable] || "none"}
                  onValueChange={(value) => handleMappingChange(variable, value)}
                >
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
              </div>
            </div>
          ))}

          {templateVariables.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No variables found in template
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Variables with exact or similar names are automatically mapped. 
            You can change or remove any mapping using the dropdowns above.
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#324c48] text-white hover:bg-[#243a36]"
            disabled={isGenerating || getMappedCount() === 0}
          >
            {isGenerating ? "Generating..." : `Generate PDF with ${getMappedCount()} Mapping${getMappedCount() !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}