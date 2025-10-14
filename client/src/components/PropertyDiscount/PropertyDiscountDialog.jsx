// client/src/components/PropertyDiscount/PropertyDiscountDialog.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import DiscountSubjectLineCreator from "./DiscountSubjectLineCreator";
import { useDiscountCampaignSender } from "@/hooks/useDiscountCampaignSender";

export default function PropertyDiscountDialog({
  open,
  onOpenChange,
  dialogType,
  dialogMessage,
  propertyId,
  propertyData,
}) {
  const navigate = useNavigate();
  const [sendCampaign, setSendCampaign] = useState(false);
  const [showSubjectCreator, setShowSubjectCreator] = useState(false);

  const {
    campaignSubject,
    setCampaignSubject,
    sendingCampaign,
    handleSendCampaign,
  } = useDiscountCampaignSender(propertyId, propertyData);

  const handleClose = () => {
    onOpenChange(false);
    setSendCampaign(false);
    setShowSubjectCreator(false);
    setCampaignSubject("");
    if (dialogType === "success") {
      navigate("/properties");
    }
  };

  const onSendNow = async () => {
    const success = await handleSendCampaign("now");
    if (success) {
      onOpenChange(false);
      navigate("/properties");
    }
  };

  const onSendFromMailivo = async () => {
    await handleSendCampaign("mailivo");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle
            className={
              dialogType === "success" ? "text-green-600" : "text-red-600"
            }
          >
            {dialogType === "success" ? "Success" : "Warning"}
          </DialogTitle>
          <DialogDescription>{dialogMessage}</DialogDescription>
        </DialogHeader>

        {/* Campaign Options */}
        {dialogType === "success" && !showSubjectCreator && (
          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="send-campaign"
                checked={sendCampaign}
                onCheckedChange={setSendCampaign}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="send-campaign"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send discount notification for {propertyData?.streetAddress || "property"} to buyers who
                  prefer {propertyData?.area || propertyData?.city} using the
                  default template
                </label>
                <p className="text-sm text-muted-foreground">
                  Notify interested buyers about this price reduction
                </p>
              </div>
            </div>

            {sendCampaign && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setShowSubjectCreator(true)}
                  className="flex-1 bg-[#324c48] hover:bg-[#3f4f24] text-white"
                >
                  Send Now
                </Button>
                <Button
                  onClick={onSendFromMailivo}
                  variant="outline"
                  className="flex-1"
                  disabled={sendingCampaign}
                >
                  {sendingCampaign ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Send from Mailivo"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Subject Creator */}
        {dialogType === "success" && showSubjectCreator && (
          <div className="space-y-4">
            <DiscountSubjectLineCreator
              propertyId={propertyId}
              onSubjectChange={setCampaignSubject}
            />

            <div className="flex gap-2">
              <Button
                onClick={() => setShowSubjectCreator(false)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={onSendNow}
                disabled={!campaignSubject.trim() || sendingCampaign}
                className="flex-1 bg-[#324c48] hover:bg-[#3f4f24] text-white"
              >
                {sendingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Now"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Default Footer */}
        {(!sendCampaign || dialogType !== "success") && (
          <DialogFooter>
            <Button onClick={handleClose} className="bg-[#324c48] text-white">
              Okay
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}