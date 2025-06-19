import React, { useState, useEffect } from "react";
import { parsePhoneNumber } from "libphonenumber-js";
import { useAuth } from "@/components/hooks/useAuth";
import { useVipBuyer } from '@/utils/VipBuyerContext';
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UserInfo({ surveyData, updateSurveyData, onSubmit, onBack }) {
  // Initialize local form state from parent surveyData
  const [formData, setFormData] = useState({
    firstName: surveyData.firstName || "",
    lastName: surveyData.lastName || "",
    email: surveyData.email || "",
    phone: surveyData.phone || "",
    buyerType: surveyData.buyerType || ""  // Add buyerType
  });

  // Track if form has been populated to prevent multiple API calls
  const [formPopulated, setFormPopulated] = useState(false);

  // Get user data from Auth and VIP buyer contexts
  const { user, isLoading } = useAuth();
  const { isVipBuyer, vipBuyerData } = useVipBuyer();

  // State for the Dialog notification
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("warning");

  // Update local state if surveyData changes
  useEffect(() => {
    setFormData({
      firstName: surveyData.firstName || "",
      lastName: surveyData.lastName || "",
      email: surveyData.email || "",
      phone: surveyData.phone || "",
      buyerType: surveyData.buyerType || ""  // Add buyerType
    });
  }, [surveyData]);

  // Auto-populate user data when component mounts
  useEffect(() => {
    // Only populate if fields are empty and we haven't populated yet
    if (!formPopulated && !isLoading && 
        (!formData.firstName || !formData.lastName || !formData.email)) {
      populateUserData();
      setFormPopulated(true);
    }
  }, [user, isLoading, isVipBuyer, vipBuyerData, formData]);

  // Function to populate user data with priority
  const populateUserData = () => {
    let newData = { ...formData };
    let dataChanged = false;

    // Priority 1: Use VIP buyer data if available
    if (isVipBuyer && vipBuyerData) {
      if (vipBuyerData.firstName && !newData.firstName) {
        newData.firstName = vipBuyerData.firstName;
        dataChanged = true;
      }
      
      if (vipBuyerData.lastName && !newData.lastName) {
        newData.lastName = vipBuyerData.lastName;
        dataChanged = true;
      }
      
      if (vipBuyerData.email && !newData.email) {
        newData.email = vipBuyerData.email;
        dataChanged = true;
      }
      
      if (vipBuyerData.phone && !newData.phone) {
        newData.phone = formatPhoneNumber(vipBuyerData.phone);
        dataChanged = true;
      }
      
      // Add buyerType population from VIP data
      if (vipBuyerData.buyerType && !newData.buyerType) {
        newData.buyerType = vipBuyerData.buyerType;
        dataChanged = true;
      }
    }

    // Priority 2: Fall back to Auth0 user data
    if (user) {
      // Try to extract name from Auth0 data
      if (user.given_name && !newData.firstName) {
        newData.firstName = user.given_name;
        dataChanged = true;
      }
      
      if (user.family_name && !newData.lastName) {
        newData.lastName = user.family_name;
        dataChanged = true;
      }
      
      // If no given/family name, try to parse from name
      if ((!newData.firstName || !newData.lastName) && user.name) {
        const nameParts = user.name.split(' ');
        if (nameParts.length > 0 && !newData.firstName) {
          newData.firstName = nameParts[0];
          dataChanged = true;
        }
        if (nameParts.length > 1 && !newData.lastName) {
          newData.lastName = nameParts.slice(1).join(' ');
          dataChanged = true;
        }
      }
      
      // Set email if available
      if (user.email && !newData.email) {
        newData.email = user.email;
        dataChanged = true;
      }
    }

    // Update form data if changes were made
    if (dataChanged) {
      setFormData(newData);
      
      // Update parent state with populated values
      Object.entries(newData).forEach(([key, value]) => {
        if (value && key in newData) {
          updateSurveyData(key, value);
        }
      });
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Also update the parent state immediately
    updateSurveyData(name, value);
  };

  // Handle buyer type selection
  const handleBuyerTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      buyerType: value
    }));
    
    // Update parent state
    updateSurveyData("buyerType", value);
  };

  // Phone number validation using libphonenumber-js
  const validatePhone = (phoneInput) => {
    try {
      const phoneNumber = parsePhoneNumber(phoneInput, "US"); // "US" as default country code
      return phoneNumber?.isValid();
    } catch (error) {
      console.error("Phone validation error:", error);
      return false;
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
    
    // Also update the parent state
    updateSurveyData("phone", formatted);
  };

  const formatPhoneNumber = (input) => {
    if (!input) return '';
    
    // Strip all non-numeric characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Format the number as user types
    let formattedNumber = '';
    if (digitsOnly.length === 0) {
      return '';
    } else if (digitsOnly.length <= 3) {
      formattedNumber = digitsOnly;
    } else if (digitsOnly.length <= 6) {
      formattedNumber = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      formattedNumber = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, Math.min(10, digitsOnly.length))}`;
    }
    
    return formattedNumber;
  };

  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validatePhone(formData.phone)) {
      setDialogMessage("Please enter a valid US phone number.");
      setDialogOpen(true);
      return;
    }
    
    // Validate buyer type
    if (!formData.buyerType) {
      setDialogMessage("Please select a buyer type.");
      setDialogOpen(true);
      return;
    }
    
    // Update parent state with all values
    updateSurveyData("firstName", formData.firstName);
    updateSurveyData("lastName", formData.lastName);
    updateSurveyData("email", formData.email);
    updateSurveyData("phone", formData.phone);
    updateSurveyData("buyerType", formData.buyerType);
    
    // Move to the next step after a short delay to ensure state updates are processed
    setTimeout(() => {
      onSubmit();
    }, 100);
  };

  // Translation object based on selected language
  const translations = {
    en: {
      title: "Give us a way to reach you",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number (US only)",
      buyerType: "Buyer Type",
      submit: "Submit Application",
      back: "Back",
      warning: "Warning",
      okay: "Okay"
    },
    es: {
      title: "Díganos cómo podemos comunicarnos con usted",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo electrónico",
      phone: "Número de teléfono (solo EE.UU.)",
      buyerType: "Tipo de Comprador",
      submit: "Enviar solicitud",
      back: "Atrás",
      warning: "Advertencia",
      okay: "OK"
    }
  };

  // Use the appropriate translation based on the selected language
  const t = translations[surveyData.language || 'en'];

  return (
    <Card className="max-w-2xl mx-auto border-[#324c48]/20 shadow-lg bg-white">
      <CardContent className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#3f4f24] mb-2">{t.title}</h2>
          <div className="h-1 w-20 bg-[#324c48] rounded-full"></div>
        </div>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="firstName" className="block mb-2 text-[#324c48] font-medium">
                  {t.firstName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#324c48]/30 rounded-lg focus:ring-2 focus:ring-[#3f4f24] focus:border-transparent"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName" className="block mb-2 text-[#324c48] font-medium">
                  {t.lastName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#324c48]/30 rounded-lg focus:ring-2 focus:ring-[#3f4f24] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <Label htmlFor="email" className="block mb-2 text-[#324c48] font-medium">
                {t.email} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#324c48]/30 rounded-lg focus:ring-2 focus:ring-[#3f4f24] focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="phone" className="block mb-2 text-[#324c48] font-medium">
                  {t.phone} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 555-5555"
                  className="w-full px-4 py-2 border border-[#324c48]/30 rounded-lg focus:ring-2 focus:ring-[#3f4f24] focus:border-transparent"
                />
              </div>
              
              <div>
                <Label htmlFor="buyerType" className="block mb-2 text-[#324c48] font-medium">
                  {t.buyerType} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.buyerType}
                  onValueChange={handleBuyerTypeChange}
                  required
                >
                  <SelectTrigger className="w-full px-4 py-2 border border-[#324c48]/30 rounded-lg focus:ring-2 focus:ring-[#3f4f24] focus:border-transparent">
                    <SelectValue placeholder="Select buyer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CashBuyer">Cash Buyer</SelectItem>
                    <SelectItem value="Builder">Builder</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Realtor">Realtor</SelectItem>
                    <SelectItem value="Investor">Investor</SelectItem>
                    <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                className="text-[#324c48] border-[#324c48] hover:bg-[#f0f5f4]"
                onClick={onBack}
              >
                {t.back}
              </Button>
              
              <Button
                type="submit"
                className="bg-[#3f4f24] hover:bg-[#546930] text-white"
              >
                {t.submit}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>

      {/* Dialog for validation errors */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#FFF] text-[#050002] border border-[#405025]/30 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {t.warning}
            </DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDialogOpen(false)}
              className="bg-[#324c48] text-[#FFF]"
            >
              {t.okay}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}