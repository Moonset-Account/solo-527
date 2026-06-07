import { FilterBar } from '../components/FilterBar';
import { ReportExport } from '../components/ReportExport';
import { useFilterStore } from '../store';
import { useTrainingData, useRecoveryData, useStrengthData } from '../hooks/useData';
import { motion } from 'framer-motion';
import { FileText, Table, BarChart3, Calendar, Users, Activity } from 'lucide-react';

export function ReportsPage() {
  const filters = useFilterStore((s) => s.filters);
  const presets = useFilterStore((s) => s.presets);
  const { data: trainingData = [] } = useTrainingData();
  const { data: recoveryData = [] } = useRecoveryData();
  const { data: strengthData = [] } = useStrengthData();

  const summary = {
    trainingRecords: trainingData.length,
    recoveryRecords: recoveryData.length,
    strengthRecords: strengthData.length,
    totalLoad: trainingData.reduce((s, d) => s + d.loadScore, 0),
    avgRecovery: recoveryData.length > 0
      ? (recoveryData.reduce((s, d) => s + d.overallScore, 0) / recoveryData.length).toFixed(1)
      : 0,
    avgLoad: trainingData.length > 0
      ? Math.round(trainingData.reduce((s, d) => s + d.loadScore, 0) / trainingData.length)
      : 0,
  };

  return (
    <div>
      <FilterBar />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            报告中心
          </h1>
          <p className="text-slate-400 text-sm">
            生成并导出训练分析报告
          </p>
        </div>
        <ReportExport
          filters={filters}
          trainingData={trainingData}
          recoveryData={recoveryData}
          strengthData={strengthData}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-400/15 flex items-center justify-center text-brand-300">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">训练记录</p>
              <p className="font-mono text-xl font-semibold text-white">{summary.trainingRecords}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center text-success">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">总负荷量</p>
              <p className="font-mono text-xl font-semibold text-white">
                {summary.totalLoad.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center text-warning">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">力量测试</p>
              <p className="font-mono text-xl font-semibold text-white">{summary.strengthRecords}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center text-success">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">平均恢复分</p>
              <p className="font-mono text-xl font-semibold text-white">{summary.avgRecovery}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="section-title">报告摘要</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                日期范围
              </span>
              <span className="text-sm text-slate-200 font-mono">
                {filters.dateRange.start} ~ {filters.dateRange.end}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">时间窗口</span>
              <span className="text-sm text-slate-200">
                {filters.timeWindow === 'day' ? '按日' :
                 filters.timeWindow === 'week' ? '按周' :
                 filters.timeWindow === 'month' ? '按月' : '自定义'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">选中指标</span>
              <span className="text-sm text-slate-200">{filters.metrics.length} 个</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">数据条目总数</span>
              <span className="text-sm text-slate-200 font-mono">
                {summary.trainingRecords + summary.recoveryRecords + summary.strengthRecords}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title">已保存的筛选组合</h3>
          {presets.length > 0 ? (
            <div className="space-y-2">
              {presets.map((preset, idx) => (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface/50 hover:bg-surface-lighter/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-400/15 flex items-center justify-center text-brand-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{preset.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(preset.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-lighter flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400 mb-2">暂无保存的筛选组合</p>
              <p className="text-xs text-slate-500">
                在筛选器中点击"保存"按钮可保存当前筛选条件
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
