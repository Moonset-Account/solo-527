import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  TrendingUp,
  Download,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  ChartCard,
  ClosureRateTrendChart,
  OverdueRankingChart,
  FloorHeatmapChart,
  TeamTrendChart,
} from '@/components/Charts';
import { FilterBar } from '@/components/FilterBar';
import { useFilterStore } from '@/store';
import { dashboardApi, masterDataApi, exportApi } from '@/services/api';
import type {
  DashboardStats,
  ClosureRateTrendItem,
  OverdueRankingItem,
  FloorHeatmapItem,
  TeamTrendItem,
  Team,
  HazardType,
} from '@/types';
import { formatCurrency } from '@/utils';
import { saveAs } from 'file-saver';

const DashboardPage: React.FC = () => {
  const { criteria, toggleTeam } = useFilterStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [closureTrend, setClosureTrend] = useState<ClosureRateTrendItem[]>([]);
  const [overdueRanking, setOverdueRanking] = useState<OverdueRankingItem[]>([]);
  const [floorHeatmap, setFloorHeatmap] = useState<FloorHeatmapItem[]>([]);
  const [teamTrend, setTeamTrend] = useState<TeamTrendItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hazardTypes, setHazardTypes] = useState<HazardType[]>([]);
  const [floors, setFloors] = useState<number[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        trendRes,
        rankingRes,
        heatmapRes,
        teamTrendRes,
        teamsRes,
        typesRes,
        floorsRes,
      ] = await Promise.all([
        dashboardApi.getStats(criteria),
        dashboardApi.getClosureRateTrend(14, criteria),
        dashboardApi.getOverdueRanking(5, criteria),
        dashboardApi.getFloorHeatmap(criteria),
        dashboardApi.getTeamTrend(7, criteria),
        masterDataApi.getTeams(),
        masterDataApi.getHazardTypes(),
        masterDataApi.getFloors(),
      ]);
      setStats(statsRes);
      setClosureTrend(trendRes);
      setOverdueRanking(rankingRes);
      setFloorHeatmap(heatmapRes);
      setTeamTrend(teamTrendRes);
      setTeams(teamsRes);
      setHazardTypes(typesRes);
      setFloors(floorsRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [criteria]);

  const handleExport = async () => {
    try {
      const blob = await exportApi.exportHazards(criteria);
      saveAs(blob, `隐患数据_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleBarClick = (teamId: string) => {
    toggleTeam(teamId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-6 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar
        teams={teams}
        hazardTypes={hazardTypes}
        floors={floors}
        onFilterChange={loadData}
      />

      <div className="px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
            <p className="text-gray-500 mt-1">实时监控隐患整改进度与闭环情况</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <StatCard
            title="总隐患数"
            value={stats?.total || 0}
            suffix="项"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="待整改"
            value={stats?.pending || 0}
            suffix="项"
            icon={<Clock className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="整改中"
            value={stats?.inProgress || 0}
            suffix="项"
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="复查中"
            value={stats?.underReview || 0}
            suffix="项"
            icon={<Eye className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="已关闭"
            value={stats?.closed || 0}
            suffix="项"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="已逾期"
            value={stats?.overdue || 0}
            suffix="项"
            icon={<XCircle className="w-6 h-6" />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <StatCard
            title="整改闭环率"
            value={stats?.closureRate || 0}
            suffix="%"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="green"
            className="col-span-2"
          />
          <StatCard
            title="逾期率"
            value={stats?.overdueRate || 0}
            suffix="%"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
            className="col-span-2"
          />
          <StatCard
            title="已确认罚款"
            value={stats?.totalConfirmedFine || 0}
            isCurrency
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
            className="col-span-1"
          />
          <StatCard
            title="待确认罚款"
            value={stats?.totalPendingFine || 0}
            isCurrency
            icon={<DollarSign className="w-6 h-6" />}
            color="orange"
            className="col-span-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ChartCard
            title="整改闭环率趋势"
            subtitle="近14天闭环率变化情况"
            action={
              <span className="text-2xl font-bold text-green-600">
                {stats?.closureRate || 0}%
              </span>
            }
          >
            <ClosureRateTrendChart data={closureTrend} />
          </ChartCard>

          <ChartCard
            title="逾期隐患排行"
            subtitle="各班组逾期隐患数量排名"
            action={
              <span className="text-sm text-gray-500">
                点击筛选对应班组
              </span>
            }
          >
            <OverdueRankingChart data={overdueRanking} onBarClick={handleBarClick} />
          </ChartCard>

          <ChartCard
            title="楼层隐患热力图"
            subtitle="各楼层隐患分布情况"
          >
            <FloorHeatmapChart data={floorHeatmap} />
          </ChartCard>

          <ChartCard
            title="班组整改趋势"
            subtitle="各班组近7天整改完成情况"
          >
            <TeamTrendChart data={teamTrend} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
