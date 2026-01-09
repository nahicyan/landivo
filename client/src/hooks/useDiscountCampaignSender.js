// client/src/hooks/useDiscountCampaignSender.js
import { useState } from "react";
import { sendPropertyDiscountCampaign } from "@/utils/api";
import { toast } from "react-toastify";
import { getLogger } from "@/utils/logger";

const log = getLogger("useDiscountCampaignSender");

export function useDiscountCampaignSender(propertyId, propertyData) {
  log.info(
    `[useDiscountCampaignSender] > [Init]: propertyId=${propertyId}`
  );
  const [campaignSubject, setCampaignSubject] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const handleSendCampaign = async (sendType) => {
    log.info(
      `[useDiscountCampaignSender] > [Request]: start sendType=${sendType}`
    );
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
      log.info(
        `[useDiscountCampaignSender] > [Response]: success sendType=${sendType}`
      );

      if (sendType === "mailivo" && response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return true;
      }

      toast.success("Discount notification sent successfully!");
      return true;
    } catch (error) {
      log.error(`[useDiscountCampaignSender] > [Error]: ${error.message}`);
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
