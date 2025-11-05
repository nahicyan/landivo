// client/src/pages/EditProperty/EditProperty.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProperty, updateProperty } from "@/utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/hooks/useAuth";
import { Loader2, Check, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

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

// Format number with commas for display
const formatWithCommas = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function EditProperty() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for validation
  const [formErrors, setFormErrors] = useState({});
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // Store raw numeric values separately to preserve full values
  const [rawValues, setRawValues] = useState({});

  // New state for tracking CMA document removal
  const [removeCmaFile, setRemoveCmaFile] = useState(false);

  // Form data state with formatted display values
  const [formData, setFormData] = useState({
    ownerId: "",
    status: "",
    area: "",
    featured: "",
    featuredPosition: 0,
    propertyRows: "",
    profileId: "",
    title: "",
    description: "",
    notes: "",
    type: "",
    landType: [],
    legalDescription: "",
    zoning: "",
    restrictions: "",
    mobileHomeFriendly: "",
    hoaPoa: "",
    hoaPaymentTerms: "",
    hoaFee: "",
    survey: "",
    direction: "",
    streetAddress: "",
    toggleObscure: false,
    city: "",
    county: "",
    state: "",
    zip: "",
    latitude: "",
    longitude: "",
    apnOrPin: "",
    landId: "",
    landIdLink: "",
    sqft: "",
    acre: "",
    askingPrice: "",
    minPrice: "",
    disPrice: "",
    financing: "",
    financingTwo: "",
    financingThree: "",
    tax: "",
    closingDate: "",
    hoaMonthly: "",
    serviceFee: "",
    termOne: "",
    termTwo: "",
    termThree: "",
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
    water: "",
    sewer: "",
    electric: "",
    roadCondition: "",
    floodplain: "",
    ltag: "",
    rtag: "",
    // CMA fields
    hasCma: false,
    cmaData: "",
    cmaFilePath: "",
  });

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
      const totalImages = existingImages.length + uploadedImages.length;
      if (totalImages === 0) {
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

  // Media state
  const [existingImages, setExistingImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  // New state for videos
  const [existingVideos, setExistingVideos] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  // Add new state for CMA file
  const [cmaFile, setCmaFile] = useState(null);

  // Add handler for CMA file upload
  const handleCmaFileUpload = (file) => {
    setCmaFile(file);
  };

  // Define numeric fields that need special handling
  const numericFields = [
    "sqft",
    "acre",
    "askingPrice",
    "minPrice",
    "disPrice",
    "hoaFee",
    "tax",
    "hoaMonthly",
    "serviceFee",
    "termOne",
    "termTwo",
    "termThree",
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

  // Fetch property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoading(true);
        setLoadingError(null);

        const data = await getProperty(propertyId);
        if (!data) throw new Error("Property not found");

        // Process data for the form
        const processedData = { ...data };
        const rawDataValues = {};

        // Format numeric fields with commas for display while preserving raw values
        numericFields.forEach((field) => {
          if (processedData[field] !== undefined && processedData[field] !== null) {
            // Store raw value for calculations and submission
            rawDataValues[field] = processedData[field];
            // Format with commas for display
            processedData[field] = formatWithCommas(processedData[field]);
          }
        });

        // Handle landType field parsing - with better error handling
        try {
          if (processedData.landType) {
            // If it's a string that looks like a JSON array
            if (typeof processedData.landType === "string") {
              // First try parsing it as JSON
              try {
                const parsed = JSON.parse(processedData.landType);
                processedData.landType = Array.isArray(parsed) ? parsed : [processedData.landType];
              } catch (parseError) {
                // If parsing fails, treat it as a single value
                processedData.landType = [processedData.landType];
              }
            }
            // If it's already an array, leave it alone
            else if (Array.isArray(processedData.landType)) {
              // Keep as is
            }
            // Any other type, convert to string and wrap in array
            else {
              processedData.landType = [String(processedData.landType)];
            }
          } else {
            processedData.landType = [];
          }
          //LandId Conversion
          processedData.landId = processedData.landId === true || processedData.landId === "true";

          // Extra check to make sure we don't get stringified arrays displayed
          // This handles the specific case shown in your screenshot
          if (processedData.landType.length === 1 && typeof processedData.landType[0] === "string" && processedData.landType[0].startsWith("[") && processedData.landType[0].endsWith("]")) {
            try {
              processedData.landType = JSON.parse(processedData.landType[0]);
            } catch (e) {
              // Keep original if parsing fails
            }
          }
        } catch (e) {
          console.error("Error processing landType:", e);
          processedData.landType = [];
        }

        // Handle existing images
        let imageArray = [];
        if (processedData.imageUrls) {
          if (typeof processedData.imageUrls === "string") {
            try {
              imageArray = JSON.parse(processedData.imageUrls);
            } catch (e) {
              console.error("Error parsing image URLs:", e);
              imageArray = [];
            }
          } else if (Array.isArray(processedData.imageUrls)) {
            imageArray = processedData.imageUrls;
          }
        }
        setExistingImages(imageArray);
        delete processedData.imageUrls;

        // Handle existing videos
        let videoArray = [];
        if (processedData.videoUrls) {
          if (typeof processedData.videoUrls === "string") {
            try {
              videoArray = JSON.parse(processedData.videoUrls);
            } catch (e) {
              console.error("Error parsing video URLs:", e);
              videoArray = [];
            }
          } else if (Array.isArray(processedData.videoUrls)) {
            videoArray = processedData.videoUrls;
          }
        }
        setExistingVideos(videoArray);
        delete processedData.videoUrls;

        // Ensure hasCma is a boolean
        processedData.hasCma = !!processedData.hasCma;

        setFormData(processedData);
        setRawValues(rawDataValues);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching property:", error);
        setLoadingError(error.message || "Failed to load property data");
        setIsLoading(false);
      }
    };

    if (propertyId) fetchPropertyData();
  }, [propertyId]);

  // Handle input changes
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

    if (numericFields.includes(name)) {
      // For numeric fields, store raw value and display formatted value
      const rawValue = value.replace(/,/g, "");

      setRawValues((prev) => ({
        ...prev,
        [name]: rawValue === "" ? null : rawValue,
      }));

      setFormData((prev) => {
        const updated = { ...prev };

        if (rawValue === "") {
          updated[name] = "";
        } else {
          const numberVal = parseFloat(rawValue);
          if (!isNaN(numberVal)) {
            updated[name] = formatWithCommas(numberVal);

            // Special case for sqft to acre conversion
            if (name === "sqft") {
              const acreValue = numberVal / 43560;
              updated.acre = formatWithCommas(acreValue.toFixed(2));

              setRawValues((prev) => ({
                ...prev,
                acre: acreValue.toFixed(2),
              }));
            }
          } else {
            updated[name] = value;
          }
        }

        return updated;
      });
    } else {
      // For non-numeric fields, just update normally
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handler for removing CMA file
  const handleRemoveCmaFile = () => {
    setRemoveCmaFile(true);
    // Clear the cmaFilePath from form data to update the UI
    setFormData((prev) => ({
      ...prev,
      cmaFilePath: null,
    }));
  };

  // Handle form submission - FIXED VERSION WITH PROPERTY ROWS
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
      // Create a FormData object for file uploads
      const form = new FormData();

      // Process propertyRows specially if it exists
      if (formData.propertyRows) {
        form.append("propertyRows", formData.propertyRows);
      }

      // Only include fields that match the server's schema exactly
      const validFields = [
        // System Info
        "ownerId",
        "status",
        "area",
        "featured",
        "featuredPosition",
        "profileId",

        // Listing Details
        "title",
        "description",
        "notes",

        // Classification
        "type",
        "landType",
        "legalDescription",
        "zoning",
        "restrictions",
        "mobileHomeFriendly",
        "hoaPoa",
        "hoaPaymentTerms",
        "hoaFee",
        "survey",

        // CMA fields
        "hasCma",
        "cmaData",
        "cmaFilePath",

        // Location
        "direction",
        "streetAddress",
        "toggleObscure",
        "city",
        "county",
        "state",
        "zip",
        "latitude",
        "longitude",
        "apnOrPin",
        "landId",
        "landIdLink",

        // Dimensions
        "sqft",
        "acre",

        // Pricing
        "askingPrice",
        "minPrice",
        "disPrice",
        "closingDate",

        // Financing
        "financing",
        "financingTwo",
        "financingThree",
        "tax",
        "hoaMonthly",
        "serviceFee",
        "termOne",
        "termTwo",
        "termThree",
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

        // Utilities
        "water",
        "sewer",
        "electric",
        "roadCondition",
        "floodplain",

        // Media
        "ltag",
        "rtag",
      ];

      // Process each valid field
      validFields.forEach((field) => {
        if (field === "landType") {
          const landTypeValue = formData[field];
          const landTypeArray = Array.isArray(landTypeValue) ? landTypeValue : [];
          form.append(field, JSON.stringify(landTypeArray));
        }
        // ADD THIS SPECIAL CASE FOR closingDate ONLY
        else if (field === "closingDate") {
          const dateValue = formData[field];
          // Only append if it has a real value (not null, "null", or empty)
          if (dateValue && dateValue !== "null" && dateValue !== "") {
            form.append(field, dateValue);
          }
          // Skip appending if no valid date
        }
        // KEEP EVERYTHING ELSE EXACTLY AS IS
        else if (numericFields.includes(field)) {
          const rawValue = rawValues[field];
          form.append(field, rawValue === undefined || rawValue === "" ? null : rawValue);
        } else if (formData[field] !== undefined) {
          form.append(field, formData[field]);
        }
      });

      // Add flag for removing CMA file if set
      if (removeCmaFile) {
        form.append("removeCmaFile", "true");
      }

      // Append images
      form.append("imageUrls", JSON.stringify(existingImages));
      uploadedImages.forEach((file) => form.append("images", file));

      // Append videos
      form.append("videoUrls", JSON.stringify(existingVideos));
      uploadedVideos.forEach((file) => form.append("videos", file));

      // Append CMA file if available
      if (cmaFile) {
        form.append("cmaFile", cmaFile);
      }

      console.log("Submitting update for property:", propertyId);
      await updateProperty(propertyId, form);

      setDialogMessage("Property updated successfully!");
      setDialogType("success");
      setDialogOpen(true);
    } catch (error) {
      console.error("Error updating property:", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      setDialogMessage(`Failed to update property: ${errorMsg}`);
      setDialogType("warning");
      setDialogOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => e.preventDefault();

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

  // Define steps array with components
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
      component: <Dimension formData={formData} handleChange={handleChange} setFormData={setFormData} setRawValues={setRawValues} errors={formErrors} />,
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
            // Maintain raw values when updating from Financing component
            const newFormData = { ...updatedData };
            const newRawValues = { ...rawValues };

            numericFields.forEach((field) => {
              if (updatedData[field] !== undefined) {
                const rawVal = typeof updatedData[field] === "string" ? updatedData[field].replace(/,/g, "") : updatedData[field];

                newRawValues[field] = rawVal === "" ? null : rawVal;
                newFormData[field] = formatWithCommas(rawVal);
              }
            });

            setRawValues(newRawValues);
            setFormData(newFormData);
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
          handleRemoveCmaFile={handleRemoveCmaFile}
          existingCmaFile={!!formData.cmaFilePath && !removeCmaFile}
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
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          uploadedVideos={uploadedVideos}
          setUploadedVideos={setUploadedVideos}
          existingVideos={existingVideos}
          setExistingVideos={setExistingVideos}
          errors={formErrors}
        />
      ),
    },
  ];

  // Step Indicator component - UPDATED to make all steps clickable and show validation errors
  const StepIndicator = ({ currentStep }) => {
    // Function to navigate directly to any step when clicked
    const goToStep = (index) => {
      // Allow navigation to any step
      setStep(index);
    };

    return (
      <div className="w-full flex items-center justify-between mb-8 px-2">
        {steps.map((item, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const hasErrors = requiredFieldsByStep[index] && requiredFieldsByStep[index].some((field) => Object.keys(formErrors).includes(field));

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center cursor-pointer" onClick={() => goToStep(index)}>
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 
                    ${
                      hasErrors
                        ? "border-red-500 bg-red-100 text-red-700"
                        : isCompleted
                        ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                        : isActive
                        ? "border-blue-500 bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "border-gray-300 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-100"
                    } transition-colors duration-200`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 text-center ${
                    hasErrors ? "font-semibold text-red-600" : isCompleted || isActive ? "font-semibold text-gray-900" : "text-gray-500"
                  } hover:text-gray-900`}>
                  {item.title}
                </span>
              </div>
              {index < steps.length - 1 && <div className="w-full h-[2px] bg-gray-300 mx-1"></div>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-[#324c48] animate-spin" />
        <p className="mt-4 text-[#324c48] text-lg">Loading property data...</p>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-red-700 text-xl font-semibold mb-2">Error Loading Property</h2>
          <p className="text-red-600 mb-4">{loadingError}</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => navigate("/properties")} className="bg-[#324c48] text-white hover:bg-[#253838]">
              Back to Properties
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-[#3f4f24] text-white hover:bg-[#2c3b18]">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-[#324c48]">Edit Property</h1>
        <Button onClick={() => navigate(`/properties/${propertyId}`)} variant="outline" className="text-[#324c48] border-[#324c48]">
          View Property
        </Button>
      </div>

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

      <form onSubmit={handleFormSubmit} className="w-full">
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

        <div className="flex items-center justify-between w-full mt-6 max-w-2xl mx-auto">
          <div>
            {step > 0 && (
              <Button type="button" onClick={prevStep} className="bg-gray-300 text-gray-800 hover:bg-gray-400 flex items-center" disabled={isSubmitting}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>

          <div>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="bg-[#324c48] text-white hover:bg-[#253838] flex items-center">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmitForm} className="bg-green-600 text-white hover:bg-green-700 flex items-center" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update Property
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border border-gray-300 shadow-lg rounded-lg p-6 w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className={dialogType === "success" ? "text-green-600" : "text-red-600"}>{dialogType === "success" ? "Success" : "Warning"}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen(false);
                if (dialogType === "success") {
                  navigate(`/properties/${propertyId}`);
                }
              }}
              className="bg-[#324c48] text-white hover:bg-[#253838]">
              {dialogType === "success" ? "View Property" : "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
