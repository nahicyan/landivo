// client/src/pages/AddProperty/AddProperty.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createResidencyWithFiles } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Loader2 } from "lucide-react";
// Import subcomponents
import SystemInfo from "@/components/AddProperty/SystemInfo";
import ListingDetails from "@/components/AddProperty/ListingDetails";
import Classification from "@/components/AddProperty/Classification";
import ComparativeMarketAnalysis from "@/components/AddProperty/ComparativeMarketAnalysis";
import Location from "@/components/AddProperty/Location";
import Dimension from "@/components/AddProperty/Dimension";
import Pricing from "@/components/AddProperty/Pricing";
import Financing from "@/components/AddProperty/Financing";
import Utilities from "@/components/AddProperty/Utilities";
import MediaTags from "@/components/AddProperty/MediaTags";
import PropertySuccessDialog from "@/components/PropertyUpload/PropertySuccessDialog";

export default function AddProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Current step index
  const [step, setStep] = useState(0);

  // Loading state for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog state for alert after submission
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success"); // "success" or "warning"

  // State for validation errors
  const [formErrors, setFormErrors] = useState({});
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // Property creation result
  const [createdPropertyId, setCreatedPropertyId] = useState(null);
  const [createdPropertyData, setCreatedPropertyData] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // System Information
    ownerId: "",
    status: "",
    area: "",
    featured: "Not Featured",
    featuredPosition: 0,
    profileId: "",

    // Listing Details
    title: "",
    description: "",
    notes: "",

    // Classification
    type: "Land", // Default value
    landType: [],
    legalDescription: "",
    zoning: "",
    restrictions: "",
    mobileHomeFriendly: "",
    hoaPoa: "No", // Default value
    hoaPaymentTerms: "",
    hoaFee: "",
    survey: "",

    // CMA fields
    hasCma: false,
    cmaData: "",
    cmaFilePath: "",

    // Address and Location
    direction: "",
    streetAddress: "",
    // Display
    toggleObscure: false,
    //
    city: "",
    county: "",
    state: "",
    zip: "",
    latitude: "",
    longitude: "",
    apnOrPin: "",
    landId: false,
    landIdLink: "",

    // Dimensions
    sqft: "",
    acre: "",

    // Pricing and Financing
    askingPrice: "",
    minPrice: "",
    disPrice: "",

    // Financing and Payment Calculation
    financing: "Not-Available", // Default value
    financingTwo: "Not-Available", // Default value
    financingThree: "Not-Available", // Default value
    tax: "",
    closingDate: "", 
    hoaMonthly: "",
    serviceFee: "35",
    term: "",
    interestOne: "",
    interestTwo: "",
    interestThree: "",
    monthlyPaymentOne: "",
    monthlyPaymentTwo: "",
    monthlyPaymentThree: "",
    downPaymentOne: "",
    downPaymentTwo: "",
    downPaymentThree: "",
    loanAmountOne: "",
    loanAmountTwo: "",
    loanAmountThree: "",
    purchasePrice: "",
    financedPrice: "",

    // Utilities and Infrastructure
    water: "",
    sewer: "",
    electric: "",
    roadCondition: "",
    floodplain: "No", // Default value

    //Media & Tags
    ltag: "",
    rtag: "",
  });

  // Media state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [cmaFile, setCmaFile] = useState(null);

  // Required fields for each step (based on Prisma schema without ?)
  const requiredFieldsByStep = {
    0: ["status", "area", "profileId"], // System Info
    1: ["title", "description"], // Listing Details
    2: ["type", "landType", "zoning"], // Classification
    3: ["streetAddress", "city", "state", "zip", "latitude", "longitude", "apnOrPin"], // Location
    4: ["sqft"], // Dimensions
    5: ["askingPrice", "minPrice", "disPrice", "hoaPoa"], // Pricing
    6: ["financing"],
    7: ["water", "sewer", "electric", "roadCondition", "floodplain"], // Utilities
  };

  // Update the validateStep function
  const validateStep = (stepIndex) => {
    const currentRequiredFields = requiredFieldsByStep[stepIndex] || [];
    const errors = {};
    let isValid = true;

    // Special validation for MediaTags step (step 9)
    if (stepIndex === 9) {
      if (uploadedImages.length === 0) {
        errors.images = "At least one image is required";
        isValid = false;
      }
    }

    currentRequiredFields.forEach((field) => {
      // Handle rich text fields
      if (field === "title" || field === "description") {
        const textContent = formData[field]?.replace(/<[^>]*>/g, "")?.trim();
        if (!textContent) {
          errors[field] = "This field is required";
          isValid = false;
        }
      }
      // Handle array fields
      else if (field === "landType") {
        if (!Array.isArray(formData[field]) || formData[field].length === 0) {
          errors[field] = "At least one land type is required";
          isValid = false;
        }
      }
      // Handle numeric fields
      else if (["sqft", "askingPrice", "minPrice"].includes(field)) {
        const numValue = formData[field]?.toString().replace(/,/g, "");
        if (!numValue || isNaN(parseFloat(numValue))) {
          errors[field] = "This field is required";
          isValid = false;
        }
      }
      // Handle regular string fields
      else if (!formData[field] || formData[field].toString().trim() === "") {
        errors[field] = "This field is required";
        isValid = false;
      }
    });

    return { valid: isValid, errors };
  };

  // Helper function to check if rich text is empty
  const isRichTextEmpty = (value) => {
    if (!value) return true;
    // Remove HTML tags and check if anything remains
    const textOnly = value.replace(/<[^>]*>/g, "").trim();
    return !textOnly;
  };

  // Add handler for CMA file upload
  const handleCmaFileUpload = (file) => {
    setCmaFile(file);
  };

  // Numeric fields formatting, etc.
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    setFormData((prev) => {
      const updated = { ...prev };
      const numericFields = [
        // Skip sqft and acre as they are now handled in Dimension.jsx

        // Pricing and Financing
        "askingPrice",
        "minPrice",
        "disPrice",
        "hoaFee",

        // Financing and Payment Calculation
        "tax",
        "hoaMonthly",
        "serviceFee",
        "interestOne",
        "interestTwo",
        "interestThree",
        "monthlyPaymentOne",
        "monthlyPaymentTwo",
        "monthlyPaymentThree",
        "downPaymentOne",
        "downPaymentTwo",
        "downPaymentThree",
        "loanAmountOne",
        "loanAmountTwo",
        "loanAmountThree",
        "purchasePrice",
        "financedPrice",
      ];

      if (numericFields.includes(name)) {
        const noCommas = value.replace(/,/g, "");
        const numberVal = parseFloat(noCommas);
        if (!isNaN(numberVal)) {
          updated[name] = numberVal.toLocaleString("en-US");
        } else {
          updated[name] = "";
        }
      } else {
        updated[name] = value;
      }
      return updated;
    });
  };

  // Handle form submission
  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();

    // Validate the final step
    const finalValidation = validateStep(step);
    if (!finalValidation.valid) {
      setFormErrors(finalValidation.errors);
      setShowValidationAlert(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validate all steps to make sure everything is filled
    let allValid = true;
    let allErrors = {};

    Object.keys(requiredFieldsByStep).forEach((stepIdx) => {
      const validation = validateStep(parseInt(stepIdx));
      if (!validation.valid) {
        allValid = false;
        allErrors = { ...allErrors, ...validation.errors };
      }
    });

    if (!allValid) {
      setFormErrors(allErrors);
      setShowValidationAlert(true);
      setDialogMessage("Please complete all required fields before submitting");
      setDialogType("warning");
      setDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const numericFields = [
        // Physical Attributes
        "sqft",
        "acre",

        // Pricing and Financing
        "askingPrice",
        "minPrice",
        "disPrice",
        "hoaFee",

        // Financing and Payment Calculation
        "tax",
        "hoaMonthly",
        "serviceFee",
        "interestOne",
        "interestTwo",
        "interestThree",
        "monthlyPaymentOne",
        "monthlyPaymentTwo",
        "monthlyPaymentThree",
        "downPaymentOne",
        "downPaymentTwo",
        "downPaymentThree",
        "loanAmountOne",
        "loanAmountTwo",
        "loanAmountThree",
        "purchasePrice",
        "financedPrice",
      ];

      const multipartForm = new FormData();
      for (let key in formData) {
        if (key === "imageUrls" || key === "videoUrls") continue; // skip imageUrls and videoUrls here

        let val = formData[key];

        if (numericFields.includes(key) && typeof val === "string") {
          val = val.replace(/,/g, "");
        }

        // Special handling for landType array
        if (key === "landType" && Array.isArray(val)) {
          multipartForm.append(key, JSON.stringify(val));
        } else {
          multipartForm.append(key, val);
        }
      }

      // Only include featuredPosition if the property is featured
      if (formData.featured === "Featured") {
        multipartForm.append("featuredPosition", formData.featuredPosition);
      }

      // Append CMA file if available
      if (cmaFile) {
        multipartForm.append("cmaFile", cmaFile);
      }

      // Append empty array for image URLs
      multipartForm.append("imageUrls", JSON.stringify([]));
      multipartForm.append("videoUrls", JSON.stringify([]));

      // Append newly uploaded files
      uploadedImages.forEach((file) => multipartForm.append("images", file));
      uploadedVideos.forEach((file) => multipartForm.append("videos", file));

      const result = await createResidencyWithFiles(multipartForm);
      setCreatedPropertyId(result.residency.id);
      setCreatedPropertyData(result.residency);

      setDialogMessage("Property added successfully!");
      setDialogType("success");
      setDialogOpen(true);
    } catch (error) {
      console.error("Error creating property:", error);
      // Attempt to extract a detailed error message from the response
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Unknown error";
      setDialogMessage(`Failed to create property: ${errorMsg}`);
      setDialogType("warning");
      setDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty form handler to prevent default behavior
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Form submission is handled explicitly by buttons
  };

  // Steps navigation with validation
  const nextStep = () => {
    const validation = validateStep(step);

    if (validation.valid) {
      // Clear errors when validation passes
      setFormErrors({});
      setShowValidationAlert(false);
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      // Update errors state to show validation messages
      setFormErrors(validation.errors);
      setShowValidationAlert(true);

      // Scroll to the top to show validation alert
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  // Define steps array with all necessary props passed to each component
  const steps = [
    {
      title: "System Info",
      component: <SystemInfo formData={formData} handleChange={handleChange} errors={formErrors} />,
    },
    {
      title: "Listing Details",
      component: (
        <ListingDetails
          formData={formData}
          errors={formErrors}
          handleTitleChange={(val) => {
            if (formErrors.title) {
              setFormErrors((prev) => {
                const updated = { ...prev };
                delete updated.title;
                return updated;
              });
            }
            setFormData((prev) => ({ ...prev, title: val }));
          }}
          handleDescriptionChange={(val) => {
            if (formErrors.description) {
              setFormErrors((prev) => {
                const updated = { ...prev };
                delete updated.description;
                return updated;
              });
            }
            setFormData((prev) => ({ ...prev, description: val }));
          }}
          handleNotesChange={(val) => setFormData((prev) => ({ ...prev, notes: val }))}
        />
      ),
    },
    {
      title: "Classification",
      component: <Classification formData={formData} handleChange={handleChange} errors={formErrors} />,
    },
    {
      title: "Location",
      component: <Location formData={formData} handleChange={handleChange} setFormData={setFormData} errors={formErrors} />,
    },
    {
      title: "Dimensions",
      component: <Dimension formData={formData} handleChange={handleChange} setFormData={setFormData} errors={formErrors} />,
    },
    {
      title: "Pricing",
      component: <Pricing formData={formData} handleChange={handleChange} errors={formErrors} />,
    },
    {
      title: "Financing",
      component: (
        <Financing
          formData={formData}
          handleChange={handleChange}
          updateFormData={(updatedData) => {
            // Clear any financing related errors when updating form data
            const updatedErrors = { ...formErrors };
            Object.keys(updatedErrors).forEach((key) => {
              if (["financing", "term", "interestOne"].includes(key)) {
                delete updatedErrors[key];
              }
            });
            setFormErrors(updatedErrors);
            setFormData(updatedData);
          }}
          errors={formErrors}
        />
      ),
    },
    {
      title: "Utilities",
      component: <Utilities formData={formData} handleChange={handleChange} errors={formErrors} />,
    },
    {
      title: "Market Analysis",
      component: (
        <ComparativeMarketAnalysis
          formData={formData}
          handleChange={handleChange}
          handleCmaFileUpload={handleCmaFileUpload}
          handleCmaDataChange={(val) => setFormData((prev) => ({ ...prev, cmaData: val }))}
          errors={formErrors}
        />
      ),
    },
    {
      title: "Media & Tags",
      component: (
        <MediaTags
          formData={formData}
          handleChange={handleChange}
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          uploadedVideos={uploadedVideos}
          setUploadedVideos={setUploadedVideos}
          errors={formErrors}
        />
      ),
    },
  ];

  // Step Indicator component
  const StepIndicator = ({ currentStep }) => {
    return (
      <div className="w-full flex items-center justify-between mb-8 px-2">
        {steps.map((item, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const hasErrors = Object.keys(requiredFieldsByStep[index] || {}).some((field) => Object.keys(formErrors).includes(field));

          return (
            <React.Fragment key={index}>
              {/* Circle with number or check */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                    hasErrors
                      ? "border-red-500 bg-red-100 text-red-700"
                      : isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : isActive
                      ? "border-blue-500 bg-blue-100 text-blue-700"
                      : "border-gray-300 bg-white text-gray-500"
                  }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>

                {/* Step title - shown underneath in small text */}
                <span className={`text-xs mt-1 text-center ${hasErrors ? "font-semibold text-red-600" : isCompleted || isActive ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                  {item.title}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < steps.length - 1 && <div className="w-full h-[2px] bg-gray-300 mx-1"></div>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-[#324c48] text-center mb-4">Add New Property</h1>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Validation Alert */}
      {showValidationAlert && Object.keys(formErrors).length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Please complete all required fields</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {Object.keys(formErrors).map((field) => (
                    <li key={field}>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")} is required</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form with explicit onSubmit handler to prevent default behavior */}
      <form onSubmit={handleFormSubmit} className="w-full">
        {/* Current Step Content - Only show the active step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg max-w-2xl mx-auto min-h-[640px]">
            {steps[step].component}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between w-full mt-6 max-w-2xl mx-auto">
          <div>
            {/* Left container */}
            {step > 0 && (
              <Button type="button" onClick={prevStep} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center" disabled={isSubmitting}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>
            )}
          </div>

          <div>
            {/* Right container */}
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="bg-[#324c48] text-white px-4 py-2 rounded-md flex items-center">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmitForm} className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* ShadCN Alert Dialog */}
      <PropertySuccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dialogType={dialogType}
        dialogMessage={dialogMessage}
        propertyId={createdPropertyId}
        propertyData={createdPropertyData}
      />
    </div>
  );
}
