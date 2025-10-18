import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Download, CheckCircle, XCircle, Loader2, Settings } from "lucide-react";
import VariableMappingDialog from "@/components/PdfMerge/VariableMappingDialog";

// Simple API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:8200",
  timeout: 3600000,
});

export default function MailMerge() {
  // File state
  const [templateFile, setTemplateFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  // Flow state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Mapping dialog state
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [analyzeNotes, setAnalyzeNotes] = useState("");

  // Analyzer options (frontend defaults; backend also has fallbacks)
  const [sheetName, setSheetName] = useState("");
  const [sheetIndex, setSheetIndex] = useState(""); // keep string for empty/0 distinction
  const [encoding, setEncoding] = useState("");     // e.g., 'utf-8', 'windows-1252'; blank = let pandas decide

  // Generation options (frontend defaults; backend also has fallbacks)
  const [chunkSize, setChunkSize] = useState(200);  // aligns with server DEFAULT_CHUNK_SIZE
  const [genWorkers, setGenWorkers] = useState(2);
  const [convWorkers, setConvWorkers] = useState(2);

  // Toggle Advanced panel
  const [showAdvanced, setShowAdvanced] = useState(false);

  // NEW: live counters for progress
  const [progressId, setProgressId] = useState(null);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  // Polling interval ref to survive re-renders
  const pollTimerRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Handle file selection
  const handleTemplateChange = (e) => {
    const file = e.target.files[0];
    const ok =
      file &&
      (file.name.toLowerCase().endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (ok) {
      setTemplateFile(file);
      setError(null);
      setResult(null);
    } else {
      setTemplateFile(null);
      setError("Please select a valid DOCX template file");
    }
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    const name = (file?.name || "").toLowerCase();
    const type = file?.type || "";
    const ok =
      file &&
      (name.endsWith(".csv") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls") ||
        type === "text/csv" ||
        type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        type === "application/vnd.ms-excel");

    if (ok) {
      setCsvFile(file);
      setError(null);
      setResult(null);
    } else {
      setCsvFile(null);
      setError("Please select a CSV or Excel (.xlsx/.xls) file");
    }
  };

  // Analyze files and extract variables/headers
  const handleAnalyzeFiles = async () => {
    if (!templateFile || !csvFile) {
      setError("Please select both DOCX template and CSV/XLSX file");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalyzeNotes("");

    try {
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("csv", csvFile);

      // Pass analyzer hints (all optional; backend tolerates blanks)
      if (sheetName.trim()) formData.append("sheetName", sheetName.trim());
      if (String(sheetIndex).trim() !== "") formData.append("sheetIndex", String(Number(sheetIndex)));
      if (encoding.trim()) formData.append("encoding", encoding.trim());

      const response = await api.post("/api/pdf-merge/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success) {
        setTemplateVariables(response.data.templateVariables || []);
        setCsvHeaders(response.data.csvHeaders || []);
        setAnalyzeNotes(response.data.notes || "");
        setShowMappingDialog(true);
      } else {
        setError(response.data?.message || "Failed to analyze files");
      }
    } catch (err) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else if (err.message) setError(err.message);
      else setError("There was an error analyzing the files. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Polling helpers
  const startPolling = (id) => {
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const r = await api.get(`/api/pdf-merge/progress/${id}`, { params: { t: Date.now() }});
        if (r.data && r.data.success) {
          const { processed = 0, total = 0, percent = 0, done = false } = r.data;
          setProcessedRows(processed);
          setTotalRows(total);
          setProgress(percent);
          if (done) stopPolling();
        }
      } catch {
        // ignore transient polling errors
      }
    }, 500);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // Generate PDF with mapping (uses real server progress)
  const handleGenerateWithMapping = async (mapping) => {
    setShowMappingDialog(false);
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // create a client progressId
    const id = (window?.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    setProgressId(id);
    setProcessedRows(0);
    setTotalRows(0);
    startPolling(id);

    try {
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("csv", csvFile);
      formData.append("mapping", JSON.stringify(mapping));
      formData.append("progressId", id); // tell server which entry to update

      // knobs
      formData.append("chunkSize", String(Math.max(1, Number(chunkSize) || 200)));
      formData.append("genWorkers", String(Math.max(1, Number(genWorkers) || 2)));
      formData.append("convWorkers", String(Math.max(1, Number(convWorkers) || 2)));

      const response = await api.post("/api/pdf-merge/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ensure final progress fetch (race-safe)
      try {
        const r = await api.get(`/api/pdf-merge/progress/${id}`, { params: { t: Date.now() } });
        if (r.data && r.data.success) {
          setProcessedRows(r.data.processed ?? processedRows);
          setTotalRows(r.data.total ?? totalRows);
          setProgress(r.data.percent ?? 100);
        }
      } catch {}

      if (response.data && response.data.success) {
        setResult(response.data);
        setError(null);
      } else {
        setError(response.data?.message || "PDF generation failed. Please try again.");
      }
    } catch (err) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else if (err.message) setError(err.message);
      else setError("There was an error generating the PDF. Please try again.");
    } finally {
      stopPolling();
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
    setAnalyzeNotes("");

    // reset advanced
    setSheetName("");
    setSheetIndex("");
    setEncoding("");
    setChunkSize(200);
    setGenWorkers(2);
    setConvWorkers(2);
    setShowAdvanced(false);

    // reset progress
    setProgressId(null);
    setProcessedRows(0);
    setTotalRows(0);
    stopPolling();

    const templateInput = document.getElementById("template-upload");
    const csvInput = document.getElementById("csv-upload");
    if (templateInput) templateInput.value = "";
    if (csvInput) csvInput.value = "";
  };

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
              DOCX Mail Merge Engine
            </CardTitle>
            <CardDescription>
              Upload a DOCX template and CSV/Excel data to generate a merged PDF
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Template DOCX Upload */}
            <div className="space-y-2">
              <Label htmlFor="template-upload" className="text-sm font-medium">
                DOCX Template
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
                  Browse DOCX
                </Button>
                <input
                  id="template-upload"
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

            {/* CSV/XLSX Upload */}
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

            {/* NEW: Advanced Options */}
            <div className="rounded-lg border border-gray-200">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => setShowAdvanced(v => !v)}
              >
                <span className="flex items-center gap-2 font-semibold text-gray-800">
                  <Settings className="h-4 w-4" /> Advanced Options
                </span>
                <span className="text-sm text-gray-500">{showAdvanced ? "Hide" : "Show"}</span>
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
                  {/* Analyzer options */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Excel Sheet Name (optional)</Label>
                    <Input
                      placeholder="e.g., Sheet1"
                      value={sheetName}
                      onChange={e => setSheetName(e.target.value)}
                      disabled={isAnalyzing || isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Excel Sheet Index (optional)</Label>
                    <Input
                      type="number"
                      placeholder="0 for first sheet"
                      value={sheetIndex}
                      onChange={e => setSheetIndex(e.target.value)}
                      disabled={isAnalyzing || isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CSV Encoding (optional)</Label>
                    <Input
                      placeholder="utf-8 / windows-1252"
                      value={encoding}
                      onChange={e => setEncoding(e.target.value)}
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
                      value={chunkSize}
                      onChange={e => setChunkSize(e.target.value)}
                      disabled={isAnalyzing || isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Merge Workers (DOCX generation)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="2"
                      value={genWorkers}
                      onChange={e => setGenWorkers(e.target.value)}
                      disabled={isAnalyzing || isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Convert Workers (DOCX→PDF)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="2"
                      value={convWorkers}
                      onChange={e => setConvWorkers(e.target.value)}
                      disabled={isAnalyzing || isGenerating}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar (live processed/total · percent) */}
            {(isGenerating || isAnalyzing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {isAnalyzing ? "Analyzing files..." : "Generating PDF..."}
                  </span>
                  {!isAnalyzing && (
                    <div className="text-[#324c48] font-medium flex items-center gap-3">
                      {totalRows > 0 ? (
                        <>
                          <span>{processedRows}/{totalRows}</span>
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
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Optional: analyzer notes */}
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
                <li>Upload a <b>DOCX</b> template with <b>Mail Merge fields</b> (e.g., first_name, address, amount).</li>
                <li>Upload a <b>CSV</b> or <b>Excel</b> file with matching column headers.</li>
                <li>Click <b>Continue to Mapping</b> to map variables to columns.</li>
                <li>Use <b>Advanced Options</b> to specify Excel sheet/encoding and performance knobs.</li>
                <li>Generate your merged <b>PDF</b> when mappings look right.</li>
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
