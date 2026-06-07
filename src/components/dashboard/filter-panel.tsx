"use client";

import { useFilterStore } from "@/store/filter-store";
import { AGE_GROUPS, CHANNELS } from "@/lib/constants";
import { X, RotateCcw } from "lucide-react";

const CAMPUS_OPTIONS = [
  { id: "campus-1", name: "朝阳区校区" },
  { id: "campus-2", name: "海淀区校区" },
  { id: "campus-3", name: "西城区校区" },
];

const COURSE_OPTIONS = [
  { id: "course-1", name: "少儿英语启蒙" },
  { id: "course-2", name: "青少年编程基础" },
  { id: "course-3", name: "数学思维训练" },
  { id: "course-4", name: "创意美术" },
  { id: "course-5", name: "钢琴入门" },
  { id: "course-6", name: "机器人编程" },
];

const AGE_OPTIONS = AGE_GROUPS.map((g) => ({ id: g, name: g }));
const CHANNEL_OPTIONS = CHANNELS.map((c) => ({ id: c, name: c }));

type FilterConfig = {
  key: "campusIds" | "courseIds" | "ageGroups" | "channels";
  label: string;
  options: { id: string; name: string }[];
};

const FILTER_CONFIGS: FilterConfig[] = [
  { key: "campusIds", label: "校区", options: CAMPUS_OPTIONS },
  { key: "courseIds", label: "课程", options: COURSE_OPTIONS },
  { key: "ageGroups", label: "年龄段", options: AGE_OPTIONS },
  { key: "channels", label: "渠道", options: CHANNEL_OPTIONS },
];

function resolveNames(key: FilterConfig["key"], ids: string[]): string[] {
  const config = FILTER_CONFIGS.find((c) => c.key === key)!;
  return ids.map(
    (id) => config.options.find((o) => o.id === id)?.name ?? id
  );
}

export function FilterPanel() {
  const { campusIds, courseIds, ageGroups, channels, setFilter, resetFilters } =
    useFilterStore();

  const filterValues = { campusIds, courseIds, ageGroups, channels };

  const activeTags: { key: FilterConfig["key"]; id: string; name: string }[] =
    [];
  for (const config of FILTER_CONFIGS) {
    const ids = filterValues[config.key];
    for (const id of ids) {
      const name =
        config.options.find((o) => o.id === id)?.name ?? id;
      activeTags.push({ key: config.key, id, name });
    }
  }

  function handleSelect(
    key: FilterConfig["key"],
    value: string
  ) {
    if (!value) return;
    const current = filterValues[key];
    if (current.includes(value)) return;
    setFilter(key, [...current, value]);
  }

  function handleRemoveTag(key: FilterConfig["key"], id: string) {
    const current = filterValues[key];
    setFilter(
      key,
      current.filter((v) => v !== id)
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
      <div className="flex flex-wrap items-end gap-4">
        {FILTER_CONFIGS.map((config) => (
          <div key={config.key} className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-sm text-text-secondary font-medium">
              {config.label}
            </label>
            <select
              value=""
              onChange={(e) => handleSelect(config.key, e.target.value)}
              className="h-9 rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="">选择{config.label}...</option>
              {config.options.map((opt) => (
                <option
                  key={opt.id}
                  value={opt.id}
                  disabled={filterValues[config.key].includes(opt.id)}
                >
                  {opt.name}
                  {filterValues[config.key].includes(opt.id) ? " ✓" : ""}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={resetFilters}
          disabled={activeTags.length === 0}
          className="h-9 px-4 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <RotateCcw size={14} />
          重置
        </button>
      </div>

      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          {activeTags.map((tag) => (
            <span
              key={`${tag.key}-${tag.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/5 text-xs text-primary font-medium"
            >
              {resolveNames(tag.key, [tag.id])[0]}
              <button
                onClick={() => handleRemoveTag(tag.key, tag.id)}
                className="text-text-muted hover:text-danger transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
