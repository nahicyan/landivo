// client/src/hooks/usePropertyBulkDeletion.js
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { usePermissions } from "@/components/Auth0/PermissionsContext";
import { requestPropertyBulkDeletion as apiRequestBulkDeletion, deletePropertiesBulk } from "@/utils/api";
import { getLogger } from "@/utils/logger";

const log = getLogger("usePropertyBulkDeletion");

/**
 * Bulk Deletion flow steps
 */
const BULK_DELETION_STEPS = {
  PERMISSION_CHECK: "permission_check",
  INITIAL_CONFIRM: "initial_confirm",
  STATUS_CHECK: "status_check",
  FINAL_CONFIRM: "final_confirm",
  REQUEST_DELETION: "request_deletion",
};

/**
 * Custom hook for handling bulk property deletion workflow
 */
export const usePropertyBulkDeletion = () => {
  log.info("[usePropertyBulkDeletion] > [Init]: hook initialized");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [currentStep, setCurrentStep] = useState(BULK_DELETION_STEPS.PERMISSION_CHECK);
  const [isPermissionLoading, setIsPermissionLoading] = useState(false);
  const queryClient = useQueryClient();
  const { check } = usePermissions();

  // API call to request bulk property deletion (existing flow)
  const requestBulkDeletion = async ({ propertyIds, reason }) => {
    return await apiRequestBulkDeletion(propertyIds, reason);
  };

  // Direct bulk deletion API call (for users with delete:properties permission)
  const directBulkDeletion = async ({ propertyIds, reason }) => {
    return await deletePropertiesBulk(propertyIds, reason);
  };

  // Mutation for bulk deletion request (admin approval flow)
  const bulkDeletionRequestMutation = useMutation({
    mutationFn: requestBulkDeletion,
    onSuccess: (data) => {
      log.info(
        `[usePropertyBulkDeletion] > [Response]: bulkDeletionRequest success ${data?.count || 0} properties`
      );
      toast.success(`Deletion request sent for ${data.count} properties`);
      closeBulkDeletionConfirm();
      queryClient.invalidateQueries("allProperties");
    },
    onError: (error) => {
      log.error(`[usePropertyBulkDeletion] > [Error]: ${error.message}`);
      toast.error(error.message || "Failed to request bulk property deletion");
    },
  });

  // Mutation for direct bulk deletion (for users with permissions)
  const directBulkDeletionMutation = useMutation({
    mutationFn: directBulkDeletion,
    onSuccess: (data) => {
      log.info(
        `[usePropertyBulkDeletion] > [Response]: directBulkDeletion success ${data?.count || 0} properties`
      );
      toast.success(`Successfully deleted ${data.count} properties`);
      closeBulkDeletionConfirm();
      queryClient.invalidateQueries("allProperties");
    },
    onError: (error) => {
      log.error(`[usePropertyBulkDeletion] > [Error]: ${error.message}`);
      toast.error(error.message || "Failed to delete properties");
    },
  });

  // Analyze selected properties for status-based decisions
  const analyzeSelectedProperties = () => {
    const statusCounts = {
      available: 0,
      pending: 0,
      sold: 0,
      notAvailable: 0,
      testing: 0,
      incomplete: 0,
      other: 0,
    };

    selectedProperties.forEach((property) => {
      const status = property?.status;
      if (status === "Available") statusCounts.available++;
      else if (status === "Pending") statusCounts.pending++;
      else if (status === "Sold") statusCounts.sold++;
      else if (status === "Not Available") statusCounts.notAvailable++;
      else if (status === "Testing") statusCounts.testing++;
      else statusCounts.other++;
    });

    return statusCounts;
  };

  // Check if bulk deletion requires special status confirmation
  const requiresStatusConfirmation = () => {
    const statusCounts = analyzeSelectedProperties();
    return statusCounts.available > 0 || statusCounts.pending > 0;
  };

  // Check if all properties can be deleted directly
  const canDirectDelete = () => {
    const statusCounts = analyzeSelectedProperties();
    return statusCounts.available === 0 && statusCounts.pending === 0 && selectedProperties.length > 0;
  };

  // Start bulk deletion flow with permission check
  const openBulkDeletionConfirm = async (properties) => {
    log.info(
      `[usePropertyBulkDeletion] > [Action]: openBulkDeletionConfirm count=${properties?.length || 0}`
    );
    if (!properties || properties.length === 0) {
      toast.error("No properties selected");
      return;
    }

    setSelectedProperties(properties);
    setIsConfirmOpen(true);
    setCurrentStep(BULK_DELETION_STEPS.PERMISSION_CHECK);

    // Simulate loading for permission check
    setIsPermissionLoading(true);

    // Short delay to show loading spinner
    setTimeout(() => {
      setIsPermissionLoading(false);

      if (!check.canDeleteProperties) {
        // No permission - show request deletion flow
        setCurrentStep(BULK_DELETION_STEPS.REQUEST_DELETION);
      } else {
        // Has permission - proceed to initial confirmation
        setCurrentStep(BULK_DELETION_STEPS.INITIAL_CONFIRM);
      }
    }, 800);
  };

  // Handle initial confirmation (when user has delete permissions)
  const handleInitialConfirm = () => {
    if (selectedProperties.length === 0) return;

    if (canDirectDelete()) {
      // All properties are sold/unavailable/testing - proceed with deletion
      setCurrentStep(BULK_DELETION_STEPS.STATUS_CHECK);
    } else if (requiresStatusConfirmation()) {
      // Some properties are available/pending - show additional confirmation
      setCurrentStep(BULK_DELETION_STEPS.FINAL_CONFIRM);
    } else {
      // Fallback - show status check
      setCurrentStep(BULK_DELETION_STEPS.STATUS_CHECK);
    }
  };

  // Handle final bulk deletion execution
  const executeBulkPropertyDeletion = (reason = "") => {
    log.info(
      `[usePropertyBulkDeletion] > [Action]: executeBulkPropertyDeletion count=${selectedProperties.length}`
    );
    if (selectedProperties.length === 0) return;

    const propertyIds = selectedProperties.map((prop) => prop.id);

    if (check.canDeleteProperties) {
      // Use direct deletion for users with permissions
      directBulkDeletionMutation.mutate({
        propertyIds,
        reason,
      });
    } else {
      // Use request deletion for users without permissions
      bulkDeletionRequestMutation.mutate({
        propertyIds,
        reason,
      });
    }
  };

  // Close confirmation dialog and reset state
  const closeBulkDeletionConfirm = () => {
    setIsConfirmOpen(false);
    setSelectedProperties([]);
    setCurrentStep(BULK_DELETION_STEPS.PERMISSION_CHECK);
    setIsPermissionLoading(false);
  };

  // Navigate to specific step (for modal controls)
  const goToStep = (step) => {
    setCurrentStep(step);
  };

  return {
    // State
    isConfirmOpen,
    selectedProperties,
    currentStep,
    isPermissionLoading,
    isLoading: bulkDeletionRequestMutation.isLoading || directBulkDeletionMutation.isLoading,

    // Computed properties
    hasDeletePermission: check.canDeleteProperties,
    requiresStatusConfirmation: requiresStatusConfirmation(),
    canDirectDelete: canDirectDelete(),
    statusAnalysis: analyzeSelectedProperties(),

    // Actions
    openBulkDeletionConfirm,
    closeBulkDeletionConfirm,
    handleInitialConfirm,
    executeBulkPropertyDeletion,
    goToStep,

    // Constants
    BULK_DELETION_STEPS,
  };
};
