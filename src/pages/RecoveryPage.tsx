import { FilterBar } from '../components/FilterBar';
import { RecoveryChart } from '../components/ChartsVictory';
import { useRecoveryData } from '../hooks/useData';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, Heart, Smile, Activity, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../components/EmptyStates';

export function RecoveryPage() {
  const { data: recoveryData = [], isLoading } = useRecoveryData();

  const stats = useMemo(() => {
    const avgSleep = recoveryData.length > 0
      ? recoveryData.filter((d) => d.sleepScore).reduce((s, d) => s + (d.sleepScore || 0), 0) /
        (recoveryData.filter((d) => d.sleepScore).length || 1)
      : 0;
    const avgHrv = recoveryData.length > 0
      ? recoveryData.filter((d) => d.hrv).reduce((s, d) => s + (d.hrv || 0), 0) /
        (recoveryData.filter((d) => d.hrv).length || 1)
      : 0;
    const avgSoreness = recoveryData.length > 0
      ? recoveryData.filter((d) => d.sorenessScore).reduce((s, d) => s + (d.sorenessScore || 0), 0) /
        (recoveryData.filter((d) => d.sorenessScore).length || 1)
      : 0;
    const avgMood = recoveryData.length > 0
      ? recoveryData.filter((d) => d.moodScore).reduce((s, d) => s + (d.moodScore || 0), 0) /
        (recoveryData.filter((d) => d.moodScore).length || 1)
      : 0;
    const avgOverall = recoveryData.length > 0
      ? recoveryData.reduce((s, d) => s + d.overallScore, 0) / recoveryData.length
      : 0;

    return { avgSleep, avgHrv, avgSoreness, avgMood, avgOverall };
  }, [recoveryData]);

  const warnings = useMemo(() => {
    return recoveryData
      .filter((d) => d.overallScore < 50)
      .slice(0, 5)
      .map((d) => ({
        date: d.date,
        score: d.overallScore,
        reason: d.sorenessScore && d.sorenessScore > 6 ? '酸痛评分过高' :
                d.sleepScore && d.sleepScore < 60 ? '睡眠质量较差' :
                '综合恢复不足',
      }));
  }, [recoveryData]);

  if (recoveryData.length === 0 && !isLoading) {
    return (
      <div>
        <FilterBar />
        <EmptyState title="暂无恢复数据" />
      </div>
    );
  }

  return (
    <div>
      <FilterBar />

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          恢复监测
        </h1>
        <p className="text-slate-400 text-sm">
          监控恢复状态，预防过度训练
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-brand-300 mb-2">
            <Moon className="w-4 h-4" />
            <span className="text-sm">睡眠评分</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-white">
            {Math.round(stats.avgSleep)}
            <span className="text-sm text-slate-400 font-normal ml-1">分</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-brand-300 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-sm">HRV</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-white">
            {Math.round(stats.avgHrv)}
            <span className="text-sm text-slate-400 font-normal ml-1">ms</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-warning mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">酸痛评分</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-white">
            {stats.avgSoreness.toFixed(1)}
            <span className="text-sm text-slate-400 font-normal ml-1">/10</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 text-success mb-2">
            <Smile className="w-4 h-4" />
            <span className="text-sm">情绪评分</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-white">
            {stats.avgMood.toFixed(1)}
            <span className="text-sm text-slate-400 font-normal ml-1">/10</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              stats.avgOverall >= 70 ? 'bg-success' :
              stats.avgOverall >= 50 ? 'bg-warning' : 'bg-danger'
            }`} />
            <span className="text-sm text-slate-300">综合恢复</span>
          </div>
          <p className={`font-mono text-2xl font-semibold ${
            stats.avgOverall >= 70 ? 'text-success' :
            stats.avgOverall >= 50 ? 'text-warning' : 'text-danger'
          }`}>
            {Math.round(stats.avgOverall)}
            <span className="text-sm text-slate-400 font-normal ml-1">分</span>
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="section-title">恢复趋势</h3>
          <RecoveryChart recoveryData={recoveryData} />
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            恢复预警
          </h3>
          {warnings.length > 0 ? (
            <div className="space-y-3">
              {warnings.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg bg-warning/10 border border-warning/20"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{w.date}</span>
                    <span className="text-xs font-mono text-danger">{w.score}分</span>
                  </div>
                  <p className="text-xs text-slate-400">{w.reason}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-success" />
              </div>
              <p className="text-sm text-slate-400">恢复状态良好，无预警</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
