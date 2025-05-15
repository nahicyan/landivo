// ContactProfile.jsx
import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { Loader2 } from "lucide-react";

const ContactProfile = ({ profileId }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/user/${profileId}`);
        setProfileData(response.data);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Unable to load contact information");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
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

  const imageUrl = profileData.avatarUrl ? 
    `${import.meta.env.VITE_SERVER_URL}/${profileData.avatarUrl}` : 
    `https://ui-avatars.com/api/?name=${profileData.firstName}+${profileData.lastName}&background=324c48&color=fff&size=150`;

  return (
    <div className="w-full bg-[#f5faf7] rounded-lg px-8 py-10 mt-6">
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
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
        
        <div className="ml-4">
          <h3 className="text-2xl font-normal text-[#324c48]">
            {profileData.firstName} {profileData.lastName}
          </h3>
          <p className="text-[#3f4f24] text-lg font-light">
            {profileData.profileRole || "Landivo Expert"}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-start space-y-4">
        {profileData.phone && (
          <a 
            href={`tel:${profileData.phone.replace(/\D/g, '')}`}
            className="text-xl text-[#324c48] hover:text-[#D4A017] border-b border-[#324c48] pb-1"
          >
            {profileData.phone}
          </a>
        )}
        
        {profileData.email && (
          <a 
            href={`mailto:${profileData.email}`}
            className="text-[#324c48] hover:text-[#D4A017] text-lg font-light"
          >
            {profileData.email}
          </a>
        )}
      </div>
    </div>
  );
};

export default ContactProfile;