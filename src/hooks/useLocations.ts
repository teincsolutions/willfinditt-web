import { useQuery } from '@tanstack/react-query';
import {
  getCountries,
  getStates,
  getCities,
  searchLocations,
} from '@/services/location.service';

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useStates = (countryId: string | undefined) => {
  return useQuery({
    queryKey: ['states', countryId],
    queryFn: () => getStates(countryId!),
    enabled: !!countryId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useCities = (stateId: string | undefined) => {
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: () => getCities(stateId!),
    enabled: !!stateId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useLocationSearch = (query: string) => {
  return useQuery({
    queryKey: ['location-search', query],
    queryFn: () => searchLocations(query),
    enabled: query.length > 2,
  });
};
