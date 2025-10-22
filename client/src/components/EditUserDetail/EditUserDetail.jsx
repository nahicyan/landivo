// client/src/components/EditUserDetail/EditUserDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, updateUser } from "@/utils/api";
import { PuffLoader } from "react-spinners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save
} from "lucide-react";

export default function EditUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    profileRole: ""
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);
        
        // Populate form with existing data
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          phone: userData.phone || "",
          profileRole: userData.profileRole || ""
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts editing
    setError(null);
    setSuccessMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Call API to update user
      await updateUser(userId, formData);
      
      setSuccessMessage("User updated successfully!");
      
      // Redirect back to user detail page after a short delay
      setTimeout(() => {
        navigate(`/admin/users/${userId}`);
      }, 1500);
      
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || "Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PuffLoader color="#3f4f24" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            User not found
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/admin/users/${userId}`)}
          className="mb-4 text-[#324c48] hover:text-[#3f4f24]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to User Details
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#324c48] text-white flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#030001]">
              Edit User
            </h1>
            <p className="text-gray-600">
              {displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - Left Side */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#324c48]" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Name */}
                <div>
                  <Label htmlFor="firstName" className="text-[#030001] font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className="mt-1"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName" className="text-[#030001] font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className="mt-1"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-[#030001] font-medium">
                    Phone Number
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Profile Role */}
                <div>
                  <Label htmlFor="profileRole" className="text-[#030001] font-medium">
                    Profile Role / Title
                  </Label>
                  <Input
                    id="profileRole"
                    name="profileRole"
                    value={formData.profileRole}
                    onChange={handleChange}
                    placeholder="e.g., Landivo Expert, Real Estate Agent"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This title will be displayed on property listings and contact information
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#324c48] hover:bg-[#3f4f24] text-white"
                  >
                    {saving ? (
                      <>
                        <PuffLoader size={16} color="#ffffff" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/admin/users/${userId}`)}
                    disabled={saving}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Read-Only Information - Right Side */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-[#324c48]" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge
                  className={
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {user.profileRole && (
                <div>
                  <p className="text-sm text-gray-500">Current Role</p>
                  <Badge className="bg-[#324c48] text-white">
                    {user.profileRole}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Read-Only Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="w-4 h-4 text-[#324c48]" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email (Read-Only)</p>
                <p className="font-medium text-sm break-all">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Email is managed through Auth0 and cannot be changed here
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-xs text-gray-600 break-all">
                  {user.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-[#324c48]" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium text-sm">
                  {formatDate(user.lastLoginAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Logins</p>
                <p className="font-medium text-sm">{user.loginCount || 0}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-sm">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Allowed Profiles */}
          {user.allowedProfiles && user.allowedProfiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allowed Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.allowedProfiles.map((profile, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-[#324c48] text-[#324c48]"
                    >
                      {profile}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}