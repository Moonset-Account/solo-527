"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TimelineItem {
  dotColor: string;
  time: string;
  author: string;
  content: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="relative flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full ring-4 ring-white shrink-0"
                style={{ backgroundColor: item.dotColor }}
              />
              {!isLast && (
                <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span className="font-medium text-slate-600">{item.author}</span>
                <span>{item.time}</span>
              </div>
              <div className="text-sm text-slate-700">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { Timeline };
export type { TimelineItem };
