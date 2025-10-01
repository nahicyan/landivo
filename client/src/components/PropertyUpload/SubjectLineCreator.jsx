// client/src/components/PropertyUpload/SubjectLineCreator.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Mail, Loader2, AlertTriangle, Smile } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import { getProperty } from "@/utils/api";

const ADDRESS_FORMAT_TEMPLATES = [
  '{county}',
  '{city}',
  '{state}',
  '{state} {zip}',
  '{city} {zip}',
  '{county}, {state} {zip}',
  '{city}, {state} {zip}',
  '{county}, {city}, {state} {zip}'
];

export default function SubjectLineCreator({ 
  propertyId,
  onSubjectChange,
  errors = {}
}) {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [propertyData, setPropertyData] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState("");
  const [selectedAddressTemplate, setSelectedAddressTemplate] = useState("");
  const [templateRequiresAddress, setTemplateRequiresAddress] = useState(false);
  const [subjectContent, setSubjectContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef(null);

  // Fetch property data from Landivo API
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setLoadingProperty(false);
        return;
      }

      try {
        setLoadingProperty(true);
        const data = await getProperty(propertyId);
        console.log("Fetched property data:", data);
        setPropertyData(data);
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Fetch templates from Mailivo API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get("https://api.mailivo.landivo.com/subject-templates");
        if (response.data.success) {
          const enabled = response.data.templates.filter(t => t.isEnabled);
          setTemplates(enabled);
        }
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const replaceVariables = (template, data) => {
    if (!data) return template;
    
    let result = template;
    
    const replacements = {
      county: data.county || '',
      city: data.city || '',
      state: data.state || '',
      zip: data.zip || '',
      streetAddress: data.streetAddress || '',
      acre: data.acre?.toString() || '',
      zoning: data.zoning || '',
      restrictions: data.restrictions || '',
      askingPrice: data.askingPrice ? `$${data.askingPrice.toLocaleString()}` : '',
      minPrice: data.minPrice ? `$${data.minPrice.toLocaleString()}` : '',
      disPrice: data.disPrice ? `$${data.disPrice.toLocaleString()}` : '',
      hoaPoa: data.hoaPoa || '',
      hoaFee: data.hoaFee ? `$${data.hoaFee}` : '',
      tax: data.tax ? `$${data.tax}` : '',
      area: data.city || ''
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  };

  const generateSubjectLine = () => {
    const template = templates.find(t => t.id === selectedSubjectTemplate);
    if (!template || !propertyData) return;

    let templateContent = template.content;

    // Replace {address} with formatted address if template requires it
    if (templateContent.includes('{address}') && selectedAddressTemplate) {
      const formattedAddress = replaceVariables(selectedAddressTemplate, propertyData);
      templateContent = templateContent.replace(/{address}/g, formattedAddress);
    }

    const generated = replaceVariables(templateContent, propertyData);
    
    setSubjectContent(generated);
    onSubjectChange(generated);
    setCharCount(generated.length);

    if (editorRef.current) {
      editorRef.current.textContent = generated;
    }
  };

  const handleSubjectTemplateChange = (templateId) => {
    setSelectedSubjectTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      const requiresAddress = template.variables?.includes("address");
      setTemplateRequiresAddress(requiresAddress);
      
      if (!requiresAddress) {
        setSelectedAddressTemplate("");
      } else {
        setSelectedAddressTemplate("");
      }
    }
  };

  const handleAddressTemplateChange = (template) => {
    setSelectedAddressTemplate(template);
  };

  // Auto-generate when requirements are met
  useEffect(() => {
    if (selectedSubjectTemplate && propertyData) {
      if (templateRequiresAddress) {
        if (selectedAddressTemplate) {
          generateSubjectLine();
        }
      } else {
        generateSubjectLine();
      }
    }
  }, [selectedSubjectTemplate, selectedAddressTemplate, propertyData]);

  const handleContentInput = (e) => {
    const content = e.target.textContent || '';
    
    if (content.length > 150) {
      e.target.textContent = content.substring(0, 150);
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(e.target);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }

    setSubjectContent(content);
    setCharCount(content.length);
    onSubjectChange(content);
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(emoji));
        range.collapse(false);
      } else {
        editorRef.current.textContent += emoji;
      }
      
      const newContent = editorRef.current.textContent;
      setSubjectContent(newContent);
      setCharCount(newContent.length);
      onSubjectChange(newContent);
    }
    
    setShowEmojiPicker(false);
    editorRef.current?.focus();
  };

  const isLoading = loadingTemplates || loadingProperty;
  const enabledTemplates = templates.filter(t => t.isEnabled);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Subject Line
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingProperty ? "Loading property data..." : "Loading templates..."}
          </div>
        ) : !propertyData ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Could not load property data. Please try again.
            </AlertDescription>
          </Alert>
        ) : enabledTemplates.length > 0 ? (
          <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Subject Line Template</Label>
              <Select
                value={selectedSubjectTemplate}
                onValueChange={handleSubjectTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {enabledTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.content}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address Format */}
            {templateRequiresAddress && (
              <div className="space-y-2">
                <Label>Address Format Template *</Label>
                <Select
                  value={selectedAddressTemplate}
                  onValueChange={handleAddressTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select address format" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_FORMAT_TEMPLATES.map((template, index) => (
                      <SelectItem key={index} value={template}>
                        <span className="font-medium">{template}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Required for templates with {"{address}"} variable
                </p>
              </div>
            )}
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No templates available. You can still create a custom subject line below.
            </AlertDescription>
          </Alert>
        )}

        {/* Subject Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Customize Subject Line</Label>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  autoFocusSearch={false}
                  height={400}
                  width={350}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="border rounded-md">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentInput}
              className="min-h-[100px] p-3 text-base outline-none focus:ring-2 focus:ring-ring rounded-md"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
              data-placeholder="Enter your email subject line or select templates above..."
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Add emojis and customize</span>
            <span className={charCount > 135 ? 'text-orange-600' : ''}>
              {charCount}/150
            </span>
          </div>

          {errors.subject && (
            <p className="text-sm text-red-600">{errors.subject}</p>
          )}
        </div>

        {/* Helper */}
        {selectedSubjectTemplate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            {templateRequiresAddress ? (
              selectedAddressTemplate ? (
                <p>💡 Template generated! Customize above.</p>
              ) : (
                <p>⏳ Select an address format to continue.</p>
              )
            ) : (
              <p>💡 Template generated! Customize above.</p>
            )}
          </div>
        )}
      </CardContent>

      <style jsx>{`
        [contenteditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </Card>
  );
}