import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useFilterStore, useAuthStore } from '../store';

export function useAthletes(sport?: string) {
  return useQuery({
    queryKey: ['athletes', sport],
    queryFn: () => api.getAthletes(sport),
    staleTime: 60 * 60 * 1000,
  });
}

export function useTrainingData() {
  const filters = useFilterStore((s) => s.filters);
  const user = useAuthStore((s) => s.user);
  
  const effectiveFilters = { ...filters };
  if (user?.role === 'athlete' && user.athleteId) {
    effectiveFilters.athleteIds = [user.athleteId];
  }
  
  return useQuery({
    queryKey: ['training', effectiveFilters],
    queryFn: () => api.getTraining(effectiveFilters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStrengthData() {
  const filters = useFilterStore((s) => s.filters);
  const user = useAuthStore((s) => s.user);
  
  const effectiveFilters = { ...filters };
  if (user?.role === 'athlete' && user.athleteId) {
    effectiveFilters.athleteIds = [user.athleteId];
  }
  
  return useQuery({
    queryKey: ['strength', effectiveFilters],
    queryFn: () => api.getStrength(effectiveFilters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecoveryData() {
  const filters = useFilterStore((s) => s.filters);
  const user = useAuthStore((s) => s.user);
  
  const effectiveFilters = { ...filters };
  if (user?.role === 'athlete' && user.athleteId) {
    effectiveFilters.athleteIds = [user.athleteId];
  }
  
  return useQuery({
    queryKey: ['recovery', effectiveFilters],
    queryFn: () => api.getRecovery(effectiveFilters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInjuryRecords() {
  const filters = useFilterStore((s) => s.filters);
  const isCoach = useAuthStore((s) => s.isCoach());
  
  return useQuery({
    queryKey: ['injuries', filters],
    queryFn: () => api.getInjuries(filters),
    enabled: isCoach,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRadarData(athleteId: string) {
  return useQuery({
    queryKey: ['radar', athleteId],
    queryFn: () => api.getRadar(athleteId),
    staleTime: 30 * 60 * 1000,
  });
}

export function useDataQuality() {
  const filters = useFilterStore((s) => s.filters);
  return useQuery({
    queryKey: ['data-quality', filters],
    queryFn: () => api.getDataQuality(filters),
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useSports() {
  return useQuery({
    queryKey: ['sports'],
    queryFn: () => api.getSports(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: () => api.getExercises(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useRefreshData() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['training'] });
    queryClient.invalidateQueries({ queryKey: ['strength'] });
    queryClient.invalidateQueries({ queryKey: ['recovery'] });
    queryClient.invalidateQueries({ queryKey: ['injuries'] });
    queryClient.invalidateQueries({ queryKey: ['data-quality'] });
    return api.triggerEtl();
  };
}
