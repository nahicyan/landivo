// client/src/components/AddProperty/Pricing.jsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Pricing({ formData, handleChange, errors }) {
  const handleDateSelect = (date) => {
    if (!date) {
      handleChange({
        target: {
          name: "closingDate",
          value: null,
        },
      });
      return;
    }

    // Set the time to 5PM (17:00:00) of the selected day
    const dateAt5PM = new Date(date);
    dateAt5PM.setHours(17, 0, 0, 0);

    // Convert to ISO-8601 string format for Prisma compatibility
    const isoString = dateAt5PM.toISOString();

    handleChange({
      target: {
        name: "closingDate",
        value: isoString,
      },
    });
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asking Price */}
        <div>
          <Label className="text-sm font-semibold text-gray-700">
            Asking Price <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            placeholder="Enter asking price"
            name="askingPrice"
            value={formData.askingPrice}
            onChange={handleChange}
            className={cn("w-full border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-md", errors?.askingPrice && "border-red-500")}
          />
          {errors?.askingPrice && <p className="text-xs text-red-500 mt-1">{errors.askingPrice}</p>}
          <p className="text-xs text-gray-500 mt-1">The price you are asking for this property.</p>
        </div>

        {/* Discount Price */}
        <div>
          <Label className="text-sm font-semibold text-gray-700">Discount Price</Label>
          <Input
            type="text"
            placeholder="Enter discount price"
            name="disPrice"
            value={formData.disPrice}
            onChange={handleChange}
            className="w-full border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">The special price available for logged in buyers.</p>
        </div>

        {/* Minimum Price */}
        <div>
          <Label className="text-sm font-semibold text-gray-700">Minimum Price</Label>
          <Input
            type="text"
            placeholder="Enter minimum price"
            name="minPrice"
            value={formData.minPrice}
            onChange={handleChange}
            className="w-full border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017] rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">The lowest amount you are willing to accept for this property.</p>
        </div>

        {/* Yearly Tax and HOA/POA on the same line */}
        <div className="grid grid-cols-2 gap-4">
          {/* Yearly Tax */}
          <div className="flex flex-col space-y-1">
            <Label className="text-gray-700 font-semibold">Yearly Tax</Label>
            <Input type="text" name="tax" value={formData.tax} onChange={handleChange} placeholder="Enter Yearly Tax" />
          </div>

          {/* HOA/POA */}
          <div className="flex flex-col space-y-1">
            <Label className="text-sm font-semibold text-gray-700">
              HOA/POA <span className="text-red-500">*</span>
            </Label>
            <Select name="hoaPoa" value={formData.hoaPoa} onValueChange={(value) => handleChange({ target: { name: "hoaPoa", value } })}>
              <SelectTrigger className={cn("w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]", errors?.hoaPoa && "border-red-500")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {["Yes", "No"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.hoaPoa && <p className="text-xs text-red-500 mt-1">{errors.hoaPoa}</p>}
          </div>
        </div>

        {/* HOA Details (conditional) */}
        {formData.hoaPoa === "Yes" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <Label className="text-gray-700 font-semibold">HOA Payment Terms</Label>
              <Select name="hoaPaymentTerms" value={formData.hoaPaymentTerms} onValueChange={(value) => handleChange({ target: { name: "hoaPaymentTerms", value } })}>
                <SelectTrigger className="w-full border-gray-300 focus:border-[#324c48] focus:ring-1 focus:ring-[#324c48]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Annually", "Semi-Annually", "Quarterly", "Monthly"].map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1 mb-4">
              <Label className="text-gray-700 font-semibold">HOA Fee</Label>
              <Input type="text" name="hoaFee" value={formData.hoaFee} onChange={handleChange} placeholder="Enter HOA Fee" />
            </div>
          </div>
        )}

        {/* Closing Date */}
        <div>
          <Label className="text-sm font-semibold text-gray-700">Closing Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-gray-300 focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]",
                  !formData.closingDate && "text-muted-foreground"
                )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.closingDate ? format(new Date(formData.closingDate), "PPP") : <span>Pick a closing date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <style>{`
                .compact-calendar * {
                  margin: 0 !important;
                }
                .compact-calendar table {
                  border-collapse: collapse !important;
                  width: auto !important;
                }
                .compact-calendar td,
                .compact-calendar th {
                  padding: 2px !important;
                  width: 28px !important;
                  height: 28px !important;
                }
                .compact-calendar button {
                  width: 24px !important;
                  height: 24px !important;
                  font-size: 0.875rem !important;
                  padding: 0 !important;
                }
                .compact-calendar .rdp-day_button {
                  width: 24px !important;
                  height: 24px !important;
                }
                .compact-calendar .rdp-weekday {
                  font-size: 0.75rem !important;
                  padding: 2px !important;
                }
                .compact-calendar .rdp-month {
                  margin: 0.5rem !important;
                }
                .compact-calendar .rdp-month_caption {
                  margin-bottom: 0.5rem !important;
                }
              `}</style>
              <div className="border border-gray-200 rounded-md">
                <DayPicker
                  mode="single"
                  selected={formData.closingDate ? new Date(formData.closingDate) : undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="compact-calendar p-2"
                />
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500 mt-1">Expected closing date for this property transaction.</p>
        </div>
      </CardContent>
    </Card>
  );
}
