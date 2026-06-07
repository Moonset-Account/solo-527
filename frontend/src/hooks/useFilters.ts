import { useState, useCallback } from 'react';
import { FilterState } from '../types';
import dayjs from 'dayjs';

const defaultFilters: FilterState = {
  start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  end_date: dayjs().format('YYYY-MM-DD'),
  floor: null,
  shift: null,
  is_vip: null,
  is_late_checkout: null,
  cleaner_id: null,
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return { filters, updateFilter, resetFilters };
}
