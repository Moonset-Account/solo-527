import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAppStore, DISTRICTS, LAYOUTS, SOURCES } from '@/store/appStore';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-workbench-border">
      <button
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-workbench-surface/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium text-workbench-text">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-workbench-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-workbench-text-muted" />
        )}
      </button>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
}

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  keyPrefix: string;
}

function MultiSelect({ options, selected, onChange, keyPrefix }: MultiSelectProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(option => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={`${keyPrefix}-${option}`}
            onClick={() => toggle(option)}
            className={`px-2 py-1 text-xs rounded transition-all ${
              isSelected
                ? 'bg-cyan-600 text-white'
                : 'bg-workbench-surface text-workbench-text-muted hover:bg-workbench-border'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  unit?: string;
}

function RangeSlider({ min, max, step = 1, value, onChange, unit = '' }: RangeSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-workbench-text-muted">
        <span>{value[0]}{unit}</span>
        <span>-</span>
        <span>{value[1]}{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={e => onChange([Number(e.target.value), value[1]])}
          className="flex-1 accent-cyan-500"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={e => onChange([value[0], Number(e.target.value)])}
          className="flex-1 accent-cyan-500"
        />
      </div>
    </div>
  );
}

export default function FilterPanel() {
  const {
    filterState,
    setFilterState,
    resetFilters,
    filteredRecords
  } = useAppStore();

  const anomalyCount = filteredRecords.filter(r => r.isAnomaly).length;
  const activeFilterCount =
    filterState.districts.length +
    filterState.layouts.length +
    filterState.sources.length +
    (filterState.excludeAnomaly ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-workbench-surface border-r border-workbench-border">
      <div className="p-4 border-b border-workbench-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-workbench-text">筛选条件</h3>
            {activeFilterCount > 0 && (
              <span className="bg-cyan-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-workbench-text-muted hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            重置
          </button>
        </div>
        <div className="text-xs text-workbench-text-muted">
          当前样本量: <span className="text-cyan-400 font-medium">{filteredRecords.length}</span>
          {anomalyCount > 0 && (
            <span className="ml-2 text-orange-400">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              异常: {anomalyCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <FilterSection title="区域">
          <MultiSelect
            options={DISTRICTS}
            selected={filterState.districts}
            onChange={values => setFilterState({ districts: values })}
            keyPrefix="district"
          />
        </FilterSection>

        <FilterSection title="户型">
          <MultiSelect
            options={LAYOUTS}
            selected={filterState.layouts}
            onChange={values => setFilterState({ layouts: values })}
            keyPrefix="layout"
          />
        </FilterSection>

        <FilterSection title="挂牌来源">
          <MultiSelect
            options={SOURCES}
            selected={filterState.sources}
            onChange={values => setFilterState({ sources: values })}
            keyPrefix="source"
          />
        </FilterSection>

        <FilterSection title="租金范围">
          <RangeSlider
            min={1000}
            max={30000}
            step={500}
            value={filterState.rentRange}
            onChange={value => setFilterState({ rentRange: value })}
            unit="元"
          />
        </FilterSection>

        <FilterSection title="面积范围">
          <RangeSlider
            min={20}
            max={200}
            step={5}
            value={filterState.areaRange}
            onChange={value => setFilterState({ areaRange: value })}
            unit="㎡"
          />
        </FilterSection>

        <FilterSection title="楼龄范围">
          <RangeSlider
            min={0}
            max={40}
            step={1}
            value={filterState.buildingAgeRange}
            onChange={value => setFilterState({ buildingAgeRange: value })}
            unit="年"
          />
        </FilterSection>

        <FilterSection title="地铁距离">
          <RangeSlider
            min={0}
            max={5000}
            step={100}
            value={filterState.subwayDistanceRange}
            onChange={value => setFilterState({ subwayDistanceRange: value })}
            unit="m"
          />
        </FilterSection>

        <FilterSection title="成交周期">
          <RangeSlider
            min={0}
            max={90}
            step={3}
            value={filterState.dealCycleRange}
            onChange={value => setFilterState({ dealCycleRange: value })}
            unit="天"
          />
        </FilterSection>

        <FilterSection title="数据质量">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterState.excludeAnomaly}
                onChange={e => setFilterState({ excludeAnomaly: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
              <span className="text-sm text-workbench-text">排除异常样本</span>
            </label>
            <div>
              <label className="text-xs text-workbench-text-muted block mb-1">
                IQR 异常阈值: {filterState.iqrThreshold}×
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.5}
                value={filterState.iqrThreshold}
                onChange={e => setFilterState({ iqrThreshold: Number(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </FilterSection>
      </div>

      {activeFilterCount > 0 && (
        <div className="p-3 border-t border-workbench-border">
          <div className="text-xs text-workbench-text-muted mb-2">已选条件:</div>
          <div className="flex flex-wrap gap-1">
            {filterState.districts.map(d => (
              <span key={d} className="bg-workbench-border text-workbench-text text-xs px-2 py-0.5 rounded flex items-center gap-1">
                {d}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-cyan-400"
                  onClick={() => setFilterState({ districts: filterState.districts.filter(x => x !== d) })}
                />
              </span>
            ))}
            {filterState.layouts.map(l => (
              <span key={l} className="bg-workbench-border text-workbench-text text-xs px-2 py-0.5 rounded flex items-center gap-1">
                {l}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-cyan-400"
                  onClick={() => setFilterState({ layouts: filterState.layouts.filter(x => x !== l) })}
                />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
