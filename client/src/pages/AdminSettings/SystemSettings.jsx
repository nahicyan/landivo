import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { parsePhoneNumber } from "libphonenumber-js";
import { toast } from "react-toastify";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneIcon, WrenchIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemSettings, updateSystemSettings } from "@/utils/api";
import { Switch } from "@/components/ui/switch";

export default function SystemSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState(null);

  const systemForm = useForm({
    defaultValues: {
      overrideContactPhone: "",
      displayIncomplete: false,
      displaySold: false,
      displayNotAvailable: false,
      displayNotTesting: false,
    },
  });

  // Load system settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSystemSettings();
        if (settings) {
          systemForm.reset({
            overrideContactPhone: settings.overrideContactPhone || "",
            displayIncomplete: settings.displayIncomplete || false,
            displaySold: settings.displaySold || false,
            displayNotAvailable: settings.displayNotAvailable || false,
            displayNotTesting: settings.displayNotTesting || false,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Phone number validation using libphonenumber-js
  const validatePhone = (phoneInput) => {
    if (!phoneInput) return true; // Allow empty

    try {
      const phoneNumber = parsePhoneNumber(phoneInput, "US"); // "US" as default country code
      return phoneNumber?.isValid();
    } catch (error) {
      console.error("Phone validation error:", error);
      return false;
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (input) => {
    if (!input) return "";

    // Strip all non-numeric characters
    const digitsOnly = input.replace(/\D/g, "");

    // Format the number as user types
    let formattedNumber = "";
    if (digitsOnly.length === 0) {
      return "";
    } else if (digitsOnly.length <= 3) {
      formattedNumber = digitsOnly;
    } else if (digitsOnly.length <= 6) {
      formattedNumber = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      formattedNumber = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, Math.min(10, digitsOnly.length))}`;
    }

    return formattedNumber;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    systemForm.setValue("overrideContactPhone", formatted);

    // Clear error if field is empty or valid
    if (!formatted || validatePhone(formatted)) {
      setPhoneError(null);
    }
  };

  const onSystemSubmit = async (data) => {
    // Validate phone number before submission
    if (data.overrideContactPhone && !validatePhone(data.overrideContactPhone)) {
      setPhoneError("Please enter a valid US phone number");
      return;
    }

    setIsLoading(true);

    try {
      await updateSystemSettings(data);
      toast.success("System settings updated successfully");
    } catch (error) {
      console.error("Error updating system settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <WrenchIcon className="w-6 h-6 text-[#D4A017]" />
          System Settings
        </CardTitle>
        <CardDescription>Configure global system settings and display options</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...systemForm}>
          <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
            {/* Contact Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#324c48]">Contact Display Settings</h3>
              <FormField
                control={systemForm.control}
                name="overrideContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-[#D4A017]" />
                      Override Contact Profile Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} onChange={handlePhoneChange} className={phoneError ? "border-red-500 focus:ring-red-500" : ""} />
                    </FormControl>
                    {phoneError && <div className="text-red-500 text-sm mt-1">{phoneError}</div>}
                    <FormDescription>
                      If set, this phone number will be displayed for all contact profiles instead of their individual numbers. Leave empty to use individual profile numbers.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            {/* Property Status Display Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#324c48]">Property Status Display Settings</h3>
              <p className="text-sm text-gray-600">Control which property statuses are visible to users with status:properties permission</p>

              <FormField
                control={systemForm.control}
                name="displayIncomplete"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Display Incomplete Properties</FormLabel>
                      <FormDescription>Show properties with "Incomplete" status to authorized users</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={systemForm.control}
                name="displaySold"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Display Sold Properties</FormLabel>
                      <FormDescription>Show properties with "Sold" status to authorized users</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={systemForm.control}
                name="displayNotAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Display Not Available Properties</FormLabel>
                      <FormDescription>Show properties with "Not Available" status to authorized users</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={systemForm.control}
                name="displayNotTesting"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Display Testing Properties</FormLabel>
                      <FormDescription>Show properties with "Testing" status to authorized users</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-6 pt-6 border-t">
              <Button type="submit" className="bg-[#3f4f24] hover:bg-[#3f4f24]/90" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save System Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
