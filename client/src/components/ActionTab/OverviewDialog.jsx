// src/components/ActionTab/OverviewDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Wrench } from 'lucide-react';

export default function OverviewDialog({ isOpen, onClose, propertyData }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#324c48] flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Property Overview
          </DialogTitle>
        </DialogHeader>

        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="py-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              In Development
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Property overview analytics and insights are currently being developed. 
              This feature will be available soon.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}