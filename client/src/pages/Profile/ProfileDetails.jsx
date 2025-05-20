import React, { useState } from 'react';
import { parsePhoneNumber } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Upload, X } from 'lucide-react';

const ProfileDetails = ({
  user,
  dbUserData,
  profileData,
  setProfileData,
  isEditing,
  setIsEditing,
  handleSubmit,
  isSubmitting,
  updateSuccess,
  profileError,
  isLoading,
  handleImageUpload,
  handleImageRemove,
  isSystemUser
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [imageMarkedForRemoval, setImageMarkedForRemoval] = useState(false);
  const [phoneError, setPhoneError] = useState(null);

  // Phone number validation using libphonenumber-js
  const validatePhone = (phoneInput) => {
    if (!phoneInput) return true; // Allow empty
    
    try {
      const phoneNumber = parsePhoneNumber(phoneInput, "US"); // "US" as default country code
      return phoneNumber?.isValid();
    } catch (error) {
      console.error("Phone validation error:", error);
      return false;
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (input) => {
    if (!input) return '';
    
    // Strip all non-numeric characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Format the number as user types
    let formattedNumber = '';
    if (digitsOnly.length === 0) {
      return '';
    } else if (digitsOnly.length <= 3) {
      formattedNumber = digitsOnly;
    } else if (digitsOnly.length <= 6) {
      formattedNumber = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    } else {
      formattedNumber = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, Math.min(10, digitsOnly.length))}`;
    }
    
    return formattedNumber;
  };

  // Handle phone number change with formatting
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setProfileData({ ...profileData, phone: formatted });
    
    // Clear error if field is empty or valid
    if (!formatted || validatePhone(formatted)) {
      setPhoneError(null);
    } else {
      setPhoneError("Please enter a valid US phone number");
    }
  };

  // Extended form submission handler that validates the phone first
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validate phone number before submission
    if (profileData.phone && !validatePhone(profileData.phone)) {
      setPhoneError("Please enter a valid US phone number");
      return;
    }
    
    // If phone is valid, proceed with the original submission
    handleSubmit(e);
  };

  // Handle file selection
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setImageMarkedForRemoval(false);

      // Update form data with the file
      handleImageUpload(file);
    }
  };

  // Clear selected file
  const removeImage = () => {
    setPreviewImage(null);
    setImageMarkedForRemoval(true);
    handleImageRemove();

    // Reset the file input to allow re-uploading the same file
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Get avatar URL with fallback
  const avatarUrl = dbUserData?.avatarUrl ?
    `${import.meta.env.VITE_SERVER_URL}/${dbUserData.avatarUrl}` :
    user?.picture || null;

  return (
    <div className="space-y-5">
      {isEditing ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="avatar" className="text-sm font-medium text-text-500">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 border border-gray-300 relative">
                <div className="w-full h-full overflow-hidden rounded-full">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (avatarUrl && !imageMarkedForRemoval) ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Move the button completely outside and ensure it has higher z-index */}
                {(previewImage || (avatarUrl && !imageMarkedForRemoval)) && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-7 h-7 flex items-center justify-center z-10 border-2 border-white shadow-md hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/90 h-10 px-4 py-2 cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Choose Image</span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a profile picture (JPG, PNG, WebP)
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-text-500">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-text-500">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          {/* Phone Number field - Updated with formatting and validation */}
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-text-500">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={profileData.phone || ''}
              onChange={handlePhoneChange}
              className={`mt-1 ${phoneError ? "border-red-500 focus:ring-red-500" : ""}`}
              placeholder="(555) 123-4567"
            />
            {phoneError && (
              <div className="text-red-500 text-sm mt-1">{phoneError}</div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              U.S. format: (123) 456-7890
            </p>
          </div>

          {/* Profile Role field */}
          <div>
            <Label htmlFor="profileRole" className="text-sm font-medium text-text-500">Profile Role/Title</Label>
            <Input
              id="profileRole"
              name="profileRole"
              value={profileData.profileRole || ''}
              onChange={(e) => setProfileData({ ...profileData, profileRole: e.target.value })}
              className="mt-1"
              placeholder="E.g., Landivo Expert, Property Advisor, etc."
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              type="submit"
              className="bg-[#000] hover:[#030001]"
              disabled={isSubmitting || !!phoneError}
            >
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setPhoneError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          {updateSuccess && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your profile has been updated successfully.
              </AlertDescription>
            </Alert>
          )}

          {profileError && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">
                {profileError}
              </AlertDescription>
            </Alert>
          )}
        </form>
      ) : (
        <>
          {/* Display mode - don't show duplicated profile image/name for system users */}
          {!isSystemUser && (
            <div className="flex flex-col sm:flex-row sm:items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-3 sm:mb-0 sm:mr-4 border border-gray-200">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text-700">
                  {dbUserData?.firstName || profileData.firstName || "Not set"} {dbUserData?.lastName || profileData.lastName || ""}
                </h3>
                {(dbUserData?.profileRole || profileData.profileRole) && (
                  <p className="text-sm text-text-500">{dbUserData?.profileRole || profileData.profileRole}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-text-500 mb-2">Email</h3>
            <p className="text-text-700">{user?.email}</p>
          </div>

          {/* Display phone if available */}
          {(dbUserData?.phone || profileData.phone) && (
            <div>
              <h3 className="text-sm font-medium text-text-500 mb-2">Phone</h3>
              <p className="text-text-700">{dbUserData?.phone || profileData.phone}</p>
            </div>
          )}

          <Button
            onClick={() => setIsEditing(true)}
            className="mt-4"
            variant="outline"
          >
            Edit Profile
          </Button>
        </>
      )}

      <div>
        <h3 className="text-sm font-medium text-text-500 mb-2">Email Verification</h3>
        {user.email_verified ? (
          <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
            Verified
          </Badge>
        ) : (
          <Badge className="bg-accent-100 text-accent-800 hover:bg-accent-100">
            Not Verified
          </Badge>
        )}
      </div>

      {user.nickname && (
        <div>
          <h3 className="text-sm font-medium text-text-500 mb-2">Nickname</h3>
          <p className="text-text-700">{user.nickname}</p>
        </div>
      )}

      {user.locale && (
        <div>
          <h3 className="text-sm font-medium text-text-500 mb-2">Locale</h3>
          <p className="text-text-700">{user.locale}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileDetails;