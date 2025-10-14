// client/src/pages/Discount/Discount.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { getProperty, updateProperty } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Loader2, Calculator, CalendarIcon, ArrowLeft, Percent, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import PaymentCalculatorBack from "@/components/PaymentCalculator/PaymentCalculatorBack";
import PropertyDiscountDialog from "@/components/PropertyDiscount/PropertyDiscountDialog";

const formatWithCommas = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseCurrency = (value) => {
  if (!value) return 0;
  return parseFloat(String(value).replace(/,/g, ""));
};

export default function Discount() {
  const navigate = useNavigate();
  const { propertyId } = useParams();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");

  // Warning dialog state
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState(""); // 'partial', 'severe', 'increase'
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState({
    partialDiscount: false,
    severeDiscount: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [openCalculator, setOpenCalculator] = useState(false);
  const [tempCalculatorData, setTempCalculatorData] = useState(null);

  const [discountData, setDiscountData] = useState({
    originalAskingPrice: "",
    originalDisPrice: "",
    originalMinPrice: "",
    originalPurchasePrice: "",
    originalClosingDate: null,
    discountedAskingPrice: "",
    discountedDisPrice: "",
    discountedMinPrice: "",
    updatedClosingDate: null,
    askingPricePercent: "",
    disPricePercent: "",
    minPricePercent: "",
  });

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery(["property", propertyId], () => getProperty(propertyId), {
    enabled: !!propertyId,
    onSuccess: (data) => {
      setDiscountData((prev) => ({
        ...prev,
        originalAskingPrice: formatWithCommas(data.askingPrice || ""),
        originalDisPrice: formatWithCommas(data.disPrice || ""),
        originalMinPrice: formatWithCommas(data.minPrice || ""),
        originalPurchasePrice: formatWithCommas(data.purchasePrice || ""),
        originalClosingDate: data.closingDate ? new Date(data.closingDate) : null,
        discountedAskingPrice: formatWithCommas(data.askingPrice || ""),
        discountedDisPrice: formatWithCommas(data.disPrice || ""),
        discountedMinPrice: formatWithCommas(data.minPrice || ""),
        updatedClosingDate: data.closingDate ? new Date(data.closingDate) : null,
      }));
    },
  });

  const calculateDiscount = (originalPrice, percentage) => {
    const price = parseCurrency(originalPrice);
    if (!price || !percentage) return "";
    const discountMultiplier = (100 - parseInt(percentage)) / 100;
    return formatWithCommas(Math.round(price * discountMultiplier));
  };

  const handlePercentChange = (field, percent) => {
    const percentNum = parseInt(percent);
    let originalField = "";
    let discountedField = "";

    if (field === "askingPrice") {
      originalField = "originalAskingPrice";
      discountedField = "discountedAskingPrice";
      setDiscountData((prev) => ({
        ...prev,
        askingPricePercent: percent,
        [discountedField]: calculateDiscount(prev[originalField], percentNum),
      }));
    } else if (field === "disPrice") {
      originalField = "originalDisPrice";
      discountedField = "discountedDisPrice";
      setDiscountData((prev) => ({
        ...prev,
        disPricePercent: percent,
        [discountedField]: calculateDiscount(prev[originalField], percentNum),
      }));
    } else if (field === "minPrice") {
      originalField = "originalMinPrice";
      discountedField = "discountedMinPrice";
      setDiscountData((prev) => ({
        ...prev,
        minPricePercent: percent,
        [discountedField]: calculateDiscount(prev[originalField], percentNum),
      }));
    }
  };

  const handlePriceChange = (field, value) => {
    const numericValue = value.replace(/,/g, "");
    if (numericValue === "" || /^\d*\.?\d*$/.test(numericValue)) {
      setDiscountData((prev) => ({
        ...prev,
        [field]: formatWithCommas(numericValue),
      }));
    }
  };

  const handleDateSelect = (date, field) => {
    setDiscountData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const openPaymentCalculator = () => {
    const calculatorData = {
      ...property,
      askingPrice: discountData.discountedAskingPrice,
      disPrice: discountData.discountedDisPrice,
      minPrice: discountData.discountedMinPrice,
      financingPrice: discountData.discountedAskingPrice,
      closingDate: discountData.updatedClosingDate,
    };
    setTempCalculatorData(calculatorData);
    setOpenCalculator(true);
  };

  const handleCalculatorChange = (e) => {
    const { name, value } = e.target;
    setTempCalculatorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateDiscount = () => {
    const origAsking = parseCurrency(discountData.originalAskingPrice);
    const origDis = parseCurrency(discountData.originalDisPrice);
    const origMin = parseCurrency(discountData.originalMinPrice);

    const newAsking = parseCurrency(discountData.discountedAskingPrice);
    const newDis = parseCurrency(discountData.discountedDisPrice);
    const newMin = parseCurrency(discountData.discountedMinPrice);

    // Check 1: No changes made
    if (origAsking === newAsking && origDis === newDis && origMin === newMin) {
      setWarningType("nochange");
      setWarningMessage("No price changes detected. Please adjust at least one price.");
      setWarningDialogOpen(true);
      return false;
    }

    // Check 2: Price increased
    if (newAsking > origAsking || newDis > origDis || newMin > origMin) {
      setWarningType("increase");
      setWarningMessage("One or more prices have increased from the original value. This is not a discount. Please review your changes.");
      setWarningDialogOpen(true);
      return false;
    }

    // Check 3: Only minimum price reduced
    if (origMin > newMin && origAsking === newAsking && origDis === newDis) {
      setWarningType("minonly");
      setWarningMessage("Cannot discount only the minimum price. Please reduce the asking price or discount price (or preferably both) to apply a discount.");
      setWarningDialogOpen(true);
      return false;
    }

    // Check 4: Partial discount (only asking or discount reduced)
    const askingReduced = origAsking > newAsking;
    const disReduced = origDis > newDis;

    if ((askingReduced && !disReduced) || (!askingReduced && disReduced)) {
      if (!acknowledgedWarnings.partialDiscount) {
        setWarningType("partial");
        setWarningMessage(
          askingReduced
            ? "Only the asking price has been reduced. For better results, consider reducing the discount price as well. Do you want to continue?"
            : "Only the discount price has been reduced. For better results, consider reducing the asking price as well. Do you want to continue?"
        );
        setWarningDialogOpen(true);
        return false;
      }
    }

    // Check 5: Severe discount (>50% reduction)
    const askingPercent = origAsking > 0 ? ((origAsking - newAsking) / origAsking) * 100 : 0;
    const disPercent = origDis > 0 ? ((origDis - newDis) / origDis) * 100 : 0;
    const minPercent = origMin > 0 ? ((origMin - newMin) / origMin) * 100 : 0;

    if (askingPercent > 50 || disPercent > 50 || minPercent > 50) {
      if (!acknowledgedWarnings.severeDiscount) {
        setWarningType("severe");
        setWarningMessage(`Warning: You're reducing the price by more than 50%. This is a significant discount. Are you sure you want to proceed?`);
        setWarningDialogOpen(true);
        return false;
      }
    }

    return true;
  };

  const handleWarningConfirm = () => {
    if (warningType === "partial") {
      setAcknowledgedWarnings((prev) => ({ ...prev, partialDiscount: true }));
    } else if (warningType === "severe") {
      setAcknowledgedWarnings((prev) => ({ ...prev, severeDiscount: true }));
    }
    setWarningDialogOpen(false);
  };

  // Retry save when warnings are acknowledged
  useEffect(() => {
    if ((acknowledgedWarnings.partialDiscount || acknowledgedWarnings.severeDiscount) && !warningDialogOpen) {
      handleSaveDiscount();
    }
  }, [acknowledgedWarnings]);

  const handleSaveDiscount = async () => {
    // Validate discount
    if (!validateDiscount()) {
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();

      formData.append("askingPrice", parseCurrency(discountData.discountedAskingPrice));
      formData.append("disPrice", parseCurrency(discountData.discountedDisPrice));
      formData.append("minPrice", parseCurrency(discountData.discountedMinPrice));

      if (discountData.updatedClosingDate) {
        formData.append("closingDate", discountData.updatedClosingDate.toISOString());
      }

      if (property.imageUrls) {
        formData.append("imageUrls", JSON.stringify(property.imageUrls));
      }
      if (property.videoUrls) {
        formData.append("videoUrls", JSON.stringify(property.videoUrls));
      }

      await updateProperty(propertyId, formData);

      // Reset warning acknowledgments
      setAcknowledgedWarnings({
        partialDiscount: false,
        severeDiscount: false,
      });

      setDialogMessage("Property discounted successfully!");
      setDialogType("success");
      setDialogOpen(true);
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Failed to save discount");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#324c48]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Property</h2>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(`/admin/edit-property/${propertyId}`)} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#324c48]">Discount Property</h1>
            <p className="text-gray-600 mt-1">{property?.title || "Unnamed Property"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Pricing */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              Original Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Original Asking Price</Label>
              <Input type="text" value={discountData.originalAskingPrice} disabled className="bg-gray-100 text-gray-700 font-semibold border-gray-300" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Original Discount Price</Label>
              <Input type="text" value={discountData.originalDisPrice} disabled className="bg-gray-100 text-gray-700 font-semibold border-gray-300" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Original Minimum Price</Label>
              <Input type="text" value={discountData.originalMinPrice} disabled className="bg-gray-100 text-gray-700 font-semibold border-gray-300" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Purchase Price</Label>
              <Input type="text" value={discountData.originalPurchasePrice} disabled className="bg-gray-100 text-gray-700 font-semibold border-gray-300" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Original Closing Date</Label>
              <Input
                type="text"
                value={discountData.originalClosingDate ? format(discountData.originalClosingDate, "PPP") : "Not set"}
                disabled
                className="bg-gray-100 text-gray-700 font-semibold border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Discounted Pricing */}
        <Card className="border-[#D4A017] shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#D4A017]/10 to-[#D4A017]/5">
            <CardTitle className="text-xl font-semibold text-[#324c48] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#D4A017]" />
              Discounted Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Discounted Asking Price</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter new asking price"
                  value={discountData.discountedAskingPrice}
                  onChange={(e) => handlePriceChange("discountedAskingPrice", e.target.value)}
                  className="flex-1 border-[#D4A017] focus:ring-[#D4A017]"
                />
                <Select value={discountData.askingPricePercent} onValueChange={(val) => handlePercentChange("askingPrice", val)}>
                  <SelectTrigger className="w-32 border-[#D4A017]">
                    <SelectValue placeholder="Discount %" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(19)].map((_, i) => {
                      const percent = 5 + i * 5;
                      return (
                        <SelectItem key={percent} value={String(percent)}>
                          {percent}%
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Discounted Discount Price</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter new discount price"
                  value={discountData.discountedDisPrice}
                  onChange={(e) => handlePriceChange("discountedDisPrice", e.target.value)}
                  className="flex-1 border-[#D4A017] focus:ring-[#D4A017]"
                />
                <Select value={discountData.disPricePercent} onValueChange={(val) => handlePercentChange("disPrice", val)}>
                  <SelectTrigger className="w-32 border-[#D4A017]">
                    <SelectValue placeholder="Discount %" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(19)].map((_, i) => {
                      const percent = 5 + i * 5;
                      return (
                        <SelectItem key={percent} value={String(percent)}>
                          {percent}%
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Discounted Minimum Price</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter new minimum price"
                  value={discountData.discountedMinPrice}
                  onChange={(e) => handlePriceChange("discountedMinPrice", e.target.value)}
                  className="flex-1 border-[#D4A017] focus:ring-[#D4A017]"
                />
                <Select value={discountData.minPricePercent} onValueChange={(val) => handlePercentChange("minPrice", val)}>
                  <SelectTrigger className="w-32 border-[#D4A017]">
                    <SelectValue placeholder="Discount %" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(19)].map((_, i) => {
                      const percent = 5 + i * 5;
                      return (
                        <SelectItem key={percent} value={String(percent)}>
                          {percent}%
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Updated Closing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-[#D4A017]", !discountData.updatedClosingDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {discountData.updatedClosingDate ? format(discountData.updatedClosingDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker mode="single" selected={discountData.updatedClosingDate} onSelect={(date) => handleDateSelect(date, "updatedClosingDate")} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button onClick={openPaymentCalculator} className="bg-gradient-to-r from-[#3f4f24] to-[#324c48] hover:from-[#2c3b18] hover:to-[#253838] text-white">
          <Calculator className="w-4 h-4 mr-2" />
          Updated Payment Plan
        </Button>

        <Button onClick={handleSaveDiscount} disabled={isSaving} className="bg-[#D4A017] hover:bg-[#b88914] text-white px-8">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Discount This Property"
          )}
        </Button>
      </div>

      {/* Warning Dialog */}
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              {warningType === "increase" || warningType === "nochange" || warningType === "minonly" ? "Cannot Apply Discount" : "Discount Warning"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-base">{warningMessage}</DialogDescription>
          <DialogFooter>
            {warningType === "partial" || warningType === "severe" ? (
              <>
                <Button variant="outline" onClick={() => setWarningDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWarningConfirm} className="bg-[#D4A017]">
                  Continue Anyway
                </Button>
              </>
            ) : (
              <Button onClick={() => setWarningDialogOpen(false)}>Okay</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Calculator Dialog */}
      <Dialog open={openCalculator} onOpenChange={setOpenCalculator}>
        <DialogContent className="max-w-6xl mx-auto bg-[#FDF8F2]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">Updated Payment Plan Calculator</DialogTitle>
          </DialogHeader>
          {tempCalculatorData && <PaymentCalculatorBack formData={tempCalculatorData} handleChange={handleCalculatorChange} />}
          <DialogFooter>
            <Button onClick={() => setOpenCalculator(false)} className="bg-gray-400 hover:bg-gray-500 text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PropertyDiscountDialog open={dialogOpen} onOpenChange={setDialogOpen} dialogType={dialogType} dialogMessage={dialogMessage} propertyId={propertyId} propertyData={property} />
    </div>
  );
}
