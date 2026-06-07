"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { X, RefreshCw, Calendar, ChevronDown } from "lucide-react";

const TIME_WINDOWS = [
  { key: "today" as const, label: "今日" },
  { key: "7d" as const, label: "近7天" },
  { key: "30d" as const, label: "近30天" },
];

export default function FilterBar() {
  const {
    filters,
    filterOptions,
    setTimeWindow,
    toggleFilterValue,
    clearAllFilters,
    fetchAll,
  } = useDashboardStore();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const totalSelected =
    filters.products.length +
    filters.stores.length +
    filters.reasons.length +
    filters.warehouses.length +
    filters.logistics.length;

  const FilterDropdown = ({
    filterKey,
    label,
    options,
    groupByCategory = false,
  }: {
    filterKey: "products" | "stores" | "reasons" | "warehouses" | "logistics";
    label: string;
    options: { id: string; name: string; category?: string }[];
    groupByCategory?: boolean;
  }) => {
    const selected = filters[filterKey];

    const grouped = groupByCategory
      ? options.reduce((acc, opt) => {
          const cat = opt.category || "其他";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(opt);
          return acc;
        }, {} as Record<string, typeof options>)
      : null;

    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(filterKey)}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
        >
          <span className="text-slate-600">{label}</span>
          {selected.length > 0 && (
            <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
        {openDropdown === filterKey && (
          <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 animate-fade-in scrollbar-thin">
            {groupByCategory && grouped
              ? Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                      {cat}
                    </div>
                    {items.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(opt.id)}
                          onChange={() => toggleFilterValue(filterKey, opt.id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-slate-700">{opt.name}</span>
                      </label>
                    ))}
                  </div>
                ))
              : options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(opt.id)}
                      onChange={() => toggleFilterValue(filterKey, opt.id)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-slate-700">{opt.name}</span>
                  </label>
                ))}
          </div>
        )}
      </div>
    );
  };

  const renderTag = (
    filterKey: "products" | "stores" | "reasons" | "warehouses" | "logistics",
    value: string
  ) => {
    let displayName = value;
    if (filterKey === "products" && filterOptions) {
      const opt = filterOptions.products.find((o) => o.id === value);
      if (opt) displayName = opt.name;
    } else if (filterKey === "stores" && filterOptions) {
      const opt = filterOptions.stores.find((o) => o.id === value || o.name === value);
      if (opt) displayName = opt.name;
    } else if (filterKey === "reasons" && filterOptions) {
      const opt = filterOptions.reasons.find((o) => o.id === value);
      if (opt) displayName = opt.name;
    } else if (filterKey === "warehouses" && filterOptions) {
      const opt = filterOptions.warehouses.find((o) => o.id === value || o.name === value);
      if (opt) displayName = opt.name;
    } else if (filterKey === "logistics" && filterOptions) {
      const opt = filterOptions.logistics.find((o) => o.id === value || o.name === value);
      if (opt) displayName = opt.name;
    }

    return (
      <span
        key={`${filterKey}-${value}`}
        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
      >
        {displayName}
        <button
          onClick={() => toggleFilterValue(filterKey, value)}
          className="hover:text-primary-900"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">时间范围：</span>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setTimeWindow(w.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                filters.timeWindow === w.key
                  ? "bg-white text-primary-700 shadow-sm font-medium"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {filterOptions && (
          <>
            <FilterDropdown
              filterKey="products"
              label="商品"
              options={filterOptions.products}
              groupByCategory
            />
            <FilterDropdown
              filterKey="stores"
              label="店铺"
              options={filterOptions.stores}
            />
            <FilterDropdown
              filterKey="reasons"
              label="原因"
              options={filterOptions.reasons}
              groupByCategory
            />
            <FilterDropdown
              filterKey="warehouses"
              label="仓库"
              options={filterOptions.warehouses}
            />
            <FilterDropdown
              filterKey="logistics"
              label="物流商"
              options={filterOptions.logistics}
            />
          </>
        )}

        <div className="flex-1" />

        {totalSelected > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-danger-500 transition-colors"
          >
            <X className="w-4 h-4" />
            清除筛选 ({totalSelected})
          </button>
        )}

        <button
          onClick={() => fetchAll()}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {totalSelected > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.products.map((v) => renderTag("products", v))}
          {filters.stores.map((v) => renderTag("stores", v))}
          {filters.reasons.map((v) => renderTag("reasons", v))}
          {filters.warehouses.map((v) => renderTag("warehouses", v))}
          {filters.logistics.map((v) => renderTag("logistics", v))}
        </div>
      )}
    </div>
  );
}
