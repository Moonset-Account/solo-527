import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FilterParams } from '@shared/types';

interface FilterContextType {
  filters: FilterParams;
  setFilters: (filters: FilterParams) => void;
  updateFilters: (partial: Partial<FilterParams>) => void;
  resetFilters: () => void;
  applyAnomalyFilters: (context: Partial<FilterParams>) => void;
}

const defaultFilters: FilterParams = {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
};

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterParams>(defaultFilters);

  const updateFilters = useCallback((partial: Partial<FilterParams>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const applyAnomalyFilters = useCallback((context: Partial<FilterParams>) => {
    setFilters((prev) => ({ ...prev, ...context }));
  }, []);

  return (
    <FilterContext.Provider
      value={{ filters, setFilters, updateFilters, resetFilters, applyAnomalyFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
}
