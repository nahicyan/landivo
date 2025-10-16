// File location: client/src/components/EmailLists/DeleteListConfirmDialog.jsx

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

export default function DeleteListConfirmDialog({ 
  open, 
  onOpenChange, 
  selectedList,
  onConfirmDelete 
}) {
  const [deleteBuyers, setDeleteBuyers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleConfirm = async () => {
    try {
      // Show loading state
      setIsDeleting(true);
      setDeleteSuccess(false);
      
      // Call the delete function
      await onConfirmDelete(deleteBuyers);
      
      // Show success state
      setDeleteSuccess(true);
      
      // Close after showing success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Error deleting list:", error);
      setIsDeleting(false);
      setDeleteSuccess(false);
    }
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleClose = () => {
    setDeleteBuyers(false);
    setIsDeleting(false);
    setDeleteSuccess(false);
    onOpenChange(false);
  };

  return (
    <>
      {/* Main Confirmation Dialog */}
      <Dialog open={open && !isDeleting} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Email List
            </DialogTitle>
            <DialogDescription>
              {selectedList && (
                <>
                  Are you sure you want to delete the "{selectedList.name}" list?
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteBuyers"
                checked={deleteBuyers}
                onCheckedChange={setDeleteBuyers}
                className="h-4 w-4"
              />
              <Label htmlFor="deleteBuyers" className="text-sm">
                Also permanently delete all buyers in this list
                {selectedList && ` (${selectedList.buyerCount} buyers)`}
              </Label>
            </div>
            
            {deleteBuyers && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Warning: This will permanently delete all buyer records, 
                  their offers, and activity data. This cannot be undone.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {deleteBuyers ? "Delete List & Buyers" : "Delete List Only"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading/Success Dialog */}
      <Dialog open={isDeleting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-center">
              {deleteSuccess ? "List Deleted!" : "Deleting Email List"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-8">
            {deleteSuccess ? (
              <>
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-sm text-gray-600">
                  The email list has been deleted successfully!
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 text-red-600 animate-spin mb-4" />
                <p className="text-center text-sm text-gray-600 mb-2">
                  Please wait while we delete the list...
                </p>
                {deleteBuyers && selectedList && (
                  <p className="text-center text-xs text-gray-500">
                    Deleting list and {selectedList.buyerCount} buyers
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}