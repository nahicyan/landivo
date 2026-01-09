import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { getAllProperties } from "../../utils/api";
import { usePermissions } from "@/components/Auth0/PermissionsContext";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { shouldFilterByStatus, filterPropertiesByStatus } from "@/utils/propertyFilters";
import { sortPropertiesWithPendingLast } from "@/utils/propertySorting";
import { getLogger } from "@/utils/logger";

const log = getLogger("useProperties");

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
    const filteredData = filterPropertiesByStatus(rawData, filterFlags);
    return sortPropertiesWithPendingLast(filteredData);
  }, [rawData, settings, permissions]);

  useEffect(() => {
    log.info(
      `[useProperties] > [Response]: rawDataCount=${
        Array.isArray(rawData) ? rawData.length : rawData ? "<non-array>" : "<none>"
      }`
    );
  }, [rawData]);

  useEffect(() => {
    log.info(
      `[useProperties] > [Computed]: filteredDataCount=${
        Array.isArray(data) ? data.length : data ? "<non-array>" : "<none>"
      }`
    );
  }, [data]);

  return {
    data,
    isError,
    isLoading,
    refetch,
  };
};

export default useProperties;
