// src/components/ActionTab/OverviewDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Clock, 
  User, 
  FileEdit,
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { getProperty } from '@/utils/api/properties';
import { getUserById } from '@/utils/api/users';
import { format } from 'date-fns';

export default function OverviewDialog({ isOpen, onClose, propertyData }) {
  const [modificationHistory, setModificationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCache, setUserCache] = useState({});

  // Fetch property details and modification history when dialog opens
  useEffect(() => {
    if (isOpen && propertyData?.id) {
      fetchModificationHistory();
    }
  }, [isOpen, propertyData?.id]);

  const fetchModificationHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the full property details including modification history
      const property = await getProperty(propertyData.id);
      
      if (property?.modificationHistory && Array.isArray(property.modificationHistory)) {
        // Sort by timestamp (newest first)
        const sortedHistory = [...property.modificationHistory].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        setModificationHistory(sortedHistory);
        
        // Fetch user details for all unique user IDs
        const uniqueUserIds = [...new Set(sortedHistory.map(h => h.userId))];
        await fetchUserDetails(uniqueUserIds);
      } else {
        setModificationHistory([]);
      }
    } catch (err) {
      console.error('Error fetching modification history:', err);
      setError('Failed to load modification history');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userIds) => {
    const newUserCache = { ...userCache };
    
    for (const userId of userIds) {
      if (!newUserCache[userId]) {
        try {
          const user = await getUserById(userId);
          newUserCache[userId] = user;
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
          newUserCache[userId] = {
            firstName: 'Unknown',
            lastName: 'User'
          };
        }
      }
    }
    
    setUserCache(newUserCache);
  };

  const getUserName = (userId) => {
    const user = userCache[userId];
    if (!user) return 'Loading...';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      return user.email;
    }
    return 'Unknown User';
  };

  const formatFieldName = (fieldName) => {
    // Convert camelCase to readable format
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getChangeCount = (changes) => {
    return Object.keys(changes || {}).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#324c48] flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Modification History
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {propertyData?.title || 'Property'} - {propertyData?.streetAddress}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#546930]" />
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && modificationHistory.length === 0 && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="py-12 text-center">
                <FileEdit className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No Modification History
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  This property has not been modified since creation.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && modificationHistory.length > 0 && (
            <div className="space-y-4">
              {modificationHistory.map((modification, index) => (
                <Card 
                  key={index}
                  className="border-[#D4A017] hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#546930] rounded-full p-2">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#324c48]">
                            {getUserName(modification.userId)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(modification.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-[#f4f7ee] text-[#546930] border-[#546930]"
                      >
                        {getChangeCount(modification.changes)} change{getChangeCount(modification.changes) !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Changes Section */}
                    <div className="space-y-3">
                      {Object.entries(modification.changes || {}).map(([fieldName, change], changeIndex) => (
                        <div 
                          key={changeIndex}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <p className="font-medium text-sm text-[#324c48] mb-2">
                            {formatFieldName(fieldName)}
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">From:</p>
                              <p className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 break-words">
                                {formatValue(change.from)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">To:</p>
                              <p className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 break-words">
                                {formatValue(change.to)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}