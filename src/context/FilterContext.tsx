import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { FilterState, InventoryItem, Batch } from '../types';
import { mockInventory, mockBatches, mockSKUs, mockLocations } from '../data/mockData';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredInventory: InventoryItem[];
  filteredBatches: Batch[];
  selectedSKUId: string | null;
  setSelectedSKUId: (id: string | null) => void;
  selectedBatchId: string | null;
  setSelectedBatchId: (id: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  resetFilters: () => void;
  getFilterSummary: () => string;
}

const defaultFilters: FilterState = {
  skuIds: [],
  locationIds: [],
  supplierIds: [],
  batchIds: [],
  ageRange: null,
  timeWindow: '90d',
  dateRange: null,
  categories: [],
  zones: [],
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedSKUId, setSelectedSKUId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredInventory = useMemo(() => {
    let result = [...mockInventory];

    if (filters.skuIds.length > 0) {
      result = result.filter(item => filters.skuIds.includes(item.skuId));
    }

    if (filters.locationIds.length > 0) {
      result = result.filter(item => filters.locationIds.includes(item.locationId));
    }

    if (filters.supplierIds.length > 0) {
      result = result.filter(item => filters.supplierIds.includes(item.supplierId));
    }

    if (filters.batchIds.length > 0) {
      result = result.filter(item => filters.batchIds.includes(item.batchId));
    }

    if (filters.ageRange) {
      result = result.filter(item => item.ageDays >= filters.ageRange![0] && item.ageDays <= filters.ageRange![1]);
    }

    if (filters.categories.length > 0) {
      const skuIdsInCategory = mockSKUs.filter(s => filters.categories.includes(s.category)).map(s => s.id);
      result = result.filter(item => skuIdsInCategory.includes(item.skuId));
    }

    if (filters.zones.length > 0) {
      const locationIdsInZone = mockLocations.filter(l => filters.zones.includes(l.zone)).map(l => l.id);
      result = result.filter(item => locationIdsInZone.includes(item.locationId));
    }

    return result;
  }, [filters]);

  const filteredBatches = useMemo(() => {
    const invBatchIds = new Set(filteredInventory.map(i => i.batchId));
    return mockBatches.filter(b => invBatchIds.has(b.id));
  }, [filteredInventory]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSelectedSKUId(null);
    setSelectedBatchId(null);
  }, []);

  const getFilterSummary = useCallback(() => {
    const parts: string[] = [];
    if (filters.skuIds.length > 0) parts.push(`${filters.skuIds.length}个SKU`);
    if (filters.categories.length > 0) parts.push(`${filters.categories.length}个品类`);
    if (filters.supplierIds.length > 0) parts.push(`${filters.supplierIds.length}个供应商`);
    if (filters.locationIds.length > 0 || filters.zones.length > 0) parts.push(`仓位筛选`);
    if (filters.ageRange) parts.push(`库龄${filters.ageRange[0]}-${filters.ageRange[1]}天`);
    return parts.length > 0 ? parts.join(' · ') : '全部数据';
  }, [filters]);

  return (
    <FilterContext.Provider value={{
      filters,
      setFilters,
      filteredInventory,
      filteredBatches,
      selectedSKUId,
      setSelectedSKUId,
      selectedBatchId,
      setSelectedBatchId,
      isLoading,
      setIsLoading,
      resetFilters,
      getFilterSummary,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
