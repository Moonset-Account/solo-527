"use client";

import { useState } from "react";
import { Filter, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { severityConfig, statusConfig } from "@/utils/format";
import { mockData } from "@/utils/mockData";

interface Filters {
  statuses: string[];
  severities: string[];
  metricId: string;
  dateFrom: string;
  dateTo: string;
}

interface AnomalyFilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const statusOptions = Object.entries(statusConfig).map(([key, val]) => ({
  value: key,
  label: val.label,
  bg: val.bg,
  color: val.color,
}));

const severityOptions = Object.entries(severityConfig).map(([key, val]) => ({
  value: key,
  label: val.label,
  bg: val.bg,
  color: val.color,
  dot: val.dot,
}));

export function AnomalyFilterBar({ filters, onChange }: AnomalyFilterBarProps) {
  const [expanded, setExpanded] = useState(true);

  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const toggleSeverity = (severity: string) => {
    const next = filters.severities.includes(severity)
      ? filters.severities.filter((s) => s !== severity)
      : [...filters.severities, severity];
    onChange({ ...filters, severities: next });
  };

  const resetFilters = () => {
    onChange({
      statuses: [],
      severities: [],
      metricId: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.severities.length > 0 ||
    filters.metricId !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  return (
    <div className="card">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">筛选条件</span>
          {hasActiveFilters && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center justify-center">
              {filters.statuses.length +
                filters.severities.length +
                (filters.metricId ? 1 : 0) +
                (filters.dateFrom || filters.dateTo ? 1 : 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetFilters();
              }}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-100 pt-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">
              状态
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className={`badge transition-all ${
                    filters.statuses.includes(opt.value)
                      ? `${opt.bg} ${opt.color} ring-1 ring-current`
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">
              严重程度
            </label>
            <div className="flex flex-wrap gap-2">
              {severityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleSeverity(opt.value)}
                  className={`badge transition-all ${
                    filters.severities.includes(opt.value)
                      ? `${opt.bg} ${opt.color} ring-1 ring-current`
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      filters.severities.includes(opt.value)
                        ? opt.dot
                        : "bg-neutral-400"
                    }`}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                关联指标
              </label>
              <select
                value={filters.metricId}
                onChange={(e) =>
                  onChange({ ...filters, metricId: e.target.value })
                }
                className="select"
              >
                <option value="">全部指标</option>
                {mockData.metrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                开始日期
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onChange({ ...filters, dateFrom: e.target.value })
                }
                className="input"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                结束日期
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onChange({ ...filters, dateTo: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
