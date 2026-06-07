import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/apiClient';
import type { MonitoringSite, Measurement, OverviewStats, QualityCheckResult, TrendPoint } from '../types';

interface UseDataOptions<T> {
  autoFetch?: boolean;
  onSuccess?: (data: T) => void;
}

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  options: UseDataOptions<T> = { autoFetch: true }
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      options.onSuccess?.(result);
    } catch (e: any) {
      setError(e.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, options]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      refetch();
    }
  }, deps);

  return { data, loading, error, refetch };
}

export function useOverview() {
  return useData<OverviewStats>(async () => {
    const result = await api.overview.get();
    if (!result.success) throw new Error(result.error || '获取总览数据失败');
    return result.data!;
  });
}

export function useSites() {
  return useData<MonitoringSite[]>(async () => {
    const result = await api.sites.list();
    if (!result.success) throw new Error(result.error || '获取采样点失败');
    return result.data!;
  });
}

interface UseMeasurementsParams {
  limit?: number;
  onlyAnomalies?: boolean;
}

export function useMeasurements(params: UseMeasurementsParams = {}) {
  const { limit = 100, onlyAnomalies = false } = params;
  
  return useData<{ data: Measurement[]; total: number }>(async () => {
    const result = await api.measurements.list({ limit, onlyAnomalies });
    if (!result.success) throw new Error(result.error || '获取监测数据失败');
    return { data: result.data!, total: result.total! };
  }, [limit, onlyAnomalies]);
}

interface UseTrendParams {
  indicator?: string;
  dataSource?: 'manual' | 'automatic';
  siteId?: string;
}

export function useTrend(params: UseTrendParams = {}) {
  const { indicator = 'dissolvedOxygen', dataSource = 'manual', siteId } = params;
  
  return useData<TrendPoint[]>(async () => {
    const result = await api.measurements.trend({ indicator, dataSource, siteId });
    if (!result.success) throw new Error(result.error || '获取趋势数据失败');
    return result.data!;
  }, [indicator, dataSource, siteId]);
}

export function useQualityCheck() {
  return useData<QualityCheckResult>(async () => {
    const result = await api.quality.check();
    if (!result.success) throw new Error(result.error || '获取质量检查数据失败');
    return result.data!;
  });
}

export function useAnomalies(limit: number = 50) {
  return useData<{ data: Measurement[]; total: number }>(async () => {
    const result = await api.anomalies.list({ limit });
    if (!result.success) throw new Error(result.error || '获取异常数据失败');
    return { data: result.data!, total: result.total! };
  }, [limit]);
}

export { useData };
