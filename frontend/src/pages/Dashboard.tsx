import { useState, useCallback, useEffect, useRef } from 'react';
import { Zap, Server, Activity, ClipboardList, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import EnergyTrendChart from '../components/EnergyTrendChart';
import EnergyBreakdownChart from '../components/EnergyBreakdownChart';
import AlarmList from '../components/AlarmList';
import WeekCompareChart from '../components/WeekCompareChart';
import AnomalyDetailModal from '../components/AnomalyDetailModal';
import GlobalFilterBar from '../components/GlobalFilterBar';
import { apiService } from '../services/api';
import { useFilterStore } from '../stores/filterStore';
import type { OverviewMetrics } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const { roomIds, weekType } = useFilterStore();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiService.getOverview(
        roomIds.length > 0 ? roomIds : undefined,
        weekType !== 'all' ? weekType : undefined
      );
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, [roomIds, weekType]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: '#0F172A',
        scale: 2,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`能耗看板报告_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div id="dashboard-content" ref={contentRef} className="p-6">
        <GlobalFilterBar />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="今日总能耗"
            value={metrics?.totalEnergy?.toFixed(1) || '0'}
            unit="kWh"
            trend={metrics?.comparedToYesterday}
            icon={<Zap className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="PUE值"
            value={metrics?.pue?.toFixed(2) || '0'}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="在线设备"
            value={metrics?.onlineDevices || '0'}
            unit="台"
            icon={<Server className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="待处理工单"
            value={metrics?.pendingWorkorders || '0'}
            unit="个"
            icon={<ClipboardList className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <EnergyTrendChart onAnomalyClick={setSelectedAnomalyId} />
          </div>
          <div className="lg:col-span-1">
            <AlarmList />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnergyBreakdownChart />
          <WeekCompareChart />
        </div>
      </div>

      <AnomalyDetailModal
        anomalyId={selectedAnomalyId}
        onClose={() => setSelectedAnomalyId(null)}
      />
    </div>
  );
}
