// client/src/components/PropertyDiscount/DiscountSubjectLineCreator.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Mail, Loader2, AlertTriangle, Smile, History } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import { getSubjectTemplates, getPastCampaignSubjects } from "@/utils/api";

import { getProperty } from "@/utils/api";

const ADDRESS_FORMAT_TEMPLATES = ["{county}", "{city}", "{state}", "{state} {zip}", "{city} {zip}", "{county}, {state} {zip}", "{city}, {state} {zip}", "{county}, {city}, {state} {zip}"];

const DISCOUNT_PREFIXES = [
  "Price Drop Alert 🔻 ",
  "Just Reduced ",
  "New Low Price ",
  "Deal Alert 🚨 ",
  "Investor Special 🏠 ",
  "Discounted Deal 🏷️ ",
  "Priced to Sell ",
  "Exclusive Deal ",
  "Below Market Value ",
  "Price Improvement ",
];

export default function DiscountSubjectLineCreator({ propertyId, onSubjectChange, errors = {} }) {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [propertyData, setPropertyData] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState("");
  const [selectedPastSubject, setSelectedPastSubject] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState(DISCOUNT_PREFIXES[0]);
  const [baseSubject, setBaseSubject] = useState(""); // Subject without prefix
  const [selectedAddressTemplate, setSelectedAddressTemplate] = useState("");
  const [templateRequiresAddress, setTemplateRequiresAddress] = useState(false);
  const [subjectContent, setSubjectContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        setLoadingProperty(false);
        return;
      }

      try {
        setLoadingProperty(true);
        const data = await getProperty(propertyId);
        setPropertyData(data);
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Fetch subject templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await getSubjectTemplates();
        if (response.success) {
          const enabled = response.templates.filter((t) => t.isEnabled);
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

  // Fetch past campaigns for this property
  useEffect(() => {
    const fetchPastCampaigns = async () => {
      if (!propertyId) {
        setLoadingCampaigns(false);
        return;
      }

      try {
        setLoadingCampaigns(true);
        const response = await getPastCampaignSubjects(propertyId);

        if (response.success && response.subjects) {
          setPastCampaigns(response.subjects);
        }
      } catch (error) {
        console.error("Error loading past campaigns:", error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchPastCampaigns();
  }, [propertyId]);

  const replaceVariables = (template, data) => {
    if (!data) return template;

    let result = template;

    const replacements = {
      title: data.title || "", 
      county: data.county || "",
      city: data.city || "",
      state: data.state || "",
      zip: data.zip || "",
      streetAddress: data.streetAddress || "",
      acre: data.acre?.toString() || "",
      zoning: data.zoning || "",
      restrictions: data.restrictions || "",
      askingPrice: data.askingPrice ? `${data.askingPrice.toLocaleString()}` : "",
      minPrice: data.minPrice ? `${data.minPrice.toLocaleString()}` : "",
      disPrice: data.disPrice ? `${data.disPrice.toLocaleString()}` : "",
      hoaPoa: data.hoaPoa || "",
      hoaFee: data.hoaFee ? `${data.hoaFee}` : "",
      tax: data.tax ? `${data.tax}` : "",
      area: data.city || "",
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, value);
    });

    return result;
  };

  // Remove any existing discount prefix from subject
  const stripExistingPrefix = (subject) => {
    let cleaned = subject;

    // Try to remove each prefix if it exists at the start
    for (const prefix of DISCOUNT_PREFIXES) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
        break; // Only remove one prefix
      }
    }

    return cleaned.trim();
  };

  const generateSubjectLine = () => {
    const template = templates.find((t) => t.id === selectedSubjectTemplate);
    if (!template || !propertyData) return;

    let templateContent = template.content;

    if (templateContent.includes("{address}") && selectedAddressTemplate) {
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
    setSelectedPastSubject(""); // Clear past subject selection
    const template = templates.find((t) => t.id === templateId);

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

  const handlePastSubjectChange = (value) => {
    // value is in format "title|||subject"
    const [title, subject] = value.split("|||");

    setSelectedPastSubject(value);
    setSelectedSubjectTemplate(""); // Clear template selection
    setTemplateRequiresAddress(false);

    // Remove any existing prefix before applying new one
    const cleanedSubject = stripExistingPrefix(subject);

    // Store base subject and automatically apply first prefix
    setBaseSubject(cleanedSubject);
    setSelectedPrefix(DISCOUNT_PREFIXES[0]);

    const finalSubject = DISCOUNT_PREFIXES[0] + cleanedSubject;
    setSubjectContent(finalSubject);
    onSubjectChange(finalSubject);
    setCharCount(finalSubject.length);

    if (editorRef.current) {
      editorRef.current.textContent = finalSubject;
    }
  };

  const handlePrefixChange = (prefix) => {
    setSelectedPrefix(prefix);

    if (baseSubject) {
      const finalSubject = prefix + baseSubject;
      setSubjectContent(finalSubject);
      onSubjectChange(finalSubject);
      setCharCount(finalSubject.length);

      if (editorRef.current) {
        editorRef.current.textContent = finalSubject;
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
    const content = e.target.textContent || "";

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

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
      };
    }
  };

  const restoreSelection = () => {
    if (editorRef.current && savedSelectionRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      try {
        range.setStart(savedSelectionRef.current.startContainer, savedSelectionRef.current.startOffset);
        range.setEnd(savedSelectionRef.current.endContainer || savedSelectionRef.current.startContainer, savedSelectionRef.current.endOffset);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch (e) {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const handleEmojiPickerOpenChange = (open) => {
    if (open) {
      saveSelection();
    }
    setShowEmojiPicker(open);
  };

  // Update handleEmojiClick to restore selection first
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;

    if (editorRef.current) {
      restoreSelection(); // Add this line

      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
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

  const isLoading = loadingTemplates || loadingProperty || loadingCampaigns;
  const enabledTemplates = templates.filter((t) => t.isEnabled);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Discount Email Subject Line
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingProperty ? "Loading property data..." : loadingCampaigns ? "Loading past campaigns..." : "Loading templates..."}
          </div>
        ) : !propertyData ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Could not load property data. Please try again.</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Past Subject Selection */}
            {pastCampaigns.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Select a Past Subject
                </Label>
                <Select value={selectedPastSubject} onValueChange={handlePastSubjectChange}>
                  <SelectTrigger className={errors?.subject ? "border-red-500" : ""}>
                    <SelectValue placeholder="Choose from past campaigns..." />
                  </SelectTrigger>
                  <SelectContent className="max-w-[500px]">
                    {pastCampaigns.map((item, index) => (
                      <SelectItem key={index} value={`${item.title}|||${item.subject}`} className="cursor-pointer">
                        <div className="flex flex-col gap-0.5 py-1">
                          <span className="text-sm font-medium">{item.subject}</span>
                          <span className="text-xs text-muted-foreground truncate">{item.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Previously used subjects for this property</p>
              </div>
            )}

            {/* Discount Prefix Selection - shown when past subject is selected */}
            {selectedPastSubject && (
              <div className="space-y-2">
                <Label>Discount Prefix</Label>
                <Select value={selectedPrefix} onValueChange={handlePrefixChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_PREFIXES.map((prefix, index) => (
                      <SelectItem key={index} value={prefix}>
                        {prefix.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This prefix will be added to the beginning of your subject line</p>
              </div>
            )}

            {/* Template Selection */}
            {enabledTemplates.length > 0 && (
              <div className="space-y-2">
                <Label>Select a Template</Label>
                <Select value={selectedSubjectTemplate} onValueChange={handleSubjectTemplateChange}>
                  <SelectTrigger className={errors?.subject ? "border-red-500" : ""}>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateRequiresAddress && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>This template requires an address format selection below.</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Address Format Selection (conditional) */}
            {templateRequiresAddress && selectedSubjectTemplate && (
              <div className="space-y-2">
                <Label>Address Format</Label>
                <Select value={selectedAddressTemplate} onValueChange={handleAddressTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select address format..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_FORMAT_TEMPLATES.map((template, index) => (
                      <SelectItem key={index} value={template}>
                        {replaceVariables(template, propertyData) || template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subject Line</Label>
                <span className={`text-xs ${charCount > 150 ? "text-red-500" : "text-muted-foreground"}`}>{charCount}/150</span>
              </div>
              <div className="relative">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleContentInput}
                  className={`min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    errors?.subject ? "border-red-500" : "border-input"
                  }`}
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                />
                <Popover open={showEmojiPicker} onOpenChange={handleEmojiPickerOpenChange}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="absolute bottom-2 right-2">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="end">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" />
                  </PopoverContent>
                </Popover>
              </div>
              {errors?.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
              <p className="text-xs text-muted-foreground">Create a compelling subject line for your discount notification</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
