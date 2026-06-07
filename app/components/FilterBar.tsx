import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboardStore } from '../store/useDashboardStore';

const stageLabels: Record<string, string> = {
  lead: '潜客',
  consulted: '已咨询',
  appointed: '已预约',
  visited: '已到店',
  planned: '已方案',
  paid: '已付款',
  followed_up: '已复诊',
};

interface FilterConfig {
  key: 'projectIds' | 'consultantIds' | 'channelIds' | 'customerStage' | 'months';
  label: string;
  multiple: boolean;
}

const filterConfigs: FilterConfig[] = [
  { key: 'projectIds', label: '项目', multiple: true },
  { key: 'consultantIds', label: '顾问', multiple: true },
  { key: 'channelIds', label: '渠道', multiple: true },
  { key: 'customerStage', label: '客户阶段', multiple: false },
  { key: 'months', label: '月份', multiple: true },
];

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [ref, handler]);
}

interface MultiSelectDropdownProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  getLabel?: (id: string) => string;
}

function MultiSelectDropdown({ label, options, selected, onChange, getLabel }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const displayText = selected.length === 0
    ? label
    : selected.length === 1
      ? getLabel?.(selected[0]) ?? options.find((o) => o.id === selected[0])?.name ?? label
      : `${label} (${selected.length})`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors min-w-[120px]',
          'bg-slate-800/60 border-slate-700 hover:border-slate-600',
          selected.length > 0 ? 'text-slate-200' : 'text-slate-400'
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[180px] max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((v) => v !== opt.id));
                  } else {
                    onChange([...selected, opt.id]);
                  }
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                  isSelected ? 'text-emerald bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'
                )}
              >
                <span
                  className={cn(
                    'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                    isSelected ? 'border-emerald bg-emerald/20' : 'border-slate-600'
                  )}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-sm bg-emerald" />}
                </span>
                {opt.name}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">暂无选项</div>
          )}
        </div>
      )}
    </div>
  );
}

interface SingleSelectDropdownProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string | undefined;
  onChange: (value: string | undefined) => void;
}

function SingleSelectDropdown({ label, options, selected, onChange }: SingleSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const displayText = selected
    ? options.find((o) => o.id === selected)?.name ?? label
    : label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors min-w-[120px]',
          'bg-slate-800/60 border-slate-700 hover:border-slate-600',
          selected ? 'text-slate-200' : 'text-slate-400'
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[180px] max-h-60 overflow-y-auto">
          <button
            onClick={() => { onChange(undefined); setOpen(false); }}
            className={cn(
              'w-full text-left px-3 py-2 text-sm transition-colors',
              !selected ? 'text-emerald bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'
            )}
          >
            全部
          </button>
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { onChange(isSelected ? undefined : opt.id); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  isSelected ? 'text-emerald bg-slate-700/50' : 'text-slate-300 hover:bg-slate-700/30'
                )}
              >
                {opt.name}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">暂无选项</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar() {
  const {
    filterParams,
    setFilter,
    resetFilters,
    filterOptions,
    fetchFilterOptionsData,
    loading,
  } = useDashboardStore();

  useEffect(() => {
    fetchFilterOptionsData();
  }, [fetchFilterOptionsData]);

  const stageOptions = filterOptions.stages.map((s) => ({
    id: s,
    name: stageLabels[s] ?? s,
  }));

  const monthOptions = filterOptions.months.map((m) => ({
    id: m,
    name: m,
  }));

  const projectOptions = filterOptions.projects.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const consultantOptions = filterOptions.consultants.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const channelOptions = filterOptions.channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
  }));

  const allOptionsMap: Record<string, { id: string; name: string }[]> = {
    projectIds: projectOptions,
    consultantIds: consultantOptions,
    channelIds: channelOptions,
    customerStage: stageOptions,
    months: monthOptions,
  };

  const tags: { key: string; value: string; label: string }[] = [];

  for (const cfg of filterConfigs) {
    if (cfg.multiple) {
      const values = filterParams[cfg.key] as string[] | undefined;
      values?.forEach((v) => {
        const optList = allOptionsMap[cfg.key];
        const found = optList.find((o) => o.id === v);
        if (found) {
          tags.push({ key: cfg.key, value: v, label: found.name });
        }
      });
    } else {
      const val = filterParams[cfg.key] as string | undefined;
      if (val) {
        const optList = allOptionsMap[cfg.key];
        const found = optList.find((o) => o.id === val);
        if (found) {
          tags.push({ key: cfg.key, value: val, label: found.name });
        }
      }
    }
  }

  function removeTag(tag: { key: string; value: string }) {
    const cfg = filterConfigs.find((c) => c.key === tag.key);
    if (!cfg) return;
    if (cfg.multiple) {
      const current = (filterParams[cfg.key] as string[] | undefined) ?? [];
      setFilter({ [cfg.key]: current.filter((v) => v !== tag.value) });
    } else {
      setFilter({ [cfg.key]: undefined });
    }
  }

  const hasFilters = tags.length > 0;

  return (
    <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {loading.filterOptions && (
          <span className="text-sm text-slate-500 font-mono animate-pulse">加载中...</span>
        )}

        {!loading.filterOptions && (
          <>
            <MultiSelectDropdown
              label="项目"
              options={projectOptions}
              selected={filterParams.projectIds ?? []}
              onChange={(v) => setFilter({ projectIds: v.length ? v : undefined })}
            />
            <MultiSelectDropdown
              label="顾问"
              options={consultantOptions}
              selected={filterParams.consultantIds ?? []}
              onChange={(v) => setFilter({ consultantIds: v.length ? v : undefined })}
            />
            <MultiSelectDropdown
              label="渠道"
              options={channelOptions}
              selected={filterParams.channelIds ?? []}
              onChange={(v) => setFilter({ channelIds: v.length ? v : undefined })}
            />
            <SingleSelectDropdown
              label="客户阶段"
              options={stageOptions}
              selected={filterParams.customerStage}
              onChange={(v) => setFilter({ customerStage: v })}
            />
            <MultiSelectDropdown
              label="月份"
              options={monthOptions}
              selected={filterParams.months ?? []}
              onChange={(v) => setFilter({ months: v.length ? v : undefined })}
            />
          </>
        )}

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-coral hover:bg-slate-700/30 transition-colors ml-auto"
          >
            <RotateCcw size={14} />
            重置
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-700/50">
          {tags.map((tag) => (
            <span
              key={`${tag.key}-${tag.value}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300 border border-slate-600/50"
            >
              {tag.label}
              <button
                onClick={() => removeTag(tag)}
                className="text-slate-500 hover:text-coral transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
