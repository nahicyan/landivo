// client/src/hooks/useCampaignSender.js
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export function useCampaignSender(propertyId, propertyData) {
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
        source: "Property-Upload-Landivo",
        emailSchedule: "immediate",
        sendType: sendType, // "now" or "mailivo"
      };

      if (sendType === "mailivo") {
        // Redirect to Mailivo
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/mailivo/automation`,
          payload
        );

        if (response.data.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        }
        return true;
      } else {
        // Send now
        await axios.post(
          "https://api.mailivo.landivo.com/automation/propertyUpload",
          payload
        );

        toast.success("Campaign sent successfully!");
        return true;
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error("Failed to send campaign");
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