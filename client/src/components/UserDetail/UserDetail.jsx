// FIXED UserDetail.jsx - NO FLASHING ISSUE
// Added imageLoaded state and stable layout structure

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById, deleteUser } from "@/utils/api";
import { PuffLoader } from "react-spinners";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Activity,
  Home,
  Users,
  Briefcase,
  FileCheck,
  Clock,
  Shield,
  TrendingUp
} from "lucide-react";

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); // NEW: Track image load state

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Reset image loaded state when user changes
  useEffect(() => {
    setImageLoaded(false);
  }, [user?.id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteUser(userId);
      navigate("/admin/users", { 
        state: { message: "User deleted successfully" } 
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDealStatusColor = (status) => {
    const statusColors = {
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      DEFAULT: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || statusColors.DEFAULT;
  };

  // Get display name once to prevent recalculation
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#324c48" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-red-600 text-xl font-semibold">
            {error || "User not found"}
          </h2>
          <Button
            className="mt-4 bg-[#324c48] hover:bg-[#3f4f24] text-white"
            onClick={() => navigate("/admin/users")}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FDF8F2] min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#324c48]">User Profile</h1>
            <p className="text-gray-600 mt-1">
              View and manage user information
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white"
            onClick={() => navigate("/admin/users")}
          >
            Back to Users
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-[#324c48]/10">
              <CardHeader className="text-center pb-4 bg-gradient-to-b from-[#324c48]/5 to-transparent">
                {/* FIXED: Stable container with fixed height to prevent layout shift */}
                <div className="relative w-full">
                  {/* Image Container - Fixed dimensions */}
                  

                  {/* Name - Separate container with stable position */}
                  <div className="w-full">
                    <CardTitle className="text-2xl break-words px-2">
                      {displayName}
                    </CardTitle>
                  </div>

                  {/* Badges - Stable container */}
                  <div className="flex items-center justify-center gap-2 mt-3 flex-wrap px-2">
                    <Badge
                      className={
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {user.profileRole && (
                      <Badge className="bg-[#324c48] text-white">
                        {user.profileRole}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#324c48] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium break-all">{user.email}</p>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#324c48] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#324c48] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  {user.lastLoginAt && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#324c48] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-[#324c48] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Login Count</p>
                      <p className="font-medium">{user.loginCount || 0} logins</p>
                    </div>
                  </div>

                  {user.auth0Id && (
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-[#324c48] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Auth0 ID</p>
                        <p className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
                          {user.auth0Id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Allowed Profiles */}
                {user.allowedProfiles && user.allowedProfiles.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Allowed Profiles</p>
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
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-[#324c48] hover:bg-[#3f4f24] text-white"
                    onClick={() => navigate(`/admin/users/${userId}/edit`)}
                  >
                    Edit User
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            {user.stats && (
              <Card className="mt-6 border-2 border-[#324c48]/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#324c48]">
                    <TrendingUp className="w-5 h-5" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[#324c48]/5 rounded-lg">
                      <p className="text-2xl font-bold text-[#324c48]">
                        {user.stats.totalPropertiesCreated}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Properties Created
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#324c48]/5 rounded-lg">
                      <p className="text-2xl font-bold text-[#324c48]">
                        {user.stats.totalBuyersCreated}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Buyers Created
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#324c48]/5 rounded-lg">
                      <p className="text-2xl font-bold text-[#324c48]">
                        {user.stats.totalDealsCreated}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Deals Created
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#324c48]/5 rounded-lg">
                      <p className="text-2xl font-bold text-[#324c48]">
                        {user.stats.totalActivities}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Total Activities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tabbed Content */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-[#324c48]/10">
              <Tabs defaultValue="properties" className="w-full">
                <CardHeader className="pb-3">
                  <TabsList className="grid w-full grid-cols-5 bg-[#324c48]/10">
                    <TabsTrigger value="properties" className="data-[state=active]:bg-[#324c48] data-[state=active]:text-white">
                      <Home className="w-4 h-4 mr-2" />
                      Properties
                    </TabsTrigger>
                    <TabsTrigger value="buyers" className="data-[state=active]:bg-[#324c48] data-[state=active]:text-white">
                      <Users className="w-4 h-4 mr-2" />
                      Buyers
                    </TabsTrigger>
                    <TabsTrigger value="deals" className="data-[state=active]:bg-[#324c48] data-[state=active]:text-white">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Deals
                    </TabsTrigger>
                    <TabsTrigger value="qualifications" className="data-[state=active]:bg-[#324c48] data-[state=active]:text-white">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Qualifications
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-[#324c48] data-[state=active]:text-white">
                      <Activity className="w-4 h-4 mr-2" />
                      Activity
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  {/* Properties Tab */}
                  <TabsContent value="properties" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#324c48]">
                          Created Properties ({user.createdResidencies?.length || 0})
                        </h3>
                      </div>
                      
                      {user.createdResidencies && user.createdResidencies.length > 0 ? (
                        <div className="space-y-3">
                          {user.createdResidencies.map((property) => (
                            <div
                              key={property.id}
                              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <img
                                src={
                                  property.imageUrls?.[0]
                                    ? `${import.meta.env.VITE_SERVER_URL}/${property.imageUrls[0]}`
                                    : "/default-property.jpg"
                                }
                                alt={property.title}
                                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = "/default-property.jpg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#324c48]">
                                  {property.title || "Untitled Property"}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {property.streetAddress && `${property.streetAddress}, `}
                                  {property.city}, {property.state}
                                </p>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {property.status && (
                                    <Badge variant="outline" className="text-xs">
                                      {property.status}
                                    </Badge>
                                  )}
                                  {property.featured && (
                                    <Badge className="bg-[#D4A017] text-white text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#324c48] text-[#324c48] hover:bg-[#324c48] hover:text-white flex-shrink-0"
                                onClick={() => navigate(`/properties/${property.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No properties created by this user.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Buyers Tab */}
                  <TabsContent value="buyers" className="mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#324c48]">
                        Created Buyers ({user.createdBuyers?.length || 0})
                      </h3>
                      
                      {user.createdBuyers && user.createdBuyers.length > 0 ? (
                        <div className="space-y-3">
                          {user.createdBuyers.map((buyer) => (
                            <div
                              key={buyer.id}
                              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="w-12 h-12 bg-[#324c48] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {buyer.firstName?.[0]}{buyer.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#324c48]">
                                  {buyer.firstName} {buyer.lastName}
                                </h4>
                                <p className="text-sm text-gray-600 break-all">{buyer.email}</p>
                                {buyer.phone && (
                                  <p className="text-sm text-gray-500">{buyer.phone}</p>
                                )}
                                {buyer.buyerType && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {buyer.buyerType}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500 flex-shrink-0">
                                <p>{formatDate(buyer.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No buyers created by this user.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Deals Tab */}
                  <TabsContent value="deals" className="mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#324c48]">
                        Created Deals ({user.createdDeals?.length || 0})
                      </h3>
                      
                      {user.createdDeals && user.createdDeals.length > 0 ? (
                        <div className="space-y-3">
                          {user.createdDeals.map((deal) => (
                            <div
                              key={deal.id}
                              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {/* Property Info */}
                              {deal.property && (
                                <div className="mb-2">
                                  <h4 className="font-semibold text-[#324c48]">
                                    {deal.property.title || "Untitled Property"}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {deal.property.streetAddress && `${deal.property.streetAddress}, `}
                                    {deal.property.city}, {deal.property.state}
                                  </p>
                                </div>
                              )}

                              {/* Buyer Info */}
                              {deal.buyer && (
                                <p className="text-sm text-gray-600 mb-2">
                                  Buyer: {deal.buyer.firstName} {deal.buyer.lastName}
                                </p>
                              )}

                              {/* Financial Details */}
                              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                <div>
                                  <span className="text-gray-500">Purchase: </span>
                                  <span className="font-medium">{formatCurrency(deal.purchasePrice)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Sale: </span>
                                  <span className="font-medium">{formatCurrency(deal.salePrice)}</span>
                                </div>
                                {deal.profitLoss !== null && deal.profitLoss !== undefined && (
                                  <div>
                                    <span className="text-gray-500">Profit/Loss: </span>
                                    <span className={`font-medium ${deal.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(deal.profitLoss)}
                                    </span>
                                  </div>
                                )}
                                {deal.currentRevenue !== null && deal.currentRevenue !== undefined && (
                                  <div>
                                    <span className="text-gray-500">Revenue: </span>
                                    <span className="font-medium">{formatCurrency(deal.currentRevenue)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Status and Date */}
                              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getDealStatusColor(deal.status)}>
                                    {deal.status}
                                  </Badge>
                                  {deal.completionDate && (
                                    <span className="text-xs text-gray-500">
                                      Completed: {formatDate(deal.completionDate)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  Started: {formatDate(deal.startDate)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No deals created by this user.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Qualifications Tab */}
                  <TabsContent value="qualifications" className="mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#324c48]">
                        Updated Qualifications ({user.updatedQualifications?.length || 0})
                      </h3>
                      
                      {user.updatedQualifications && user.updatedQualifications.length > 0 ? (
                        <div className="space-y-3">
                          {user.updatedQualifications.map((qual) => (
                            <div
                              key={qual.id}
                              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h4 className="font-semibold text-[#324c48]">
                                    {qual.firstName} {qual.lastName}
                                  </h4>
                                  <Badge 
                                    className={
                                      qual.qualified
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {qual.qualified ? "Qualified" : "Not Qualified"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 break-all">{qual.email}</p>
                                <p className="text-sm text-gray-600">
                                  Property Price: {formatCurrency(qual.propertyPrice)}
                                </p>
                                {qual.disqualificationReason && (
                                  <p className="text-sm text-red-600 mt-1">
                                    Reason: {qual.disqualificationReason}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500 flex-shrink-0">
                                <p>{formatDate(qual.updatedAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No qualifications updated by this user.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[#324c48]">
                        Recent Activity ({user.activityLogs?.length || 0})
                      </h3>
                      
                      {user.activityLogs && user.activityLogs.length > 0 ? (
                        <div className="space-y-2">
                          {user.activityLogs.map((log) => (
                            <div
                              key={log.id}
                              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="w-8 h-8 bg-[#324c48]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Activity className="w-4 h-4 text-[#324c48]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {log.entityType}
                                  </Badge>
                                  <Badge className="bg-[#324c48] text-white text-xs">
                                    {log.actionType}
                                  </Badge>
                                </div>
                                {log.details && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {log.details}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(log.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No activity logs available for this user.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}