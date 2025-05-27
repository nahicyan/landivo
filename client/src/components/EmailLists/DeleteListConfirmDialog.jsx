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
import { AlertTriangle } from "lucide-react";

export default function DeleteListConfirmDialog({ 
  open, 
  onOpenChange, 
  selectedList,
  onConfirmDelete 
}) {
  const [deleteBuyers, setDeleteBuyers] = useState(false);

  const handleConfirm = () => {
    onConfirmDelete(deleteBuyers);
    setDeleteBuyers(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setDeleteBuyers(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          >
            {deleteBuyers ? "Delete List & Buyers" : "Delete List Only"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}