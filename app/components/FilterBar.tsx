import type { Filters, DimensionOptions } from "~/types";
import { useNavigate, useLocation } from "@remix-run/react";

interface FilterBarProps {
  dimensions: DimensionOptions;
  filters: Filters;
}

export function FilterBar({ dimensions, filters }: FilterBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const updateFilter = (key: keyof Filters, value: string | number | undefined) => {
    const params = new URLSearchParams(location.search);
    if (value === undefined || value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    navigate(`?${params.toString()}`, { preventScrollReset: true });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "");

  const clearAll = () => {
    navigate(location.pathname, { preventScrollReset: true });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">部门：</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.department_id || "all"}
            onChange={e => updateFilter("department_id", e.target.value === "all" ? undefined : parseInt(e.target.value))}
          >
            <option value="all">全部部门</option>
            {dimensions.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">课程：</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.course_id || "all"}
            onChange={e => updateFilter("course_id", e.target.value === "all" ? undefined : parseInt(e.target.value))}
          >
            <option value="all">全部课程</option>
            {dimensions.courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">班期：</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.cohort_id || "all"}
            onChange={e => updateFilter("cohort_id", e.target.value === "all" ? undefined : parseInt(e.target.value))}
          >
            <option value="all">全部班期</option>
            {dimensions.cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">讲师：</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.instructor_id || "all"}
            onChange={e => updateFilter("instructor_id", e.target.value === "all" ? undefined : parseInt(e.target.value))}
          >
            <option value="all">全部讲师</option>
            {dimensions.instructors.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">岗位：</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.position || "all"}
            onChange={e => updateFilter("position", e.target.value === "all" ? undefined : e.target.value)}
          >
            <option value="all">全部岗位</option>
            {dimensions.positions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ml-auto text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
}
