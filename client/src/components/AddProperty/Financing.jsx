"use client";

import React, { useState, useEffect } from "react";
import PaymentCalculatorBack from "@/components/PaymentCalculator/PaymentCalculatorBack";
import PaymentCalculatorEntry from "@/components/PaymentCalculator/PaymentCalculatorEntry";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, CreditCard, Sparkles } from "lucide-react";

export default function Financing({ formData, handleChange, updateFormData, errors }) {
  // Local state to manage the modal
  const [openModal, setOpenModal] = useState(false);
  const [planType, setPlanType] = useState(null); // "CALC" or "ENTRY"
  // Temporary state for modal edits
  const [tempData, setTempData] = useState(formData);
  
  // State for number of payment plans - default to "0" (Not Available)
  const [numberOfPlans, setNumberOfPlans] = useState(() => {
    // Initialize based on current formData, default to "0"
    if (formData.financingThree === "Available") return "3";
    if (formData.financingTwo === "Available") return "2";
    if (formData.financing === "Available") return "1";
    return "0"; // Default to Not Available
  });

  // Whenever parent's formData changes, sync tempData
  useEffect(() => {
    setTempData(formData);
  }, [formData]);

  // Handle number of plans change
  const handleNumberOfPlansChange = (value) => {
    setNumberOfPlans(value);
    
    // Update the financing fields based on selection
    const updatedData = { ...formData };
    
    switch (value) {
      case "1":
        updatedData.financing = "Available";
        updatedData.financingTwo = "Not-Available";
        updatedData.financingThree = "Not-Available";
        break;
      case "2":
        updatedData.financing = "Available";
        updatedData.financingTwo = "Available";
        updatedData.financingThree = "Not-Available";
        break;
      case "3":
        updatedData.financing = "Available";
        updatedData.financingTwo = "Available";
        updatedData.financingThree = "Available";
        break;
      default: // "0"
        updatedData.financing = "Not-Available";
        updatedData.financingTwo = "Not-Available";
        updatedData.financingThree = "Not-Available";
        break;
    }
    
    updateFormData(updatedData);
  };

  // Initialize calculator data from formData
  const prepareCalculatorData = (data) => {
    // Make a deep copy of formData
    const calculatorData = { ...data };
    
    // Initialize financingPrice if not set - use askingPrice as default
    if (!calculatorData.financingPrice && calculatorData.askingPrice) {
      calculatorData.financingPrice = calculatorData.askingPrice;
    }
    
    // Ensure other required fields are initialized
    if (!calculatorData.term) calculatorData.term = "60"; // Default to 5 years
    if (!calculatorData.interestOne) calculatorData.interestOne = "4.99";
    if (!calculatorData.interestTwo) calculatorData.interestTwo = "5.99";
    if (!calculatorData.interestThree) calculatorData.interestThree = "6.99";
    
    // Initialize down payment percentages if not set
    if (!calculatorData.downPaymentOnePercent) calculatorData.downPaymentOnePercent = "5";
    if (!calculatorData.downPaymentTwoPercent) calculatorData.downPaymentTwoPercent = "10";
    if (!calculatorData.downPaymentThreePercent) calculatorData.downPaymentThreePercent = "15";
    
    // Initialize down payment sliders if not set
    if (!calculatorData.downPaymentOneSlider) calculatorData.downPaymentOneSlider = "5";
    if (!calculatorData.downPaymentTwoSlider) calculatorData.downPaymentTwoSlider = "10";
    if (!calculatorData.downPaymentThreeSlider) calculatorData.downPaymentThreeSlider = "15";
    
    // Initialize source fields if not set
    if (!calculatorData.downPaymentOneSource) calculatorData.downPaymentOneSource = "selector";
    if (!calculatorData.downPaymentTwoSource) calculatorData.downPaymentTwoSource = "selector";
    if (!calculatorData.downPaymentThreeSource) calculatorData.downPaymentThreeSource = "selector";
    
    return calculatorData;
  };

  // Open the modal and initialize tempData from parent's formData
  const openModalWithPlan = (type) => {
    // Check if number of plans is selected and not "Not Available"
    if (numberOfPlans === "0") {
      return;
    }
    
    setPlanType(type);
    // Initialize calculator data with proper defaults
    setTempData(prepareCalculatorData(formData));
    setOpenModal(true);
  };

  // Close modal without updating parent's state
  const handleCancel = () => {
    setOpenModal(false);
  };

  // Apply changes: update parent's formData with tempData
  const handleApply = () => {
    updateFormData(tempData);
    setOpenModal(false);
  };

  // Update tempData when changes are made in the modal
  const handleTempChange = (e) => {
    setTempData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Check if payment plans are available
  const isPaymentPlansAvailable = formData.financing === "Available";

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] w-full max-w-xl mx-auto">
      <Card className="w-full border-2 border-gradient-to-r from-[#3f4f24] to-[#324c48] shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-gradient-to-r from-[#3f4f24] to-[#324c48] rounded-full">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-[#3f4f24] to-[#324c48] bg-clip-text text-transparent">
            Financing & Payment Plans
          </CardTitle>
          <p className="text-gray-600 text-sm mt-1">Configure payment options for this property</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Number of Payment Plans Selector - Full Width */}
          <div className="w-full">
            <label className="block text-base font-bold text-gray-800 mb-3 text-center">
              Payment Plan Configuration
            </label>
            <Select
              value={numberOfPlans}
              onValueChange={handleNumberOfPlansChange}
            >
              <SelectTrigger className={`w-full h-12 text-base border-2 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl ${
                errors?.financing 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 focus:border-[#3f4f24] hover:border-[#3f4f24]'
              } bg-white`}>
                <SelectValue placeholder="Select payment plan configuration" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="0" className="text-base py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Not Available</span>
                  </div>
                </SelectItem>
                <SelectItem value="1" className="text-base py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#EF9C66] rounded-full"></div>
                    <span>1 Payment Plan</span>
                  </div>
                </SelectItem>
                <SelectItem value="2" className="text-base py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#C8CFA0] rounded-full"></div>
                    <span>2 Payment Plans</span>
                  </div>
                </SelectItem>
                <SelectItem value="3" className="text-base py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#E7C05F] rounded-full"></div>
                    <span>3 Payment Plans</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors?.financing && (
              <p className="text-red-500 text-sm mt-2 text-center">Payment plan configuration is required</p>
            )}
          </div>

          {/* Action Buttons */}
          {isPaymentPlansAvailable ? (
            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <Button
                  type="button"
                  className="h-10 bg-gradient-to-r from-[#3f4f24] to-[#324c48] hover:from-[#2c3b18] hover:to-[#253838] text-white font-medium text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => openModalWithPlan("CALC")}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Payment Calculator
                </Button>
                
                <Button
                  type="button"
                  className="h-10 bg-gradient-to-r from-[#D4A017] to-[#b88914] hover:from-[#b88914] hover:to-[#8a670f] text-white font-medium text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => openModalWithPlan("ENTRY")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="font-medium text-sm">Payment plans are configured and ready</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-1">No Payment Plans Available</h3>
                <p className="text-gray-500 text-sm">Select a payment plan configuration above to enable financing options.</p>
              </div>
            </div>
          )}

          {/* Modal for Payment Calculations/Entry */}
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogContent className="max-w-6xl mx-auto bg-[#FDF8F2]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {planType === "CALC"
                    ? "Payment Calculator - Configure Payment Plans"
                    : "Manual Payment Plan Entry"}
                </DialogTitle>
              </DialogHeader>

              {planType === "CALC" ? (
                <PaymentCalculatorBack
                  formData={tempData}
                  handleChange={handleTempChange}
                />
              ) : planType === "ENTRY" ? (
                <PaymentCalculatorEntry
                  formData={tempData}
                  handleChange={handleTempChange}
                />
              ) : null}

              <DialogFooter>
                <Button
                  onClick={handleCancel}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  className="bg-gradient-to-r from-[#3f4f24] to-[#324c48] hover:from-[#2c3b18] hover:to-[#253838] text-white px-6 py-2"
                >
                  Apply Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}