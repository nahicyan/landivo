// client/src/pages/Subscription/Unsubscribe.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { CheckCircleIcon, HeartIcon, EnvelopeIcon, MapPinIcon, BellIcon, TagIcon, GiftIcon, StarIcon } from "@heroicons/react/24/outline";

// Define the available areas matching your project
const AREAS = [
  { id: "DFW", label: "Dallas Fort Worth", value: "DFW" },
  { id: "Austin", label: "Austin", value: "Austin" },
  { id: "Houston", label: "Houston", value: "Houston" },
  { id: "San Antonio", label: "San Antonio", value: "San Antonio" },
  { id: "Other Areas", label: "Other Areas", value: "Other Areas" },
];

// Define subscription types
const EMAIL_TYPES = [
  {
    id: "weeklyUpdates",
    label: "Weekly Property Updates",
    description: "Get the latest properties that match your interests",
    icon: BellIcon,
  },
  {
    id: "holidayDeals",
    label: "Holiday Deals",
    description: "Special holiday promotions and seasonal offers",
    icon: GiftIcon,
  },
  {
    id: "specialDiscounts",
    label: "Special Discounts",
    description: "Exclusive discounts and VIP pricing opportunities",
    icon: TagIcon,
  },
];

export default function Unsubscribe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buyer, setBuyer] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showResubscribeForm, setShowResubscribeForm] = useState(false);
  const [actionType, setActionType] = useState(""); // Track what action was performed

  // Subscription preferences state
  const [preferences, setPreferences] = useState({
    preferredAreas: [],
    weeklyUpdates: "available",
    holidayDeals: "available",
    specialDiscounts: "available",
  });

  // Fetch buyer data and current preferences
  useEffect(() => {
    fetchBuyerData();
  }, [id]);

  const fetchBuyerData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/buyer/unsubscribe/${id}/data`);
      const buyerData = response.data; // Extract data from axios response
      setBuyer(buyerData);

      console.log("Buyer data received:", buyerData); // Debug log

      // Set current preferences - default to 'available' if null/undefined/empty
      const loadedPreferences = {
        preferredAreas: Array.isArray(buyerData.preferredAreas) ? buyerData.preferredAreas : [],
        weeklyUpdates: buyerData.weeklyUpdates === "unsubscribe" ? "unsubscribe" : "available",
        holidayDeals: buyerData.holidayDeals === "unsubscribe" ? "unsubscribe" : "available",
        specialDiscounts: buyerData.specialDiscounts === "unsubscribe" ? "unsubscribe" : "available",
      };

      console.log("Setting preferences:", loadedPreferences); // Debug log
      setPreferences(loadedPreferences);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (areaId) => {
    setPreferences((prev) => ({
      ...prev,
      preferredAreas: prev.preferredAreas.includes(areaId) ? prev.preferredAreas.filter((area) => area !== areaId) : [...prev.preferredAreas, areaId],
    }));
  };

  const handleEmailTypeChange = (emailType) => {
    setPreferences((prev) => ({
      ...prev,
      [emailType]: prev[emailType] === "available" ? "unsubscribe" : "available",
    }));
  };

  const handleSavePreferences = async () => {
    // Validate at least one area is selected
    if (preferences.preferredAreas.length === 0) {
      setError("Please select at least one area to receive property updates.");
      return;
    }

    try {
      setSaving(true);
      setError(""); // Clear any previous errors

      await api.put(`/buyer/unsubscribe/${id}`, preferences);

      setActionType("preferences");
      setSuccess(true);

      // Auto redirect after success
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError("Failed to update your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResubscribe = async () => {
    // Validate at least one area is selected
    if (preferences.preferredAreas.length === 0) {
      setError("Please select at least one area to receive property updates.");
      return;
    }

    try {
      setSaving(true);
      setError(""); // Clear any previous errors

      console.log("Resubscribing with preferences:", preferences);

      // Resubscribe with current preferences
      const result = await api.put(`/buyer/resubscribe/${id}`, {
        emailTypes: [
          preferences.weeklyUpdates === "available" ? "weeklyUpdates" : null,
          preferences.holidayDeals === "available" ? "holidayDeals" : null,
          preferences.specialDiscounts === "available" ? "specialDiscounts" : null,
        ].filter(Boolean),
        areas: preferences.preferredAreas,
      });

      console.log("Resubscribe result:", result);

      // These lines should trigger the success message
      setActionType("resubscribe");
      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Resubscribe error:", err);
      setError("Failed to resubscribe. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteUnsubscribe = async () => {
    try {
      setSaving(true);

      await api.put(`/buyer/unsubscribe/${id}/complete`);

      setActionType("unsubscribe");
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError("Failed to unsubscribe. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f4f24] mx-auto mb-4"></div>
          <p className="text-[#324c48]">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  if (error && !buyer) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>This unsubscribe link is not valid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")} className="bg-[#3f4f24] hover:bg-[#324c48]">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // MOVED SUCCESS CHECK HERE - BEFORE isAlreadyUnsubscribed CHECKS
  if (success) {
    // Different success messages based on action type
    const getSuccessContent = () => {
      switch (actionType) {
        case "resubscribe":
          return {
            title: "Welcome Back to Landivo!",
            message: `Thank you so much for resubscribing, ${buyer?.firstName || "there"}! You'll start receiving our curated property updates and exclusive deals again.`,
            icon: <HeartIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          };
        case "unsubscribe":
          return {
            title: "Successfully Unsubscribed",
            message: "You have been unsubscribed from all emails. We're sorry to see you go, but you can always resubscribe anytime.",
            icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          };
        default: // preferences
          return {
            title: "Preferences Updated!",
            message: "Your email preferences have been successfully updated. You'll only receive emails for the areas and types you selected.",
            icon: <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          };
      }
    };

    const { title, message, icon } = getSuccessContent();

    return (
      <div className="bg-[#FDF8F2] min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          {icon}
          <h2 className="text-2xl font-bold text-[#3f4f24] mb-4">{title}</h2>
          <p className="text-[#324c48] mb-6 leading-relaxed">{message}</p>
          <div className="bg-gradient-to-r from-[#FDF8F2] to-[#f4f7ee] p-4 rounded-lg border border-[#D4A017]/20 mb-4">
            <p className="text-sm text-[#324c48] flex items-center justify-center gap-2">
              <StarIcon className="h-4 w-4 text-[#D4A017]" />
              Redirecting you to explore amazing land deals...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check if user is already unsubscribed
  const isAlreadyUnsubscribed = buyer?.emailStatus === "unsubscribe";

  if (isAlreadyUnsubscribed && !showResubscribeForm) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <img src="https://cdn.landivo.com/wp-content/uploads/2025/08/unsub.gif" alt="Already Unsubscribed" className="mx-auto mb-6 rounded-lg shadow-lg max-w-xs" />
            <h1 className="text-3xl font-bold text-[#3f4f24] mb-2">You're Already Unsubscribed!</h1>
            <p className="text-[#324c48] text-lg">Hi {buyer?.firstName || "there"}! You've already opted out of our emails.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-[#3f4f24] flex items-center justify-center gap-2">
                  <HeartIcon className="h-6 w-6 text-red-400" />
                  Miss Our Updates?
                </CardTitle>
                <CardDescription className="text-[#324c48]">Consider resubscribing to stay informed about great land deals</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Resubscribe Benefits */}
                <div className="bg-gradient-to-r from-[#FDF8F2] to-[#f4f7ee] p-6 rounded-lg border border-[#D4A017]/20">
                  <h3 className="text-lg font-semibold text-[#3f4f24] mb-4 flex items-center gap-2">
                    <StarIcon className="h-5 w-5 text-[#D4A017]" />
                    What You'll Get Back
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <BellIcon className="h-4 w-4 text-[#D4A017]" />
                      <span className="text-[#324c48]">Weekly property updates in your preferred areas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GiftIcon className="h-4 w-4 text-[#D4A017]" />
                      <span className="text-[#324c48]">Exclusive holiday deals and seasonal offers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TagIcon className="h-4 w-4 text-[#D4A017]" />
                      <span className="text-[#324c48]">Special VIP discounts and early access</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setShowResubscribeForm(true)} className="flex-1 bg-[#3f4f24] hover:bg-[#324c48] text-white py-3 font-semibold h-12">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Resubscribe Now
                  </Button>

                  <Button onClick={() => navigate("/")} variant="outline" className="flex-1 border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white py-3 font-semibold h-12">
                    Browse Properties
                  </Button>
                </div>

                {/* Contact Information */}
                <div className="text-center text-sm text-[#324c48]/70 pt-4 border-t border-[#324c48]/10">
                  <p className="flex items-center justify-center gap-1">
                    <HeartIcon className="h-4 w-4" />
                    Questions? Contact us at{" "}
                    <a href="mailto:support@landivo.com" className="text-[#D4A017] hover:underline">
                      support@landivo.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show resubscribe form for already unsubscribed users
  if (isAlreadyUnsubscribed && showResubscribeForm) {
    return (
      <div className="bg-[#FDF8F2] min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <img src="https://cdn.landivo.com/wp-content/uploads/2025/08/unsub.gif" alt="Resubscribe" className="mx-auto mb-6 rounded-lg shadow-lg max-w-xs" />
            <h1 className="text-3xl font-bold text-[#3f4f24] mb-2">Welcome Back!</h1>
            <p className="text-[#324c48] text-lg">Hi {buyer?.firstName || "there"}! Choose your email preferences to resubscribe.</p>
          </motion.div>

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-[#3f4f24] flex items-center justify-center gap-2">
                  <EnvelopeIcon className="h-6 w-6" />
                  Choose Your Email Preferences
                </CardTitle>
                <CardDescription className="text-[#324c48]">Select the areas and updates you'd like to receive</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Areas Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPinIcon className="h-5 w-5 text-[#D4A017]" />
                    <h3 className="text-lg font-semibold text-[#3f4f24]">Property Areas</h3>
                  </div>
                  <p className="text-sm text-[#324c48] mb-4">Choose the areas where you'd like to receive property updates:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AREAS.map((area) => (
                      <div key={area.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`resubscribe-area-${area.id}`}
                          checked={preferences.preferredAreas.includes(area.value)}
                          onCheckedChange={() => handleAreaChange(area.value)}
                          className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                        />
                        <Label htmlFor={`resubscribe-area-${area.id}`} className="text-[#324c48] cursor-pointer font-medium">
                          {area.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Email Types Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BellIcon className="h-5 w-5 text-[#D4A017]" />
                    <h3 className="text-lg font-semibold text-[#3f4f24]">Email Types</h3>
                  </div>
                  <p className="text-sm text-[#324c48] mb-4">Choose what types of emails you'd like to receive:</p>
                  <div className="space-y-4">
                    {EMAIL_TYPES.map((emailType) => {
                      const IconComponent = emailType.icon;
                      return (
                        <div key={emailType.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#FDF8F2] border border-[#324c48]/10">
                          <Checkbox
                            id={`resubscribe-email-${emailType.id}`}
                            checked={preferences[emailType.id] === "available"}
                            onCheckedChange={() => handleEmailTypeChange(emailType.id)}
                            className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017] mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={`resubscribe-email-${emailType.id}`} className="text-[#324c48] cursor-pointer font-medium flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-[#D4A017]" />
                              {emailType.label}
                            </Label>
                            <p className="text-xs text-[#324c48]/70 mt-1">{emailType.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleResubscribe} disabled={saving} className="flex-1 bg-[#3f4f24] hover:bg-[#324c48] text-white py-3 font-semibold">
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Resubscribing...
                      </div>
                    ) : (
                      "Resubscribe to Emails"
                    )}
                  </Button>

                  <Button
                    onClick={() => setShowResubscribeForm(false)}
                    disabled={saving}
                    variant="outline"
                    className="flex-1 border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white py-3 font-semibold">
                    Cancel
                  </Button>
                </div>

                {/* Contact Information */}
                <div className="text-center text-sm text-[#324c48]/70 pt-4 border-t border-[#324c48]/10">
                  <p className="flex items-center justify-center gap-1">
                    <HeartIcon className="h-4 w-4" />
                    Questions? Contact us at{" "}
                    <a href="mailto:support@landivo.com" className="text-[#D4A017] hover:underline">
                      support@landivo.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF8F2] min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with GIF */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <img src="https://cdn.landivo.com/wp-content/uploads/2025/08/unsub.gif" alt="Unsubscribe" className="mx-auto mb-6 rounded-lg shadow-lg max-w-xs" />
          <h1 className="text-3xl font-bold text-[#3f4f24] mb-2">We're Sorry to See You Leave!</h1>
          <p className="text-[#324c48] text-lg">Hi {buyer?.firstName || "there"}! Instead of leaving completely, how about customizing what you receive?</p>
        </motion.div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-[#3f4f24] flex items-center justify-center gap-2">
                <EnvelopeIcon className="h-6 w-6" />
                Customize Your Email Preferences
              </CardTitle>
              <CardDescription className="text-[#324c48]">Select only the areas and updates you're interested in</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Areas Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPinIcon className="h-5 w-5 text-[#D4A017]" />
                  <h3 className="text-lg font-semibold text-[#3f4f24]">Property Areas</h3>
                </div>
                <p className="text-sm text-[#324c48] mb-4">Choose the areas where you'd like to receive property updates:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AREAS.map((area) => (
                    <div key={area.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`area-${area.id}`}
                        checked={preferences.preferredAreas.includes(area.value)}
                        onCheckedChange={() => handleAreaChange(area.value)}
                        className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                      />
                      <Label htmlFor={`area-${area.id}`} className="text-[#324c48] cursor-pointer font-medium">
                        {area.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Email Types Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BellIcon className="h-5 w-5 text-[#D4A017]" />
                  <h3 className="text-lg font-semibold text-[#3f4f24]">Email Types</h3>
                </div>
                <p className="text-sm text-[#324c48] mb-4">Choose what types of emails you'd like to receive:</p>
                <div className="space-y-4">
                  {EMAIL_TYPES.map((emailType) => {
                    const IconComponent = emailType.icon;
                    return (
                      <div key={emailType.id} className="flex items-start space-x-3 p-3 rounded-lg bg-[#FDF8F2] border border-[#324c48]/10">
                        <Checkbox
                          id={`email-${emailType.id}`}
                          checked={preferences[emailType.id] === "available"}
                          onCheckedChange={() => handleEmailTypeChange(emailType.id)}
                          className="border-gray-400 data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017] mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`email-${emailType.id}`} className="text-[#324c48] cursor-pointer font-medium flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-[#D4A017]" />
                            {emailType.label}
                          </Label>
                          <p className="text-xs text-[#324c48]/70 mt-1">{emailType.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSavePreferences} disabled={saving} className="flex-1 bg-[#3f4f24] hover:bg-[#324c48] text-white py-3 font-semibold">
                  {saving ? "Saving..." : "Save My Preferences"}
                </Button>

                <Button
                  onClick={handleCompleteUnsubscribe}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 py-3 font-semibold">
                  Unsubscribe from All
                </Button>
              </div>

              {/* Contact Information */}
              <div className="text-center text-sm text-[#324c48]/70 pt-4 border-t border-[#324c48]/10">
                <p className="flex items-center justify-center gap-1">
                  <HeartIcon className="h-4 w-4" />
                  Still have questions? Contact us at{" "}
                  <a href="mailto:support@landivo.com" className="text-[#D4A017] hover:underline">
                    support@landivo.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
