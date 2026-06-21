"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/KPICards";

interface RenewalRisk {
  id: string;
  name: string;
  remainingHours: number;
  totalHours: number;
  level: "HIGH" | "MID" | "LOW";
  classes: string[];
  expectedDaysLeft: number;
  lastFollowUp: Date | null;
}

interface RenewalRisksListProps {
  items: RenewalRisk[];
}

const levelStyles = {
  HIGH: {
    badge: "bg-alert-red text-white",
    border: "border-alert-red/40",
    text: "text-alert-red",
    breathe: true,
  },
  MID: {
    badge: "bg-warn-orange text-white",
    border: "border-warn-orange/30",
    text: "text-warn-orange",
    breathe: false,
  },
  LOW: {
    badge: "bg-success-green text-white",
    border: "border-success-green/30",
    text: "text-success-green",
    breathe: false,
  },
};

const levelLabel: Record<string, string> = {
  HIGH: "高风险",
  MID: "中风险",
  LOW: "低风险",
};

export function RenewalRisksList({ items }: RenewalRisksListProps) {
  if (items.length === 0) {
    return (
      <div className="card-gold p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-alert-red" size={18} />
          <h3 className="section-title text-base">续费风险学员</h3>
        </div>
        <EmptyState title="暂无续费风险学员" hint="所有学员课时充足" />
      </div>
    );
  }

  return (
    <div className="card-gold p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-alert-red" size={18} />
          <h3 className="section-title text-base">续费风险学员</h3>
        </div>
        <span className="chip bg-red-50 text-alert-red border border-red-100">
          共 {items.length} 人
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto scrollbar-thin flex-1 pr-1">
        {items.map((item, idx) => {
          const style = levelStyles[item.level];
          const progress = Math.round(
            ((item.totalHours - item.remainingHours) / item.totalHours) * 100
          );
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className={cn(
                "relative p-3.5 rounded-lg border-2 bg-white transition-all",
                style.border,
                style.breathe && "animate-breathe-red"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-deep-blue-800 truncate">
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        "chip !px-2 !py-0 !text-[10px] flex-shrink-0",
                        style.badge
                      )}
                    >
                      {levelLabel[item.level]}
                    </span>
                  </div>
                  {item.classes.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-deep-blue-400">
                      <BookOpen size={12} />
                      <span className="truncate">{item.classes.join("、")}</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={cn("num text-lg font-semibold", style.text)}
                  >
                    {item.remainingHours}
                  </div>
                  <div className="text-[10px] text-deep-blue-400">剩余课时</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-deep-blue-50 rounded-full overflow-hidden mb-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    item.level === "HIGH"
                      ? "bg-alert-red"
                      : item.level === "MID"
                      ? "bg-warn-orange"
                      : "bg-success-green"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {item.expectedDaysLeft > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-deep-blue-400">
                    <Clock size={11} />
                    <span>预计可用</span>
                    <span className={cn("font-medium num", style.text)}>
                      {item.expectedDaysLeft}
                    </span>
                    <span>天</span>
                  </div>
                  <span className="text-deep-blue-400">
                    进度 {progress}%
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
