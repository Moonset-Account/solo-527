import { useMemo, useState } from 'react';
import { Activity, Heart, Zap, Clock, TrendingUp, Target } from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { MetricCard } from '../components/MetricCard';
import { WorkloadChart, RecoveryChart } from '../components/ChartsVictory';
import { RadarChart, CompareBarChart, ExerciseCompareChart } from '../components/ChartsECharts';
import { ReportExport } from '../components/ReportExport';
import { useFilterStore, useAuthStore } from '../store';
import {
  useTrainingData,
  useRecoveryData,
  useStrengthData,
  useAthletes,
  useRadarData,
} from '../hooks/useData';
import { EmptyState } from '../components/EmptyStates';

export function DashboardPage() {
  const filters = useFilterStore((s) => s.filters);
  const user = useAuthStore((s) => s.user);
  const isCoach = useAuthStore((s) => s.isCoach());

  const { data: trainingData = [], isLoading: trainingLoading } = useTrainingData();
  const { data: recoveryData = [], isLoading: recoveryLoading } = useRecoveryData();
  const { data: strengthData = [], isLoading: strengthLoading } = useStrengthData();
  const { data: athletes = [] } = useAthletes();

  const selectedAthleteId = filters.athleteIds.length > 0
    ? filters.athleteIds[0]
    : user?.athleteId || (athletes[0]?.id ?? '');

  const { data: radarData = [] } = useRadarData(selectedAthleteId);

  const summary = useMemo(() => {
    const totalLoad = trainingData.reduce((sum, d) => sum + d.loadScore, 0);
    const avgLoad = trainingData.length > 0 ? totalLoad / trainingData.length : 0;
    const avgHr = trainingData.filter((d) => d.avgHeartRate).length > 0
      ? trainingData.filter((d) => d.avgHeartRate).reduce((sum, d) => sum + (d.avgHeartRate || 0), 0) /
        trainingData.filter((d) => d.avgHeartRate).length
      : 0;
    const avgRecovery = recoveryData.length > 0
      ? recoveryData.reduce((sum, d) => sum + d.overallScore, 0) / recoveryData.length
      : 0;
    const totalDuration = trainingData.reduce((sum, d) => sum + d.durationMin, 0);
    const maxLoad = trainingData.length > 0 ? Math.max(...trainingData.map((d) => d.loadScore)) : 0;

    return { totalLoad, avgLoad, avgHr, avgRecovery, totalDuration, maxLoad };
  }, [trainingData, recoveryData]);

  const selectedAthleteName = useMemo(() => {
    if (filters.athleteIds.length > 0) {
      const athlete = athletes.find((a) => a.id === filters.athleteIds[0]);
      return athlete?.name || '';
    }
    if (user?.athleteId) {
      const athlete = athletes.find((a) => a.id === user.athleteId);
      return athlete?.name || '';
    }
    return athletes[0]?.name || '';
  }, [filters.athleteIds, athletes, user?.athleteId]);

  if (!isCoach && trainingData.length === 0 && !trainingLoading) {
    return (
      <div>
        <FilterBar />
        <EmptyState
          title="暂无训练数据"
          description="您的训练数据尚未同步，请稍后再试或联系教练。"
          icon="database"
        />
      </div>
    );
  }

  return (
    <div>
      <FilterBar />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            训练负荷概览
          </h1>
          <p className="text-slate-400 text-sm">
            {filters.dateRange.start} 至 {filters.dateRange.end}
            {selectedAthleteName && ` · ${selectedAthleteName}`}
          </p>
        </div>
        <ReportExport
          filters={filters}
          trainingData={trainingData}
          recoveryData={recoveryData}
          strengthData={strengthData}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="总训练负荷"
          value={Math.round(summary.totalLoad).toLocaleString()}
          unit="分"
          icon={<Activity className="w-5 h-5" />}
          trend={12.5}
          trendLabel="较上周"
          sampleSize={trainingData.length}
          delay={0}
        />
        <MetricCard
          title="平均心率"
          value={Math.round(summary.avgHr)}
          unit="bpm"
          icon={<Heart className="w-5 h-5" />}
          trend={-3.2}
          trendLabel="较上周"
          delay={1}
        />
        <MetricCard
          title="峰值负荷"
          value={summary.maxLoad}
          unit="分"
          icon={<Zap className="w-5 h-5" />}
          delay={2}
        />
        <MetricCard
          title="训练时长"
          value={Math.round(summary.totalDuration / 60)}
          unit="小时"
          icon={<Clock className="w-5 h-5" />}
          trend={8.3}
          trendLabel="较上周"
          delay={3}
        />
        <MetricCard
          title="平均恢复分"
          value={Math.round(summary.avgRecovery)}
          unit="分"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={summary.avgRecovery > 70 ? 5.1 : -2.3}
          trendLabel="较上周"
          sampleSize={recoveryData.length}
          delay={4}
        />
        <MetricCard
          title="训练次数"
          value={trainingData.length}
          unit="次"
          icon={<Target className="w-5 h-5" />}
          delay={5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="section-title">训练负荷趋势</h3>
          <WorkloadChart
            trainingData={trainingData}
            filters={filters}
            isLoading={trainingLoading}
          />
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">
            能力雷达图
            {selectedAthleteName && (
              <span className="text-sm text-slate-400 font-normal ml-2">
                {selectedAthleteName}
              </span>
            )}
          </h3>
          <RadarChart
            data={radarData}
            athleteName={selectedAthleteName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <h3 className="section-title">恢复评分趋势</h3>
          <RecoveryChart
            recoveryData={recoveryData}
            isLoading={recoveryLoading}
          />
          <p className="text-xs text-slate-500 mt-2 text-center">
            虚线表示健康阈值 (60分)，低于此值建议调整训练强度
          </p>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">队员训练量对比</h3>
          {isCoach ? (
            <CompareBarChart
              strengthData={strengthData}
              athletes={athletes}
              isLoading={strengthLoading}
            />
          ) : (
            <ExerciseCompareChart
              strengthData={strengthData}
              isLoading={strengthLoading}
            />
          )}
        </div>
      </div>

      {isCoach && (
        <div className="glass-card p-5">
          <h3 className="section-title">动作力量分布</h3>
          <ExerciseCompareChart
            strengthData={strengthData}
            isLoading={strengthLoading}
          />
        </div>
      )}
    </div>
  );
}
