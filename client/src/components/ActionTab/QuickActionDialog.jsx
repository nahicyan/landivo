// src/components/ActionTab/QuickActionDialog.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, FileText, DollarSign, BarChart3 } from 'lucide-react';
import OffersDialog from './OffersDialog';
import FinanceDialog from './FinanceDialog';
import OverviewDialog from './OverviewDialog';

export default function QuickActionDialog({ isOpen, onClose, propertyData }) {
  const [activeDialog, setActiveDialog] = useState(null);
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/admin/edit-property/${propertyData.id}`);
    onClose();
  };

  const openDialog = (dialogType) => {
    setActiveDialog(dialogType);
  };

  const closeSubDialog = () => {
    setActiveDialog(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#324c48] flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Actions
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={handleEdit}
              className="h-20 flex flex-col items-center gap-2 bg-[#3f4f24] hover:bg-[#4a5c2c] text-white"
            >
              <Edit className="w-6 h-6" />
              <span className="text-sm font-medium">Edit</span>
            </Button>

            <Button
              onClick={() => openDialog('offers')}
              className="h-20 flex flex-col items-center gap-2 bg-[#324c48] hover:bg-[#3d5a55] text-white"
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm font-medium">Offers</span>
            </Button>

            <Button
              onClick={() => openDialog('finance')}
              className="h-20 flex flex-col items-center gap-2 bg-[#D4A017] hover:bg-[#c0921a] text-white"
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-sm font-medium">Finance</span>
            </Button>

            <Button
              onClick={() => openDialog('overview')}
              className="h-20 flex flex-col items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm font-medium">Overview</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OffersDialog 
        isOpen={activeDialog === 'offers'} 
        onClose={closeSubDialog}
        propertyData={propertyData}
      />
      
      <FinanceDialog 
        isOpen={activeDialog === 'finance'} 
        onClose={closeSubDialog}
        propertyData={propertyData}
      />
      
      <OverviewDialog 
        isOpen={activeDialog === 'overview'} 
        onClose={closeSubDialog}
        propertyData={propertyData}
      />
    </>
  );
}