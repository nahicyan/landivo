import { useMemo } from "react";
import { useQuery } from "react-query";
import { getAllProperties } from "@/utils/api";
import { sortPropertiesWithPendingLast } from "@/utils/propertySorting";

const useAllPropertiesUnfiltered = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allPropertiesUnfiltered",
    getAllProperties,
    { refetchOnWindowFocus: false }
  );

  // Apply sorting to ensure Pending properties appear last
  const sortedData = useMemo(() => {
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