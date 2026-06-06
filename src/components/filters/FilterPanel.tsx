"use client";

import { useAppStore } from "@/store";
import { MOCK_DEPARTMENTS, MOCK_DOCTORS, MOCK_PATIENT_TYPES } from "@/mock/data";
import { TIME_SLOTS } from "@/types";
import { X, Filter, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-50"
      >
        <span className="text-sm font-medium text-neutral-700">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

export function FilterPanel() {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const toggleFilterPanel = useAppStore((state) => state.toggleFilterPanel);

  const handleDeptChange = (deptId: string) => {
    const current = filters.departments;
    const updated = current.includes(deptId)
      ? current.filter((id) => id !== deptId)
      : [...current, deptId];
    setFilters({ departments: updated });
  };

  const handlePatientTypeChange = (typeId: string) => {
    const current = filters.patientTypes;
    const updated = current.includes(typeId)
      ? current.filter((id) => id !== typeId)
      : [...current, typeId];
    setFilters({ patientTypes: updated });
  };

  const handleTimeSlotChange = (slotCode: string) => {
    const current = filters.timeSlots;
    const updated = current.includes(slotCode)
      ? current.filter((id) => id !== slotCode)
      : [...current, slotCode];
    setFilters({ timeSlots: updated });
  };

  const activeFilterCount =
    filters.departments.length +
    filters.patientTypes.length +
    filters.timeSlots.length +
    (filters.dateRange ? 1 : 0);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-neutral-800">筛选条件</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-600 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={toggleFilterPanel}
          className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <FilterSection title="科室">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {MOCK_DEPARTMENTS.map((dept) => (
              <label
                key={dept.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.departments.includes(dept.id)}
                  onChange={() => handleDeptChange(dept.id)}
                  className="w-3.5 h-3.5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600">{dept.deptName}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="患者类型">
          <div className="space-y-1.5">
            {MOCK_PATIENT_TYPES.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.patientTypes.includes(type.id)}
                  onChange={() => handlePatientTypeChange(type.id)}
                  className="w-3.5 h-3.5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600">{type.typeName}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="时段">
          <div className="space-y-1.5">
            {TIME_SLOTS.map((slot) => (
              <label
                key={slot.code}
                className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.timeSlots.includes(slot.code)}
                  onChange={() => handleTimeSlotChange(slot.code)}
                  className="w-3.5 h-3.5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-600">{slot.name}</span>
                <span className="text-xs text-neutral-400">
                  {slot.startHour}:00-{slot.endHour}:00
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="日期范围" defaultOpen={false}>
          <div className="space-y-2">
            <input
              type="date"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="开始日期"
            />
            <input
              type="date"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="结束日期"
            />
          </div>
        </FilterSection>
      </div>

      <div className="px-4 py-3 border-t border-neutral-200">
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重置筛选
        </button>
      </div>
    </div>
  );
}
