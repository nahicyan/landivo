// client/src/hooks/useDiscountCampaignSender.js
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export function useDiscountCampaignSender(propertyId, propertyData) {
  const [campaignSubject, setCampaignSubject] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const handleSendCampaign = async (sendType) => {
    if (!campaignSubject.trim()) {
      toast.error("Please enter a subject line");
      return false;
    }

    setSendingCampaign(true);

    try {
      const payload = {
        propertyID: propertyId,
        type: "single",
        subject: campaignSubject,
        audienceType: "area",
        area: propertyData?.area || propertyData?.city,
        emailTemplate: "default",
        source: "Property-Discount-Landivo",
        emailSchedule: "immediate",
        sendType: sendType, // "now" or "mailivo"
      };

      if (sendType === "mailivo") {
        // Redirect to Mailivo
        const response = await axios.post(
          `${import.meta.env.VITE_MAILIVO_API_URL}/automation-landivo/propertyDiscount`,
          payload
        );

        if (response.data.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        }
        return true;
      } else {
        // Send now
        await axios.post(
          `${import.meta.env.VITE_MAILIVO_API_URL}/automation-landivo/propertyDiscount`,
          payload
        );

        toast.success("Discount notification sent successfully!");
        return true;
      }
    } catch (error) {
      console.error("Error sending discount campaign:", error);
      toast.error("Failed to send discount notification");
      return false;
    } finally {
      setSendingCampaign(false);
    }
  };

  return {
    campaignSubject,
    setCampaignSubject,
    sendingCampaign,
    handleSendCampaign,
  };
}