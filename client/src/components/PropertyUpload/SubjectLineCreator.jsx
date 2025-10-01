// client/src/components/PropertyUpload/SubjectLineCreator.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

const ADDRESS_FORMAT_TEMPLATES = [
  "{streetAddress}, {city}, {state}",
  "{streetAddress}, {city}",
  "{city}, {state}",
  "{streetAddress}",
];

export default function SubjectLineCreator({ 
  propertyData, 
  onSubjectChange,
  errors = {},
  area 
}) {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedSubjectTemplate, setSelectedSubjectTemplate] = useState("");
  const [selectedAddressTemplate, setSelectedAddressTemplate] = useState("");
  const [templateRequiresAddress, setTemplateRequiresAddress] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  // Load templates from Mailivo API
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

  const replaceVariables = (template, data, addressFormat) => {
    let result = template;
    
    // Replace {address} with formatted address if needed
    if (addressFormat && result.includes("{address}")) {
      const formattedAddress = replaceVariables(addressFormat, data);
      result = result.replace(/{address}/g, formattedAddress);
    }
    
    // Replace property variables
    const replacements = {
      county: data.county || "",
      city: data.city || "",
      state: data.state || "",
      zip: data.zip || "",
      streetAddress: data.streetAddress || "",
      acre: data.acre?.toString() || "",
      zoning: data.zoning || "",
      askingPrice: data.askingPrice ? `$${data.askingPrice.toLocaleString()}` : "",
      area: area || data.city || ""
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, "g");
      result = result.replace(regex, value);
    });

    return result;
  };

  const generateSubjectLine = () => {
    const template = templates.find(t => t.id === selectedSubjectTemplate);
    if (!template || !propertyData) return;

    let generated = "";
    if (templateRequiresAddress && selectedAddressTemplate) {
      generated = replaceVariables(template.content, propertyData, selectedAddressTemplate);
    } else if (!templateRequiresAddress) {
      generated = replaceVariables(template.content, propertyData);
    }

    setGeneratedSubject(generated);
    setCustomSubject(generated);
    onSubjectChange(generated);
  };

  const handleSubjectTemplateChange = (templateId) => {
    setSelectedSubjectTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      const requiresAddress = template.variables?.includes("address");
      setTemplateRequiresAddress(requiresAddress);
      
      if (!requiresAddress && propertyData) {
        const generated = replaceVariables(template.content, propertyData);
        setGeneratedSubject(generated);
        setCustomSubject(generated);
        onSubjectChange(generated);
        setSelectedAddressTemplate("");
      } else {
        setSelectedAddressTemplate("");
      }
    }
  };

  const handleAddressTemplateChange = (template) => {
    setSelectedAddressTemplate(template);
  };

  const handleCustomSubjectChange = (e) => {
    const value = e.target.value;
    setCustomSubject(value);
    onSubjectChange(value);
  };

  // Trigger generation when address template changes
  useEffect(() => {
    if (selectedSubjectTemplate && propertyData) {
      if (templateRequiresAddress && selectedAddressTemplate) {
        generateSubjectLine();
      } else if (!templateRequiresAddress) {
        generateSubjectLine();
      }
    }
  }, [selectedSubjectTemplate, selectedAddressTemplate, propertyData, templateRequiresAddress]);

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
        {loadingTemplates ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates...
          </div>
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

            {/* Address Format - Only show if template requires it */}
            {templateRequiresAddress && (
              <div className="space-y-2">
                <Label>Address Format *</Label>
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
                  Required because the template contains an {"{address}"} variable
                </p>
              </div>
            )}
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No templates found. You can still create a custom subject line below.
            </AlertDescription>
          </Alert>
        )}

        {/* Custom Subject Line */}
        <div className="space-y-2">
          <Label>Customize Subject Line</Label>
          <Textarea
            value={customSubject}
            onChange={handleCustomSubjectChange}
            placeholder="Enter your email subject line..."
            maxLength={150}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Maximum 150 characters</span>
            <span>{customSubject.length}/150</span>
          </div>
          {errors.subject && (
            <p className="text-sm text-red-600">{errors.subject}</p>
          )}
        </div>

        {/* Helper Text */}
        {selectedSubjectTemplate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            {templateRequiresAddress ? (
              selectedAddressTemplate ? (
                <p>💡 Template generated! You can customize it above.</p>
              ) : (
                <p>⏳ Please select an address format to complete generation.</p>
              )
            ) : (
              <p>💡 Template generated! You can customize it above.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}