// src/components/ActionTab/ActionTab.jsx
import React, { useState } from 'react';
import PermissionGuard from '@/components/Auth0/PermissionGuard';
import { PERMISSIONS } from '@/utils/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import QuickActionDialog from './QuickActionDialog';

export default function ActionTab({ propertyData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PermissionGuard permission={PERMISSIONS.WRITE_PROPERTIES}>
      <Badge 
        variant="outline" 
        className="bg-[#3f4f24] hover:bg-[#4a5c2c] text-white border-none cursor-pointer transition-all duration-200 px-4 py-2 text-sm font-medium"
        onClick={() => setIsOpen(true)}
      >
        <Zap className="w-4 h-4 mr-2" />
        Quick Action
      </Badge>

      <QuickActionDialog 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        propertyData={propertyData}
      />
    </PermissionGuard>
  );
}