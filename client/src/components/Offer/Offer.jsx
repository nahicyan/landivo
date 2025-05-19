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
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

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
  const [buyerMessage, setBuyerMessage] = useState("");

  // New states for handling existing offers
  const [existingOffer, setExistingOffer] = useState(null);
  const [hasExistingOffer, setHasExistingOffer] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newOfferPrice, setNewOfferPrice] = useState("");
  const [foundBuyer, setFoundBuyer] = useState(null);

  // New states for offer status and system message
  const [offerStatus, setOfferStatus] = useState("PENDING");
  const [sysMessage, setSysMessage] = useState("");
  const [counteredPrice, setCounteredPrice] = useState(null);
  const [actionType, setActionType] = useState(""); // For tracking which action triggered the dialog
  const [isAcceptingCounter, setIsAcceptingCounter] = useState(false);

  // Use useRef instead of useState to track population status
  // This persists across refreshes within the same component lifecycle
  const formPopulationAttempted = useRef(false);
  const existingOfferChecked = useRef(false);

  // Get user data from Auth and VIP buyer contexts
  const { user, isLoading: authLoading } = useAuth();
  const { isVipBuyer, vipBuyerData, isLoading: vipLoading } = useVipBuyer();

  // State for the Dialog notification
  const [updateMessage, setUpdateMessage] = useState("");
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

            // Set the offer status and system message
            if (offerForThisProperty.offerStatus) {
              setOfferStatus(offerForThisProperty.offerStatus);
            }

            if (offerForThisProperty.sysMessage) {
              setSysMessage(offerForThisProperty.sysMessage);
            }

            if (offerForThisProperty.buyerMessage) {
              setBuyerMessage(offerForThisProperty.buyerMessage);
            }

            if (offerForThisProperty.counteredPrice) {
              setCounteredPrice(offerForThisProperty.counteredPrice);
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

              // Set the offer status and system message
              if (offerForThisProperty.offerStatus) {
                setOfferStatus(offerForThisProperty.offerStatus);
              }

              if (offerForThisProperty.sysMessage) {
                setSysMessage(offerForThisProperty.sysMessage);
              }

              if (offerForThisProperty.buyerMessage) {
                setBuyerMessage(offerForThisProperty.buyerMessage);
              }

              if (offerForThisProperty.counteredPrice) {
                setCounteredPrice(offerForThisProperty.counteredPrice);
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

    // For counter offers, the price must be higher than the original offer
    if (offerStatus === "COUNTERED") {
      return newPriceValue > existingPriceValue;
    }

    // For other statuses, the price must be higher than the existing offer
    return newPriceValue > existingPriceValue;
  };

  // New method for accepting counter offer
  const handleAcceptCounter = async () => {
    if (!existingOffer || !counteredPrice) {
      setDialogMessage("Counter offer information is missing. Please try again.");
      setDialogType("warning");
      setDialogOpen(true);
      return;
    }

    setIsAcceptingCounter(true);

    try {
      // Make API call to accept the counter offer
      const response = await api.put(`/offer/${existingOffer.id}/status`, {
        status: "ACCEPTED",
        buyerMessage: "Counter offer accepted",
        acceptedPrice: counteredPrice  // Explicitly include the accepted price
      });

      setDialogMessage("You have accepted the counter offer! Our team will contact you soon with the next steps.");
      setDialogType("success");
      setDialogOpen(true);

      // Update local state
      setOfferStatus("ACCEPTED");
      setOfferPrice(counteredPrice.toLocaleString());  // Update displayed price to match counter price

      // Update existing offer object in state
      setExistingOffer({
        ...existingOffer,
        offerStatus: "ACCEPTED",
        offeredPrice: counteredPrice  // Update the price in our local state
      });

    } catch (error) {
      setDialogMessage("Failed to accept counter offer. Please try again or contact support.");
      setDialogType("warning");
      setDialogOpen(true);
    } finally {
      setIsAcceptingCounter(false);
    }
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

    // If there's an existing offer, check if the new price is valid based on status
    if (hasExistingOffer) {
      if (!validateOfferPrice(offerPrice)) {
        // Show dialog for entering a higher price
        setNewOfferPrice("");
        setActionType("update"); // Set action type to update
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
      buyerMessage: buyerMessage,
      // Pass auth0Id from authenticated user if available
      auth0Id: user?.sub || null
    };

    console.log("Submitting offer with data:", offerData);

    try {
      // Use the offer endpoint
      const response = await api.post("/offer/makeOffer", offerData);

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

      // Update the local state
      setExistingOffer(response.data.offer);
      setHasExistingOffer(true);
      setOfferStatus("PENDING");
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

    if (isNaN(parsedNewPrice)) {
      setDialogMessage("Please enter a valid price");
      setDialogType("warning");
      setUpdateDialogOpen(false);
      setDialogOpen(true);
      return;
    }

    if (offerStatus === "COUNTERED") {
      // For counter offers, new price must be higher than original offer
      if (parsedNewPrice <= existingOffer.offeredPrice) {
        setDialogMessage(
          `Please enter an amount higher than your previous offer of $${existingOffer.offeredPrice.toLocaleString()}.`
        );
        setDialogType("warning");
        setUpdateDialogOpen(false);
        setDialogOpen(true);
        return;
      }
    } else {
      // For regular updates, price must be higher than the previous offer
      if (parsedNewPrice <= existingOffer.offeredPrice) {
        setDialogMessage(
          `Please enter an amount higher than your previous offer of $${existingOffer.offeredPrice.toLocaleString()}.`
        );
        setDialogType("warning");
        setUpdateDialogOpen(false);
        setDialogOpen(true);
        return;
      }
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
      buyerMessage: updateMessage || null,
      auth0Id: user?.sub || null
    };

    try {
      const response = await api.post("/offer/makeOffer", offerData);

      setDialogMessage("Your offer has been successfully updated!");
      setDialogType("success");
      setDialogOpen(true);

      // Update local state
      setExistingOffer(response.data.offer);
      setOfferStatus("PENDING");
      // Reset the update message after successful submission
      setUpdateMessage("");
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

  // Get card title based on offer status
  const getCardTitle = () => {
    if (!hasExistingOffer) {
      return "Make An Offer";
    }

    switch (offerStatus) {
      case "PENDING":
        return "Your Pending Offer";
      case "ACCEPTED":
        return "Your Accepted Offer";
      case "REJECTED":
        return "Your Offer Was Rejected";
      case "COUNTERED":
        return "Counter Offer Received";
      case "EXPIRED":
        return "Your Offer Has Expired";
      default:
        return "Your Offer";
    }
  };

  // Check if form should be disabled based on status
  const isFormDisabled = () => {
    return offerStatus === "ACCEPTED";
  };

  // Get status message for the alert
  const getStatusMessage = () => {
    switch (offerStatus) {
      case "PENDING":
        return "Your offer is pending review.";
      case "ACCEPTED":
        return "Congratulations! Your offer has been accepted.";
      case "REJECTED":
        return "We're sorry, your offer was not accepted. You can submit a new offer if you're still interested.";
      case "COUNTERED":
        return `We've made a counter offer of $${counteredPrice?.toLocaleString() || 0}. You can accept this counter offer or propose a new offer.`;
      case "EXPIRED":
        return "Your offer has expired. You can submit a new offer if you're still interested.";
      default:
        return "";
    }
  };

  // Get status color for styling
  const getStatusColor = () => {
    switch (offerStatus) {
      case "PENDING":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "ACCEPTED":
        return "bg-green-50 border-green-200 text-green-800";
      case "REJECTED":
        return "bg-red-50 border-red-200 text-red-800";
      case "COUNTERED":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "EXPIRED":
        return "bg-gray-50 border-gray-200 text-gray-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (offerStatus) {
      case "PENDING":
        return <InfoCircledIcon className="h-4 w-4 text-amber-800" />;
      case "ACCEPTED":
        return <CheckCircledIcon className="h-4 w-4 text-green-800" />;
      case "REJECTED":
        return <CrossCircledIcon className="h-4 w-4 text-red-800" />;
      case "COUNTERED":
        return <InfoCircledIcon className="h-4 w-4 text-blue-800" />;
      case "EXPIRED":
        return <InfoCircledIcon className="h-4 w-4 text-gray-800" />;
      default:
        return <InfoCircledIcon className="h-4 w-4" />;
    }
  };

return (
  <div className="bg-white text-[#050002]">
    <Card className="w-full max-w-md border border-[#405025]/20 bg-white shadow-lg mx-auto">
      <CardHeader className="text-center py-4">
        <CardTitle className="text-2xl font-bold text-[#405025]">
          {getCardTitle()}
        </CardTitle>
        <CardDescription className="text-[#324d49] text-sm">
          For {propertyData.streetAddress || "This Property"}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pb-3">
        {/* Status Alert - Only shown for existing offers */}
        {hasExistingOffer && (
          <Alert className={`mb-4 py-3 ${getStatusColor()}`}>
            <div className="flex items-center">
              {getStatusIcon()}
              <AlertTitle className="ml-2 text-sm">Status: {offerStatus}</AlertTitle>
            </div>
            <AlertDescription className="text-sm mt-1">{getStatusMessage()}</AlertDescription>

            {/* Show system message if exists */}
            {sysMessage && (
              <div className="mt-2 pt-1 border-t border-[#324d49]/20 text-sm">
                <p className="font-semibold">Landivo Says:</p>
                <p className="italic">{sysMessage}</p>
              </div>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name fields on same line */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <Label htmlFor="firstName" className="text-sm text-[#050002] mb-1 block">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isFormDisabled()}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="lastName" className="text-sm text-[#050002] mb-1 block">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isFormDisabled()}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Email on separate line */}
          <div>
            <Label htmlFor="email" className="text-sm text-[#050002] mb-1 block">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={isFormDisabled()}
              className="h-9 text-sm"
            />
          </div>

          {/* Phone on separate line */}
          <div>
            <Label htmlFor="phone" className="text-sm text-[#050002] mb-1 block">Phone</Label>
            <Input
              id="phone"
              type="text"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={handlePhoneChange}
              required
              disabled={isFormDisabled()}
              className="h-9 text-sm"
            />
          </div>

          {/* Offer Price and Buyer Type on same line, with Offer first */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <Label htmlFor="offerPrice" className="text-sm text-[#050002] mb-1 block">
                {hasExistingOffer
                  ? (offerStatus === "COUNTERED"
                    ? "Your Original Offer"
                    : "Your Offer Price")
                  : "Offer Price ($)"}
              </Label>
              <Input
                id="offerPrice"
                type="text"
                placeholder="500,000"
                value={offerPrice}
                onChange={handleOfferPriceChange}
                required
                disabled={isFormDisabled() || offerStatus === "COUNTERED"}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-[#050002] mb-1 block">Buyer Type</Label>
              <Select
                value={buyerType}
                onValueChange={(val) => setBuyerType(val)}
                required
                disabled={isFormDisabled()}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#FFF] text-[#050002] border border-[#405025]/20 text-sm">
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

          {/* Show counter offer price if applicable */}
          {offerStatus === "COUNTERED" && counteredPrice && (
            <div className="mt-2">
              <Label htmlFor="counteredPrice" className="text-sm font-medium text-blue-700 mb-1 block">
                Counter Offer Price
              </Label>
              <Input
                id="counteredPrice"
                type="text"
                value={counteredPrice.toLocaleString()}
                disabled={true}
                className="bg-blue-50 text-blue-800 font-medium h-9 text-sm"
              />
            </div>
          )}

          {/* Buyer Message */}
          <div>
            <Label htmlFor="buyerMessage" className="text-sm text-[#050002] mb-1 block">
              Message (Optional)
            </Label>
            <textarea
              id="buyerMessage"
              placeholder="Include any notes or questions about your offer"
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              className="w-full min-h-[70px] p-2 text-sm rounded-md border border-input bg-background resize-y"
              disabled={isFormDisabled()}
            />
          </div>

          {/* Action Buttons - Display based on offer status */}
          <div className="pt-0">
            {/* CASE 1: COUNTERED status - show side-by-side Accept Counter and Update Offer buttons */}
            {offerStatus === "COUNTERED" ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  className="w-full bg-[#324c48] text-[#FFF] hover:bg-[#324c48]/90 font-semibold text-sm h-9"
                  onClick={handleAcceptCounter}
                  disabled={isAcceptingCounter}
                >
                  {isAcceptingCounter ? "Accepting..." : "Accept Counter"}
                </Button>

                <Button
                  type="button"
                  className="w-full bg-[#405025] text-[#FFF] hover:bg-[#405025]/90 font-semibold text-sm h-9"
                  onClick={() => {
                    setActionType("counter");
                    setNewOfferPrice("");
                    setUpdateDialogOpen(true);
                  }}
                  disabled={isFormDisabled()}
                >
                  Counter Offer
                </Button>
              </div>
            ) : offerStatus === "ACCEPTED" ? (
              /* CASE 2: ACCEPTED status - show disabled accepted button */
              <Button
                type="button"
                className="w-full bg-green-600 text-[#FFF] hover:bg-green-600 font-semibold text-sm h-9 mt-1"
                disabled={true}
              >
                Offer Accepted
              </Button>
            ) : (
              /* CASE 3: All other statuses (PENDING, REJECTED, EXPIRED or new offer) - show single submit/update button */
              <Button
                type="submit"
                className="w-full bg-[#324c48] text-[#FFF] hover:bg-[#324c48]/90 font-semibold text-sm h-9 mt-1"
                disabled={isFormDisabled()}
              >
                {hasExistingOffer ? "Update Your Offer" : "Submit Offer"}
              </Button>
            )}
          </div>
        </form>
        <div className="py-2 mt-1">
          <ContactCard />
        </div>
      </CardContent>
    </Card>

    {/* Dialog Notification */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="bg-[#FFF] text-[#050002] border border-[#405025]/30 shadow-lg max-w-sm">
        <DialogHeader className="pb-2">
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
              if (dialogType === "success" && offerStatus === "ACCEPTED") {
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
      <DialogContent className="bg-[#FFF] text-[#050002] border border-[#405025]/30 shadow-lg max-w-sm">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-[#405025]">
            {actionType === "counter"
              ? "Respond to Counter Offer"
              : "Update Your Offer"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {actionType === "counter"
              ? `The seller has countered with $${counteredPrice?.toLocaleString() || 0}. You can respond with a new offer.`
              : `Your new offer must be higher than your previous offer of $${existingOffer?.offeredPrice?.toLocaleString() || "0"}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div>
            <Label htmlFor="newOfferPrice" className="text-sm text-[#050002] mb-1 block">
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
              className="text-sm h-9"
            />
          </div>
          <div>
            <Label htmlFor="updateMessage" className="text-sm text-[#050002] mb-1 block">
              Message (Optional)
            </Label>
            <textarea
              id="updateMessage"
              placeholder="Include any notes about your updated offer..."
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              className="w-full min-h-[70px] p-2 text-sm rounded-md border border-input bg-background resize-y"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <Button
            onClick={() => setUpdateDialogOpen(false)}
            variant="outline"
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateFromDialog}
            className="bg-[#324c48] text-[#FFF] text-sm"
          >
            Submit New Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
}