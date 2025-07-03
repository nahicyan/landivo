// src/components/ActionTab/QuickActionDialog.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, FileText, DollarSign, BarChart3, MoreVertical } from 'lucide-react';
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
      <DropdownMenu open={isOpen} onOpenChange={onClose}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-gray-800 border-gray-700 text-white rounded-lg shadow-lg"
        >
          <DropdownMenuItem 
            onClick={handleEdit}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer rounded-none"
          >
            <Edit className="h-5 w-5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => openDialog('offers')}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer rounded-none"
          >
            <FileText className="h-5 w-5" />
            Offers
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => openDialog('finance')}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer rounded-none"
          >
            <DollarSign className="h-5 w-5" />
            Finance
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => openDialog('overview')}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer rounded-none"
          >
            <BarChart3 className="h-5 w-5" />
            Overview
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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