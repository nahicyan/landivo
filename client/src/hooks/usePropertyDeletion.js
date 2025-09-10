// client/src/hooks/usePropertyDeletion.js
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { usePermissions } from '@/components/Auth0/PermissionsContext';
import { requestPropertyDeletion as apiRequestPropertyDeletion } from '@/utils/api';

/**
 * Custom hook for handling property deletion workflow
 */
export const usePropertyDeletion = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const queryClient = useQueryClient();
  const { check } = usePermissions();

  // API call to request property deletion
  const requestDeletion = async ({ propertyId, reason }) => {
    return await apiRequestPropertyDeletion(propertyId, reason);
  };

  // Mutation for deletion request
  const deletionMutation = useMutation({
    mutationFn: requestDeletion,
    onSuccess: () => {
      toast.success('Deletion request sent to admin for approval');
      setIsConfirmOpen(false);
      setSelectedProperty(null);
      // Optionally refresh the properties list
      queryClient.invalidateQueries('allProperties');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to request property deletion');
    },
  });

  // Check if property can be deleted
  const canDeleteProperty = (property) => {
    if (!check.canDeleteProperties) return false;
    return property?.status === 'Sold' || property?.status === 'Not Available';
  };

  // Open confirmation dialog
  const openDeletionConfirm = (property) => {
    setSelectedProperty(property);
    setIsConfirmOpen(true);
  };

  // Close confirmation dialog
  const closeDeletionConfirm = () => {
    setIsConfirmOpen(false);
    setSelectedProperty(null);
  };

  // Execute deletion request
  const requestPropertyDeletion = (reason = '') => {
    if (!selectedProperty) return;
    
    deletionMutation.mutate({
      propertyId: selectedProperty.id,
      reason,
    });
  };

  return {
    // State
    isConfirmOpen,
    selectedProperty,
    isLoading: deletionMutation.isLoading,
    
    // Actions
    canDeleteProperty,
    openDeletionConfirm,
    closeDeletionConfirm,
    requestPropertyDeletion,
  };
};