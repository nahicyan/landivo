// client/src/components/PropertyManagement/PropertyBulkDeletionModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Trash2, 
  Mail, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PropertyBulkDeletionModal = ({
  isOpen,
  onClose,
  properties,
  onConfirm,
  isLoading,
  currentStep,
  isPermissionLoading,
  hasDeletePermission,
  requiresStatusConfirmation,
  canDirectDelete,
  onInitialConfirm,
  statusAnalysis,
  BULK_DELETION_STEPS,
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!properties || properties.length === 0) return null;

  const propertyCount = properties.length;

  // Permission checking step
  if (currentStep === BULK_DELETION_STEPS.PERMISSION_CHECK) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              Checking Permissions
            </DialogTitle>
            <DialogDescription>
              Verifying your deletion permissions for {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}...
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-8">
            {isPermissionLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            ) : (
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Permission check complete</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Initial confirmation step (for users with permissions)
  if (currentStep === BULK_DELETION_STEPS.INITIAL_CONFIRM) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete these properties?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Property Status Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {statusAnalysis.available > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                    <span>{statusAnalysis.available}</span>
                  </div>
                )}
                {statusAnalysis.pending > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                    <span>{statusAnalysis.pending}</span>
                  </div>
                )}
                {statusAnalysis.sold > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Sold</Badge>
                    <span>{statusAnalysis.sold}</span>
                  </div>
                )}
                {statusAnalysis.notAvailable > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800">Not Available</Badge>
                    <span>{statusAnalysis.notAvailable}</span>
                  </div>
                )}
                {statusAnalysis.testing > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">Testing</Badge>
                    <span>{statusAnalysis.testing}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Properties to be deleted:</h4>
              <ScrollArea className="h-[200px] w-full rounded-md border p-3">
                {properties.map((property, index) => (
                  <div
                    key={property.id}
                    className={`flex items-center justify-between py-2 ${
                      index !== properties.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" dangerouslySetInnerHTML={{
                        __html: property.title || "Untitled Property"
                      }} />
                      <p className="text-xs text-gray-600">
                        {property.streetAddress}, {property.city}, {property.state}
                      </p>
                    </div>
                    <Badge
                      className={
                        property.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : property.status === "Pending"
                          ? "bg-orange-100 text-orange-800"
                          : property.status === "Sold"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {property.status || "Unknown"}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. {propertyCount} {propertyCount === 1 ? 'property' : 'properties'} will be permanently removed.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={onInitialConfirm}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Delete {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Status-based deletion confirmation
  if (currentStep === BULK_DELETION_STEPS.STATUS_CHECK) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Confirm Bulk Deletion
            </DialogTitle>
            <DialogDescription>
              Proceeding with deletion of {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property List Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Deletion Summary</h4>
              <p className="text-sm text-gray-700">
                You are about to delete {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}.
                All associated data will be permanently removed.
              </p>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="bulk-deletion-reason">
                Reason for deletion (optional)
              </Label>
              <Textarea
                id="bulk-deletion-reason"
                placeholder="e.g., Bulk cleanup, Properties sold, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Critical Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This will permanently delete {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}.
                This action cannot be undone!
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Final confirmation for Available/Pending properties
  if (currentStep === BULK_DELETION_STEPS.FINAL_CONFIRM) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Additional Confirmation Required
            </DialogTitle>
            <DialogDescription>
              Some selected properties are Available or Pending
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {statusAnalysis.available > 0 && (
                  <div><strong>{statusAnalysis.available}</strong> Available {statusAnalysis.available === 1 ? 'property' : 'properties'}</div>
                )}
                {statusAnalysis.pending > 0 && (
                  <div><strong>{statusAnalysis.pending}</strong> Pending {statusAnalysis.pending === 1 ? 'property' : 'properties'}</div>
                )}
                <p className="mt-2 text-sm">
                  Deleting active listings may impact potential buyers and ongoing deals.
                </p>
              </AlertDescription>
            </Alert>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="bulk-deletion-reason-final">
                Reason for deletion (required for active properties)
              </Label>
              <Textarea
                id="bulk-deletion-reason-final"
                placeholder="Please provide a detailed reason for deleting active listings..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Final Warning:</strong> You are about to delete {propertyCount} {propertyCount === 1 ? 'property' : 'properties'},
                including active listings. This action is irreversible!
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || !reason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Request deletion step (for users without permissions)
  if (currentStep === BULK_DELETION_STEPS.REQUEST_DELETION) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Request Bulk Property Deletion
            </DialogTitle>
            <DialogDescription>
              You don't have direct deletion permissions. This will send a request to admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Count */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Requesting deletion for {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
              </p>
            </div>

            {/* Property List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Selected Properties:</h4>
              <ScrollArea className="h-[150px] w-full rounded-md border p-3">
                {properties.map((property, index) => (
                  <div
                    key={property.id}
                    className={`py-2 ${index !== properties.length - 1 ? 'border-b' : ''}`}
                  >
                    <p className="text-sm font-medium" dangerouslySetInnerHTML={{
                      __html: property.title || "Untitled Property"
                    }} />
                    <p className="text-xs text-gray-600">
                      {property.streetAddress} - Status: {property.status}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                An email will be sent to the admin. The properties will only be deleted after admin approval.
              </AlertDescription>
            </Alert>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="bulk-deletion-reason-request">
                Reason for deletion (optional)
              </Label>
              <Textarea
                id="bulk-deletion-reason-request"
                placeholder="e.g., Bulk cleanup, Properties sold, outdated listings, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Deletion Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};