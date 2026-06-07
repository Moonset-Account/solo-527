import { useState } from "react";
import type { FilterOptions, FilterState } from "~/types";

interface FilterBarProps {
  options: FilterOptions;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export default function FilterBar({ options, filters, onFilterChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const handleMultiSelect = (
    key: keyof Pick<FilterState, "fieldIds" | "cropIds" | "pumpIds" | "strategyIds">,
    id: number
  ) => {
    const current = filters[key];
    const updated = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];
    onFilterChange({ [key]: updated });
  };

  const clearAll = () => {
    onFilterChange({
      fieldIds: [],
      cropIds: [],
      pumpIds: [],
      strategyIds: [],
      startDate: "",
      endDate: "",
    });
  };

  const activeFilterCount =
    filters.fieldIds.length +
    filters.cropIds.length +
    filters.pumpIds.length +
    filters.strategyIds.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">筛选视角</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {activeFilterCount} 个筛选条件
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              清除全部
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {expanded ? "收起" : "展开更多"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            📍 地块
          </label>
          <div className="flex flex-wrap gap-2">
            {options.fields.map((field) => (
              <button
                key={field.id}
                onClick={() => handleMultiSelect("fieldIds", field.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filters.fieldIds.includes(field.id)
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {field.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            🌾 作物
          </label>
          <div className="flex flex-wrap gap-2">
            {options.crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => handleMultiSelect("cropIds", crop.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filters.cropIds.includes(crop.id)
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {crop.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            🚰 泵站
          </label>
          <div className="flex flex-wrap gap-2">
            {options.pumps.map((pump) => (
              <button
                key={pump.id}
                onClick={() => handleMultiSelect("pumpIds", pump.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filters.pumpIds.includes(pump.id)
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {pump.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              📋 灌溉策略
            </label>
            <div className="flex flex-wrap gap-2">
              {options.strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => handleMultiSelect("strategyIds", strategy.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.strategyIds.includes(strategy.id)
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {strategy.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              📅 开始日期
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              📅 结束日期
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
