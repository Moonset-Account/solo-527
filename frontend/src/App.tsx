import React, { useEffect, useState, useCallback } from 'react';
import { FilterState, FloorHeatmapCell, ReworkTrendPoint, ShiftComparisonItem, CleanerPerformance, WorkOrderDetail, CleanerInfo } from './types';
import { useFilters } from './hooks/useFilters';
import {
  fetchFloorHeatmap, fetchReworkTrend, fetchShiftComparison,
  fetchWorkOrders, fetchCleanerPerformance, fetchCleaners,
  getWeeklyReportUrl,
} from './api';
import FilterBar from './components/FilterBar';
import FloorHeatmap from './components/FloorHeatmap';
import ReworkTrend from './components/ReworkTrend';
import ShiftComparison from './components/ShiftComparison';
import WorkOrderDrilldown from './components/WorkOrderDrilldown';
import CleanerPerformanceTable from './components/CleanerPerformanceTable';
import ReworkReasonPie from './components/ReworkReasonPie';
import './styles/global.css';

export default function App() {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [cleaners, setCleaners] = useState<CleanerInfo[]>([]);
  const [heatmap, setHeatmap] = useState<FloorHeatmapCell[]>([]);
  const [trend, setTrend] = useState<ReworkTrendPoint[]>([]);
  const [shiftData, setShiftData] = useState<ShiftComparisonItem[]>([]);
  const [performance, setPerformance] = useState<CleanerPerformance[]>([]);
  const [drilldownOrders, setDrilldownOrders] = useState<WorkOrderDetail[]>([]);
  const [drilldownTrigger, setDrilldownTrigger] = useState<FloorHeatmapCell | null>(null);
  const [showDrilldown, setShowDrilldown] = useState(false);

  useEffect(() => {
    fetchCleaners().then(setCleaners).catch(console.error);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [hm, tr, sh, perf] = await Promise.all([
        fetchFloorHeatmap(filters),
        fetchReworkTrend(filters),
        fetchShiftComparison(filters),
        fetchCleanerPerformance(filters),
      ]);
      setHeatmap(hm);
      setTrend(tr);
      setShiftData(sh);
      setPerformance(perf);
    } catch (e) {
      console.error(e);
    }
  }, [filters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRoomClick = useCallback(async (cell: FloorHeatmapCell) => {
    const drillFilters: FilterState = {
      ...filters,
      floor: cell.floor,
    };
    try {
      const orders = await fetchWorkOrders(drillFilters);
      const filtered = orders.filter((o: WorkOrderDetail) => o.room_number === cell.room_number);
      setDrilldownOrders(filtered.length > 0 ? filtered : orders);
      setDrilldownTrigger(cell);
      setShowDrilldown(true);
    } catch (e) {
      console.error(e);
    }
  }, [filters]);

  const handleExport = useCallback(() => {
    const url = getWeeklyReportUrl(filters);
    window.open(url, '_blank');
  }, [filters]);

  const kpiStats = (() => {
    const normalOrders = heatmap.filter(d => !d.is_late_checkout);
    const vipOrders = heatmap.filter(d => d.is_vip);
    const lateOrders = heatmap.filter(d => d.is_late_checkout);
    const avgNormal = normalOrders.length
      ? (normalOrders.reduce((s, d) => s + (d.avg_duration || 0), 0) / normalOrders.length).toFixed(1)
      : '-';
    const avgVip = vipOrders.length
      ? (vipOrders.reduce((s, d) => s + (d.avg_duration || 0), 0) / vipOrders.length).toFixed(1)
      : '-';
    const totalRework = heatmap.reduce((s, d) => s + d.rework_count, 0);
    const lateCount = lateOrders.length;
    return { avgNormal, avgVip, totalRework, lateCount };
  })();

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <div className="icon">🏨</div>
          <h1>酒店客房清洁效率看板</h1>
        </div>
      </header>

      <FilterBar
        filters={filters}
        cleaners={cleaners}
        onUpdate={updateFilter}
        onReset={resetFilters}
        onExport={handleExport}
      />

      <main className="main-content">
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">普通房平均清洁时长</span>
            <span className="kpi-value blue">{kpiStats.avgNormal}<small style={{ fontSize: 14 }}>min</small></span>
            <span className="kpi-sub">已排除延迟退房</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">VIP房平均清洁时长</span>
            <span className="kpi-value yellow">{kpiStats.avgVip}<small style={{ fontSize: 14 }}>min</small></span>
            <span className="kpi-sub">单独计算，独立排名</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">总返工次数</span>
            <span className="kpi-value red">{kpiStats.totalRework}</span>
            <span className="kpi-sub">查房后需返工的工单</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">延迟退房房间</span>
            <span className="kpi-value purple">{kpiStats.lateCount}</span>
            <span className="kpi-sub">不参与普通平均值计算</span>
          </div>
        </div>

        <div className="dashboard-row full">
          <div className="card">
            <div className="card-header">
              <h3>🗺️ 楼层热力图</h3>
              <span className="badge badge-normal">点击房间下钻明细</span>
            </div>
            <div className="card-body">
              <FloorHeatmap data={heatmap} onRoomClick={handleRoomClick} />
            </div>
          </div>
        </div>

        <div className="dashboard-row two-col">
          <div className="card">
            <div className="card-header">
              <h3>📈 返工率趋势</h3>
              <span className="badge badge-vip">VIP/普通分离</span>
            </div>
            <div className="card-body">
              <ReworkTrend data={trend} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3>🔍 返工原因分布</h3>
              <span className="badge badge-normal">用品缺失分析</span>
            </div>
            <div className="card-body">
              <ReworkReasonPie trendData={trend} />
            </div>
          </div>
        </div>

        <div className="dashboard-row full">
          <div className="card">
            <div className="card-header">
              <h3>⏰ 班次对比</h3>
              <span className="badge badge-vip">VIP/普通分离</span>
            </div>
            <div className="card-body">
              <ShiftComparison data={shiftData} />
            </div>
          </div>
        </div>

        <div className="dashboard-row full">
          <div className="card">
            <div className="card-header">
              <h3>🏆 保洁员绩效排名</h3>
              <span className="badge badge-vip">VIP/普通分离计算</span>
            </div>
            <div className="card-body">
              <CleanerPerformanceTable data={performance} />
            </div>
          </div>
        </div>

        {showDrilldown && (
          <div className="dashboard-row full">
            <WorkOrderDrilldown
              orders={drilldownOrders}
              cleaners={cleaners}
              triggeredBy={drilldownTrigger}
              onClose={() => setShowDrilldown(false)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
