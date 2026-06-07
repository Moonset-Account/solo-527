"use client";

import { useState } from "react";
import { FilterOptions, ROOM_TYPES, REPAIR_TYPES } from "@/types";
import { MOCK_BUILDINGS, MOCK_SUPPLIERS } from "@/mock/data";
import { Filter, Download, X } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { WorkOrder } from "@/types";
import dayjs from "dayjs";

interface FilterBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  onExport?: () => void;
  exportData?: WorkOrder[];
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1;
  return {
    value: `2026-${String(m).padStart(2, "0")}`,
    label: `${m}月`,
  };
});

export default function FilterBar({
  filters,
  onChange,
  onExport,
  exportData,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters };
    if (value === undefined || value === "" || value === null) {
      delete newFilters[key];
    } else {
      (newFilters as any)[key] = value;
    }
    onChange(newFilters);
  };

  const clearAll = () => {
    onChange({});
  };

  const handleExport = () => {
    if (!exportData) return;
    const data = exportData.map((o) => ({
      工单编号: o.orderNo,
      楼栋: o.buildingName,
      房型: o.roomType,
      维修类型: o.repairType,
      供应商: o.supplierName,
      状态: o.status,
      创建时间: dayjs(o.createdAt).format("YYYY-MM-DD HH:mm"),
      响应时长: o.responseTime ? `${Math.round(o.responseTime)}分钟` : "-",
      是否复修: o.isRepeat ? "是" : "否",
      是否节假日: o.isHoliday ? "是" : "否",
      租户评分: o.tenantRating || "-",
    }));
    exportToCSV(data, `维修工单_${dayjs().format("YYYYMMDD")}`);
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
              showFilters || activeFilterCount > 0
                ? "border-primary-500 bg-primary-50 text-primary-600"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">筛选</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              清除全部
            </button>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {filters.buildingId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                楼栋: {MOCK_BUILDINGS.find((b) => b.id === filters.buildingId)?.name}
                <button
                  onClick={() => handleChange("buildingId", undefined)}
                  className="hover:text-slate-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.supplierId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                供应商: {MOCK_SUPPLIERS.find((s) => s.id === filters.supplierId)?.name}
                <button
                  onClick={() => handleChange("supplierId", undefined)}
                  className="hover:text-slate-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.repairType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                类型: {filters.repairType}
                <button
                  onClick={() => handleChange("repairType", undefined)}
                  className="hover:text-slate-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.month && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                月份: {filters.month.slice(5)}月
                <button
                  onClick={() => handleChange("month", undefined)}
                  className="hover:text-slate-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">导出</span>
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              楼栋
            </label>
            <select
              value={filters.buildingId || ""}
              onChange={(e) => handleChange("buildingId", e.target.value || undefined)}
              className="select text-sm"
            >
              <option value="">全部楼栋</option>
              {MOCK_BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              房型
            </label>
            <select
              value={filters.roomType || ""}
              onChange={(e) => handleChange("roomType", e.target.value || undefined)}
              className="select text-sm"
            >
              <option value="">全部房型</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              维修类型
            </label>
            <select
              value={filters.repairType || ""}
              onChange={(e) => handleChange("repairType", e.target.value || undefined)}
              className="select text-sm"
            >
              <option value="">全部类型</option>
              {REPAIR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              供应商
            </label>
            <select
              value={filters.supplierId || ""}
              onChange={(e) => handleChange("supplierId", e.target.value || undefined)}
              className="select text-sm"
            >
              <option value="">全部供应商</option>
              {MOCK_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              月份
            </label>
            <select
              value={filters.month || ""}
              onChange={(e) => handleChange("month", e.target.value || undefined)}
              className="select text-sm"
            >
              <option value="">全部月份</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
