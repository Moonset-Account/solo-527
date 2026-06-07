'use client';

import { X, RefreshCw } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';
import { windows, departments, pharmacists } from '@/data/mockData';
import type { PrescriptionType, TimePeriod } from '@/types';
import { cn } from '@/utils/formatters';

const prescriptionTypes: { value: PrescriptionType; label: string }[] = [
  { value: 'emergency', label: '急诊处方' },
  { value: 'normal', label: '普通处方' },
  { value: 'specialist', label: '专科处方' },
];

const timePeriods: { value: TimePeriod; label: string }[] = [
  { value: 'morning', label: '早高峰(6-9)' },
  { value: 'noon', label: '上午(9-12)' },
  { value: 'afternoon', label: '午间(12-14)' },
  { value: 'evening', label: '下午(14-17)' },
  { value: 'night', label: '夜间(17-22)' },
];

export default function FilterPanel() {
  const {
    dateRange,
    windows: selectedWindows,
    pharmacists: selectedPharmacists,
    departments: selectedDepartments,
    prescriptionTypes: selectedTypes,
    timePeriods: selectedPeriods,
    setDateRange,
    setWindows,
    setPharmacists,
    setDepartments,
    setPrescriptionTypes,
    setTimePeriods,
    resetFilters,
  } = useFilterStore();

  const toggleItem = <T,>(list: T[], item: T, setter: (list: T[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const hasActiveFilters =
    selectedWindows.length > 0 ||
    selectedPharmacists.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedTypes.length > 0 ||
    selectedPeriods.length > 0;

  return (
    <div className="bg-white rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">筛选条件</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            重置筛选
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">日期范围</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(e.target.value, dateRange.end)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(dateRange.start, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            取药窗口
            {selectedWindows.length > 0 && (
              <span className="ml-1 text-xs text-primary-500">({selectedWindows.length})</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {windows.map((w) => {
              const isSelected = selectedWindows.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => toggleItem(selectedWindows, w.id, setWindows)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg transition-all',
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {w.windowNo}号窗
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            处方类型
            {selectedTypes.length > 0 && (
              <span className="ml-1 text-xs text-primary-500">({selectedTypes.length})</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {prescriptionTypes.map((t) => {
              const isSelected = selectedTypes.includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => toggleItem(selectedTypes, t.value, setPrescriptionTypes)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg transition-all',
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            时段
            {selectedPeriods.length > 0 && (
              <span className="ml-1 text-xs text-primary-500">({selectedPeriods.length})</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {timePeriods.map((p) => {
              const isSelected = selectedPeriods.includes(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => toggleItem(selectedPeriods, p.value, setTimePeriods)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg transition-all',
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            科室
            {selectedDepartments.length > 0 && (
              <span className="ml-1 text-xs text-primary-500">({selectedDepartments.length})</span>
            )}
          </label>
          <select
            multiple
            className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={selectedDepartments}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              setDepartments(selected);
            }}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.deptName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            药师
            {selectedPharmacists.length > 0 && (
              <span className="ml-1 text-xs text-primary-500">({selectedPharmacists.length})</span>
            )}
          </label>
          <select
            multiple
            className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={selectedPharmacists}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              setPharmacists(selected);
            }}
          >
            {pharmacists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.title})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
