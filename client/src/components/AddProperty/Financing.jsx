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

export default function Financing({ formData, handleChange, updateFormData }) {
  // Local state to manage the modal
  const [openModal, setOpenModal] = useState(false);
  const [planType, setPlanType] = useState(null); // "CALC" or "ENTRY"
  // Temporary state for modal edits
  const [tempData, setTempData] = useState(formData);

  // Whenever parent's formData changes, sync tempData
  useEffect(() => {
    setTempData(formData);
  }, [formData]);

  // Initialize calculator data from formData
  const prepareCalculatorData = (data) => {
    // Make a deep copy of formData
    const calculatorData = { ...data };
    
    // Initialize financingPrice if not set - use askingPrice as default
    if (!calculatorData.financingPrice && calculatorData.askingPrice) {
      calculatorData.financingPrice = calculatorData.askingPrice;
    }
    
    // Ensure other required fields are initialized
    if (!calculatorData.term) calculatorData.term = "60"; // Default to 15 years
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

  return (
    <Card className="border border-gray-200 shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Financing and Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Plans Selector */}
        <div className="mb-4 w-64">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Payment Plans
          </label>
          <Select
            name="financing"
            value={formData.financing}
            onValueChange={(value) =>
              updateFormData({ ...formData, financing: value })
            }
          >
            <SelectTrigger className="w-full border border-gray-300 rounded-md">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not-Available">Not Available</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Are Payment Plans available?
          </p>
        </div>

        {/* Show calculator buttons if Payment Plans are available */}
        {formData.financing === "Available" && (
          <div className="flex items-center gap-4">
            <Button
              type="button"
              className="bg-[#3f4f24] hover:bg-[#324c48] text-white px-4 py-2 rounded-md"
              onClick={() => openModalWithPlan("CALC")}
            >
              Use Payment Calculator
            </Button>
            <Button
              type="button"
              className="bg-[#3f4f24] hover:bg-[#324c48] text-white px-4 py-2 rounded-md"
              onClick={() => openModalWithPlan("ENTRY")}
            >
              Payment Plan Entry
            </Button>
          </div>
        )}

        {/* Modal for Payment Calculations/Entry */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-6xl mx-auto bg-[#FDF8F2]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                {planType === "CALC"
                  ? "Calculate Monthly Payments & Create Payment Plans"
                  : "Payment Plan Entry"}
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
                className="bg-gray-400 hover:bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-[#3f4f24] hover:bg-[#324c48] text-white"
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}