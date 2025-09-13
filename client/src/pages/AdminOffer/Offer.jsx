import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { PuffLoader } from "react-spinners";
import PropertyCard from "@/components/PropertyCard/PropertyCard";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  X,
  RefreshCw,
  Clock,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Home,
  MessageSquare,
} from "lucide-react";

export default function Offer() {
  const { offerId } = useParams();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [history, setHistory] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyData, setPropertyData] = useState(null);

  // Fetch offer data
  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        setLoading(true);

        // Fetch offer details and history
        const [offerResponse, historyResponse] = await Promise.all([
          api.get(`/offer/${offerId}`),
          api.get(`/offer/${offerId}/history`),
        ]);

        setOffer(offerResponse.data.offer);
        setHistory(historyResponse.data.history || []);
        if (offerResponse.data.offer?.propertyId) {
          try {
            const property = await getProperty(
              offerResponse.data.offer.propertyId
            );
            setPropertyData(property);
          } catch (err) {
            console.error("Error fetching property:", err);
          }
        }
      } catch (error) {
        console.error("Error fetching offer data:", error);
        toast.error("Failed to load offer details");
        navigate("/admin/offers");
      } finally {
        setLoading(false);
      }
    };

    if (offerId) {
      fetchOfferData();
    }
  }, [offerId, navigate]);

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return `$${Number(value).toLocaleString()}`;
  };

  // Format phone number for display and tel: link
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return "N/A";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  const formatPhoneForTel = (phone) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badgeMap = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ACCEPTED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      COUNTERED: "bg-blue-100 text-blue-800 border-blue-200",
      EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge variant="outline" className={badgeMap[status] || badgeMap.PENDING}>
        {status}
      </Badge>
    );
  };

  // Handle offer actions
  const handleAction = (type) => {
    setActionType(type);
    setCounterPrice("");
    setMessage("");
    setIsDialogOpen(true);
  };

  // Submit offer action
  const handleSubmitAction = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        action: actionType,
        message: message.trim(),
      };

      if (actionType === "COUNTER" && counterPrice) {
        // Remove commas and convert to number
        const price = parseFloat(counterPrice.replace(/,/g, ""));
        if (isNaN(price) || price <= 0) {
          toast.error("Please enter a valid counter price");
          return;
        }
        payload.counteredPrice = price;
      }

      await api.put(`/offer/${offerId}/status`, payload);

      toast.success(`Offer ${actionType.toLowerCase()}ed successfully`);
      setIsDialogOpen(false);

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error updating offer:", error);
      toast.error("Failed to update offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle counter price formatting
  const handleCounterPriceChange = (e) => {
    let value = e.target.value.replace(/,/g, "");
    if (value === "") {
      setCounterPrice("");
      return;
    }
    const number = parseFloat(value);
    if (!isNaN(number)) {
      setCounterPrice(number.toLocaleString());
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PuffLoader size={80} color="#324c48" />
      </div>
    );
  }

  // Error state
  if (!offer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-2">Offer Not Found</h2>
        <p className="text-gray-500 mb-4">
          The requested offer could not be found.
        </p>
        <Button onClick={() => navigate("/admin/offers")}>
          Back to Offers
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/offers")}
            className="text-[#324c48] hover:bg-[#324c48]/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Offers
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#324c48]">Offer Details</h1>
            <p className="text-gray-600">
              Offer #{offerId.slice(0, 8)} •{" "}
              {format(new Date(offer.timestamp), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        {/* Top Row - Buyer Info and Property Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Buyer Information Card */}
          <Card className="shadow-lg border-l-4 border-l-[#324c48]">
            <CardHeader className="bg-gradient-to-r from-[#324c48]/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-[#324c48]">
                <User className="h-5 w-5" />
                Buyer Information
              </CardTitle>
              <CardDescription>
                Contact details and buyer profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#324c48]/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-[#324c48]" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {offer.buyer?.firstName} {offer.buyer?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {offer.buyer?.buyerType || "Buyer"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  {offer.buyer?.phone ? (
                    <a
                      href={`tel:+1${formatPhoneForTel(offer.buyer.phone)}`}
                      className="font-medium text-green-600 hover:text-green-700 hover:underline"
                    >
                      {formatPhoneForDisplay(offer.buyer.phone)}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-400">Not provided</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  {offer.buyer?.email ? (
                    <a
                      href={`mailto:${offer.buyer.email}`}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {offer.buyer.email}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-400">Not provided</p>
                  )}
                </div>
              </div>

              {/* Offer Status */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(offer.offerStatus)}
                  </div>
                </div>
              </div>

              {/* Offer Price */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Offer Price</p>
                  <p className="font-semibold text-lg text-green-600">
                    {formatCurrency(offer.offerPrice)}
                  </p>
                  {offer.counteredPrice && (
                    <p className="text-sm text-blue-600">
                      Countered: {formatCurrency(offer.counteredPrice)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information Card */}
          <Card className="shadow-lg border-l-4 border-l-[#324c48]">
            <CardHeader className="bg-gradient-to-r from-[#324c48]/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-[#324c48]">
                <Home className="h-5 w-5" />
                Property Information
              </CardTitle>
              <CardDescription>Details about the property</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property Information */}
              <div>
                <h3 className="text-lg font-semibold text-[#324c48] mb-4">
                  Property Information
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Details about the property
                </p>
                {propertyData ? (
                  <PropertyCard card={propertyData} />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    Loading property details...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {offer.offerStatus === "PENDING" && (
                <div className="pt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleAction("ACCEPT")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleAction("REJECT")}
                      variant="destructive"
                      size="sm"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleAction("COUNTER")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Counter
                    </Button>
                    <Button
                      onClick={() => handleAction("EXPIRE")}
                      variant="outline"
                      size="sm"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Expire
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Offer History Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#324c48]">
              <MessageSquare className="h-5 w-5" />
              Offer History & Interactions
            </CardTitle>
            <CardDescription>
              Complete timeline of all offer interactions and status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status Change</TableHead>
                      <TableHead>Price Details</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Updated By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">
                                {format(
                                  new Date(entry.timestamp),
                                  "MMM d, yyyy"
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(entry.timestamp), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {entry.previousStatus && (
                              <p className="text-sm text-gray-500">
                                From: {getStatusBadge(entry.previousStatus)}
                              </p>
                            )}
                            <p className="text-sm">
                              To: {getStatusBadge(entry.newStatus)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {entry.newPrice && (
                              <p className="font-medium">
                                {formatCurrency(entry.newPrice)}
                              </p>
                            )}
                            {entry.counteredPrice && (
                              <p className="text-sm text-blue-600">
                                Counter: {formatCurrency(entry.counteredPrice)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {entry.buyerMessage && (
                              <div className="bg-blue-50 p-2 rounded text-sm">
                                <p className="font-medium text-blue-800">
                                  Buyer:
                                </p>
                                <p className="text-blue-700">
                                  {entry.buyerMessage}
                                </p>
                              </div>
                            )}
                            {entry.sysMessage && (
                              <div className="bg-gray-50 p-2 rounded text-sm">
                                <p className="font-medium text-gray-800">
                                  System:
                                </p>
                                <p className="text-gray-700">
                                  {entry.sysMessage}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600">
                            {entry.updatedByName || "System"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history available for this offer</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offer Actions Section */}
        {(offer.offerStatus === "PENDING" ||
          offer.offerStatus === "COUNTERED") && (
          <Card className="shadow-lg border-l-4 border-l-orange-500">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <DollarSign className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Take action on this offer</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => handleAction("ACCEPT")}
                  className="group relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg px-3 py-2 shadow-md shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span className="font-medium text-xs">Accept</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction("COUNTER")}
                  className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg px-3 py-2 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <RefreshCw className="h-2.5 w-2.5" />
                    </div>
                    <span className="font-medium text-xs">Counter</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction("REJECT")}
                  className="group relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg px-3 py-2 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <X className="h-2.5 w-2.5" />
                    </div>
                    <span className="font-medium text-xs">Reject</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction("EXPIRE")}
                  className="group relative bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-3 py-2 shadow-md shadow-gray-200/50 hover:shadow-lg hover:shadow-gray-200/60 border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="h-2.5 w-2.5" />
                    </div>
                    <span className="font-medium text-xs">Expire</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionType === "ACCEPT" && "Accept Offer"}
                {actionType === "REJECT" && "Reject Offer"}
                {actionType === "COUNTER" && "Counter Offer"}
                {actionType === "EXPIRE" && "Expire Offer"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "ACCEPT" &&
                  "Are you sure you want to accept this offer?"}
                {actionType === "REJECT" &&
                  "Are you sure you want to reject this offer?"}
                {actionType === "COUNTER" &&
                  "Enter your counter offer details."}
                {actionType === "EXPIRE" &&
                  "Are you sure you want to expire this offer?"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {actionType === "COUNTER" && (
                <div>
                  <Label htmlFor="counterPrice">Counter Price *</Label>
                  <Input
                    id="counterPrice"
                    placeholder="Enter counter price"
                    value={counterPrice}
                    onChange={handleCounterPriceChange}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="message">
                  Message{" "}
                  {actionType === "COUNTER" ? "(Optional)" : "(Optional)"}
                </Label>
                <Textarea
                  id="message"
                  placeholder="Add a message for the buyer..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAction}
                disabled={
                  isSubmitting || (actionType === "COUNTER" && !counterPrice)
                }
                className={
                  actionType === "ACCEPT"
                    ? "bg-green-600 hover:bg-green-700"
                    : actionType === "REJECT"
                    ? "bg-red-600 hover:bg-red-700"
                    : actionType === "COUNTER"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }
              >
                {isSubmitting
                  ? "Processing..."
                  : actionType === "COUNTER"
                  ? "Send Counter"
                  : `${
                      actionType.charAt(0).toUpperCase() +
                      actionType.slice(1).toLowerCase()
                    } Offer`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
