"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { parsePhoneNumber } from "libphonenumber-js";
import ContactCard from "@/components/ContactCard/ContactCard";
import { useAuth } from "@/components/hooks/useAuth";
import { useVipBuyer } from '@/utils/VipBuyerContext';

// ShadCN UI components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Offer({ propertyData }) {
  if (!propertyData) {
    return (
      <div className="min-h-screen bg-[#FFF] text-[#050002] flex items-center justify-center">
        Error: Property data not found.
      </div>
    );
  }

  const navigate = useNavigate();
  const [offerPrice, setOfferPrice] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // New states for handling existing offers
  const [existingOffer, setExistingOffer] = useState(null);
  const [hasExistingOffer, setHasExistingOffer] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newOfferPrice, setNewOfferPrice] = useState("");
  const [foundBuyer, setFoundBuyer] = useState(null);
  
  // Use useRef instead of useState to track population status
  // This persists across refreshes within the same component lifecycle
  const formPopulationAttempted = useRef(false);
  const existingOfferChecked = useRef(false);

  // Get user data from Auth and VIP buyer contexts
  const { user, isLoading: authLoading } = useAuth();
  const { isVipBuyer, vipBuyerData, isLoading: vipLoading } = useVipBuyer();

  // State for the Dialog notification
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success"); // "success" or "warning"

  // Auto-populate user data when component mounts or data becomes available
  useEffect(() => {
    // Only run if auth and VIP data is done loading and we haven't attempted population yet
    if (!authLoading && !vipLoading && !formPopulationAttempted.current) {
      populateUserData();
      formPopulationAttempted.current = true;
    }
  }, [user, isVipBuyer, vipBuyerData, authLoading, vipLoading]);

  // Check for existing offers when user data is loaded
  useEffect(() => {
    // Check for existing offers once user data is populated and we have enough info
    if ((email || (user && user.email)) && !existingOfferChecked.current && propertyData?.id) {
      checkForExistingOffer();
      existingOfferChecked.current = true;
    }
  }, [email, phone, user, propertyData?.id]);

  // Function to check for existing offers and populate buyer data
  const checkForExistingOffer = async () => {
    try {
      // Construct query parameters based on available information
      let queryParams = new URLSearchParams();
      
      if (user?.sub) {
        // If authenticated, check by Auth0 ID
        queryParams.append("auth0Id", user.sub);
      } else if (email) {
        // Otherwise check by email
        queryParams.append("email", email);
      } else if (phone) {
        // Or by phone if available
        queryParams.append("phone", phone);
      } else {
        // No identifiers available yet
        return;
      }
      
      // Fetch buyer's offers
      const response = await api.get(`/offer/buyer?${queryParams}`);
      
      if (response.data && response.data.buyer) {
        // Store the found buyer
        setFoundBuyer(response.data.buyer);
        
        // Auto-populate the buyer's info
        populateBuyerData(response.data.buyer);
        
        // Check for offers on this property
        if (response.data.offers) {
          const offerForThisProperty = response.data.offers.find(
            offer => offer.propertyId === propertyData.id
          );
          
          if (offerForThisProperty) {
            console.log("Found existing offer:", offerForThisProperty);
            setExistingOffer(offerForThisProperty);
            setHasExistingOffer(true);
            
            // Set the current offer price
            if (offerForThisProperty.offeredPrice) {
              setOfferPrice(offerForThisProperty.offeredPrice.toLocaleString());
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for existing offers:", error);
    }
  };

  // Function to populate buyer data from API response
  const populateBuyerData = (buyer) => {
    if (!buyer) return;
    
    // Only set values if they're not already set by the user
    if (!firstName && buyer.firstName) setFirstName(buyer.firstName);
    if (!lastName && buyer.lastName) setLastName(buyer.lastName);
    if (!email && buyer.email) setEmail(buyer.email);
    if (!phone && buyer.phone) setPhone(formatPhoneNumber(buyer.phone));
    if (!buyerType && buyer.buyerType) setBuyerType(buyer.buyerType);
    
    console.log("Auto-populated buyer data:", { firstName: buyer.firstName, lastName: buyer.lastName, buyerType: buyer.buyerType });
  };

  // When email or phone changes, check for existing buyer and offers
  const handleIdentifierChange = async (field, value) => {
    if (field === 'email') {
      setEmail(value);
    } else if (field === 'phone') {
      setPhone(formatPhoneNumber(value));
    }
    
    // If either email or phone has changed, check for buyer data
    if ((email || field === 'email') && (phone || field === 'phone')) {
      try {
        // Find buyer by email or phone
        const queryParams = new URLSearchParams();
        if (field === 'email') {
          queryParams.append("email", value);
        } else {
          queryParams.append("phone", formatPhoneNumber(value));
        }
        
        const response = await api.get(`/offer/buyer?${queryParams}`);
        
        if (response.data && response.data.buyer) {
          // We found a buyer - auto-populate fields
          setFoundBuyer(response.data.buyer);
          populateBuyerData(response.data.buyer);
          
          // Check for existing offers on this property
          if (response.data.offers && propertyData?.id) {
            const offerForThisProperty = response.data.offers.find(
              offer => offer.propertyId === propertyData.id
            );
            
            if (offerForThisProperty) {
              setExistingOffer(offerForThisProperty);
              setHasExistingOffer(true);
              
              // Set the current offer price
              if (offerForThisProperty.offeredPrice) {
                setOfferPrice(offerForThisProperty.offeredPrice.toLocaleString());
              }
            }
          }
        }
      } catch (error) {
        // It's okay if we don't find a buyer - just log and continue
        console.log("No buyer found with the provided information");
      }
    }
  };

  // Function to populate user data with priority
  const populateUserData = () => {
    // Only set values for fields that are empty - don't overwrite existing data
    // This helps preserve data on refreshes
    
    // Priority 1: Use VIP buyer data if available
    if (isVipBuyer && vipBuyerData) {
      if (!firstName && vipBuyerData.firstName) setFirstName(vipBuyerData.firstName);
      if (!lastName && vipBuyerData.lastName) setLastName(vipBuyerData.lastName);
      if (!email && vipBuyerData.email) setEmail(vipBuyerData.email);
      if (!phone && vipBuyerData.phone) setPhone(formatPhoneNumber(vipBuyerData.phone));
      if (!buyerType && vipBuyerData.buyerType) setBuyerType(vipBuyerData.buyerType);
      return;
    }

    // Priority 2: Fall back to Auth0 user data
    if (user) {
      // Try to extract name from Auth0 data
      if (!firstName && user.given_name) setFirstName(user.given_name);
      if (!lastName && user.family_name) setLastName(user.family_name);
      
      // If no given/family name, try to parse from name
      if ((!firstName || !lastName) && user.name) {
        const nameParts = user.name.split(' ');
        if (nameParts.length > 0 && !firstName) setFirstName(nameParts[0]);
        if (nameParts.length > 1 && !lastName) setLastName(nameParts.slice(1).join(' '));
      }
      
      // Set email if available
      if (!email && user.email) setEmail(user.email);
    }
  };

  // Format the offer price as the user types
  const handleOfferPriceChange = (e) => {
    let value = e.target.value;
    // Remove commas from the value
    value = value.replace(/,/g, "");
    if (value === "") {
      setOfferPrice("");
      return;
    }
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      // Format number with commas
      setOfferPrice(floatValue.toLocaleString("en-US"));
    } else {
      // If not a valid number, keep the raw value
      setOfferPrice(value);
    }
  };

  // Phone number validation using libphonenumber-js
  const validatePhone = (phoneInput) => {
    try {
      const phoneNumber = parsePhoneNumber(phoneInput, "US"); // "US" as default country code
      if (!phoneNumber?.isValid()) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Phone validation error:", error);
      return false;
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    handleIdentifierChange('phone', formatted);
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

  const validateOfferPrice = (price) => {
    // If no existing offer, any price is valid
    if (!hasExistingOffer) return true;
    
    // Parse the prices for comparison
    const existingPriceValue = existingOffer.offeredPrice;
    const newPriceValue = parseFloat(price.replace(/,/g, ""));
    
    // Check if new price is higher than existing
    return newPriceValue > existingPriceValue;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Basic required field check
    if (!offerPrice || !email || !firstName || !lastName || !phone || !buyerType) {
      setDialogMessage("All fields are required.");
      setDialogType("warning");
      setDialogOpen(true);
      return;
    }
    
    // Phone Validation with libphonenumber-js
    if (!validatePhone(phone)) {
      setDialogMessage("Invalid phone number. Please enter a valid number.");
      setDialogType("warning");
      setDialogOpen(true);
      return;
    }
  
    // Remove commas before converting to float
    const parsedOfferPrice = parseFloat(offerPrice.replace(/,/g, ""));
    
    // If there's an existing offer, check if the new price is higher
    if (hasExistingOffer) {
      if (!validateOfferPrice(offerPrice)) {
        // Show dialog for entering a higher price
        setNewOfferPrice("");
        setUpdateDialogOpen(true);
        return;
      }
    }
  
    const offerData = {
      email,
      phone,
      buyerType,
      propertyId: propertyData?.id,
      offeredPrice: parsedOfferPrice,
      firstName,
      lastName,
      // Pass auth0Id from authenticated user if available
      auth0Id: user?.sub || null
    };
  
    console.log("Submitting offer with data:", offerData);
  
    try {
      // Use the new offer endpoint
      await api.post("/offer/makeOffer", offerData);
  
      // If offer is below minPrice, show a warning and do not redirect
      if (parsedOfferPrice < propertyData?.minPrice) {
        setDialogMessage(
          `At this time we cannot accept any offers below $${propertyData?.minPrice.toLocaleString()}. Consider offering a higher price.`
        );
        setDialogType("warning");
        setDialogOpen(true);
        return;
      }
  
      // If valid offer, show success and (optionally) navigate back
      setDialogMessage(hasExistingOffer 
        ? "Your offer has been successfully updated!" 
        : "Offer submitted successfully!");
      setDialogType("success");
      setDialogOpen(true);
      
      // Update the local state to show this is now an existing offer
      setExistingOffer({
        ...existingOffer,
        offeredPrice: parsedOfferPrice
      });
      setHasExistingOffer(true);
    } catch (error) {
      setDialogMessage(
        "There was an error processing your offer. Please try again."
      );
      setDialogType("warning");
      setDialogOpen(true);
    }
  };
  
  // Handle update from dialog
  const handleUpdateFromDialog = async () => {
    if (!newOfferPrice) {
      return;
    }
    
    // Parse and validate the new price
    const parsedNewPrice = parseFloat(newOfferPrice.replace(/,/g, ""));
    if (isNaN(parsedNewPrice) || parsedNewPrice <= existingOffer.offeredPrice) {
      setDialogMessage(
        `Please enter an amount higher than your previous offer of $${existingOffer.offeredPrice.toLocaleString()}.`
      );
      setDialogType("warning");
      setUpdateDialogOpen(false);
      setDialogOpen(true);
      return;
    }
    
    // Update the offer price field
    setOfferPrice(parsedNewPrice.toLocaleString());
    setUpdateDialogOpen(false);
    
    // Submit the form with the new price
    const offerData = {
      email,
      phone,
      buyerType,
      propertyId: propertyData?.id,
      offeredPrice: parsedNewPrice,
      firstName,
      lastName,
      auth0Id: user?.sub || null
    };
    
    try {
      await api.post("/offer/makeOffer", offerData);
      
      setDialogMessage("Your offer has been successfully updated!");
      setDialogType("success");
      setDialogOpen(true);
      
      // Update local state
      setExistingOffer({
        ...existingOffer,
        offeredPrice: parsedNewPrice
      });
    } catch (error) {
      setDialogMessage(
        "There was an error updating your offer. Please try again."
      );
      setDialogType("warning");
      setDialogOpen(true);
    }
  };
  
  // Handle email change with existing offer check
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    handleIdentifierChange('email', value);
  };
  
  return (
    <div className="bg-white text-[#050002]">
      <Card className="w-full max-w-md border border-[#405025]/20 bg-white shadow-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#405025]">
            {hasExistingOffer ? "Update Your Offer" : "Make An Offer"}
          </CardTitle>
          <CardDescription className="text-[#324d49]">
            For {propertyData.streetAddress || "This Property"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="text-sm text-[#050002]">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="text-sm text-[#050002]">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm text-[#050002]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm text-[#050002]">
                Phone
              </Label>
              <Input
                id="phone"
                type="text"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={handlePhoneChange}
                required
              />
            </div>

            {/* Buyer Type */}
            <div>
              <Label className="text-sm text-[#050002] mb-1 block">
                Buyer Type
              </Label>
              <Select
                value={buyerType}
                onValueChange={(val) => setBuyerType(val)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Buyer Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#FFF] text-[#050002] border border-[#405025]/20">
                  <SelectItem value="CashBuyer">Cash Buyer</SelectItem>
                  <SelectItem value="Builder">Builder</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Realtor">Realtor</SelectItem>
                  <SelectItem value="Investor">Investor</SelectItem>
                  <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Offer Price */}
            <div>
              <Label htmlFor="offerPrice" className="text-sm text-[#050002]">
                {hasExistingOffer ? "Your Previous Offer" : "Offer Price ($)"}
              </Label>
              <Input
                id="offerPrice"
                type="text" // Changed to text to allow comma formatting
                placeholder="500,000"
                value={offerPrice}
                onChange={handleOfferPriceChange}
                required
              />
              {hasExistingOffer && (
                <p className="text-sm text-[#405025] mt-1">Improve your offer to increase your chances</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#324c48] text-[#FFF] hover:bg-[#324c48]/90 font-semibold mt-4"
            >
              {hasExistingOffer ? "Update Your Offer" : "Submit Offer"}
            </Button>
          </form>
          <div className="py-6">
            <ContactCard />
          </div>
        </CardContent>
      </Card>

      {/* Dialog Notification */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#FFF] text-[#050002] border border-[#405025]/30 shadow-lg">
          <DialogHeader>
            <DialogTitle
              className={dialogType === "success" ? "text-green-600" : "text-red-600"}
            >
              {dialogType === "success" ? "Success" : "Warning"}
            </DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen(false);
                if (dialogType === "success") {
                  navigate("/properties");
                }
              }}
              className="bg-[#324c48] text-[#FFF]"
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Offer Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="bg-[#FFF] text-[#050002] border border-[#405025]/30 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[#405025]">Improve Your Offer</DialogTitle>
            <DialogDescription>
              Your new offer must be higher than your previous offer of ${existingOffer?.offeredPrice?.toLocaleString() || "0"}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newOfferPrice" className="text-sm text-[#050002]">
              New Offer Price ($)
            </Label>
            <Input
              id="newOfferPrice"
              type="text"
              placeholder={`Higher than ${existingOffer?.offeredPrice?.toLocaleString() || "0"}`}
              value={newOfferPrice}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/,/g, "");
                if (value === "") {
                  setNewOfferPrice("");
                  return;
                }
                const floatValue = parseFloat(value);
                if (!isNaN(floatValue)) {
                  setNewOfferPrice(floatValue.toLocaleString("en-US"));
                } else {
                  setNewOfferPrice(value);
                }
              }}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setUpdateDialogOpen(false)}
              variant="outline"
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFromDialog}
              className="bg-[#324c48] text-[#FFF]"
            >
              Update Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}