import { FilterBar } from '../components/FilterBar';
import { NoPermission } from '../components/EmptyStates';
import { useAuthStore, useFilterStore } from '../store';
import { useInjuryRecords, useAthletes } from '../hooks/useData';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Clock, Eye, FileText } from 'lucide-react';
import { useState } from 'react';

const SEVERITY_COLORS = {
  mild: 'bg-warning/15 text-warning border-warning/30',
  moderate: 'bg-warning/15 text-warning border-warning/30',
  severe: 'bg-danger/15 text-danger border-danger/30',
};

const SEVERITY_LABELS = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

const STATUS_COLORS = {
  active: 'bg-danger/10 text-danger',
  recovered: 'bg-success/10 text-success',
  chronic: 'bg-warning/10 text-warning',
};

const STATUS_LABELS = {
  active: '恢复中',
  recovered: '已康复',
  chronic: '慢性',
};

export function InjuryPage() {
  const isCoach = useAuthStore((s) => s.isCoach());
  const filters = useFilterStore((s) => s.filters);
  const { data: injuries = [] } = useInjuryRecords();
  const { data: athletes = [] } = useAthletes();
  const [selectedInjury, setSelectedInjury] = useState<string | null>(null);

  if (!isCoach) {
    return <NoPermission />;
  }

  const activeInjuries = injuries.filter((i) => i.status === 'active');
  const recoveredInjuries = injuries.filter((i) => i.status === 'recovered');

  const getAthleteName = (id: string) => {
    return athletes.find((a) => a.id === id)?.name || '未知队员';
  };

  return (
    <div>
      <FilterBar />

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          伤病管理
        </h1>
        <p className="text-slate-400 text-sm">
          记录和追踪队员伤病情况（仅教练组可见）
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <p className="text-sm text-slate-400 mb-1">进行中伤病</p>
          <p className="font-mono text-3xl font-semibold text-danger">{activeInjuries.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <p className="text-sm text-slate-400 mb-1">已康复</p>
          <p className="font-mono text-3xl font-semibold text-success">{recoveredInjuries.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <p className="text-sm text-slate-400 mb-1">总记录数</p>
          <p className="font-mono text-3xl font-semibold text-white">{injuries.length}</p>
        </motion.div>
      </div>

      <div className="glass-card p-5">
        <h3 className="section-title">伤病记录</h3>
        <div className="space-y-3">
          {injuries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              暂无伤病记录
            </div>
          ) : (
            injuries.map((injury, idx) => (
              <motion.div
                key={injury.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-surface/50 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedInjury(selectedInjury === injury.id ? null : injury.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      injury.severity === 'severe' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{injury.injuryType}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs ${SEVERITY_COLORS[injury.severity]} border`}>
                          {SEVERITY_LABELS[injury.severity]}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[injury.status]}`}>
                          {STATUS_LABELS[injury.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{getAthleteName(injury.athleteId)}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {injury.date}
                        </span>
                        {injury.returnDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            预计复出: {injury.returnDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Eye className={`w-4 h-4 text-slate-500 transition-transform ${
                    selectedInjury === injury.id ? 'rotate-180' : ''
                  }`} />
                </div>

                {selectedInjury === injury.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">症状描述</p>
                        <p className="text-sm text-slate-300">{injury.description}</p>
                      </div>
                      {injury.notes && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            教练备注
                          </p>
                          <p className="text-sm text-slate-300 bg-surface-lighter/50 p-3 rounded-lg">
                            {injury.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
