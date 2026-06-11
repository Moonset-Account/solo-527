"use client";

import { useState } from "react";
import { Filter, Calendar, User, X } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Button } from "./Button";
import { cn } from "@/utils/cn";

interface FilterBarProps {
  showStatusFilter?: boolean;
  showAssigneeFilter?: boolean;
  onFilter?: (filters: any) => void;
}

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待分配" },
  { value: "assigned", label: "已分配" },
  { value: "picked", label: "已取货" },
  { value: "delivering", label: "配送中" },
  { value: "completed", label: "已完成" },
  { value: "exception", label: "异常" },
];

const exceptionStatusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已关闭" },
];

const assigneeOptions = [
  { value: "", label: "全部责任人" },
  { value: "张主管", label: "张主管" },
  { value: "李运营", label: "李运营" },
  { value: "王骑手", label: "王骑手" },
  { value: "刘骑手", label: "刘骑手" },
  { value: "陈骑手", label: "陈骑手" },
  { value: "赵骑手", label: "赵骑手" },
  { value: "孙骑手", label: "孙骑手" },
];

export function FilterBar({
  showStatusFilter = true,
  showAssigneeFilter = true,
  onFilter,
}: FilterBarProps) {
  const { filters, setFilters } = useDashboardStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (value: string) => {
    setFilters({ status: value || undefined });
    onFilter?.({ ...filters, status: value || undefined });
  };

  const handleAssigneeChange = (value: string) => {
    setFilters({ assignee: value || undefined });
    onFilter?.({ ...filters, assignee: value || undefined });
  };

  const handleDateChange = (field: "startTime" | "endTime", value: string) => {
    const date = value ? new Date(value) : undefined;
    setFilters({ [field]: date });
    onFilter?.({ ...filters, [field]: date });
  };

  const clearFilters = () => {
    setFilters({});
    onFilter?.({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-300">筛选条件</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "收起" : "展开"}
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-4 transition-all duration-300",
          isExpanded ? "grid-cols-4" : "grid-cols-3"
        )}
        >
          <div>
          <label className="block text-xs text-slate-500 mb-1.5">开始时间</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="date"
              className={cn(
                "w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200",
                "focus:outline-none focus:border-brand-500 transition-colors"
              )}
              onChange={(e) => handleDateChange("startTime", e.target.value)}
            />
          </div>
        </div>

          <div>
          <label className="block text-xs text-slate-500 mb-1.5">结束时间</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="date"
              className={cn(
                "w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200",
                "focus:outline-none focus:border-brand-500 transition-colors"
              )}
              onChange={(e) => handleDateChange("endTime", e.target.value)}
            />
          </div>
        </div>

          {showStatusFilter && (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">状态</label>
              <select
                className={cn(
                  "w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200",
                  "focus:outline-none focus:border-brand-500 transition-colors"
                )}
                value={filters.status || ""}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showAssigneeFilter && (
            <div className={cn(!isExpanded && "hidden")}>
              <label className="block text-xs text-slate-500 mb-1.5">责任人</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  className={cn(
                    "w-full h-9 pl-9 pr-3 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200",
                    "focus:outline-none focus:border-brand-500 transition-colors"
                  )}
                  value={filters.assignee || ""}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                >
                  {assigneeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {isExpanded && hasActiveFilters && (
          <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              清除筛选
            </Button>
          </div>
        )}
      </div>
    );
}
