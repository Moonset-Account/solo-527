import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Users,
  Building2,
  Radio,
  Layers,
  Box,
  Filter,
  X,
  ChevronDown,
  RotateCcw,
  Beaker,
  Leaf,
} from 'lucide-react';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { filterOptions } from '../data/mockData';
import clsx from 'clsx';

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon,
  options,
  selected,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all',
          selected.length > 0
            ? 'bg-primary-50 border-primary-200 text-primary-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        )}
      >
        {icon}
        <span className="font-medium">
          {selected.length > 0 ? `${label} (${selected.length})` : label}
        </span>
        <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterBar: React.FC = () => {
  const { filters, dateRange, setFilters, setDateRange, resetFilters } = useAnalyticsStore();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasActiveFilters =
    filters.users.length > 0 ||
    filters.teams.length > 0 ||
    filters.channels.length > 0 ||
    filters.versions.length > 0 ||
    filters.modules.length > 0 ||
    filters.trafficType !== 'all';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-800">筛选条件</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置筛选
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {dateRange.start} ~ {dateRange.end}
            </span>
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="flex gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <FilterDropdown
          label="用户"
          icon={<Users className="w-4 h-4" />}
          options={filterOptions.users}
          selected={filters.users}
          onChange={(values) => setFilters({ users: values })}
        />

        <FilterDropdown
          label="团队"
          icon={<Building2 className="w-4 h-4" />}
          options={filterOptions.teams}
          selected={filters.teams}
          onChange={(values) => setFilters({ teams: values })}
        />

        <FilterDropdown
          label="渠道"
          icon={<Radio className="w-4 h-4" />}
          options={filterOptions.channels}
          selected={filters.channels}
          onChange={(values) => setFilters({ channels: values })}
        />

        <FilterDropdown
          label="版本"
          icon={<Layers className="w-4 h-4" />}
          options={filterOptions.versions}
          selected={filters.versions}
          onChange={(values) => setFilters({ versions: values })}
        />

        <FilterDropdown
          label="功能模块"
          icon={<Box className="w-4 h-4" />}
          options={filterOptions.modules}
          selected={filters.modules}
          onChange={(values) => setFilters({ modules: values })}
        />

        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg">
          <button
            onClick={() => setFilters({ trafficType: 'all' })}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded-md transition-all',
              filters.trafficType === 'all'
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            全部
          </button>
          <button
            onClick={() => setFilters({ trafficType: 'experiment' })}
            className={clsx(
              'flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all',
              filters.trafficType === 'experiment'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Beaker className="w-3 h-3" />
            实验组
          </button>
          <button
            onClick={() => setFilters({ trafficType: 'organic' })}
            className={clsx(
              'flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all',
              filters.trafficType === 'organic'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Leaf className="w-3 h-3" />
            自然流量
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">已选:</span>
          {filters.trafficType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
              {filters.trafficType === 'experiment' ? '实验组' : '自然流量'}
              <X
                className="w-3 h-3 cursor-pointer hover:text-gray-800"
                onClick={() => setFilters({ trafficType: 'all' })}
              />
            </span>
          )}
          {[...filters.users, ...filters.teams, ...filters.channels, ...filters.versions, ...filters.modules].slice(
            0,
            5
          ).map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs"
            >
              {item}
            </span>
          ))}
          {[...filters.users, ...filters.teams, ...filters.channels, ...filters.versions, ...filters.modules]
            .length > 5 && (
            <span className="text-xs text-gray-500">
              +{[...filters.users, ...filters.teams, ...filters.channels, ...filters.versions, ...filters.modules]
                .length - 5} 更多
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
