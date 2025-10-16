import React, { useState, useEffect } from "react";
import { api, getSystemSettings } from "@/utils/api";
import { Loader2 } from "lucide-react";

const ContactProfile = ({ profileId }) => {
  const [profileData, setProfileData] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both profile data and system settings in parallel
        const [profileResponse, settingsResponse] = await Promise.all([
          api.get(`/user/public-profile/${profileId}`),
          getSystemSettings()
        ]);
        
        setProfileData(profileResponse.data);
        setSystemSettings(settingsResponse);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to load contact information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="w-full bg-[#f5faf7] rounded-lg p-4 flex justify-center">
        <Loader2 className="h-6 w-6 text-[#324c48] animate-spin" />
      </div>
    );
  }

  if (error || !profileData) {
    return null;
  }

  // Determine which phone number to display
  const displayPhone = systemSettings?.overrideContactPhone || profileData.phone;
  
  const imageUrl = profileData.avatarUrl ? 
    `${import.meta.env.VITE_SERVER_URL}/${profileData.avatarUrl}` : 
    `https://ui-avatars.com/api/?name=${profileData.firstName}+${profileData.lastName}&background=324c48&color=fff&size=150`;

  return (
    <div className="w-full bg-[#f5faf7] rounded-lg px-6 py-3 mt-5">
      <div className="flex items-center mb-2">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 -mt-1">
          <img
            src={imageUrl}
            alt={`${profileData.firstName} ${profileData.lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${profileData.firstName}+${profileData.lastName}&background=324c48&color=fff&size=150`;
            }}
          />
        </div>
        
        <div className="ml-5">
          <h3 className="text-xl font-normal text-[#324c48]">
            {profileData.firstName} {profileData.lastName}
          </h3>
          <p className="text-[#3f4f24] text-base font-light">
            {profileData.profileRole || "Landivo Expert"}
          </p>
          {displayPhone && (
            <a 
              href={`tel:${displayPhone.replace(/\D/g, '')}`}
              className="text-lg text-[#324c48] hover:text-[#D4A017] border-b border-[#324c48] pb-1 inline-block mt-1"
            >
              {displayPhone}
            </a>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        {profileData.email && (
          <a 
            href={`mailto:${profileData.email}`}
            className="text-[#324c48] hover:text-[#D4A017] text-base font-light"
          >
            {profileData.email}
          </a>
        )}
      </div>
    </div>
  );
};

export default ContactProfile;