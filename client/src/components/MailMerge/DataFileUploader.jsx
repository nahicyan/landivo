// components/MailMerge/DataFileUploader.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, XCircle } from "lucide-react";

export default function DataFileUploader({
  csvFile,
  onFileChange,
  onRemoveFile,
  isGenerating,
  isAnalyzing,
}) {
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="csv-upload" className="text-sm font-medium">
        Data File (CSV or Excel)
      </Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
          onClick={() => document.getElementById("csv-upload").click()}
          disabled={isGenerating || isAnalyzing}
        >
          <Upload className="h-4 w-4 mr-2" />
          Browse CSV/XLSX
        </Button>
        <input
          id="csv-upload"
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isGenerating || isAnalyzing}
        />
        {csvFile && (
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-1">
            <FileText className="h-4 w-4 text-[#324c48]" />
            <span className="font-medium">{csvFile.name}</span>
            <span className="text-gray-400">
              ({(csvFile.size / 1024).toFixed(1)} KB)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-auto"
              onClick={onRemoveFile}
              disabled={isGenerating || isAnalyzing}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}