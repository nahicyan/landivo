// MailMerge.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPdfMergeTemplates, deletePdfMergeTemplate, analyzePdfMergeFiles, generateMergedPdf, getPdfMergeProgress } from "@/utils/api";
import TemplateSelector from "@/components/MailMerge/TemplateSelector";
import DataFileUploader from "@/components/MailMerge/DataFileUploader";
import AdvancedOptions from "@/components/MailMerge/AdvancedOptions";
import ProgressDisplay from "@/components/MailMerge/ProgressDisplay";
import ResultDisplay from "@/components/MailMerge/ResultDisplay";
import ActionButtons from "@/components/MailMerge/ActionButtons";
import Instructions from "@/components/MailMerge/Instructions";
import VariableMappingDialog from "@/components/PdfMerge/VariableMappingDialog";
import TemplateDialog from "@/components/PdfMerge/TemplateDialog";

export default function MailMerge() {
  // Template state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // File state
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

  // Analyzer options
  const [advancedOptions, setAdvancedOptions] = useState({
    sheetName: "",
    sheetIndex: "",
    encoding: "",
    chunkSize: 200,
    genWorkers: 2,
    convWorkers: 2,
  });

  // Live counters for progress
  const [progressId, setProgressId] = useState(null);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  // Polling interval ref
  const pollTimerRef = useRef(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await getPdfMergeTemplates();
      if (response && response.success) {
        setTemplates(response.templates || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError(err.response?.data?.message || "Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await deletePdfMergeTemplate(templateId);
      if (response && response.success) {
        setTemplates(templates.filter((t) => t.id !== templateId));
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId("");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete template");
    }
  };

  // Handle CSV file selection
  const handleCsvChange = (file) => {
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
    if (!selectedTemplateId || !csvFile) {
      setError("Please select a template and upload a CSV/XLSX file");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalyzeNotes("");

    try {
      const formData = new FormData();
      formData.append("templateId", selectedTemplateId);
      formData.append("csv", csvFile);

      // Pass analyzer hints
      if (advancedOptions.sheetName.trim()) formData.append("sheetName", advancedOptions.sheetName.trim());
      if (String(advancedOptions.sheetIndex).trim() !== "") formData.append("sheetIndex", String(Number(advancedOptions.sheetIndex)));
      if (advancedOptions.encoding.trim()) formData.append("encoding", advancedOptions.encoding.trim());

      const response = await analyzePdfMergeFiles(formData);

      if (response && response.success) {
        setTemplateVariables(response.templateVariables || []);
        setCsvHeaders(response.csvHeaders || []);
        setAnalyzeNotes(response.notes || "");
        setShowMappingDialog(true);
      } else {
        setError(response?.message || "Failed to analyze files");
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
    stopPolling(); // Stop any existing polling first
    pollTimerRef.current = setInterval(async () => {
      try {
        const response = await getPdfMergeProgress(id);
        if (response && response.success) {
          const { processed = 0, total = 0, percent = 0, done = false } = response;
          setProcessedRows(processed);
          setTotalRows(total);
          setProgress(percent);
          if (done) stopPolling();
        }
      } catch (err) {
        // Ignore transient polling errors
        console.error("Polling error:", err);
      }
    }, 500); // Poll every 500ms
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // Generate PDF with mapping
  const handleGenerateWithMapping = async (mapping) => {
    setShowMappingDialog(false);
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    // Generate unique progress ID
    const id = window?.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    setProgressId(id);
    setProcessedRows(0);
    setTotalRows(0);
    startPolling(id);

    try {
      const formData = new FormData();
      formData.append("templateId", selectedTemplateId);
      formData.append("csv", csvFile);
      formData.append("mapping", JSON.stringify(mapping));
      formData.append("progressId", id);

      // Advanced options
      if (advancedOptions.sheetName.trim()) formData.append("sheetName", advancedOptions.sheetName.trim());
      if (String(advancedOptions.sheetIndex).trim() !== "") formData.append("sheetIndex", String(Number(advancedOptions.sheetIndex)));
      if (advancedOptions.encoding.trim()) formData.append("encoding", advancedOptions.encoding.trim());

      // Performance knobs
      formData.append("chunkSize", String(Math.max(1, Number(advancedOptions.chunkSize) || 200)));
      formData.append("genWorkers", String(Math.max(1, Number(advancedOptions.genWorkers) || 2)));
      formData.append("convWorkers", String(Math.max(1, Number(advancedOptions.convWorkers) || 2)));

      const response = await generateMergedPdf(formData);

      // Ensure final progress fetch
      try {
        const finalProgress = await getPdfMergeProgress(id);
        if (finalProgress && finalProgress.success) {
          setProcessedRows(finalProgress.processed ?? processedRows);
          setTotalRows(finalProgress.total ?? totalRows);
          setProgress(finalProgress.percent ?? 100);
        }
      } catch {}

      if (response && response.success) {
        setResult(response);
        setError(null);
      } else {
        setError(response?.message || "PDF generation failed. Please try again.");
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
    setSelectedTemplateId("");
    setCsvFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setIsGenerating(false);
    setTemplateVariables([]);
    setCsvHeaders([]);
    setAnalyzeNotes("");

    // Reset advanced options
    setAdvancedOptions({
      sheetName: "",
      sheetIndex: "",
      encoding: "",
      chunkSize: 200,
      genWorkers: 2,
      convWorkers: 2,
    });

    // Reset progress
    setProgressId(null);
    setProcessedRows(0);
    setTotalRows(0);
    stopPolling();
  };

  return (
    <>
      <div className="w-full bg-white">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#324c48]">DOCX Mail Merge Engine</CardTitle>
              <CardDescription>Select a stored template and upload CSV/Excel data to generate a merged PDF</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Template Selection */}
              <TemplateSelector
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                loadingTemplates={loadingTemplates}
                isGenerating={isGenerating}
                isAnalyzing={isAnalyzing}
                onRefresh={fetchTemplates}
                onCreateTemplate={() => setShowTemplateDialog(true)}
                onDeleteTemplate={handleDeleteTemplate}
              />

              {/* CSV/XLSX Upload */}
              <DataFileUploader csvFile={csvFile} onFileChange={handleCsvChange} onRemoveFile={() => setCsvFile(null)} isGenerating={isGenerating} isAnalyzing={isAnalyzing} />

              {/* Advanced Options */}
              <AdvancedOptions options={advancedOptions} setOptions={setAdvancedOptions} isAnalyzing={isAnalyzing} isGenerating={isGenerating} />

              {/* Progress Bar */}
              <ProgressDisplay isGenerating={isGenerating} isAnalyzing={isAnalyzing} progress={progress} processedRows={processedRows} totalRows={totalRows} />

              {/* Result Display (Errors, Notes, Success) */}
              <ResultDisplay error={error} analyzeNotes={analyzeNotes} result={result} />

              {/* Action Buttons */}
              <ActionButtons
                selectedTemplateId={selectedTemplateId}
                csvFile={csvFile}
                isGenerating={isGenerating}
                isAnalyzing={isAnalyzing}
                result={result}
                onAnalyze={handleAnalyzeFiles}
                onDownload={handleDownload}
                onReset={handleReset}
              />

              {/* Instructions */}
              <Instructions />
            </CardContent>
          </Card>
        </div>
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

      {/* Template Creation Dialog */}
      <TemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onTemplateCreated={(template) => {
          fetchTemplates();
          setSelectedTemplateId(template.id);
        }}
      />
    </>
  );
}
