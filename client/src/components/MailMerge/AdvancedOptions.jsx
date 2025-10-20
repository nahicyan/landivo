
// components/MailMerge/AdvancedOptions.jsx
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

export default function AdvancedOptions({
  options,
  setOptions,
  isAnalyzing,
  isGenerating,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateOption = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800">
          <Settings className="h-4 w-4" /> Advanced Options
        </span>
        <span className="text-sm text-gray-500">
          {showAdvanced ? "Hide" : "Show"}
        </span>
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
          {/* Analyzer options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Excel Sheet Name (optional)
            </Label>
            <Input
              placeholder="e.g., Sheet1"
              value={options.sheetName}
              onChange={(e) => updateOption("sheetName", e.target.value)}
              disabled={isAnalyzing || isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Excel Sheet Index (optional)
            </Label>
            <Input
              type="number"
              placeholder="0 for first sheet"
              value={options.sheetIndex}
              onChange={(e) => updateOption("sheetIndex", e.target.value)}
              disabled={isAnalyzing || isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              CSV Encoding (optional)
            </Label>
            <Input
              placeholder="utf-8 / windows-1252"
              value={options.encoding}
              onChange={(e) => updateOption("encoding", e.target.value)}
              disabled={isAnalyzing || isGenerating}
            />
          </div>

          {/* Generation options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Chunk Size</Label>
            <Input
              type="number"
              min={1}
              placeholder="200"
              value={options.chunkSize}
              onChange={(e) => updateOption("chunkSize", e.target.value)}
              disabled={isAnalyzing || isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Merge Workers (DOCX generation)
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="2"
              value={options.genWorkers}
              onChange={(e) => updateOption("genWorkers", e.target.value)}
              disabled={isAnalyzing || isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Convert Workers (DOCX→PDF)
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="2"
              value={options.convWorkers}
              onChange={(e) => updateOption("convWorkers", e.target.value)}
              disabled={isAnalyzing || isGenerating}
            />
          </div>
        </div>
      )}
    </div>
  );
}