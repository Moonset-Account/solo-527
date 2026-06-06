"use client";

import { useAppStore } from "@/store";
import { MOCK_DEPARTMENTS, MOCK_DOCTORS, MOCK_PATIENT_TYPES } from "@/mock/data";
import { TIME_SLOTS, PROCESS_NODES } from "@/types";
import { X, Filter, RefreshCw, ChevronDown, ChevronUp, User, Calendar, GitBranch } from "lucide-react";
import { useState, useMemo } from "react";
import { cn, formatDate } from "@/utils";

interface FilterSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, icon, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-neutral-50"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          {icon}
          {title}
        </span>
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

  const filteredDoctors = useMemo(() => {
    if (filters.departments.length === 0) {
      return MOCK_DOCTORS;
    }
    return MOCK_DOCTORS.filter((d) => filters.departments.includes(d.deptId));
  }, [filters.departments]);

  const handleDeptChange = (deptId: string) => {
    const current = filters.departments;
    const updated = current.includes(deptId)
      ? current.filter((id) => id !== deptId)
      : [...current, deptId];
    setFilters({ departments: updated });
  };

  const handleDoctorChange = (doctorId: string) => {
    const current = filters.doctors;
    const updated = current.includes(doctorId)
      ? current.filter((id) => id !== doctorId)
      : [...current, doctorId];
    setFilters({ doctors: updated });
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

  const handleProcessNodeChange = (nodeKey: string) => {
    const current = filters.processNodes;
    const updated = current.includes(nodeKey)
      ? current.filter((k) => k !== nodeKey)
      : [...current, nodeKey];
    setFilters({ processNodes: updated });
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    const current = filters.dateRange || [null, null];
    const newRange: [string | null, string | null] = [...current];
    
    if (type === "start") {
      newRange[0] = value || null;
    } else {
      newRange[1] = value || null;
    }

    if (newRange[0] && newRange[1]) {
      setFilters({ dateRange: [newRange[0], newRange[1]] });
    } else if (newRange[0] || newRange[1]) {
      setFilters({ dateRange: newRange as [string, string] | null });
    } else {
      setFilters({ dateRange: null });
    }
  };

  const activeFilterCount =
    filters.departments.length +
    filters.doctors.length +
    filters.patientTypes.length +
    filters.timeSlots.length +
    filters.processNodes.length +
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
        <FilterSection title="日期范围" icon={<Calendar className="w-3.5 h-3.5 text-primary-500" />}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 w-10">开始</label>
              <input
                type="date"
                value={filters.dateRange?.[0] || ""}
                onChange={(e) => handleDateChange("start", e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500 w-10">结束</label>
              <input
                type="date"
                value={filters.dateRange?.[1] || ""}
                onChange={(e) => handleDateChange("end", e.target.value)}
                className="flex-1 px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {filters.dateRange && (
              <div className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                已选: {formatDate(filters.dateRange[0])} ~ {formatDate(filters.dateRange[1])}
              </div>
            )}
          </div>
        </FilterSection>

        <FilterSection title="科室" icon={<Calendar className="w-3.5 h-3.5 text-primary-500" />}>
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

        <FilterSection title="医生" icon={<User className="w-3.5 h-3.5 text-primary-500" />} defaultOpen={false}>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {filters.departments.length > 0 && (
              <p className="text-xs text-neutral-400 mb-1">
                已按选中科室过滤 ({filteredDoctors.length} 位医生)
              </p>
            )}
            {filteredDoctors.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-2">请先选择科室</p>
            ) : (
              filteredDoctors.map((doctor) => (
                <label
                  key={doctor.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.doctors.includes(doctor.id)}
                    onChange={() => handleDoctorChange(doctor.id)}
                    className="w-3.5 h-3.5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-neutral-600 block truncate">
                      {doctor.doctorNameMasked}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {MOCK_DEPARTMENTS.find((d) => d.id === doctor.deptId)?.deptName}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>
        </FilterSection>

        <FilterSection title="患者类型" icon={<User className="w-3.5 h-3.5 text-primary-500" />} defaultOpen={false}>
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

        <FilterSection title="时段" icon={<Calendar className="w-3.5 h-3.5 text-primary-500" />} defaultOpen={false}>
          <div className="space-y-1.5">
            {TIME_SLOTS.map((slot) => (
              <label
                key={slot.code}
                className="flex items-center justify-between cursor-pointer hover:bg-neutral-50 p-1 rounded"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.timeSlots.includes(slot.code)}
                    onChange={() => handleTimeSlotChange(slot.code)}
                    className="w-3.5 h-3.5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-600">{slot.name}</span>
                </div>
                <span className="text-xs text-neutral-400">
                  {slot.startHour}:00-{slot.endHour}:00
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="流程节点" icon={<GitBranch className="w-3.5 h-3.5 text-primary-500" />} defaultOpen={false}>
          <div className="space-y-1.5">
            <p className="text-xs text-neutral-400 mb-1">筛选包含指定节点的记录</p>
            {PROCESS_NODES.map((node) => (
              <label
                key={node.key}
                className="flex items-center gap-2 cursor-pointer hover:bg-neutral-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={filters.processNodes.includes(node.key)}
                  onChange={() => handleProcessNodeChange(node.key)}
                  className="w-3.5 h-3.5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: node.color }}
                />
                <span className="text-sm text-neutral-600">{node.name}</span>
              </label>
            ))}
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
