import { FilterBar } from '../components/FilterBar';
import { CompareBarChart, ExerciseCompareChart, RadarChart } from '../components/ChartsECharts';
import { useFilterStore, useAuthStore } from '../store';
import { useAthletes, useStrengthData, useRadarData } from '../hooks/useData';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Target } from 'lucide-react';

export function ComparePage() {
  const filters = useFilterStore((s) => s.filters);
  const isCoach = useAuthStore((s) => s.isCoach());
  const { data: athletes = [] } = useAthletes();
  const { data: strengthData = [] } = useStrengthData();

  const [compareMode, setCompareMode] = useState<'athletes' | 'exercises'>('athletes');

  const displayAthletes = filters.athleteIds.length > 0
    ? athletes.filter((a) => filters.athleteIds.includes(a.id))
    : athletes.slice(0, 4);

  return (
    <div>
      <FilterBar />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            对比分析
          </h1>
          <p className="text-slate-400 text-sm">
            横向对比队员表现与训练数据
          </p>
        </div>

        <div className="flex gap-1 bg-surface/50 rounded-lg p-1">
          <button
            onClick={() => setCompareMode('athletes')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${
              compareMode === 'athletes'
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            队员对比
          </button>
          <button
            onClick={() => setCompareMode('exercises')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${
              compareMode === 'exercises'
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            动作对比
          </button>
        </div>
      </div>

      {compareMode === 'athletes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card p-5">
            <h3 className="section-title">力量训练总量对比</h3>
            <CompareBarChart
              strengthData={strengthData}
              athletes={athletes}
            />
          </div>
          <div className="glass-card p-5">
            <h3 className="section-title">能力雷达对比</h3>
            <div className="grid grid-cols-2 gap-4">
              {displayAthletes.slice(0, 2).map((athlete, idx) => (
                <RadarChartWrapper key={athlete.id} athleteId={athlete.id} name={athlete.name} delay={idx} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-5 mb-6">
          <h3 className="section-title">动作力量水平对比</h3>
          <ExerciseCompareChart strengthData={strengthData} />
        </div>
      )}

      {isCoach && (
        <div className="glass-card p-5">
          <h3 className="section-title">队员能力对比</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayAthletes.map((athlete, idx) => (
              <motion.div
                key={athlete.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-4"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold mb-3">
                  {athlete.name.charAt(0)}
                </div>
                <h4 className="font-medium text-white mb-1">{athlete.name}</h4>
                <p className="text-xs text-slate-400 mb-3">{athlete.sport} · {athlete.position || '队员'}</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>训练次数: {strengthData.filter((d) => d.athleteId === athlete.id).length}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RadarChartWrapper({ athleteId, name, delay }: { athleteId: string; name: string; delay: number }) {
  const { data: radarData = [] } = useRadarData(athleteId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay * 0.2 }}
    >
      <p className="text-sm text-slate-300 mb-2 text-center font-medium">{name}</p>
      <RadarChart data={radarData} />
    </motion.div>
  );
}
