"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

/**
 * Component to display CMA information in property details
 */
export default function PropertyCmaDetails({ propertyData }) {
  // Skip rendering if no CMA data is available
  if (!propertyData.hasCma) {
    return null;
  }

  // Handler for downloading the CMA document
  const handleDownloadCma = () => {
    if (!propertyData.id || !propertyData.cmaFilePath) return;
    
    // Construct the URL for downloading the CMA document
    const downloadUrl = `${import.meta.env.VITE_SERVER_URL}/residency/${propertyData.id}/cma-document`;
    
    // Open the document in a new tab
    window.open(downloadUrl, '_blank');
  };

  return (
    <Accordion type="single" collapsible className="mt-4 space-y-2">
      <AccordionItem value="cma" className="border-b border-[#c1d7d3]">
        <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-gray-600" />
            <span>Comparative Market Analysis</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="py-4">
          {/* CMA Content */}
          {propertyData.cmaData && (
            <div 
              className="prose prose-sm max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: propertyData.cmaData }}
            />
          )}
          
          {/* Download button for CMA document */}
          {propertyData.cmaFilePath && (
            <div className="mt-4">
              <Button
                onClick={handleDownloadCma}
                className="bg-[#324c48] text-white hover:bg-[#253838] flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CMA Document
              </Button>
            </div>
          )}
          
          {/* Show when no content is available */}
          {!propertyData.cmaData && !propertyData.cmaFilePath && (
            <p className="text-gray-500 italic">
              Comparative market analysis information is available for this property. Please contact the agent for details.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}