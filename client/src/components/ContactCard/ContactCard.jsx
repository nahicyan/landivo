"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getSystemSettings, getUserPublicProfile } from "@/utils/api";
import { Loader2 } from "lucide-react";

export default function ContactCard({ profileId }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [profileData, settingsResponse] = await Promise.all([
          profileId ? getUserPublicProfile(profileId) : Promise.resolve(null), 
          getSystemSettings()
        ]);

        setProfileData(profileData);
        setSystemSettings(settingsResponse);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId]);

  // Determine which phone number to display (override or profile)
  const displayPhone = systemSettings?.overrideContactPhone || profileData?.phone || "+18172471312"; // Fallback

  if (loading) {
    return (
      <div className="w-full flex justify-center p-2">
        <Loader2 className="h-5 w-5 text-[#324c48] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Desktop Card (hidden on mobile) - More compact version with equal width buttons */}
      <Card className="hidden sm:block w-full max-w-sm mx-auto shadow-none border-0">
        <CardContent className="p-0 grid grid-cols-2 gap-3">
          <Button
            onClick={() => (window.location.href = `tel:${displayPhone.replace(/\D/g, "")}`)}
            className="bg-[#324c48] text-white py-1 text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-shadow w-full">
            Call
          </Button>
          <Button onClick={() => setOpenDialog(true)} className="bg-[#324c48] text-white py-1 text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-shadow w-full">
            Message
          </Button>
        </CardContent>
      </Card>

      {/* Mobile Sticky Bar */}
      <div className="block sm:hidden fixed bottom-0 left-0 w-full p-2 bg-white border-t border-gray-200 z-50 grid grid-cols-2 gap-2">
        <Button
          onClick={() => (window.location.href = `tel:${displayPhone.replace(/\D/g, "")}`)}
          className="bg-[#324c48] text-white py-2 text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-shadow">
          Call
        </Button>
        <Button onClick={() => setOpenDialog(true)} className="bg-[#324c48] text-white py-2 text-sm font-semibold rounded-full shadow-sm hover:shadow-md transition-shadow">
          Message
        </Button>
      </div>

      {/* Message Options Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-white text-gray-900 border border-gray-300 shadow-lg rounded-lg p-6 w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Contact Options</DialogTitle>
            <DialogDescription>Select an option to contact us:</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-blue-100 text-blue-800"
              onClick={() => {
                window.location.href = `sms:${displayPhone.replace(/\D/g, "")}`;
                setOpenDialog(false);
              }}>
              Text/SMS
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-green-100 text-green-800"
              onClick={() => {
                window.open("https://portal.landersinvestment.com/livechat", "_blank");
                setOpenDialog(false);
              }}>
              Live Chat
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-red-100 text-red-800"
              onClick={() => {
                window.location.href = "mailto:info@landivo.com";
                setOpenDialog(false);
              }}>
              Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
