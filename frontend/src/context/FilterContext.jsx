import React, { createContext, useContext, useState, useCallback } from 'react';
import dayjs from 'dayjs';

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    floor_id: null,
    area_id: null,
    seat_type: null,
    user_group_id: null
  });

  const [drillDown, setDrillDown] = useState(null);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
      floor_id: null,
      area_id: null,
      seat_type: null,
      user_group_id: null
    });
    setDrillDown(null);
  }, []);

  const handleDrillDown = useCallback((dimension, id) => {
    setDrillDown({ dimension, id });
    if (dimension === 'floor') {
      updateFilter('floor_id', id);
    } else if (dimension === 'area') {
      updateFilter('area_id', id);
    } else if (dimension === 'user_group') {
      updateFilter('user_group_id', id);
    }
  }, [updateFilter]);

  const getActiveFilters = useCallback(() => {
    return Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '');
  }, [filters]);

  const value = {
    filters,
    drillDown,
    updateFilter,
    updateFilters,
    resetFilters,
    handleDrillDown,
    getActiveFilters
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
