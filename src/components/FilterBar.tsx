import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, RotateCcw, Calendar, X } from "lucide-react";
import { useAppStore } from "@/store";
import { useApi } from "@/hooks/useApi";
import type { FilterOptions } from "@/types";

export default function FilterBar() {
  const { filters, setFilters, resetFilters } = useAppStore();
  const { data: options } = useApi<FilterOptions>("/filters/options", filters);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterConfigs = [
    { key: "positions" as const, label: "职位", items: options?.positions ?? [] },
    { key: "departments" as const, label: "部门", items: options?.departments ?? [] },
    { key: "recruiters" as const, label: "招聘官", items: options?.recruiters ?? [] },
    { key: "channels" as const, label: "渠道", items: options?.channels ?? [] },
    { key: "stages" as const, label: "阶段", items: options?.stages ?? [] },
  ];

  const toggleItem = (key: keyof Pick<typeof filters, "positions" | "departments" | "recruiters" | "channels" | "stages">, item: string) => {
    const current = filters[key];
    const updated = current.includes(item)
      ? current.filter((v) => v !== item)
      : [...current, item];
    setFilters({ [key]: updated });
  };

  const hasActiveFilters =
    filters.positions.length > 0 ||
    filters.departments.length > 0 ||
    filters.recruiters.length > 0 ||
    filters.channels.length > 0 ||
    filters.stages.length > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-primary-dark/95 backdrop-blur-md border-b border-accent-cyan/15 flex items-center px-4 gap-3">
      <div className="flex items-center gap-2 text-accent-cyan">
        <Filter size={16} />
        <span className="text-sm font-medium text-slate-300">筛选</span>
      </div>

      <div ref={dropdownRef} className="flex items-center gap-2 flex-1 overflow-x-auto">
        {filterConfigs.map(({ key, label, items }) => {
          const selected = filters[key];
          const isOpen = openDropdown === key;
          return (
            <div key={key} className="relative">
              <button
                onClick={() => setOpenDropdown(isOpen ? null : key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors whitespace-nowrap ${
                  selected.length > 0
                    ? "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan"
                    : "bg-secondary-bg/60 border-accent-cyan/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{label}</span>
                {selected.length > 0 && (
                  <span className="data-font text-xs bg-accent-cyan/20 px-1.5 py-0.5 rounded">
                    {selected.length}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 max-h-64 overflow-y-auto bg-secondary-bg/95 backdrop-blur-md border border-accent-cyan/20 rounded-lg shadow-xl py-1 z-50">
                  {items.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">暂无选项</div>
                  ) : (
                    items.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleItem(key, item)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-cyan/10 transition-colors flex items-center gap-2 ${
                          selected.includes(item) ? "text-accent-cyan" : "text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            selected.includes(item)
                              ? "bg-accent-cyan border-accent-cyan"
                              : "border-slate-500"
                          }`}
                        >
                          {selected.includes(item) && <X size={10} className="text-primary-dark" />}
                        </span>
                        {item}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-2 ml-2">
          <Calendar size={14} className="text-slate-500" />
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) =>
              setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })
            }
            className="bg-secondary-bg/60 border border-accent-cyan/10 rounded-lg px-2 py-1.5 text-sm text-slate-300 data-font focus:outline-none focus:border-accent-cyan/40"
          />
          <span className="text-slate-500 text-xs">至</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) =>
              setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })
            }
            className="bg-secondary-bg/60 border border-accent-cyan/10 rounded-lg px-2 py-1.5 text-sm text-slate-300 data-font focus:outline-none focus:border-accent-cyan/40"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-anomaly-orange/30 text-anomaly-orange hover:bg-anomaly-orange/10 transition-colors whitespace-nowrap"
        >
          <RotateCcw size={14} />
          重置
        </button>
      )}
    </div>
  );
}
