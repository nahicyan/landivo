import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TemplateDialog({ open, onOpenChange, onTemplateCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.name.toLowerCase().endsWith(".docx") ||
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid DOCX file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Template name is required");
      return;
    }

    if (!file) {
      setError("Please select a DOCX template file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("template", file);

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/pdf-merge/templates`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onTemplateCreated?.(data.template);
          handleClose();
        }, 1500);
      } else {
        setError(data.message || "Failed to create template");
      }
    } catch (err) {
      setError(err.message || "Error creating template");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setFile(null);
    setError(null);
    setSuccess(false);
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Upload a DOCX template with Mail Merge fields to reuse for future PDF generation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Invoice Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading || success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description (Optional)</Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading || success}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-file">DOCX Template File *</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("template-file").click()}
                disabled={isUploading || success}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
              <input
                id="template-file"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || success}
              />
              {file && (
                <span className="text-sm text-gray-600 font-medium">{file.name}</span>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Template created successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isUploading || success}
              className="flex-1 bg-[#324c48] hover:bg-[#243a36]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}