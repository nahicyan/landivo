import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Utility: Format numbers as currency
const formatCurrency = (value) => {
  if (!value || isNaN(value)) return "";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Utility: Format currency for display in input fields
const formatInputCurrency = (value) => {
  if (!value) return "";
  // Remove any non-digit characters except decimal point
  const numericValue = typeof value === 'string' ? value.replace(/[^0-9.]/g, '') : value.toString();
  // Parse to a number and format with commas
  return Number(numericValue).toLocaleString('en-US');
};

// Utility: Parse currency string to number
const parseCurrencyToNumber = (value) => {
  // Remove commas and convert to number
  if (!value) return 0;
  return parseFloat(value.toString().replace(/,/g, ''));
};

// Utility: Format term (in months) into "X Years Y Months"
const formatTerm = (term) => {
  const months = Number(term) || 0;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  let result = "";
  if (years > 0) result += `${years} ${years === 1 ? "Year" : "Years"}`;
  if (remainingMonths > 0) {
    if (result) result += " ";
    result += `${remainingMonths} ${remainingMonths === 1 ? "Month" : "Months"}`;
  }
  return result || "";
};

// Utility: Calculate total interest and total cost
const calculateTotals = (monthlyPayment, loanAmount, downPayment, term) => {
  const payment = parseCurrencyToNumber(monthlyPayment);
  const loan = parseCurrencyToNumber(loanAmount);
  const down = parseCurrencyToNumber(downPayment);
  const months = Number(term) || 0;
  
  if (payment <= 0 || loan <= 0 || months <= 0) {
    return { totalInterest: 0, totalCost: 0 };
  }
  
  const totalLoanPayments = payment * months;
  const totalInterest = totalLoanPayments - loan;
  const totalCost = down + totalLoanPayments;
  
  return {
    totalInterest: Math.max(0, totalInterest),
    totalCost: totalCost
  };
};

export default function PaymentCalculatorBack({ formData, handleChange }) {
  // Sorting options state
  const [sortOption, setSortOption] = useState("");

  // Determine which plans are available
  const isPlan1Available = formData.financing === "Available";
  const isPlan2Available = formData.financeTwo === "Available";
  const isPlan3Available = formData.financeThree === "Available";

  // Enhanced input handler for currency formatting
  const handleCurrencyInputChange = (e) => {
    const { name, value } = e.target;
    
    // Remove commas for proper numeric handling
    const numericValue = value.replace(/,/g, '');
    
    // Update the display value with comma formatting
    const formattedValue = numericValue ? Number(numericValue).toLocaleString('en-US') : '';
    
    // Update the form with the formatted value for display
    handleChange({ 
      target: { 
        name, 
        value: formattedValue,
        // Store original numeric value as a data attribute for calculations
        dataset: { numericValue }
      } 
    });
  };
  
  // Handle blur for general currency inputs
  const handleCurrencyBlur = () => {
    // Trigger recalculation for all available plans to ensure consistency
    if (isPlan1Available) recalcPlan("One");
    if (isPlan2Available) recalcPlan("Two");
    if (isPlan3Available) recalcPlan("Three");
  };

  // For Down Payment manual input with special handling
  const handleDownPaymentChange = (planKey, e) => {
    const { value } = e.target;
    const fieldName = `downPayment${planKey}`;
    
    // Remove commas for calculation
    const numericValue = value.replace(/,/g, '');
    
    // Format for display
    const formattedValue = numericValue ? Number(numericValue).toLocaleString('en-US') : '';
    
    // Update the form data with the formatted value
    handleChange({ target: { name: fieldName, value: formattedValue } });
    
    // Set the source to manual
    handleChange({ target: { name: `downPayment${planKey}Source`, value: "manual" } });
  };
  
  // Handle blur (clicking out) of Down Payment fields
  const handleDownPaymentBlur = (planKey) => {
    // Manually trigger a recalculation for this plan
    recalcPlan(planKey);
  };

  // Helper: Calculate monthly payment using a basic amortization formula
  const calculateMonthlyPayment = (loan, rate, term) => {
    const principal = Number(loan) || 0;
    const annualRate = Number(rate) / 100 || 0;
    const months = Number(term) || 0;
    if (principal <= 0 || annualRate <= 0 || months <= 0) return 0;
    const monthlyRate = annualRate / 12;
    const numerator = monthlyRate * principal;
    const denominator = 1 - Math.pow(1 + monthlyRate, -months);
    return denominator > 0 ? numerator / denominator : 0;
  };

  // Custom handler for Select components
  const handleSelectChange = (name, value) => {
    handleChange({ target: { name, value } });
  };

  // For Sliders: value comes as an array, e.g., [50]
  const handleSliderChange = (name, value) => {
    handleChange({ target: { name, value: value[0] } });
  };

  // Recalculation logic per plan ("One", "Two", "Three")
  // This function is both used by effects and can be called manually
  const recalcPlan = (planKey) => {
    const { term } = formData;
    
    // Parse financing price removing commas
    const financeVal = parseCurrencyToNumber(formData.financingPrice) || 0;

    const downPaymentField = `downPayment${planKey}`;
    const downPaymentPercentField = `downPayment${planKey}Percent`;
    const loanAmountField = `loanAmount${planKey}`;
    const interestRateField = `interest${planKey}`;
    const monthlyPaymentField = `monthlyPayment${planKey}`;
    const totalInterestField = `totalInterest${planKey}`;
    const totalCostField = `totalCost${planKey}`;
    const sliderField = `downPayment${planKey}Slider`;
    const sourceField = `downPayment${planKey}Source`;

    // Parse the down payment value, removing any commas
    const dpManual = parseCurrencyToNumber(formData[downPaymentField]);
    const dpPercentVal = Number(formData[downPaymentPercentField]) || 5;
    const sliderVal = Number(formData[sliderField]) || 0;
    const interestRateVal = Number(formData[interestRateField]) || 0;

    // Determine new down payment based on the last update source
    let newDownPayment = 0;
    const source = formData[sourceField];
    if (source === "manual") {
      newDownPayment = dpManual || 0;
    } else if (source === "selector") {
      newDownPayment = financeVal * (dpPercentVal / 100);
    } else if (source === "slider") {
      newDownPayment = financeVal * (sliderVal / 100);
    }

    // Calculate Loan Amount = financingPrice - downPayment
    const newLoanAmount = financeVal - newDownPayment;
    
    // Calculate Monthly Payment using the amortization formula
    const newMonthlyPayment = calculateMonthlyPayment(newLoanAmount, interestRateVal, Number(term));

    // Calculate totals
    const totals = calculateTotals(newMonthlyPayment, newLoanAmount, newDownPayment, term);

    // Update state with formatted values for display
    handleChange({ 
      target: { 
        name: downPaymentField, 
        value: formatInputCurrency(newDownPayment.toFixed(2)) 
      } 
    });
    
    handleChange({ 
      target: { 
        name: loanAmountField, 
        value: formatInputCurrency(newLoanAmount.toFixed(2)) 
      } 
    });
    
    handleChange({ 
      target: { 
        name: monthlyPaymentField, 
        value: formatInputCurrency(newMonthlyPayment.toFixed(2)) 
      } 
    });

    // Update total interest and total cost
    handleChange({ 
      target: { 
        name: totalInterestField, 
        value: formatInputCurrency(totals.totalInterest.toFixed(2)) 
      } 
    });
    
    handleChange({ 
      target: { 
        name: totalCostField, 
        value: formatInputCurrency(totals.totalCost.toFixed(2)) 
      } 
    });
  };

  // Sort plans based on selected criteria
  const sortPlans = () => {
    // Skip if no sort option is selected
    if (!sortOption) return;

    // Create plan data objects to sort (only for available plans)
    const planData = [];
    
    if (isPlan1Available) {
      planData.push({
        key: "One",
        downPayment: parseCurrencyToNumber(formData.downPaymentOne),
        interest: formData.interestOne,
        monthlyPayment: parseCurrencyToNumber(formData.monthlyPaymentOne),
        downPaymentPercent: formData.downPaymentOnePercent,
        downPaymentSlider: formData.downPaymentOneSlider,
        downPaymentSource: formData.downPaymentOneSource || "manual"
      });
    }
    
    if (isPlan2Available) {
      planData.push({
        key: "Two",
        downPayment: parseCurrencyToNumber(formData.downPaymentTwo),
        interest: formData.interestTwo,
        monthlyPayment: parseCurrencyToNumber(formData.monthlyPaymentTwo),
        downPaymentPercent: formData.downPaymentTwoPercent,
        downPaymentSlider: formData.downPaymentTwoSlider,
        downPaymentSource: formData.downPaymentTwoSource || "manual"
      });
    }
    
    if (isPlan3Available) {
      planData.push({
        key: "Three",
        downPayment: parseCurrencyToNumber(formData.downPaymentThree),
        interest: formData.interestThree,
        monthlyPayment: parseCurrencyToNumber(formData.monthlyPaymentThree),
        downPaymentPercent: formData.downPaymentThreePercent,
        downPaymentSlider: formData.downPaymentThreeSlider,
        downPaymentSource: formData.downPaymentThreeSource || "manual"
      });
    }

    // Sort based on the selected option
    let sortedPlans = [...planData];
    
    switch (sortOption) {
      case "highToLowMonthly":
        sortedPlans.sort((a, b) => b.monthlyPayment - a.monthlyPayment);
        break;
      case "lowToHighMonthly":
        sortedPlans.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
        break;
      case "highToLowDown":
        sortedPlans.sort((a, b) => b.downPayment - a.downPayment);
        break;
      case "lowToHighDown":
        sortedPlans.sort((a, b) => a.downPayment - b.downPayment);
        break;
      case "highToLowInterest":
        sortedPlans.sort((a, b) => parseFloat(b.interest) - parseFloat(a.interest));
        break;
      case "lowToHighInterest":
        sortedPlans.sort((a, b) => parseFloat(a.interest) - parseFloat(b.interest));
        break;
      default:
        return; // No sorting needed
    }

    // Get available plan keys in order
    const availableKeys = [];
    if (isPlan1Available) availableKeys.push("One");
    if (isPlan2Available) availableKeys.push("Two");
    if (isPlan3Available) availableKeys.push("Three");
    
    // Apply the sorted values to the available plans in order
    sortedPlans.forEach((plan, index) => {
      if (index < availableKeys.length) {
        const targetPlanKey = availableKeys[index];
        
        // Update the down payment, interest rate, etc. for each plan based on sorted order
        handleChange({ target: { 
          name: `downPayment${targetPlanKey}`, 
          value: formatInputCurrency(plan.downPayment.toFixed(2)) 
        }});
        
        handleChange({ target: { 
          name: `interest${targetPlanKey}`, 
          value: plan.interest 
        }});
        
        // Also update the percent selector, slider, and source to maintain consistency
        handleChange({ target: { 
          name: `downPayment${targetPlanKey}Percent`, 
          value: plan.downPaymentPercent 
        }});
        
        handleChange({ target: { 
          name: `downPayment${targetPlanKey}Slider`, 
          value: plan.downPaymentSlider 
        }});
        
        handleChange({ target: { 
          name: `downPayment${targetPlanKey}Source`, 
          value: plan.downPaymentSource 
        }});
      }
    });
    
    // Recalculate all available plans to ensure consistency
    if (isPlan1Available) recalcPlan("One");
    if (isPlan2Available) recalcPlan("Two");
    if (isPlan3Available) recalcPlan("Three");
  };

  // Handle sort option change
  const handleSortOptionChange = (value) => {
    setSortOption(value);
  };

  // Effect to trigger sorting when option changes
  useEffect(() => {
    sortPlans();
  }, [sortOption]);

  // Recalculate each plan when relevant fields change:
  useEffect(() => {
    if (isPlan1Available) recalcPlan("One");
  }, [
    formData.financingPrice,
    formData.downPaymentOnePercent,
    formData.downPaymentOneSlider,
    formData.interestOne,
    formData.term,
    formData.downPaymentOneSource,
  ]);

  useEffect(() => {
    if (isPlan2Available) recalcPlan("Two");
  }, [
    formData.financingPrice,
    formData.downPaymentTwoPercent,
    formData.downPaymentTwoSlider,
    formData.interestTwo,
    formData.term,
    formData.downPaymentTwoSource,
  ]);

  useEffect(() => {
    if (isPlan3Available) recalcPlan("Three");
  }, [
    formData.financingPrice,
    formData.downPaymentThreePercent,
    formData.downPaymentThreeSlider,
    formData.interestThree,
    formData.term,
    formData.downPaymentThreeSource,
  ]);

  return (
    <Card className="border border-gray-200 shadow-sm rounded-lg w-full">
      <CardHeader>
        {/* <CardTitle className="text-xl font-bold text-gray-800">
          Landivo Payment Calculator v0.0.0.8
        </CardTitle> */}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* ------------------- Top Section (WARM GRAY THEME) ------------------- */}
        <div className="p-3 bg-[#f5f5f3] border border-[#adadab] rounded-lg">
          {/* ------------------- Row 1 ------------------- */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {/* Asking Price (display-only) */}
            <div>
              <Label className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Asking Price
              </Label>
              <Input
                type="text"
                readOnly
                value={formData.askingPrice}
                className="w-full bg-[#e8e8e6] text-[#333331]"
              />
            </div>
            {/* Financing Price */}
            <div>
              <Label htmlFor="financingPrice" className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Financing Price
              </Label>
              <Input
                id="financingPrice"
                name="financingPrice"
                type="text"
                placeholder="Enter financing price"
                value={formData.financingPrice}
                onChange={handleCurrencyInputChange}
                onBlur={handleCurrencyBlur}
                className="w-full border-[#adadab] focus:border-[#8a8a88]"
              />
            </div>
            {/* Purchase Price */}
            <div>
              <Label htmlFor="purchasePrice" className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Purchase Price (Optional)
              </Label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="text"
                placeholder="Enter purchase price"
                value={formData.purchasePrice}
                onChange={handleCurrencyInputChange}
                className="w-full border-[#adadab]"
              />
            </div>
            {/* Sort Options Dropdown */}
            <div>
              <Label className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Sort Plans By
              </Label>
              <Select 
                value={sortOption}
                onValueChange={handleSortOptionChange}
              >
                <SelectTrigger className="w-full border-[#adadab]">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highToLowMonthly">Monthly High to Low </SelectItem>
                  <SelectItem value="lowToHighMonthly">Monthly Low to High</SelectItem>
                  <SelectItem value="highToLowDown">Down Payment High to Low</SelectItem>
                  <SelectItem value="lowToHighDown">Down Payment Low to High</SelectItem>
                  <SelectItem value="highToLowInterest">Interest High to Low</SelectItem>
                  <SelectItem value="lowToHighInterest">Interest Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ------------------- Row 2 ------------------- */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 mt-2">
            {/* Service Fee */}
            <div>
              <Label htmlFor="serviceFee" className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Service Fee
              </Label>
              <Input
                id="serviceFee"
                name="serviceFee"
                type="text"
                placeholder="Service fee"
                value={formData.serviceFee}
                onChange={handleCurrencyInputChange}
                className="w-full border-[#adadab]"
              />
            </div>
            {/* Tax */}
            <div>
              <Label className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Yearly Tax
              </Label>
              <Input
                type="text"
                readOnly
                value={formData.tax}
                className="w-full bg-[#e8e8e6] text-[#333331]"
              />
            </div>
            {/* HOA Monthly */}
            <div>
              <Label className="block text-sm font-semibold text-[#4a4a48] mb-1">
                HOA Monthly Fee
              </Label>
              <Input
                type="text"
                readOnly
                value={formData.hoaMonthly}
                className="w-full bg-[#e8e8e6] text-[#333331]"
              />
            </div>
            {/* Term Display (in Years + Months) */}
            <div>
              <Label className="block text-sm font-semibold text-[#4a4a48] mb-1">
                Term
              </Label>
              <Input
                type="text"
                readOnly
                value={formatTerm(formData.term)}
                className="w-full bg-[#e8e8e6] text-[#333331]"
              />
            </div>
          </div>

          {/* ------------------- Row 3: Term Slider ------------------- */}
          <div className="grid grid-cols-1 gap-2 mt-2">
            <div>
              <Label className="block text-sm font-semibold text-[#4a4a48] mb-2">
                Term Slider (Months)
              </Label>
              <Slider
                value={[Number(formData.term) || 1]}
                min={1}
                max={360}
                step={1}
                onValueChange={(val) => {
                  handleSliderChange("term", val);
                }}
                className="bg-[#d2d2d0]"
              />
              <p className="text-xs text-[#4a4a48] mt-2">
                Currently: {formData.term} month{Number(formData.term) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================
            PAYMENT PLANS ACCORDION - ENHANCED STYLING
        ============================================================ */}
        <Accordion type="single" collapsible defaultValue="plan1" className="w-full space-y-2">
          {/* ============================================================
              PLAN 1 - ENHANCED SALMON THEME
          ============================================================ */}
          <AccordionItem value="plan1" className={`border-0 shadow-md rounded-xl overflow-hidden ${
            !isPlan1Available ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <AccordionTrigger 
              className={`px-6 py-3 bg-gradient-to-r from-[#EF9C66] to-[#F4B07A] hover:from-[#E6906B] hover:to-[#F1A870] text-white hover:no-underline transition-all duration-300 rounded-t-xl data-[state=closed]:rounded-xl ${
                !isPlan1Available ? 'cursor-not-allowed' : ''
              }`}
              disabled={!isPlan1Available}
            >
              <div className="flex justify-between items-center w-full mr-4">
                <div className="flex flex-col items-start">
                  <h3 className="text-lg font-bold text-white">
                    Payment Plan 1 {!isPlan1Available ? '(Disabled)' : ''}
                  </h3>
                  <span className="text-base text-white font-medium">
                    Down Payment: ${formData.downPaymentOne || '0'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    ${formData.monthlyPaymentOne || '0'}/month
                  </div>
                  <div className="text-base text-white">
                    {formData.interestOne}% APR
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-gradient-to-b from-[#fdf1ea] to-[#fcede3] border-t-0">
              {/* Plan 1 Details */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {/* Down Payment (Plan 1) */}
                <div>
                  <Label htmlFor="downPaymentOne" className="block text-sm font-semibold text-[#c97745] mb-2">
                    Down Payment
                  </Label>
                  <Input
                    id="downPaymentOne"
                    name="downPaymentOne"
                    type="text"
                    placeholder="Enter down payment"
                    value={formData.downPaymentOne}
                    onChange={(e) => handleDownPaymentChange("One", e)}
                    onBlur={() => handleDownPaymentBlur("One")}
                    className="w-full border-[#EF9C66] focus:border-[#E6906B] bg-white shadow-sm"
                    disabled={!isPlan1Available}
                  />
                </div>
                {/* Down Payment Selector (Plan 1) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#c97745] mb-2">
                    Down Payment %
                  </Label>
                  <Select
                    value={formData.downPaymentOnePercent}
                    onValueChange={(val) => {
                      handleSelectChange("downPaymentOnePercent", val);
                      handleSelectChange("downPaymentOneSource", "selector");
                    }}
                    disabled={!isPlan1Available}
                  >
                    <SelectTrigger className="w-full border-[#EF9C66] focus:border-[#E6906B] bg-white shadow-sm">
                      <SelectValue placeholder="Select %" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(19)].map((_, i) => {
                        const percent = 5 + i * 5;
                        return (
                          <SelectItem key={percent} value={String(percent)}>
                            {percent}% (
                            {formatCurrency((parseCurrencyToNumber(formData.financingPrice) || 0) * (percent / 100))}
                            )
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Loan Amount (Plan 1) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#c97745] mb-2">
                    Loan Amount
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.loanAmountOne}
                    className="w-full bg-gradient-to-r from-[#fceae0] to-[#fae4d7] text-[#c97745] font-semibold shadow-sm border-[#EF9C66] border-2"
                  />
                </div>
                {/* Interest Rate (Plan 1) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#c97745] mb-2">
                    Interest Rate
                  </Label>
                  <Select
                    value={formData.interestOne}
                    onValueChange={(val) => handleSelectChange("interestOne", val)}
                    disabled={!isPlan1Available}
                  >
                    <SelectTrigger className="w-full border-[#EF9C66] focus:border-[#E6906B] bg-white shadow-sm">
                      <SelectValue placeholder="Select Rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(11)].map((_, i) => {
                        const rate = (4.99 + i).toFixed(2);
                        return (
                          <SelectItem key={rate} value={rate}>
                            {rate}%
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Plan 1 Total Interest and Total Cost Row */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-3">
                {/* Total Interest (Plan 1) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#c97745] mb-2">
                    Total Interest
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.totalInterestOne || '0'}
                    className="w-full bg-gradient-to-r from-[#fceae0] to-[#fae4d7] text-[#c97745] font-semibold shadow-sm border-[#EF9C66] border-2"
                    />
                </div>
                {/* Total Cost (Plan 1) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#c97745] mb-2">
                    Total Cost
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.totalCostOne || '0'}
                    className="w-full bg-gradient-to-r from-[#fceae0] to-[#fae4d7] text-[#c97745] font-semibold shadow-sm border-[#EF9C66] border-2"
                    />
                </div>
              </div>

              {/* Plan 1 Slider & Monthly Payment */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {/* Slider (3/4 width) */}
                <div className="col-span-3">
                  <Label className="block text-sm font-semibold text-[#c97745] mb-3">
                    Down Payment vs. Loan Amount
                  </Label>
                  <Slider
                    value={[Number(formData.downPaymentOneSlider) || 0]}
                    min={0}
                    max={100}
                    step={0.5}
                    onValueChange={(val) => {
                      handleSliderChange("downPaymentOneSlider", val);
                      handleSelectChange("downPaymentOneSource", "slider");
                    }}
                    className="bg-gradient-to-r from-[#EF9C66] to-[#F4B07A]"
                    disabled={!isPlan1Available}
                  />
                  <p className="text-xs text-[#c97745] mt-2 font-medium">
                    Currently: {formData.downPaymentOneSlider || 0}%
                  </p>
                </div>
                {/* Monthly Payment (1/4 width) */}
                <div className="col-span-1">
                  <Label className="block text-sm font-semibold text-[#c97745] mb-2">
                    Monthly Payment
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      readOnly
                      value={formData.monthlyPaymentOne}
                      className="w-full bg-gradient-to-r from-[#EF9C66] to-[#F4B07A] text-white font-bold text-lg shadow-lg border-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#EF9C66]/20 to-[#F4B07A]/20 rounded pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ============================================================
              PLAN 2 - ENHANCED SAGE THEME
          ============================================================ */}
          <AccordionItem value="plan2" className={`border-0 shadow-md rounded-xl overflow-hidden ${
            !isPlan2Available ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <AccordionTrigger 
              className={`px-6 py-3 bg-gradient-to-r from-[#C8CFA0] to-[#D4DBA8] hover:from-[#BEC59A] hover:to-[#D0D7A2] text-white hover:no-underline transition-all duration-300 rounded-t-xl data-[state=closed]:rounded-xl ${
                !isPlan2Available ? 'cursor-not-allowed' : ''
              }`}
              disabled={!isPlan2Available}
            >
              <div className="flex justify-between items-center w-full mr-4">
                <div className="flex flex-col items-start">
                  <h3 className="text-lg font-bold text-[#4a5235]">
                    Payment Plan 2 {!isPlan2Available ? '(Disabled)' : ''}
                  </h3>
                  <span className="text-base text-[#4a5235] font-medium">
                    Down Payment: ${formData.downPaymentTwo || '0'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#4a5235]">
                    ${formData.monthlyPaymentTwo || '0'}/month
                  </div>
                  <div className="text-base text-[#4a5235]">
                    {formData.interestTwo}% APR
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-gradient-to-b from-[#f6f7ed] to-[#f3f4ea] border-t-0">
              {/* Plan 2 Details */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {/* Down Payment (Plan 2) */}
                <div>
                  <Label htmlFor="downPaymentTwo" className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Down Payment
                  </Label>
                  <Input
                    id="downPaymentTwo"
                    name="downPaymentTwo"
                    type="text"
                    placeholder="Enter down payment"
                    value={formData.downPaymentTwo}
                    onChange={(e) => handleDownPaymentChange("Two", e)}
                    onBlur={() => handleDownPaymentBlur("Two")}
                    className="w-full border-[#C8CFA0] focus:border-[#BEC59A] bg-white shadow-sm"
                    disabled={!isPlan2Available}
                  />
                </div>
                {/* Down Payment Selector (Plan 2) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Down Payment %
                  </Label>
                  <Select
                    value={formData.downPaymentTwoPercent}
                    onValueChange={(val) => {
                      handleSelectChange("downPaymentTwoPercent", val);
                      handleSelectChange("downPaymentTwoSource", "selector");
                    }}
                    disabled={!isPlan2Available}
                  >
                    <SelectTrigger className="w-full border-[#C8CFA0] focus:border-[#BEC59A] bg-white shadow-sm">
                      <SelectValue placeholder="Select %" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(19)].map((_, i) => {
                        const percent = 5 + i * 5;
                        return (
                          <SelectItem key={percent} value={String(percent)}>
                            {percent}% (
                            {formatCurrency((parseCurrencyToNumber(formData.financingPrice) || 0) * (percent / 100))}
                            )
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Loan Amount (Plan 2) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Loan Amount
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.loanAmountTwo}
                    className="w-full bg-gradient-to-r from-[#f4f5ee] to-[#f2f3ec] text-[#7a8062] font-semibold shadow-sm border-[#C8CFA0] border-2"
                  />
                </div>
                {/* Interest Rate (Plan 2) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Interest Rate
                  </Label>
                  <Select
                    value={formData.interestTwo}
                    onValueChange={(val) => handleSelectChange("interestTwo", val)}
                    disabled={!isPlan2Available}
                  >
                    <SelectTrigger className="w-full border-[#C8CFA0] focus:border-[#BEC59A] bg-white shadow-sm">
                      <SelectValue placeholder="Select Rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(11)].map((_, i) => {
                        const rate = (4.99 + i).toFixed(2);
                        return (
                          <SelectItem key={rate} value={rate}>
                            {rate}%
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Plan 2 Total Interest and Total Cost Row */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-3">
                {/* Total Interest (Plan 2) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Total Interest
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.totalInterestTwo || '0'}
                    className="w-full bg-gradient-to-r from-[#f4f5ee] to-[#f2f3ec] text-[#7a8062] font-semibold shadow-sm border-[#C8CFA0] border-2"
                    />
                </div>
                {/* Total Cost (Plan 2) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Total Cost
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.totalCostTwo || '0'}
                    className="w-full bg-gradient-to-r from-[#f4f5ee] to-[#f2f3ec] text-[#7a8062] font-semibold shadow-sm border-[#C8CFA0] border-2"
                    />
                </div>
              </div>

              {/* Plan 2 Slider & Monthly Payment */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {/* Slider (3/4 width) */}
                <div className="col-span-3">
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-3">
                    Down Payment vs. Loan Amount
                  </Label>
                  <Slider
                    value={[Number(formData.downPaymentTwoSlider) || 0]}
                    min={0}
                    max={100}
                    step={0.5}
                    onValueChange={(val) => {
                      handleSliderChange("downPaymentTwoSlider", val);
                      handleSelectChange("downPaymentTwoSource", "slider");
                    }}
                    className="bg-gradient-to-r from-[#C8CFA0] to-[#D4DBA8]"
                    disabled={!isPlan2Available}
                  />
                  <p className="text-xs text-[#7a8062] mt-2 font-medium">
                    Currently: {formData.downPaymentTwoSlider || 0}%
                  </p>
                </div>
                {/* Monthly Payment (1/4 width) */}
                <div className="col-span-1">
                  <Label className="block text-sm font-semibold text-[#7a8062] mb-2">
                    Monthly Payment
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      readOnly
                      value={formData.monthlyPaymentTwo}
                      className="w-full bg-gradient-to-r from-[#C8CFA0] to-[#D4DBA8] text-[#4a5235] font-bold text-lg shadow-lg border-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C8CFA0]/20 to-[#D4DBA8]/20 rounded pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ============================================================
              PLAN 3 - ENHANCED GOLD THEME
          ============================================================ */}
          <AccordionItem value="plan3" className={`border-0 shadow-md rounded-xl overflow-hidden ${
            !isPlan3Available ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <AccordionTrigger 
              className={`px-6 py-3 bg-gradient-to-r from-[#E7C05F] to-[#F0CE6F] hover:from-[#E1BA59] hover:to-[#EBC869] text-white hover:no-underline transition-all duration-300 rounded-t-xl data-[state=closed]:rounded-xl ${
                !isPlan3Available ? 'cursor-not-allowed' : ''
              }`}
              disabled={!isPlan3Available}
            >
              <div className="flex justify-between items-center w-full mr-4">
                <div className="flex flex-col items-start">
                  <h3 className="text-lg font-bold text-[#5d4a1a]">
                    Payment Plan 3 {!isPlan3Available ? '(Disabled)' : ''}
                  </h3>
                  <span className="text-base text-[#5d4a1a] font-medium">
                   Down Payment: ${formData.downPaymentThree || '0'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#5d4a1a]">
                    ${formData.monthlyPaymentThree || '0'}/month
                  </div>
                  <div className="text-base text-[#5d4a1a]">
                    {formData.interestThree}% APR
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-gradient-to-b from-[#fdf7e8] to-[#fbf3e0] border-t-0">
              {/* Plan 3 Details */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {/* Down Payment (Plan 3) */}
                <div>
                  <Label htmlFor="downPaymentThree" className="block text-sm font-semibold text-[#b39032] mb-2">
                    Down Payment
                  </Label>
                  <Input
                    id="downPaymentThree"
                    name="downPaymentThree"
                    type="text"
                    placeholder="Enter down payment"
                    value={formData.downPaymentThree}
                    onChange={(e) => handleDownPaymentChange("Three", e)}
                    onBlur={() => handleDownPaymentBlur("Three")}
                    className="w-full border-[#E7C05F] focus:border-[#E1BA59] bg-white shadow-sm"
                    disabled={!isPlan3Available}
                  />
                </div>
                {/* Down Payment Selector (Plan 3) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#b39032] mb-2">
                    Down Payment %
                  </Label>
                  <Select
                    value={formData.downPaymentThreePercent}
                    onValueChange={(val) => {
                      handleSelectChange("downPaymentThreePercent", val);
                      handleSelectChange("downPaymentThreeSource", "selector");
                    }}
                    disabled={!isPlan3Available}
                  >
                    <SelectTrigger className="w-full border-[#E7C05F] focus:border-[#E1BA59] bg-white shadow-sm">
                      <SelectValue placeholder="Select %" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(19)].map((_, i) => {
                        const percent = 5 + i * 5;
                        return (
                          <SelectItem key={percent} value={String(percent)}>
                            {percent}% (
                            {formatCurrency((parseCurrencyToNumber(formData.financingPrice) || 0) * (percent / 100))}
                            )
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Loan Amount (Plan 3) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#b39032] mb-2">
                    Loan Amount
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.loanAmountThree}
                    className="w-full bg-gradient-to-r from-[#fdf0d1] to-[#fbecc9] text-[#b39032] font-semibold shadow-sm border-[#E7C05F] border-2"
                  />
                </div>
                {/* Interest Rate (Plan 3) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#b39032] mb-2">
                    Interest Rate
                  </Label>
                  <Select
                    value={formData.interestThree}
                    onValueChange={(val) => handleSelectChange("interestThree", val)}
                    disabled={!isPlan3Available}
                  >
                    <SelectTrigger className="w-full border-[#E7C05F] focus:border-[#E1BA59] bg-white shadow-sm">
                      <SelectValue placeholder="Select Rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(11)].map((_, i) => {
                        const rate = (4.99 + i).toFixed(2);
                        return (
                          <SelectItem key={rate} value={rate}>
                            {rate}%
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Plan 3 Total Interest and Total Cost Row */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-3">
                {/* Total Interest (Plan 3) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#b39032] mb-2">
                    Total Interest
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.totalInterestThree || '0'}
                    className="w-full bg-gradient-to-r from-[#fdf0d1] to-[#fbecc9] text-[#b39032] font-semibold shadow-sm border-[#E7C05F] border-2"
                    />      
                </div>
                {/* Total Cost (Plan 3) */}
                <div>
                  <Label className="block text-sm font-semibold text-[#b39032] mb-2">
                    Total Cost
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    value={formData.totalCostThree || '0'}
                    className="w-full bg-gradient-to-r from-[#fdf0d1] to-[#fbecc9] text-[#b39032] font-semibold shadow-sm border-[#E7C05F] border-2"
                    />
                </div>
              </div>

              {/* Plan 3 Slider & Monthly Payment */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                {/* Slider (3/4 width) */}
                <div className="col-span-3">
                  <Label className="block text-sm font-semibold text-[#b39032] mb-3">
                    Down Payment vs. Loan Amount
                  </Label>
                  <Slider
                    value={[Number(formData.downPaymentThreeSlider) || 0]}
                    min={0}
                    max={100}
                    step={0.5}
                    onValueChange={(val) => {
                      handleSliderChange("downPaymentThreeSlider", val);
                      handleSelectChange("downPaymentThreeSource", "slider");
                    }}
                    className="bg-gradient-to-r from-[#E7C05F] to-[#F0CE6F]"
                    disabled={!isPlan3Available}
                  />
                  <p className="text-xs text-[#b39032] mt-2 font-medium">
                    Currently: {formData.downPaymentThreeSlider || 0}%
                  </p>
                </div>
                {/* Monthly Payment (1/4 width) */}
                <div className="col-span-1">
                  <Label className="block text-sm font-semibold text-[#b39032] mb-2">
                    Monthly Payment
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      readOnly
                      value={formData.monthlyPaymentThree}
                      className="w-full bg-gradient-to-r from-[#E7C05F] to-[#F0CE6F] text-[#5d4a1a] font-bold text-lg shadow-lg border-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E7C05F]/20 to-[#F0CE6F]/20 rounded pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}