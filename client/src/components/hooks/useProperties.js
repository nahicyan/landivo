import { useMemo } from "react";
import { useQuery } from "react-query";
import { getAllProperties } from "../../utils/api";
import { usePermissions } from "@/components/Auth0/PermissionsContext";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { shouldFilterByStatus, filterPropertiesByStatus } from "@/utils/propertyFilters";

const useProperties = () => {
  const { data: rawData, isLoading, isError, refetch } = useQuery(
    "allProperties",
    getAllProperties,
    { refetchOnWindowFocus: false }
  );

  const { permissions } = usePermissions();
  const { data: settings } = useSystemSettings();

  // Apply status-based filtering
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return rawData;
    
    const filterFlags = shouldFilterByStatus(permissions, settings);
    return filterPropertiesByStatus(rawData, filterFlags);
  }, [rawData, settings, permissions]);

  return {
    data,
    isError,
    isLoading,
    refetch,
  };
};

export default useProperties;