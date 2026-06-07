import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, RotateCcw, Calendar } from 'lucide-react';
import { useFilterStore } from '@/store';
import { HazardStatus, HazardLevel, Team, HazardType } from '@/types';
import { cn } from '@/utils';

interface FilterBarProps {
  teams: Team[];
  hazardTypes: HazardType[];
  floors: number[];
  onFilterChange?: () => void;
}

const statusOptions = [
  { value: HazardStatus.PENDING, label: '待整改' },
  { value: HazardStatus.IN_PROGRESS, label: '整改中' },
  { value: HazardStatus.UNDER_REVIEW, label: '复查中' },
  { value: HazardStatus.CLOSED, label: '已关闭' },
  { value: HazardStatus.REJECTED, label: '整改驳回' },
];

const levelOptions = [
  { value: HazardLevel.LOW, label: '一般' },
  { value: HazardLevel.MEDIUM, label: '较重' },
  { value: HazardLevel.HIGH, label: '严重' },
  { value: HazardLevel.CRITICAL, label: '特别严重' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  teams,
  hazardTypes,
  floors,
  onFilterChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const {
    criteria,
    setKeyword,
    toggleStatus,
    toggleLevel,
    toggleTeam,
    toggleType,
    toggleFloor,
    resetFilters,
  } = useFilterStore();

  const activeFiltersCount = [
    criteria.keyword ? 1 : 0,
    criteria.statuses?.length || 0,
    criteria.levels?.length || 0,
    criteria.teamIds?.length || 0,
    criteria.typeIds?.length || 0,
    criteria.floors?.length || 0,
    criteria.dateRange ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    onFilterChange?.();
  }, [criteria, onFilterChange]);

  const getFloorLabel = (floor: number) => {
    if (floor < 0) return `地下${Math.abs(floor)}层`;
    return `${floor}层`;
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索隐患编号、标题..."
                value={criteria.keyword || ''}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {criteria.keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  expanded
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                )}
              >
                <Filter className="h-4 w-4" />
                筛选
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置
                </button>
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  隐患状态
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        criteria.statuses?.includes(opt.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  隐患等级
                </label>
                <div className="flex flex-wrap gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleLevel(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        criteria.levels?.includes(opt.value)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  责任班组
                </label>
                <div className="flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => toggleTeam(team.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        criteria.teamIds?.includes(team.id)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在楼层
                </label>
                <div className="flex flex-wrap gap-2">
                  {floors.map((floor) => (
                    <button
                      key={floor}
                      onClick={() => toggleFloor(floor)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        criteria.floors?.includes(floor)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {getFloorLabel(floor)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                隐患类型
              </label>
              <div className="flex flex-wrap gap-2">
                {hazardTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                      criteria.typeIds?.includes(type.id)
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
