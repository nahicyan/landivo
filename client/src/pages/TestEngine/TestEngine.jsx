import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";
import VariableMappingDialog from "@/components/PdfMerge/VariableMappingDialog";

// Simple API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:8200",
  timeout: 120000, // 2 minutes timeout
});

export default function TestEngine() {
  // State management
  const [templateFile, setTemplateFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Variable mapping state
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);

  // Handle file selection
  const handleTemplateChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setTemplateFile(file);
      setError(null);
      setResult(null);
    } else {
      setError("Please select a valid PDF file");
    }
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setCsvFile(file);
      setError(null);
      setResult(null);
    } else {
      setError("Please select a valid CSV file");
    }
  };

  // Analyze files and extract variables/headers
  const handleAnalyzeFiles = async () => {
    if (!templateFile || !csvFile) {
      setError("Please select both template PDF and CSV file");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("csv", csvFile);

      console.log("Analyzing files...");

      const response = await api.post("/api/pdf-merge/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Analysis response:", response.data);

      if (response.data && response.data.success) {
        setTemplateVariables(response.data.templateVariables || []);
        setCsvHeaders(response.data.csvHeaders || []);
        setShowMappingDialog(true);
      } else {
        setError(response.data?.message || "Failed to analyze files");
      }
    } catch (err) {
      console.error("Error analyzing files:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("There was an error analyzing the files. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate PDF with mapping
  const handleGenerateWithMapping = async (mapping) => {
    setShowMappingDialog(false);
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("csv", csvFile);
      formData.append("mapping", JSON.stringify(mapping));

      console.log("Generating PDF with mapping:", mapping);

      const response = await api.post("/api/pdf-merge/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      console.log("PDF merge response:", response.data);

      if (response.data && response.data.success) {
        setResult(response.data);
        setError(null);
      } else {
        setError(response.data?.message || "PDF generation failed. Please try again.");
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Error generating PDF:", err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("There was an error generating the PDF. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Download generated PDF
  const handleDownload = () => {
    if (result && result.downloadUrl) {
      const link = document.createElement("a");
      link.href = `${import.meta.env.VITE_SERVER_URL}${result.downloadUrl}`;
      link.download = result.fileName || "merged-document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Reset form
  const handleReset = () => {
    setTemplateFile(null);
    setCsvFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setIsGenerating(false);
    setTemplateVariables([]);
    setCsvHeaders([]);
    
    const templateInput = document.getElementById("template-upload");
    const csvInput = document.getElementById("csv-upload");
    if (templateInput) templateInput.value = "";
    if (csvInput) csvInput.value = "";
  };

  // Remove a specific file
  const removeTemplateFile = () => {
    setTemplateFile(null);
    setResult(null);
    const input = document.getElementById("template-upload");
    if (input) input.value = "";
  };

  const removeCsvFile = () => {
    setCsvFile(null);
    setResult(null);
    const input = document.getElementById("csv-upload");
    if (input) input.value = "";
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800">
              PDF Mail Merge Engine
            </CardTitle>
            <CardDescription>
              Upload a PDF template and CSV data to generate personalized documents
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Template PDF Upload */}
            <div className="space-y-2">
              <Label htmlFor="template-upload" className="text-sm font-medium">
                PDF Template
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
                  onClick={() => document.getElementById("template-upload").click()}
                  disabled={isGenerating || isAnalyzing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse PDF
                </Button>
                <input
                  id="template-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleTemplateChange}
                  disabled={isGenerating || isAnalyzing}
                />
                {templateFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 text-[#324c48]" />
                    <span className="font-medium">{templateFile.name}</span>
                    <span className="text-gray-400">
                      ({(templateFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-auto"
                      onClick={removeTemplateFile}
                      disabled={isGenerating || isAnalyzing}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* CSV Upload */}
            <div className="space-y-2">
              <Label htmlFor="csv-upload" className="text-sm font-medium">
                CSV Data File
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
                  Browse CSV
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvChange}
                  disabled={isGenerating || isAnalyzing}
                />
                {csvFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      onClick={removeCsvFile}
                      disabled={isGenerating || isAnalyzing}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {(isGenerating || isAnalyzing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {isAnalyzing ? "Analyzing files..." : "Generating PDF..."}
                  </span>
                  {isGenerating && (
                    <span className="text-[#324c48] font-medium">{progress}%</span>
                  )}
                </div>
                <Progress value={isAnalyzing ? undefined : progress} className="h-2" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyzeFiles}
                disabled={!templateFile || !csvFile || isGenerating || isAnalyzing}
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
                  onClick={handleDownload}
                  variant="outline"
                  className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}

              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isGenerating || isAnalyzing}
              >
                Reset
              </Button>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Upload a PDF template with variables in format: <code className="bg-white px-1 rounded">&lt;&lt;variable_name&gt;&gt;</code></li>
                <li>Upload a CSV file with data</li>
                <li>Click "Continue to Mapping" to map variables</li>
                <li>Review and adjust the variable mappings</li>
                <li>Generate your personalized PDF documents</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variable Mapping Dialog */}
      <VariableMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        templateVariables={templateVariables}
        csvHeaders={csvHeaders}
        onConfirmMapping={handleGenerateWithMapping}
        isGenerating={isGenerating}
      />
    </>
  );
}