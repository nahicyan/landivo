// src/components/ActionTab/ActionTab.jsx
import React, { useState } from "react";
import PermissionGuard from "@/components/Auth0/PermissionGuard";
import { PERMISSIONS } from "@/utils/permissions";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  FileText,
  DollarSign,
  BarChart3,
  SendHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import OffersDialog from "./OffersDialog";
import FinanceDialog from "./FinanceDialog";
import OverviewDialog from "./OverviewDialog";

export default function ActionTab({ propertyData }) {
  const [activeDialog, setActiveDialog] = useState(null);
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/admin/edit-property/${propertyData.id}`);
  };
  const handleCampaign = () => {
    navigate(`http://localhost:3000/dashboard/campaigns/run/${propertyData.id}`);
  };

  const openDialog = (dialogType) => {
    setActiveDialog(dialogType);
  };

  const closeSubDialog = () => {
    setActiveDialog(null);
  };

  return (
    <PermissionGuard permission={PERMISSIONS.WRITE_PROPERTIES}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-[#546930] hover:bg-[#324c48] text-white hover:text-white border border-[#D4A017] hover:border-[#faeed1] transition-all duration-300 px-4 py-2 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] rounded-full"
          >
            Quick Action
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-[#627a38] border-[#D4A017] text-white rounded-lg shadow-lg"
        >
          <DropdownMenuItem
            onClick={handleEdit}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#324c48] hover:!text-white focus:bg-[#324c48] focus:!text-white cursor-pointer rounded-none"
          >
            <Edit className="h-5 w-5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openDialog("offers")}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#324c48] hover:!text-white focus:bg-[#324c48] focus:!text-white cursor-pointer rounded-none"
          >
            <FileText className="h-5 w-5" />
            Offers
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openDialog("finance")}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#324c48] hover:!text-white focus:bg-[#324c48] focus:!text-white cursor-pointer rounded-none"
          >
            <DollarSign className="h-5 w-5" />
            Finance
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openDialog("overview")}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#324c48] hover:!text-white focus:bg-[#324c48] focus:!text-white cursor-pointer rounded-none"
          >
            <BarChart3 className="h-5 w-5" />
            Overview
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCampaign}
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-[#324c48] hover:!text-white focus:bg-[#324c48] focus:!text-white cursor-pointer rounded-none"
          >
            <SendHorizontal className="h-5 w-5" />
            Run Campagin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <OffersDialog
        isOpen={activeDialog === "offers"}
        onClose={closeSubDialog}
        propertyData={propertyData}
      />
      <FinanceDialog
        isOpen={activeDialog === "finance"}
        onClose={closeSubDialog}
        propertyData={propertyData}
      />
      <OverviewDialog
        isOpen={activeDialog === "overview"}
        onClose={closeSubDialog}
        propertyData={propertyData}
      />
    </PermissionGuard>
  );
}
