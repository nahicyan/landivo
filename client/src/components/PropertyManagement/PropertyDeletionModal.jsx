// client/src/components/PropertyManagement/PropertyDeletionModal.jsx
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
import { AlertTriangle, Trash2, Mail, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PropertyDeletionModal = ({
  isOpen,
  onClose,
  property,
  onConfirm,
  isLoading,
  currentStep,
  isPermissionLoading,
  hasDeletePermission,
  requiresStatusConfirmation,
  canDirectDelete,
  onInitialConfirm,
  DELETION_STEPS,
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!property) return null;

  // Permission checking step
  if (currentStep === DELETION_STEPS.PERMISSION_CHECK) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              Checking Permissions
            </DialogTitle>
            <DialogDescription>
              Verifying your deletion permissions...
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
  if (currentStep === DELETION_STEPS.INITIAL_CONFIRM) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Property
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4
                className="font-medium text-sm"
                dangerouslySetInnerHTML={{
                  __html: property.title || "Untitled Property",
                }}
              />
              <p className="text-sm text-gray-600">
                {property.streetAddress}, {property.city}, {property.state}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium">{property.status}</span>
              </p>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The property will be permanently removed.
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
                Yes, Delete Property
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Status-based deletion confirmation (sold/unavailable/testing)
  if (currentStep === DELETION_STEPS.STATUS_CHECK) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Property is {property.status} - proceeding with deletion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4
                className="font-medium text-sm"
                dangerouslySetInnerHTML={{
                  __html: property.title || "Untitled Property",
                }}
              />
              <p className="text-sm text-gray-600">
                {property.streetAddress}, {property.city}, {property.state}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium text-green-600">{property.status}</span>
              </p>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">
                Reason for deletion (optional)
              </Label>
              <Textarea
                id="deletion-reason"
                placeholder="e.g., Property sold, duplicate listing, etc."
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
                    Delete Property
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
  if (currentStep === DELETION_STEPS.FINAL_CONFIRM) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Final Confirmation
            </DialogTitle>
            <DialogDescription>
              This property is {property.status}. Are you sure you want to delete it?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Info */}
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4
                className="font-medium text-sm"
                dangerouslySetInnerHTML={{
                  __html: property.title || "Untitled Property",
                }}
              />
              <p className="text-sm text-gray-600">
                {property.streetAddress}, {property.city}, {property.state}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium text-orange-600">{property.status}</span>
              </p>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This property is currently {property.status}. Deleting it may impact potential buyers or ongoing transactions.
              </AlertDescription>
            </Alert>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">
                Reason for deletion (required for {property.status} properties)
              </Label>
              <Textarea
                id="deletion-reason"
                placeholder="Please provide a reason for deleting this Available/Pending property"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
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
                    Delete Property
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
  if (currentStep === DELETION_STEPS.REQUEST_DELETION) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Request Property Deletion
            </DialogTitle>
            <DialogDescription>
              You don't have direct deletion permissions. This will send a request to admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4
                className="font-medium text-sm"
                dangerouslySetInnerHTML={{
                  __html: property.title || "Untitled Property",
                }}
              />
              <p className="text-sm text-gray-600">
                {property.streetAddress}, {property.city}, {property.state}
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium">{property.status}</span>
              </p>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                An email will be sent to the admin. The property will only be deleted after admin approval.
              </AlertDescription>
            </Alert>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">
                Reason for deletion (optional)
              </Label>
              <Textarea
                id="deletion-reason"
                placeholder="e.g., Property sold, duplicate listing, etc."
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