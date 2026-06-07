import { FilterBar } from '../components/FilterBar';
import { WorkloadChart } from '../components/ChartsVictory';
import { useFilterStore, useAuthStore } from '../store';
import { useTrainingData, useRecoveryData } from '../hooks/useData';
import { motion } from 'framer-motion';
import { EmptyState } from '../components/EmptyStates';

export function WorkloadPage() {
  const filters = useFilterStore((s) => s.filters);
  const user = useAuthStore((s) => s.user);
  const { data: trainingData = [], isLoading } = useTrainingData();
  const { data: recoveryData = [] } = useRecoveryData();

  const avgLoadBySession = trainingData.reduce((acc: Record<string, { total: number; count: number }>, d) => {
    if (!acc[d.sessionType]) {
      acc[d.sessionType] = { total: 0, count: 0 };
    }
    acc[d.sessionType].total += d.loadScore;
    acc[d.sessionType].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const sessionTypes = Object.entries(avgLoadBySession).map(([type, data]) => ({
    type,
    avg: Math.round(data.total / data.count),
    count: data.count,
  })).sort((a, b) => b.avg - a.avg);

  if (trainingData.length === 0 && !isLoading) {
    return (
      <div>
        <FilterBar />
        <EmptyState title="暂无训练负荷数据" />
      </div>
    );
  }

  return (
    <div>
      <FilterBar />

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          负荷分析
        </h1>
        <p className="text-slate-400 text-sm">
          深入分析训练负荷分布与强度变化
        </p>
      </div>

      <div className="glass-card p-5 mb-6">
        <h3 className="section-title">负荷曲线详情</h3>
        <WorkloadChart trainingData={trainingData} filters={filters} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sessionTypes.map((s, idx) => (
          <motion.div
            key={s.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card card-hover p-5"
          >
            <p className="text-sm text-slate-400 mb-1">{s.type}</p>
            <p className="font-mono text-3xl font-semibold text-white">
              {s.avg}
              <span className="text-sm text-slate-400 ml-1 font-normal">分/次</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">共 {s.count} 次训练</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title">负荷分布明细</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">日期</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">训练类型</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">时长</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">平均心率</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">负荷评分</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">RPE</th>
              </tr>
            </thead>
            <tbody>
              {trainingData.slice(0, 20).map((d, i) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-slate-300">{d.date}</td>
                  <td className="py-3 px-4 text-slate-300">{d.sessionType}</td>
                  <td className="py-3 px-4 text-right text-slate-300 font-mono">{d.durationMin}min</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {d.avgHeartRate ? (
                      <span className={d.avgHeartRate > 160 ? 'text-danger' : 'text-slate-300'}>
                        {d.avgHeartRate} bpm
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-brand-300">{d.loadScore}</td>
                  <td className="py-3 px-4 text-right">
                    {d.rpe ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        d.rpe >= 8 ? 'bg-danger/20 text-danger' :
                        d.rpe >= 6 ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      }`}>
                        {d.rpe}/10
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {trainingData.length > 20 && (
          <p className="text-xs text-slate-500 text-center mt-4">
            显示前 20 条记录，共 {trainingData.length} 条
          </p>
        )}
      </div>
    </div>
  );
}
