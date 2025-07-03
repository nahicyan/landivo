// src/components/ActionTab/FinanceDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DollarSign, CreditCard, FileText, Calendar } from 'lucide-react';
import { api } from '@/utils/api';

export default function FinanceDialog({ isOpen, onClose, propertyData }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && propertyData?.id) {
      fetchFinanceData();
    }
  }, [isOpen, propertyData?.id]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/properties/${propertyData.id}/finance-applications`);
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'loan': return <CreditCard className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#324c48] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Applications
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading financial applications...</div>
            ) : applications.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="py-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No financial applications found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Financial applications will appear here once submitted
                  </p>
                </CardContent>
              </Card>
            ) : (
              applications.map((app) => (
                <Card key={app.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        {getApplicationTypeIcon(app.type)}
                        {app.applicantName || 'Anonymous Applicant'}
                      </CardTitle>
                      <Badge className={getStatusColor(app.status)}>
                        {app.status?.replace('_', ' ') || 'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-medium text-gray-900">
                          ${app.requestedAmount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {app.type || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Application Date</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact</p>
                        <p className="font-medium text-gray-900">
                          {app.email || app.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {app.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-gray-600 text-sm">Notes</p>
                        <p className="text-gray-800 text-sm mt-1">{app.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}