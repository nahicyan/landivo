// src/components/ActionTab/OffersDialog.jsx
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
import { FileText, Clock, DollarSign, User } from 'lucide-react';
import { api } from '@/utils/api';

export default function OffersDialog({ isOpen, onClose, propertyData }) {
  const [offers, setOffers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && propertyData?.id) {
      fetchData();
    }
  }, [isOpen, propertyData?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offersRes, activitiesRes] = await Promise.all([
        api.get(`/properties/${propertyData.id}/offers`),
        api.get(`/properties/${propertyData.id}/activities`)
      ]);
      
      setOffers(offersRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching offers data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#324c48] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Offers & Activity
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Offers Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#D4A017]" />
                Recent Offers ({offers.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading offers...</div>
              ) : offers.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="py-8 text-center text-gray-500">
                    No offers found for this property
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <Card key={offer.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              ${offer.offerAmount?.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {offer.buyerName || 'Anonymous Buyer'}
                            </p>
                          </div>
                          <Badge className={getStatusColor(offer.status)}>
                            {offer.status || 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#324c48]" />
                Recent Activity ({activities.length})
              </h3>
              
              {activities.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200">
                  <CardContent className="py-8 text-center text-gray-500">
                    No recent activity
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <Card key={activity.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.createdAt).toLocaleDateString()} - {activity.user}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}