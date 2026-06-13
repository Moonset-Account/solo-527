"use client";

import { useState } from "react";
import { Filter, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { severityConfig, statusConfig } from "@/utils/format";
import { api } from "@/trpc/react";

interface AnomalyFilterInput {
  status?: ("OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED")[];
  severity?: ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")[];
  metricId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface AnomalyFilterBarProps {
  filters: AnomalyFilterInput;
  onChange: (filters: AnomalyFilterInput) => void;
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
  const { data: metrics } = api.metric.list.useQuery();

  const toggleStatus = (status: string) => {
    const currentStatuses = filters.status ?? [];
    const next = currentStatuses.includes(status as "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED")
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status as "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED"];
    onChange({ ...filters, status: next.length > 0 ? next : undefined });
  };

  const toggleSeverity = (severity: string) => {
    const currentSeverities = filters.severity ?? [];
    const next = currentSeverities.includes(severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
      ? currentSeverities.filter((s) => s !== severity)
      : [...currentSeverities, severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"];
    onChange({ ...filters, severity: next.length > 0 ? next : undefined });
  };

  const resetFilters = () => {
    onChange({
      status: undefined,
      severity: undefined,
      metricId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters =
    (filters.status?.length ?? 0) > 0 ||
    (filters.severity?.length ?? 0) > 0 ||
    filters.metricId !== undefined ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

  const formatDateValue = (date?: Date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
              {(filters.status?.length ?? 0) +
                (filters.severity?.length ?? 0) +
                (filters.metricId ? 1 : 0) +
                (filters.startDate || filters.endDate ? 1 : 0)}
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
                    filters.status?.includes(opt.value as "OPEN" | "INVESTIGATING" | "RESOLVED" | "IGNORED")
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
                    filters.severity?.includes(opt.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
                      ? `${opt.bg} ${opt.color} ring-1 ring-current`
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      filters.severity?.includes(opt.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
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
                value={filters.metricId ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    metricId: e.target.value || undefined,
                  })
                }
                className="select"
              >
                <option value="">全部指标</option>
                {metrics?.map((m) => (
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
                value={formatDateValue(filters.startDate)}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    startDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
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
                value={formatDateValue(filters.endDate)}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    endDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
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
