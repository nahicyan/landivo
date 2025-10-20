// components/MailMerge/TemplateSelector.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  loadingTemplates,
  isGenerating,
  isAnalyzing,
  onRefresh,
  onCreateTemplate,
  onDeleteTemplate,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="template-select" className="text-sm font-medium">
          Select Template
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loadingTemplates || isGenerating || isAnalyzing}
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingTemplates ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#324c48] hover:bg-[#243a36]"
            onClick={onCreateTemplate}
            disabled={isGenerating || isAnalyzing}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Template
          </Button>
        </div>
      </div>

      <Select
        value={selectedTemplateId}
        onValueChange={setSelectedTemplateId}
        disabled={isGenerating || isAnalyzing}
      >
        <SelectTrigger id="template-select">
          <SelectValue placeholder="Choose a template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No templates found. Create one first!
            </div>
          ) : (
            templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedTemplateId && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Selected: {templates.find((t) => t.id === selectedTemplateId)?.name}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDeleteTemplate(selectedTemplateId)}
            disabled={isGenerating || isAnalyzing}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}