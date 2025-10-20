// client/src/pages/AdminOffer/OffersTable.jsx
import React, { useState } from "react";
import { format } from "date-fns";
import { getOfferHistory } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateOfferStatus } from "@/utils/api";
import {
  Check,
  X,
  RefreshCw,
  Clock,
  MoreVertical,
  Calendar,
  History,
  Eye,
} from "lucide-react";

const OffersTable = ({ offers, onOfferUpdated }) => {
  const navigate = useNavigate();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [actionType, setActionType] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [message, setMessage] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return `$${Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return "N/A";
    // Strip all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    // Format: (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }
    // Return as-is if not 10 digits
    return phone;
  };

  // Get badge color based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "COUNTERED":
        return <Badge className="bg-blue-100 text-blue-800">Countered</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Open action dialog
  const openActionDialog = (offer, action) => {
    setSelectedOffer(offer);
    setActionType(action);

    // Set initial counter price if countering
    if (action === "counter") {
      // Suggest a price 10% higher than the current offer
      const suggestedPrice = offer.offeredPrice * 1.1;
      setCounterPrice(suggestedPrice.toFixed(0));
    } else {
      setCounterPrice("");
    }

    setMessage("");
    setIsDialogOpen(true);
  };

  // In OffersTable.jsx, update the handleUpdateOfferStatus function:

  const handleUpdateOfferStatus = async () => {
    if (!selectedOffer) return;

    setIsSubmitting(true);

    try {
      // Validate counter price if countering
      if (actionType === "counter") {
        const counterPriceValue = parseFloat(counterPrice.replace(/,/g, ""));
        if (isNaN(counterPriceValue) || counterPriceValue <= 0) {
          toast.error("Please enter a valid counter price");
          setIsSubmitting(false);
          return;
        }
      }

      // Map action type to correct status enum value
      let statusValue;
      switch (actionType) {
        case "accept":
          statusValue = "ACCEPTED";
          break;
        case "reject":
          statusValue = "REJECTED";
          break;
        case "counter":
          statusValue = "COUNTERED";
          break;
        case "expire":
          statusValue = "EXPIRED";
          break;
        default:
          statusValue = actionType.toUpperCase();
      }

      // Prepare request data
      const requestData = {
        status: statusValue,
        message: message,
      };

      // Add counter price if countering
      if (actionType === "counter") {
        requestData.counteredPrice = parseFloat(counterPrice.replace(/,/g, ""));
      }

      await updateOfferStatus(selectedOffer.id, requestData);

      // Close dialog and notify
      setIsDialogOpen(false);
      onOfferUpdated();
    } catch (error) {
      console.error("Error updating offer status:", error);
      if (error.response?.data?.message) {
        toast.error(`Failed: ${error.response.data.message}`);
      } else {
        toast.error("Failed to update offer status");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle viewing offer history
  const handleViewHistory = async (offer) => {
    setSelectedOffer(offer);

    try {
      // Fetch history for this offer using centralized function
      const history = await getOfferHistory(offer.id);
      setSelectedHistory(history || []);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error("Error fetching offer history:", error);
      toast.error("Failed to load offer history");
    }
  };

  // Handle counter price input formatting
  const handleCounterPriceChange = (e) => {
    let value = e.target.value;
    // Remove commas
    value = value.replace(/,/g, "");

    if (value === "") {
      setCounterPrice("");
      return;
    }

    // If valid number, format with commas
    const number = parseFloat(value);
    if (!isNaN(number)) {
      setCounterPrice(number.toLocaleString());
    }
  };

  // View property details
  const handleViewProperty = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
          <CardDescription>
            Manage all buyer offers across your property listings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Offer Price</TableHead>
                  <TableHead>Counter Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No offers found
                    </TableCell>
                  </TableRow>
                ) : (
                  offers.map((offer) => (
                    <TableRow key={offer.id} className="hover:bg-gray-50">
                      <TableCell>
                        {format(new Date(offer.timestamp), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {offer.buyer?.firstName} {offer.buyer?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {offer.buyer?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[200px] truncate cursor-pointer hover:text-blue-600"
                          onClick={() => handleViewProperty(offer.propertyId)}
                        >
                          {offer.property?.streetAddress
                            ? `${offer.property.streetAddress}, ${
                                offer.property.city || ""
                              }`
                            : offer.property?.title || offer.propertyId}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(offer.offeredPrice)}
                      </TableCell>
                      <TableCell>
                        {offer.counteredPrice ? (
                          <span className="text-blue-600 font-medium">
                            {formatCurrency(offer.counteredPrice)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(offer.offerStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/offers/id/${offer.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewHistory(offer)}
                              className="cursor-pointer"
                            >
                              <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewProperty(offer.propertyId)
                              }
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Property
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openActionDialog(offer, "accept")}
                              className="cursor-pointer text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" /> Accept Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openActionDialog(offer, "counter")}
                              className="cursor-pointer text-blue-600"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" /> Counter
                              Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openActionDialog(offer, "reject")}
                              className="cursor-pointer text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" /> Reject Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openActionDialog(offer, "expire")}
                              className="cursor-pointer text-gray-600"
                            >
                              <Clock className="mr-2 h-4 w-4" /> Mark as Expired
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" && "Accept Offer"}
              {actionType === "counter" && "Counter Offer"}
              {actionType === "reject" && "Reject Offer"}
              {actionType === "expire" && "Expire Offer"}
            </DialogTitle>
            <DialogDescription>
              {selectedOffer && (
                <div className="py-2">
                  <p>
                    Buyer:{" "}
                    <span className="font-medium">
                      {selectedOffer.buyer?.firstName}{" "}
                      {selectedOffer.buyer?.lastName}
                    </span>
                  </p>
                  <p>
                    Current Offer:{" "}
                    <span className="font-medium">
                      {formatCurrency(selectedOffer.offeredPrice)}
                    </span>
                  </p>
                  <p>
                    Property:{" "}
                    <span className="font-medium">
                      {selectedOffer.property?.streetAddress
                        ? `${selectedOffer.property.streetAddress}, ${
                            selectedOffer.property.city || ""
                          }`
                        : selectedOffer.property?.title ||
                          selectedOffer.propertyId}
                    </span>
                  </p>
                </div>
              )}
              {actionType === "accept" &&
                "The buyer will be notified that their offer has been accepted."}
              {actionType === "counter" &&
                "Specify a counter offer price to send to the buyer."}
              {actionType === "reject" &&
                "The buyer will be notified that their offer has been rejected."}
              {actionType === "expire" &&
                "The offer will be marked as expired and the buyer will be notified."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Counter price input - only for counter action */}
            {actionType === "counter" && (
              <div>
                <Label htmlFor="counterPrice">Counter Offer Price ($)</Label>
                <Input
                  id="counterPrice"
                  type="text"
                  value={counterPrice}
                  onChange={handleCounterPriceChange}
                  placeholder="Enter counter price"
                  className="mt-1"
                />
              </div>
            )}

            {/* Message input for all actions */}
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to the buyer..."
                className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background resize-y"
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
              onClick={handleUpdateOfferStatus}
              disabled={isSubmitting}
              className={`
                ${actionType === "accept" && "bg-green-600 hover:bg-green-700"}
                ${actionType === "counter" && "bg-blue-600 hover:bg-blue-700"}
                ${actionType === "reject" && "bg-red-600 hover:bg-red-700"}
                ${actionType === "expire" && "bg-gray-600 hover:bg-gray-700"}
              `}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offer History</DialogTitle>
            <DialogDescription>
              {selectedOffer && (
                <div className="py-2">
                  <p>
                    Property:{" "}
                    <span className="font-medium">
                      {selectedOffer.property?.streetAddress
                        ? `${selectedOffer.property.streetAddress}, ${
                            selectedOffer.property.city || ""
                          }, ${selectedOffer.property.state || ""}`
                        : selectedOffer.property?.title ||
                          selectedOffer.propertyId}
                    </span>
                  </p>
                  <p>
                    Buyer:{" "}
                    <span className="font-medium">
                      {selectedOffer.buyer?.firstName}{" "}
                      {selectedOffer.buyer?.lastName}
                    </span>
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedHistory.length === 0 ? (
              <p className="text-center text-gray-500">
                No history records found
              </p>
            ) : (
              <div className="space-y-4">
                {selectedHistory.map((entry, index) => (
                  <div key={index} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        {entry.newStatus === "PENDING" &&
                          entry.previousStatus === undefined && (
                            <div className="font-medium">
                              Buyer Submitted an Offer of{" "}
                              {formatCurrency(entry.newPrice)}
                            </div>
                          )}
                        {entry.newStatus === "COUNTERED" && (
                          <div className="font-medium">
                            Admin Countered the Offer with{" "}
                            {formatCurrency(entry.counteredPrice)}
                          </div>
                        )}
                        {entry.newStatus === "ACCEPTED" && (
                          <div className="font-medium">
                            Admin Accepted the Offer of{" "}
                            {formatCurrency(
                              entry.previousPrice || entry.newPrice
                            )}
                          </div>
                        )}
                        {entry.newStatus === "REJECTED" && (
                          <div className="font-medium">
                            Admin Rejected the Offer of{" "}
                            {formatCurrency(
                              entry.previousPrice || entry.newPrice
                            )}
                          </div>
                        )}
                        {entry.newStatus === "EXPIRED" && (
                          <div className="font-medium">
                            Offer of{" "}
                            {formatCurrency(
                              entry.previousPrice || entry.newPrice
                            )}{" "}
                            Expired
                          </div>
                        )}
                        {entry.newStatus === "PENDING" &&
                          entry.previousStatus && (
                            <div className="font-medium">
                              Buyer Updated their Offer to{" "}
                              {formatCurrency(entry.newPrice)}
                            </div>
                          )}
                      </div>
                      <Badge
                        className={`
                          ${
                            entry.newStatus === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : ""
                          }
                          ${
                            entry.newStatus === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                          ${
                            entry.newStatus === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : ""
                          }
                          ${
                            entry.newStatus === "COUNTERED"
                              ? "bg-blue-100 text-blue-800"
                              : ""
                          }
                          ${
                            entry.newStatus === "EXPIRED"
                              ? "bg-gray-100 text-gray-800"
                              : ""
                          }
                        `}
                      >
                        {entry.newStatus}
                      </Badge>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {entry.timestamp
                        ? format(
                            new Date(entry.timestamp),
                            "MMM d, yyyy h:mm a"
                          )
                        : "Unknown date"}
                    </div>

                    {/* Show messages if present */}
                    {entry.buyerMessage && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm font-semibold">Buyer Message:</p>
                        <p className="text-sm italic">{entry.buyerMessage}</p>
                      </div>
                    )}

                    {entry.sysMessage && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm font-semibold">Admin Message:</p>
                        <p className="text-sm italic">{entry.sysMessage}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OffersTable;
