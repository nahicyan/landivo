
// components/MailMerge/ProgressDisplay.jsx
import React from "react";
import { Progress } from "@/components/ui/progress";

export default function ProgressDisplay({
  isGenerating,
  isAnalyzing,
  progress,
  processedRows,
  totalRows,
}) {
  if (!isGenerating && !isAnalyzing) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {isAnalyzing ? "Analyzing files..." : "Generating PDF..."}
        </span>
        {!isAnalyzing && (
          <div className="text-[#324c48] font-medium flex items-center gap-3">
            {totalRows > 0 ? (
              <>
                <span>
                  {processedRows}/{totalRows}
                </span>
                <span>•</span>
                <span>{progress}%</span>
              </>
            ) : (
              <span>{progress}%</span>
            )}
          </div>
        )}
      </div>
      <Progress value={isAnalyzing ? undefined : progress} className="h-2" />
    </div>
  );
}