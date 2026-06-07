'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  KPIData,
  WaitDistributionItem,
  WindowCompareItem,
  HourlyPrescriptionItem,
  SankeyData,
  FilterState,
  Prescription,
  PharmacistCompareItem,
  DepartmentCompareItem,
} from '@/types';
import type { DrillDownFilter } from '@/store/useFilterStore';
import type { WindowHeatmapData } from '@/components/map/PharmacyHeatmap';

interface OverviewData {
  kpi: KPIData;
  waitDistribution: WaitDistributionItem[];
  windowCompare: WindowCompareItem[];
  hourlyPrescriptions: HourlyPrescriptionItem[];
  sankeyData: SankeyData;
  pharmacistCompare: PharmacistCompareItem[];
  departmentCompare: DepartmentCompareItem[];
  totalCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    source: string;
    queryTime: string;
    [key: string]: any;
  };
  error?: string;
}

interface DetailsResponse {
  records: Prescription[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function fetchApi<T>(
  endpoint: string,
  body: Record<string, any>
): Promise<ApiResponse<T>> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function useAnalytics(filters: FilterState, drillDown: DrillDownFilter = {}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ApiResponse<OverviewData>['metadata']>(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<OverviewData>('/api/analytics/overview', {
        filters,
        drillDown,
      });
      if (res.success) {
        setData(res.data);
        setMetadata(res.metadata);
      } else {
        setError(res.error || 'Failed to load data');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [filters, drillDown]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, metadata, refetch: loadData };
}

export function useHeatmap(filters: FilterState, drillDown: DrillDownFilter = {}) {
  const [data, setData] = useState<WindowHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ApiResponse<WindowHeatmapData[]>['metadata']>(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<WindowHeatmapData[]>('/api/analytics/heatmap', {
        filters,
        drillDown,
      });
      if (res.success) {
        setData(res.data);
        setMetadata(res.metadata);
      } else {
        setError(res.error || 'Failed to load heatmap data');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [filters, drillDown]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, metadata, refetch: loadData };
}

export function useDetails(
  filters: FilterState,
  drillDown: DrillDownFilter = {},
  page: number = 1,
  pageSize: number = 50,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const [data, setData] = useState<DetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ApiResponse<DetailsResponse>['metadata']>(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<DetailsResponse>('/api/analytics/details', {
        filters,
        drillDown,
        page,
        pageSize,
        sortBy,
        sortOrder,
      });
      if (res.success) {
        setData(res.data);
        setMetadata(res.metadata);
      } else {
        setError(res.error || 'Failed to load details');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [filters, drillDown, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, metadata, refetch: loadData };
}
