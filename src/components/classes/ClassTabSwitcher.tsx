"use client";

import { useState } from "react";
import { CalendarDays, Users, Clock, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClassTabType = "schedule" | "students" | "consumptions" | "works";

interface ClassTabSwitcherProps {
  initialTab?: ClassTabType;
  classId: string;
}

const TABS: { key: ClassTabType; label: string; Icon: any }[] = [
  { key: "schedule", label: "课程表", Icon: CalendarDays },
  { key: "students", label: "学员管理", Icon: Users },
  { key: "consumptions", label: "消课记录", Icon: Clock },
  { key: "works", label: "学员作品", Icon: Palette },
];

export function ClassTabSwitcher({ initialTab = "schedule", classId }: ClassTabSwitcherProps) {
  const [activeTab, setActiveTab] = useState<ClassTabType>(initialTab);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-deep-blue-50/40 border-b border-deep-blue-50 overflow-x-auto scrollbar-thin">
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                active
                  ? "bg-white text-deep-blue-700 shadow-sm border border-deep-blue-100"
                  : "text-deep-blue-500 hover:text-deep-blue-700 hover:bg-white/50",
              )}
            >
              <Icon
                size={16}
                className={cn(active ? "text-ink-gold-500" : "text-deep-blue-400")}
              />
              {label}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-ink-gold-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useClassTab(initialTab: ClassTabType = "schedule") {
  const [activeTab, setActiveTab] = useState<ClassTabType>(initialTab);
  return { activeTab, setActiveTab };
}
