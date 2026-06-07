import { useState } from 'react';
import { Filter, ChevronDown, Save, RotateCcw, Users, Calendar, Activity, Target, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilterStore, useAuthStore } from '../store';
import { useAthletes, useSports, useExercises } from '../hooks/useData';
import type { FilterState } from '@shared/types';

const TIME_WINDOWS: { value: FilterState['timeWindow']; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'custom', label: '自定义' },
];

const METRICS = [
  { value: 'loadScore', label: '训练负荷' },
  { value: 'avgHeartRate', label: '平均心率' },
  { value: 'distanceKm', label: '距离' },
  { value: 'paceKmPerH', label: '配速' },
  { value: 'durationMin', label: '时长' },
];

export function FilterBar() {
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const filters = useFilterStore((s) => s.filters);
  const presets = useFilterStore((s) => s.presets);
  const {
    setAthletes,
    setSports,
    setDateRange,
    setTimeWindow,
    setExercises,
    setMetrics,
    savePreset,
    loadPreset,
    deletePreset,
    resetFilters,
  } = useFilterStore();
  const isCoach = useAuthStore((s) => s.isCoach());

  const { data: athletes = [] } = useAthletes(
    filters.sports.length === 1 ? filters.sports[0] : undefined
  );
  const { data: sports = [] } = useSports();
  const { data: exercises = [] } = useExercises();

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim());
      setPresetName('');
      setShowPresetModal(false);
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-brand-300">
          <Filter className="w-5 h-5" />
          <span className="font-display font-medium">筛选器</span>
        </div>

        {isCoach && (
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-400 mb-1 block">队员</label>
            <MultiSelect
              placeholder="选择队员"
              options={athletes.map((a) => ({ value: a.id, label: a.name }))}
              value={filters.athleteIds}
              onChange={setAthletes}
              icon={<Users className="w-4 h-4" />}
            />
          </div>
        )}

        {isCoach && (
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-slate-400 mb-1 block">项目</label>
            <MultiSelect
              placeholder="选择项目"
              options={sports.map((s) => ({ value: s, label: s }))}
              value={filters.sports}
              onChange={setSports}
              icon={<Activity className="w-4 h-4" />}
            />
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 mb-1 block">日期范围</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setDateRange(e.target.value, filters.dateRange.end)}
              className="input-base flex-1 text-sm"
            />
            <span className="text-slate-500">至</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setDateRange(filters.dateRange.start, e.target.value)}
              className="input-base flex-1 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">时间窗口</label>
          <div className="flex gap-1 bg-surface/50 rounded-lg p-1">
            {TIME_WINDOWS.map((w) => (
              <button
                key={w.value}
                onClick={() => setTimeWindow(w.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  filters.timeWindow === w.value
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-surface-lightest'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="text-xs text-slate-400 mb-1 block">动作</label>
          <MultiSelect
            placeholder="选择动作"
            options={exercises.map((e) => ({ value: e, label: e }))}
            value={filters.exercises}
            onChange={setExercises}
            icon={<Target className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowPresetModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
          <button
            onClick={resetFilters}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="重置筛选"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-slate-400 mb-2 block">指标</label>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.value}
              onClick={() => {
                const newMetrics = filters.metrics.includes(m.value)
                  ? filters.metrics.filter((x) => x !== m.value)
                  : [...filters.metrics, m.value];
                if (newMetrics.length > 0) {
                  setMetrics(newMetrics);
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filters.metrics.includes(m.value)
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-400/30'
                  : 'bg-surface/50 text-slate-400 border border-transparent hover:border-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showPresetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowPresetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-semibold text-white mb-4">
                筛选组合管理
              </h3>

              <div className="mb-4">
                <label className="text-xs text-slate-400 mb-1 block">保存当前筛选为</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="输入组合名称..."
                    className="input-base flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                  />
                  <button onClick={handleSavePreset} className="btn-primary">
                    保存
                  </button>
                </div>
              </div>

              {presets.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">已保存的组合</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-3 bg-surface/50 rounded-lg"
                      >
                        <span className="text-sm text-slate-200">{preset.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              loadPreset(preset.id);
                              setShowPresetModal(false);
                            }}
                            className="p-1.5 text-brand-300 hover:bg-brand-500/20 rounded-lg transition-colors"
                            title="加载"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePreset(preset.id)}
                            className="p-1.5 text-danger hover:bg-danger/20 rounded-lg transition-colors"
                            title="删除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MultiSelectProps {
  placeholder: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  icon?: React.ReactNode;
}

function MultiSelect({ placeholder, options, value, onChange, icon }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const displayText = value.length > 0
    ? options.find((o) => o.value === value[0])?.label + (value.length > 1 ? ` +${value.length - 1}` : '')
    : placeholder;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input-base flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className={value.length > 0 ? 'text-slate-200' : 'text-slate-500'}>
            {displayText}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-surface-lighter border border-white/10 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto scrollbar-thin"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 hover:bg-surface-lightest ${
                    value.includes(opt.value) ? 'text-brand-300' : 'text-slate-300'
                  }`}
                >
                  <Check className={`w-4 h-4 ${value.includes(opt.value) ? 'opacity-100' : 'opacity-0'}`} />
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
