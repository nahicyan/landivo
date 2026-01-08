"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useShowAddress } from "@/utils/addressUtils";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Lucide Icons (https://lucide.dev/icons)
import {
  CarFront,
  UtilityPole,
  MapPinned,
  UmbrellaOff,
  NotebookPen,
  DollarSign,
  Home,
  Info,
  FileText,
  Download,
  BarChart,
} from "lucide-react";
import PropertyMap from "../PropertyMap/PropertyMap";
import PaymentCalculatorFront from "@/components/PaymentCalculator/PaymentCalculatorFront";
import PreQualification from "@/components/PreQualification/PreQualification";

export default function PropertyDetailsDetails({ propertyData }) {
  const navigate = useNavigate();
  const showAddress = useShowAddress(propertyData?.toggleObscure);

  // Handle contact button click
  const handleContactClick = () => {
    navigate('/support');
  };

  return (
    <div className="bg-[FFF] text-[var(--text)]">
      {/* Two columns: "Location" & "Property details" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Location */}
        <div>
          <h2 className="text-xl font-medium text-gray-800 mb-4 tracking-tight">
            Location
          </h2>
          <Table className="w-full text-lg">
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Street Address
                </TableCell>
                <TableCell>
                  {propertyData.toggleObscure && !showAddress ? (
                    <Button
                      onClick={handleContactClick}
                      className="bg-[#84aea8] hover:bg-[#517b75] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                    >
                      Contact For Street Address
                    </Button>
                  ) : (
                    propertyData.streetAddress
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  County
                </TableCell>
                <TableCell>{propertyData.county}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  State
                </TableCell>
                <TableCell>{propertyData.state}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">Zip</TableCell>
                <TableCell>{propertyData.zip}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Coordinates
                </TableCell>
                <TableCell>
                  <span className="flex justify-between items-center w-full">
                    {/* Display Coordinates */}
                    <span>
                      {propertyData.latitude}, {propertyData.longitude}
                    </span>

                    {/* Car Icon as a Button */}
                    
                     <a href={`https://www.google.com/maps/dir/?api=1&destination=${propertyData.latitude},${propertyData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2"
                    >
                      <CarFront className="w-6 h-6 text-gray-600" />
                    </a>
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Right Column: Property details */}
        <div>
          <h2 className="text-xl font-medium text-gray-800 mb-4 tracking-tight">
            Property Details
          </h2>
          <Table className="w-full text-lg">
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Size
                </TableCell>
                <TableCell>{propertyData.sqft?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Acreage
                </TableCell>
                <TableCell>{propertyData.acre}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Zoning
                </TableCell>
                <TableCell>{propertyData.zoning}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Parcel
                </TableCell>
                <TableCell>{propertyData.apnOrPin}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-700">
                  Legal Description
                </TableCell>
                <TableCell>{propertyData.legalDescription}</TableCell>
              </TableRow>
              {/* Add more property fields as needed */}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Accordion sections (sample items with icons) */}
      <Accordion type="single" collapsible className="mt-8 space-y-2">
        <AccordionItem value="Direction" className="border-b border-[#c1d7d3]">
          <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
            <div className="flex items-center gap-2">
              <CarFront className="w-6 h-6 text-gray-600" />
              <span>Direction</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <span className="flex items-center gap-2 text-base">
              {propertyData.direction && <span>{propertyData.direction}.</span>}
              <p>For driving directions,</p>
              
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${propertyData.latitude},${propertyData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="link" className="text-primary px-0 text-base">
                  Click here
                </Button>
              </a>
            </span>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="Untilities" className="border-b border-[#c1d7d3]">
          <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
            <div className="flex items-center gap-2">
              <UtilityPole className="w-6 h-6 text-gray-600" />
              <span>Utilites & Infrastructure</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Table className="w-[70%] text-lg">
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">
                    Water
                  </TableCell>
                  <TableCell>{propertyData.water}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">
                    Sewer
                  </TableCell>
                  <TableCell>{propertyData.sewer}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">
                    Electricity
                  </TableCell>
                  <TableCell>{propertyData.electric}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">
                    Road Condition
                  </TableCell>
                  <TableCell>{propertyData.roadCondition}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-700">
                    Mobile Home Friendly
                  </TableCell>
                  <TableCell>{propertyData.mobileHomeFriendly}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        <Accordion
          type="single"
          collapsible
          defaultValue="Map"
          className="mt-8 space-y-2"
        >
          <AccordionItem value="Map" className="border-b border-[#c1d7d3]">
            <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
              <div className="flex items-center gap-2">
                <MapPinned className="w-6 h-6 text-gray-600" />
                <span>Map</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <PropertyMap propertyData={propertyData} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {propertyData.financing === "Available" && (
          <Accordion
            type="single"
            collapsible
            defaultValue="MonthlyPayment"
            className="mt-8 space-y-2"
          >
            <AccordionItem
              value="MonthlyPayment"
              className="border-b border-[#c1d7d3]"
            >
              <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                  <span>Financing</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <PaymentCalculatorFront propertyData={propertyData} />
                <PreQualification />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {propertyData.hoaPoa === "Yes" && (
          <AccordionItem value="HOA" className="border-b border-[#c1d7d3]">
            <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
              <div className="flex items-center gap-2">
                <Home className="w-6 h-6 text-gray-600" />
                <span>Homeowners Association</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-base tracking-tight">
                Total {propertyData.hoaPaymentTerms} Association Fee: $
                {propertyData.hoaFee}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        
        {/* CMA Section - only rendered when hasCma is true */}
        {propertyData.hasCma && (
          <Accordion
            type="single"
            collapsible
            defaultValue="CMA" // Always open by default
            className="mt-8 space-y-2"
          >
            <AccordionItem value="CMA" className="border-b border-[#c1d7d3]">
              <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
                <div className="flex items-center gap-2">
                  <BarChart className="w-6 h-6 text-[#324c48]" />
                  <span className="text-[#324c48] font-semibold">Comparative Market Analysis</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 py-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
                  <p className="text-blue-800 text-sm">
                    A comparative market analysis (CMA) shows how this property compares to similar
                    properties in the area, helping you understand its market positioning.
                  </p>
                </div>

                {/* CMA Content */}
                {propertyData.cmaData && (
                  <div 
                    className="prose prose-sm max-w-none mb-6 text-gray-700" 
                    dangerouslySetInnerHTML={{ __html: propertyData.cmaData }}
                  />
                )}

                {/* CMA File Download */}
                {propertyData.cmaFilePath && (
                  <div className="mt-6 flex items-center">
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex items-center space-x-4 w-full max-w-xl">
                      <div className="bg-[#324c48]/10 p-3 rounded-full">
                        <FileText className="h-6 w-6 text-[#324c48]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-800 font-medium">CMA Document</h4>
                        <p className="text-gray-500 text-sm">Detailed market analysis report (PDF)</p>
                      </div>
                      <Button
                        className="bg-[#324c48] text-white hover:bg-[#263938] transition-colors"
                        onClick={() => window.open(`${import.meta.env.VITE_SERVER_URL}/property/${propertyData.id}/cma-document`, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
                
                {!propertyData.cmaData && !propertyData.cmaFilePath && (
                  <p className="text-gray-500 italic">
                    Comparative market analysis is available for this property. Please contact the agent for more details.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        {propertyData.floodplain !== "No" && (
          <AccordionItem
            value="Enviromental Risk"
            className="border-b border-[#c1d7d3]"
          >
            <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
              <div className="flex items-center gap-2">
                <UmbrellaOff className="w-6 h-6 text-gray-600" />
                <span>Enviromental Risk</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table className="w-[50%] text-base tracking-tight">
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-700">
                      Floodplain
                    </TableCell>
                    <TableCell>{propertyData.floodplain}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        )}
        {propertyData.notes && (
          <AccordionItem value="Notes" className="border-b border-[#c1d7d3]">
            <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
              <div className="flex items-center gap-2">
                <Info className="w-6 h-6 text-gray-600" />
                <span>Additional Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="text-base"
                dangerouslySetInnerHTML={{ __html: propertyData.notes }}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        <Accordion type="single" collapsible defaultValue="Notes">
          <AccordionItem value="Notes" className="border-b border-[#c1d7d3]">
            <AccordionTrigger className="flex items-center justify-between w-full text-left text-xl font-medium text-gray-800 tracking-tight">
              <div className="flex items-center gap-2">
                <NotebookPen className="w-6 h-6 text-gray-600" />
                <span>Buyer Guidelines</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-base w-[75%]">
                <p> Buyer pays ALL closing costs.</p>
                <p> Cash OR Hard Money Only.</p>
                <p>
                  {" "}
                  A $395 transaction fee applies to each contract and is payable
                  by the buyer.
                </p>
                <p> This Property is being sold AS-IS.</p>
                <p> No Daisy Chaining – No Option Period.</p>
                <p> Due diligence required before submitting an offer.</p>
                <p>
                  {" "}
                  Agents, please add your commission to the buyer's sales price.
                </p>
                <p> Earnest money deposit varies per property.</p>
                <p> Closing ASAP.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Accordion>
    </div>
  );
}
