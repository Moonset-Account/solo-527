import { useState } from 'react';
import { X, Save, Trash2, Filter, Bookmark } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          <span className={selected.length > 0 ? 'text-gray-800' : 'text-gray-500'}>
            {selected.length > 0 ? `已选 ${selected.length} 项` : '全部'}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${
                  selected.includes(option) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => {}}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FilterPanel() {
  const {
    filters,
    setFilters,
    filterOptions,
    savedFilters,
    saveCurrentFilter,
    applySavedFilter,
    deleteSavedFilter,
    loadAllDashboardData,
  } = useDashboardStore();

  const [savingFilter, setSavingFilter] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSaveFilter = async () => {
    if (filterName.trim()) {
      await saveCurrentFilter(filterName.trim());
      setFilterName('');
      setSavingFilter(false);
    }
  };

  const applyAndRefresh = (filter: typeof savedFilters[0]) => {
    applySavedFilter(filter);
    setTimeout(() => loadAllDashboardData(), 100);
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          筛选条件
        </h3>
        <button
          onClick={() => {
            setFilters({
              collections: [],
              readerGroups: [],
              subjects: [],
              branches: [],
              months: [],
              timeWindow: filters.timeWindow,
            });
            loadAllDashboardData();
          }}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          重置
        </button>
      </div>

      <MultiSelect
        label="馆藏类型"
        options={filterOptions.collections}
        selected={filters.collections}
        onChange={(v) => setFilters({ collections: v })}
      />

      <MultiSelect
        label="读者分组"
        options={filterOptions.readerGroups}
        selected={filters.readerGroups}
        onChange={(v) => setFilters({ readerGroups: v })}
      />

      <MultiSelect
        label="主题分类"
        options={filterOptions.subjects}
        selected={filters.subjects}
        onChange={(v) => setFilters({ subjects: v })}
      />

      <MultiSelect
        label="所属分馆"
        options={filterOptions.branches}
        selected={filters.branches}
        onChange={(v) => setFilters({ branches: v })}
      />

      <MultiSelect
        label="月份"
        options={filterOptions.months}
        selected={filters.months}
        onChange={(v) => setFilters({ months: v })}
      />

      <button
        onClick={() => loadAllDashboardData()}
        className="w-full py-2 mt-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        应用筛选
      </button>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            保存的筛选
          </h4>
          <button
            onClick={() => setSavingFilter(true)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            + 保存当前
          </button>
        </div>

        {savingFilter && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="输入筛选名称"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveFilter}
                className="flex-1 px-2 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
              >
                保存
              </button>
              <button
                onClick={() => setSavingFilter(false)}
                className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {savedFilters.map((sf) => (
            <div
              key={sf.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <button
                onClick={() => applyAndRefresh(sf)}
                className="text-sm text-gray-700 hover:text-primary-600 text-left flex-1 truncate"
              >
                {sf.name}
              </button>
              <button
                onClick={() => deleteSavedFilter(sf.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-danger-600 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-3 bg-primary-50 rounded-lg">
        <p className="text-xs text-primary-700">
          <span className="font-semibold">样本量提示：</span>
          <br />
          当前筛选条件覆盖约 3,000 条借阅记录
        </p>
      </div>
    </div>
  );
}
