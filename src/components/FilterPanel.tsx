import { useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/api';
import { Filter, RotateCcw } from 'lucide-react';

export default function FilterPanel() {
  const { filters, filterOptions, setFilters, resetFilters, setFilterOptions } = useStore();

  useEffect(() => {
    api.getFilterOptions().then(setFilterOptions);
  }, [setFilterOptions]);

  const handleFilterChange = useCallback(
    (key: string, value: string | number | undefined) => {
      setFilters({ [key]: value });
    },
    [setFilters],
  );

  const costMin = filterOptions?.cost_range?.min ?? 0;
  const costMax = filterOptions?.cost_range?.max ?? 20;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-teal-700" />
        <h3 className="text-sm font-semibold text-zinc-800 tracking-wide">筛选条件</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">窗口</label>
          <select
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            value={filters.window_id || ''}
            onChange={(e) => handleFilterChange('window_id', e.target.value || undefined)}
          >
            <option value="">全部窗口</option>
            {filterOptions?.windows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">菜系</label>
          <select
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            value={filters.cuisine_type || ''}
            onChange={(e) => handleFilterChange('cuisine_type', e.target.value || undefined)}
          >
            <option value="">全部菜系</option>
            {filterOptions?.cuisines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">时段</label>
          <select
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            value={filters.time_period || ''}
            onChange={(e) => handleFilterChange('time_period', e.target.value || undefined)}
          >
            <option value="">全部时段</option>
            <option value="week">近一周</option>
            <option value="month">近一月</option>
            <option value="quarter">近一季</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">供应批次</label>
          <select
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            value={filters.supply_batch || ''}
            onChange={(e) => handleFilterChange('supply_batch', e.target.value || undefined)}
          >
            <option value="">全部批次</option>
            {filterOptions?.batches.slice(0, 20).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            成本区间: ¥{(filters.cost_min ?? costMin).toFixed(1)} - ¥{(filters.cost_max ?? costMax).toFixed(1)}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min={costMin}
              max={costMax}
              step={0.5}
              value={filters.cost_min ?? costMin}
              onChange={(e) => handleFilterChange('cost_min', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
            />
            <input
              type="range"
              min={costMin}
              max={costMax}
              step={0.5}
              value={filters.cost_max ?? costMax}
              onChange={(e) => handleFilterChange('cost_max', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
