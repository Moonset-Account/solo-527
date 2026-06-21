"use client";

import { motion } from "framer-motion";
import {
  ListTodo,
  PhoneCall,
  PlaySquare,
  GraduationCap,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/KPICards";

type TodoType = "FOLLOW_UP" | "TRIAL" | "LESSON" | "FEEDBACK";

interface TodoItem {
  type: TodoType;
  id: string;
  title: string;
  desc: string;
  href: string;
}

interface TodayTodosListProps {
  items: TodoItem[];
}

const typeConfig: Record<
  TodoType,
  { icon: any; label: string; color: string; bg: string; border: string }
> = {
  FOLLOW_UP: {
    icon: PhoneCall,
    label: "跟进",
    color: "text-ink-gold-600",
    bg: "bg-ink-gold-50",
    border: "border-ink-gold-200",
  },
  TRIAL: {
    icon: PlaySquare,
    label: "试听",
    color: "text-deep-blue-600",
    bg: "bg-deep-blue-50",
    border: "border-deep-blue-200",
  },
  LESSON: {
    icon: GraduationCap,
    label: "上课",
    color: "text-success-green",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  FEEDBACK: {
    icon: MessageSquare,
    label: "反馈",
    color: "text-warn-orange",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
};

const typeCounts = (items: TodoItem[]) => {
  const counts: Record<TodoType, number> = {
    FOLLOW_UP: 0,
    TRIAL: 0,
    LESSON: 0,
    FEEDBACK: 0,
  };
  items.forEach((i) => counts[i.type]++);
  return counts;
};

export function TodayTodosList({ items }: TodayTodosListProps) {
  const counts = typeCounts(items);

  if (items.length === 0) {
    return (
      <div className="card-gold p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <ListTodo className="text-deep-blue-600" size={18} />
          <h3 className="section-title text-base">今日待办</h3>
        </div>
        <EmptyState
          title="今日暂无待办事项"
          hint="享受轻松的一天吧"
          icon={ListTodo}
        />
      </div>
    );
  }

  return (
    <div className="card-gold p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="text-deep-blue-600" size={18} />
          <h3 className="section-title text-base">今日待办</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {(Object.keys(counts) as TodoType[])
            .filter((k) => counts[k] > 0)
            .map((k) => {
              const cfg = typeConfig[k];
              return (
                <span
                  key={k}
                  className={cn(
                    "chip border !text-[10px] !px-2",
                    cfg.bg,
                    cfg.color,
                    cfg.border
                  )}
                >
                  {cfg.label} {counts[k]}
                </span>
              );
            })}
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto scrollbar-thin flex-1 pr-1">
        {items.map((item, idx) => {
          const cfg = typeConfig[item.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className="group flex items-center gap-3 p-2.5 rounded-lg border border-deep-blue-50 hover:border-deep-blue-100 hover:bg-deep-blue-50/40 transition-all cursor-pointer"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border",
                  cfg.bg,
                  cfg.border
                )}
              >
                <Icon size={16} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-deep-blue-800 truncate">
                  {item.title}
                </div>
                {item.desc && (
                  <div className="text-xs text-deep-blue-400 truncate mt-0.5">
                    {item.desc}
                  </div>
                )}
              </div>
              <ChevronRight
                size={16}
                className="flex-shrink-0 text-deep-blue-300 group-hover:text-deep-blue-500 transition-colors"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
