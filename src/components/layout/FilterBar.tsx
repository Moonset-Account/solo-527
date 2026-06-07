import { useState } from 'react';
import {
  Calendar,
  Building2,
  Briefcase,
  UserCircle,
  Radio,
  GitBranch,
  CircleDot,
  X,
  RotateCcw,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../utils/format';
import { cn } from '../../lib/utils';
import { StageType, CandidateStatus } from '../../data/types';
import { STAGE_NAMES } from '../../data/mockData';

interface FilterOption {
  id: string;
  label: string;
}

function MultiSelect({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string;
  icon: any;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all hover:border-slate-300',
          open && 'border-blue-500 ring-2 ring-blue-500/20'
        )}
      >
        <Icon size={16} className="text-slate-400" />
        <span className={cn(selected.length > 0 ? 'text-slate-700' : 'text-slate-400')}>
          {selected.length > 0 ? `${label} (${selected.length})` : placeholder}
        </span>
        <ChevronDown size={14} className={cn('ml-auto text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            {options.map(opt => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleOption(opt.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FilterBar() {
  const {
    filters,
    departments,
    positions,
    recruiters,
    channels,
    setDateRange,
    setDepartments,
    setPositions,
    setRecruiters,
    setChannels,
    setStages,
    setStatus,
    resetFilters,
  } = useStore();

  const [showMore, setShowMore] = useState(false);

  const departmentOptions = departments.map(d => ({ id: d.id, label: d.name }));
  const positionOptions = positions.map(p => ({ id: p.id, label: p.name }));
  const recruiterOptions = recruiters.map(r => ({ id: r.id, label: r.name }));
  const channelOptions = channels.map(c => ({ id: c.id, label: c.name }));
  const stageOptions = Object.entries(STAGE_NAMES).map(([id, label]) => ({ id, label }));
  const statusOptions: FilterOption[] = [
    { id: 'in_progress', label: '进行中' },
    { id: 'hired', label: '已入职' },
    { id: 'rejected', label: '已拒绝' },
    { id: 'offer_declined', label: 'Offer拒绝' },
  ];

  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.positions.length > 0 ||
    filters.recruiters.length > 0 ||
    filters.channels.length > 0 ||
    filters.stages.length > 0 ||
    filters.status.length > 0;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={formatDate(filters.dateRange[0])}
              onChange={(e) => setDateRange([new Date(e.target.value), filters.dateRange[1]])}
              className="bg-transparent text-sm text-slate-700 outline-none"
            />
            <span className="text-slate-400">至</span>
            <input
              type="date"
              value={formatDate(filters.dateRange[1])}
              onChange={(e) => setDateRange([filters.dateRange[0], new Date(e.target.value)])}
              className="bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>

          <MultiSelect
            label="部门"
            icon={Building2}
            options={departmentOptions}
            selected={filters.departments}
            onChange={setDepartments}
            placeholder="选择部门"
          />

          <MultiSelect
            label="职位"
            icon={Briefcase}
            options={positionOptions}
            selected={filters.positions}
            onChange={setPositions}
            placeholder="选择职位"
          />

          <MultiSelect
            label="招聘官"
            icon={UserCircle}
            options={recruiterOptions}
            selected={filters.recruiters}
            onChange={setRecruiters}
            placeholder="选择招聘官"
          />

          <button
            onClick={() => setShowMore(!showMore)}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Filter size={16} />
            更多筛选
            <ChevronDown size={14} className={cn('transition-transform', showMore && 'rotate-180')} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <RotateCcw size={14} />
              重置筛选
            </button>
          )}
        </div>
      </div>

      {showMore && (
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <MultiSelect
            label="渠道"
            icon={Radio}
            options={channelOptions}
            selected={filters.channels}
            onChange={setChannels}
            placeholder="选择渠道"
          />

          <MultiSelect
            label="阶段"
            icon={GitBranch}
            options={stageOptions}
            selected={filters.stages as string[]}
            onChange={(v) => setStages(v as StageType[])}
            placeholder="选择阶段"
          />

          <MultiSelect
            label="状态"
            icon={CircleDot}
            options={statusOptions}
            selected={filters.status}
            onChange={(v) => setStatus(v as CandidateStatus[])}
            placeholder="选择状态"
          />
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-2">
          <span className="text-xs text-slate-500">已选筛选:</span>
          {filters.departments.map(id => {
            const dept = departments.find(d => d.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {dept?.name}
                <X size={12} className="cursor-pointer" onClick={() => setDepartments(filters.departments.filter(d => d !== id))} />
              </span>
            );
          })}
          {filters.positions.map(id => {
            const pos = positions.find(p => p.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                {pos?.name}
                <X size={12} className="cursor-pointer" onClick={() => setPositions(filters.positions.filter(p => p !== id))} />
              </span>
            );
          })}
          {filters.channels.map(id => {
            const ch = channels.find(c => c.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                {ch?.name}
                <X size={12} className="cursor-pointer" onClick={() => setChannels(filters.channels.filter(c => c !== id))} />
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
