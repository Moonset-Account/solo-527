import React from 'react';
import { Filter, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';
import { RIVER_SECTIONS, SAMPLING_POINTS, SAMPLING_AGENCIES } from '@/data/mockData';
import { INDICATOR_STANDARDS } from '@/data/indicators';
import { getAvailableMonths, getMonthLabel, getPointsBySection } from '@/utils/dataProcessing';
import { IndicatorKey } from '@/types';

export const GlobalFilterBar: React.FC = () => {
  const {
    selectedSections,
    selectedPoints,
    selectedMonths,
    selectedIndicators,
    selectedAgencies,
    dateRange,
    setSelectedSections,
    setSelectedPoints,
    setSelectedMonths,
    setSelectedIndicators,
    setSelectedAgencies,
    setDateRange,
    resetFilters,
    getFilterSummary
  } = useFilterStore();

  const availableMonths = getAvailableMonths();

  const handleSectionChange = (sectionId: string) => {
    const newSections = selectedSections.includes(sectionId)
      ? selectedSections.filter(s => s !== sectionId)
      : [...selectedSections, sectionId];
    setSelectedSections(newSections);
    
    const relatedPoints = newSections.flatMap(s => getPointsBySection(s).map(p => p.id));
    const filteredPoints = selectedPoints.filter(p => relatedPoints.includes(p));
    if (newSections.length > 0) {
      setSelectedPoints(filteredPoints.length > 0 ? filteredPoints : relatedPoints);
    }
  };

  const handlePointChange = (pointId: string) => {
    const newPoints = selectedPoints.includes(pointId)
      ? selectedPoints.filter(p => p !== pointId)
      : [...selectedPoints, pointId];
    setSelectedPoints(newPoints);
  };

  const handleMonthChange = (month: string) => {
    const newMonths = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month];
    setSelectedMonths(newMonths);
  };

  const handleIndicatorChange = (indicator: IndicatorKey) => {
    const newIndicators = selectedIndicators.includes(indicator)
      ? selectedIndicators.filter(i => i !== indicator)
      : [...selectedIndicators, indicator];
    if (newIndicators.length > 0) {
      setSelectedIndicators(newIndicators);
    }
  };

  const handleAgencyChange = (agencyId: string) => {
    const newAgencies = selectedAgencies.includes(agencyId)
      ? selectedAgencies.filter(a => a !== agencyId)
      : [...selectedAgencies, agencyId];
    setSelectedAgencies(newAgencies);
  };

  const MultiSelectDropdown: React.FC<{
    label: string;
    options: { id: string; name: string }[];
    selected: string[];
    onChange: (id: string) => void;
  }> = ({ label, options, selected, onChange }) => (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm hover:border-zinc-400 transition-colors">
        <span className="text-zinc-700">{label}</span>
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className="text-zinc-500" />
      </button>
      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-64 overflow-y-auto">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center justify-between"
          >
            <span className="text-zinc-700">{opt.name}</span>
            {selected.includes(opt.id) && (
              <Check size={14} className="text-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white border-b border-zinc-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-zinc-600">
            <Filter size={16} />
            <span className="text-sm font-medium">筛选:</span>
          </div>
          
          <MultiSelectDropdown
            label="河段"
            options={RIVER_SECTIONS.map(s => ({ id: s.id, name: s.name }))}
            selected={selectedSections}
            onChange={handleSectionChange}
          />
          
          <MultiSelectDropdown
            label="采样点"
            options={SAMPLING_POINTS
              .filter(p => selectedSections.length === 0 || selectedSections.includes(p.sectionId))
              .map(p => ({ id: p.id, name: p.name }))}
            selected={selectedPoints}
            onChange={handlePointChange}
          />
          
          <MultiSelectDropdown
            label="月份"
            options={availableMonths.map(m => ({ id: m, name: getMonthLabel(m) }))}
            selected={selectedMonths}
            onChange={handleMonthChange}
          />
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm hover:border-zinc-400 transition-colors">
              <span className="text-zinc-700">指标</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {selectedIndicators.length}
              </span>
              <ChevronDown size={14} className="text-zinc-500" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {(Object.keys(INDICATOR_STANDARDS) as IndicatorKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => handleIndicatorChange(key)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center justify-between"
                >
                  <span className="text-zinc-700">{INDICATOR_STANDARDS[key].name}</span>
                  {selectedIndicators.includes(key) && (
                    <Check size={14} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <MultiSelectDropdown
            label="采样机构"
            options={SAMPLING_AGENCIES.map(a => ({ id: a.id, name: a.name }))}
            selected={selectedAgencies}
            onChange={handleAgencyChange}
          />
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-2 py-1.5 border border-zinc-300 rounded text-sm text-zinc-700"
            />
            <span className="text-zinc-400 text-sm">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-2 py-1.5 border border-zinc-300 rounded text-sm text-zinc-700"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{getFilterSummary()}</span>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <RotateCcw size={14} />
            重置
          </button>
        </div>
      </div>
    </div>
  );
};
