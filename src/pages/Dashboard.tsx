import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Calendar } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useFilterStore } from '@/store/filterStore';
import FilterPanel from '@/components/FilterPanel';
import MapView from '@/components/MapView';
import PeakForecast from '@/components/PeakForecast';
import AlertList from '@/components/AlertList';
import DispatchComparison from '@/components/DispatchComparison';
import DetailPanel from '@/components/DetailPanel';
import ExportMenu from '@/components/ExportMenu';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import SampleSizeHint from '@/components/SampleSizeHint';

export default function Dashboard() {
  const { loadData, refreshFilters, isLoading, isDataLoaded, sampleSize } = useDataStore();
  const filterState = useFilterStore();
  const [detailOpen, setDetailOpen] = useState(true);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isDataLoaded) {
      refreshFilters();
    }
  }, [
    isDataLoaded,
    refreshFilters,
    filterState.stationIds,
    filterState.timePeriod,
    filterState.vehicleStatus,
    filterState.dispatchStatus,
    filterState.weatherConditions,
  ]);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const dateRange = `${weekStart.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="flex h-screen bg-[#1a1d23] text-white overflow-hidden">
      <div className="w-64 flex-shrink-0">
        <FilterPanel />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={20} className="text-[#00e5c7]" />
            <h1 className="text-lg font-semibold">共享单车调度分析</h1>
            <span className="flex items-center gap-1.5 text-sm text-white/40">
              <Calendar size={14} />
              {dateRange}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu targetId="dashboard-content" />
            <Link
              to="/report"
              className="text-sm text-[#00e5c7] hover:underline"
            >
              周报
            </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 p-6 space-y-4">
            <LoadingSkeleton type="map" />
            <LoadingSkeleton type="chart" />
            <LoadingSkeleton type="table" />
          </div>
        ) : !isDataLoaded ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState title="暂无数据" description="请稍后再试或重置筛选条件" />
          </div>
        ) : (
          <div id="dashboard-content" className="flex-1 overflow-y-auto p-6 space-y-4">
            <SampleSizeHint sampleSize={sampleSize} />

            <div className="flex gap-4">
              <div className="flex-[3] bg-[#22252d] rounded-lg p-4">
                <MapView />
              </div>
              <div className="flex-[2] bg-[#22252d] rounded-lg p-4">
                <AlertList />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-[3] bg-[#22252d] rounded-lg p-4">
                <PeakForecast />
              </div>
              <div className="flex-[2] bg-[#22252d] rounded-lg p-4">
                <DispatchComparison />
              </div>
            </div>

            <div className="bg-[#22252d] rounded-lg">
              <button
                onClick={() => setDetailOpen(!detailOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-white/5 transition-colors rounded-lg"
              >
                <span>详细数据</span>
                <span className="text-white/40">{detailOpen ? '收起' : '展开'}</span>
              </button>
              {detailOpen && (
                <div className="px-4 pb-4">
                  <DetailPanel />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
