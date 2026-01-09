import { useQuery } from "react-query";
import { getAllUsers } from "../../utils/api";
import { getLogger } from "@/utils/logger";

const log = getLogger("useUsers");

const useUsers = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    "allUsers",
    getAllUsers,
    {
      refetchOnWindowFocus: false,
      onSuccess(result) {
        log.info(
          `[useUsers] > [Response]: received=${Array.isArray(result) ? result.length : 'unknown'}`
        );
      },
      onError(error) {
        log.error(`[useUsers] > [Error]: ${error.message}`);
      },
    }
  );

  return {
    data,
    isError,
    isLoading,
    refetch,
  };
};

export default useUsers;
