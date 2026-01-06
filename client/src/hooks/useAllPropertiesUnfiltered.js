import { useQuery } from "react-query";
import { getAllProperties } from "@/utils/api";

const useAllPropertiesUnfiltered = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allPropertiesUnfiltered",
    getAllProperties,
    { refetchOnWindowFocus: false }
  );

  return {
    data,
    isError,
    isLoading,
    refetch,
  };
};

export default useAllPropertiesUnfiltered;