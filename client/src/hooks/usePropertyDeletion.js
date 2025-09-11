// client/src/hooks/usePropertyDeletion.js
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { usePermissions } from '@/components/Auth0/PermissionsContext';
import { requestPropertyDeletion as apiRequestPropertyDeletion } from '@/utils/api';

/**
 * Deletion flow steps
 */
const DELETION_STEPS = {
  PERMISSION_CHECK: 'permission_check',
  INITIAL_CONFIRM: 'initial_confirm', 
  STATUS_CHECK: 'status_check',
  FINAL_CONFIRM: 'final_confirm',
  REQUEST_DELETION: 'request_deletion'
};

/**
 * Enhanced custom hook for handling property deletion workflow
 */
export const usePropertyDeletion = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [currentStep, setCurrentStep] = useState(DELETION_STEPS.PERMISSION_CHECK);
  const [isPermissionLoading, setIsPermissionLoading] = useState(false);
  const queryClient = useQueryClient();
  const { check } = usePermissions();

  // API call to request property deletion (existing flow)
  const requestDeletion = async ({ propertyId, reason }) => {
    return await apiRequestPropertyDeletion(propertyId, reason);
  };

  // Direct deletion API call (for users with delete:properties permission)
  const directDeletion = async ({ propertyId, reason }) => {
    return await apiDeletePropertyDirect(propertyId, reason);
  };

  // Mutation for deletion request (existing admin approval flow)
  const deletionRequestMutation = useMutation({
    mutationFn: requestDeletion,
    onSuccess: () => {
      toast.success('Deletion request sent to admin for approval');
      closeDeletionConfirm();
      queryClient.invalidateQueries('allProperties');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to request property deletion');
    },
  });

  // Mutation for direct deletion (for sold/unavailable/testing properties)
  const directDeletionMutation = useMutation({
    mutationFn: directDeletion,
    onSuccess: () => {
      toast.success('Property deleted successfully');
      closeDeletionConfirm();
      queryClient.invalidateQueries('allProperties');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete property');
    },
  });

  // Check if property requires special status confirmation
  const requiresStatusConfirmation = (property) => {
    const status = property?.status;
    return status === 'Available' || status === 'Pending';
  };

  // Check if property can be deleted directly (sold/unavailable/testing)
  const canDirectDelete = (property) => {
    const status = property?.status;
    return status === 'Sold' || status === 'Not Available' || status === 'Testing';
  };

  // All properties should be deletable regardless of status
  const canDeleteProperty = () => {
    return true; // Changed from status-based restriction
  };

  // Start deletion flow with permission check
  const openDeletionConfirm = async (property) => {
    setSelectedProperty(property);
    setIsConfirmOpen(true);
    setCurrentStep(DELETION_STEPS.PERMISSION_CHECK);
    
    // Simulate loading for permission check
    setIsPermissionLoading(true);
    
    // Short delay to show loading spinner
    setTimeout(() => {
      setIsPermissionLoading(false);
      
      if (!check.canDeleteProperties) {
        // No permission - show request deletion flow
        setCurrentStep(DELETION_STEPS.REQUEST_DELETION);
      } else {
        // Has permission - proceed to initial confirmation
        setCurrentStep(DELETION_STEPS.INITIAL_CONFIRM);
      }
    }, 800); // Short loading simulation
  };

  // Handle initial confirmation (when user has delete permissions)
  const handleInitialConfirm = () => {
    if (!selectedProperty) return;
    
    if (canDirectDelete(selectedProperty)) {
      // Property is sold/unavailable/testing - proceed with deletion
      setCurrentStep(DELETION_STEPS.STATUS_CHECK);
    } else if (requiresStatusConfirmation(selectedProperty)) {
      // Property is available/pending - show additional confirmation
      setCurrentStep(DELETION_STEPS.FINAL_CONFIRM);
    } else {
      // Fallback - show status check
      setCurrentStep(DELETION_STEPS.STATUS_CHECK);
    }
  };

  // Handle final deletion execution
  const executePropertyDeletion = (reason = '') => {
    if (!selectedProperty) return;
    
    if (check.canDeleteProperties) {
      // Use direct deletion for users with permissions
      directDeletionMutation.mutate({
        propertyId: selectedProperty.id,
        reason,
      });
    } else {
      // Use request deletion for users without permissions
      deletionRequestMutation.mutate({
        propertyId: selectedProperty.id,
        reason,
      });
    }
  };

  // Close confirmation dialog and reset state
  const closeDeletionConfirm = () => {
    setIsConfirmOpen(false);
    setSelectedProperty(null);
    setCurrentStep(DELETION_STEPS.PERMISSION_CHECK);
    setIsPermissionLoading(false);
  };

  // Navigate to specific step (for modal controls)
  const goToStep = (step) => {
    setCurrentStep(step);
  };

  return {
    // State
    isConfirmOpen,
    selectedProperty,
    currentStep,
    isPermissionLoading,
    isLoading: deletionRequestMutation.isLoading || directDeletionMutation.isLoading,
    
    // Computed properties
    hasDeletePermission: check.canDeleteProperties,
    requiresStatusConfirmation: selectedProperty ? requiresStatusConfirmation(selectedProperty) : false,
    canDirectDelete: selectedProperty ? canDirectDelete(selectedProperty) : false,
    
    // Actions
    canDeleteProperty,
    openDeletionConfirm,
    closeDeletionConfirm,
    handleInitialConfirm,
    executePropertyDeletion,
    goToStep,
    
    // Legacy compatibility
    requestPropertyDeletion: executePropertyDeletion, // For backward compatibility
    
    // Constants
    DELETION_STEPS,
  };
};