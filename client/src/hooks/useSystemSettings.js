import { useQuery } from 'react-query';
import { getSystemSettings } from '@/utils/api';
import { getLogger } from '@/utils/logger';

const log = getLogger('useSystemSettings');

export const useSystemSettings = () => {
  return useQuery('systemSettings', getSystemSettings, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    onSuccess(data) {
      log.info(
        `[useSystemSettings] > [Response]: ${data ? 'loaded' : 'empty'}`
      );
    },
    onError(error) {
      log.error(`[useSystemSettings] > [Error]: ${error.message}`);
    }
  });
};
