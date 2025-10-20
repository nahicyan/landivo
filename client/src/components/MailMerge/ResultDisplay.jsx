
// components/MailMerge/ResultDisplay.jsx
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

export default function ResultDisplay({ error, analyzeNotes, result }) {
  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analyzer notes */}
      {analyzeNotes && !error && (
        <Alert className="border-blue-400 bg-blue-50">
          <AlertDescription className="text-blue-800">
            {analyzeNotes}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Result */}
      {result && result.success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">PDF generated successfully!</p>
              {result.stats && (
                <div className="text-sm space-y-1">
                  <p>Pages created: {result.stats.pageCount || 0}</p>
                  <p>Variables found: {result.stats.variablesFound || 0}</p>
                  <p>Variables mapped: {result.stats.variablesMapped || 0}</p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}