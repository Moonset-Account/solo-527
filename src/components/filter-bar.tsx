"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "search" | "text";
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset: () => void;
  className?: string;
}

export function FilterBar({ filters, values, onChange, onReset, className }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const hasActiveFilters = Object.values(values).some((v) => v !== undefined && v !== "" && v !== null);

  return (
    <div className={cn("bg-white rounded-xl border border-zinc-200 p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-zinc-500" />
          <h3 className="font-semibold text-zinc-900">筛选条件</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
              重置
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            {isExpanded ? "收起" : "展开"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.slice(0, isExpanded ? filters.length : 4).map((filter) => (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              {filter.label}
            </label>
            {filter.type === "select" && (
              <select
                value={values[filter.key] || ""}
                onChange={(e) => handleChange(filter.key, e.target.value || undefined)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">全部</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {filter.type === "date" && (
              <input
                type="date"
                value={values[filter.key] ? new Date(values[filter.key]).toISOString().split('T')[0] : ""}
                onChange={(e) => handleChange(filter.key, e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            )}
            {filter.type === "text" && (
              <input
                type="text"
                value={values[filter.key] || ""}
                onChange={(e) => handleChange(filter.key, e.target.value || undefined)}
                placeholder={filter.placeholder}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            )}
            {filter.type === "search" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={values[filter.key] || ""}
                  onChange={(e) => handleChange(filter.key, e.target.value || undefined)}
                  placeholder={filter.placeholder}
                  className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
