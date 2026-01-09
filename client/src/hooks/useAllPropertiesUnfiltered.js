import { useMemo } from "react";
import { useQuery } from "react-query";
import { getAllProperties } from "@/utils/api";
import { sortPropertiesWithPendingLast } from "@/utils/propertySorting";
import { getLogger } from "@/utils/logger";

const log = getLogger("useAllPropertiesUnfiltered");

const useAllPropertiesUnfiltered = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allPropertiesUnfiltered",
    getAllProperties,
    {
      refetchOnWindowFocus: false,
      onSuccess: (result) => {
        log.info(
          `[useAllPropertiesUnfiltered] > [Response]: received=${Array.isArray(result) ? result.length : 'unknown'}`
        );
      },
      onError: (error) => {
        log.error(`[useAllPropertiesUnfiltered] > [Error]: ${error.message}`);
      },
    }
  );

  // Apply sorting to ensure Pending properties appear last
  const sortedData = useMemo(() => {
    log.info("[useAllPropertiesUnfiltered] > [Computed]: sorting properties");
    return sortPropertiesWithPendingLast(data);
  }, [data]);

  return {
    data: sortedData,
    isError,
    isLoading,
    refetch,
  };
};

export default useAllPropertiesUnfiltered;
