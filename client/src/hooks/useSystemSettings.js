import { useQuery } from 'react-query';
import { getSystemSettings } from '@/utils/api';

export const useSystemSettings = () => {
  return useQuery('systemSettings', getSystemSettings, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });
};