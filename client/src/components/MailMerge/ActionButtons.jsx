// components/MailMerge/ActionButtons.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

export default function ActionButtons({
  selectedTemplateId,
  csvFile,
  isGenerating,
  isAnalyzing,
  result,
  onAnalyze,
  onDownload,
  onReset,
}) {
  return (
    <div className="flex gap-3">
      <Button
        onClick={onAnalyze}
        disabled={!selectedTemplateId || !csvFile || isGenerating || isAnalyzing}
        className="flex-1 bg-[#324c48] hover:bg-[#243a36] text-white"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Continue to Mapping
          </>
        )}
      </Button>

      {result && result.success && (
        <Button
          onClick={onDownload}
          variant="outline"
          className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      )}

      <Button
        onClick={onReset}
        variant="outline"
        disabled={isGenerating || isAnalyzing}
      >
        Reset
      </Button>
    </div>
  );
}