// client/src/hooks/useDiscountCampaignSender.js
import { useState } from "react";
import { sendPropertyDiscountCampaign } from "@/utils/api";
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
        sendType: sendType,
      };

      const response = await sendPropertyDiscountCampaign(payload);

      if (sendType === "mailivo" && response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return true;
      }

      toast.success("Discount notification sent successfully!");
      return true;
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