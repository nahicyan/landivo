// client/src/hooks/useCampaignSender.js
import { useState } from "react";
import { sendPropertyUploadCampaign } from "@/utils/api";
import { toast } from "react-toastify";
import { getLogger } from "@/utils/logger";

const log = getLogger("useCampaignSender");

export function useCampaignSender(propertyId, propertyData) {
  log.info(`[useCampaignSender] > [Init]: propertyId=${propertyId}`);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const handleSendCampaign = async (sendType) => {
    log.info(`[useCampaignSender] > [Request]: sendType=${sendType}`);
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
        sendType: sendType,
      };

      const response = await sendPropertyUploadCampaign(payload);
      log.info(`[useCampaignSender] > [Response]: success sendType=${sendType}`);

      if (sendType === "mailivo" && response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return true;
      }

      toast.success("Campaign sent successfully!");
      return true;
    } catch (error) {
      log.error(`[useCampaignSender] > [Error]: ${error.message}`);
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
