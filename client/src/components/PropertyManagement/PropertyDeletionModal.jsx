// client/src/components/PropertyManagement/PropertyDeletionModal.jsx
import React, { useState } from 'react';
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
import { AlertTriangle, Trash2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PropertyDeletionModal = ({
  isOpen,
  onClose,
  property,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Request Property Deletion
          </DialogTitle>
          <DialogDescription>
            This will send a deletion request to the admin for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">{property.title}</h4>
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
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                "Sending Request..."
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
};