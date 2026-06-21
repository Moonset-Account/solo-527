"use client";

import { motion } from "framer-motion";
import { Phone, UserX, Clock, UserCheck } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/KPICards";

interface UnfollowedTrial {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  trialAt: Date;
  elapsedHours: number;
  status: string;
  assigneeName: string;
  assigneeId: string | null;
  thresholdHours: number;
  isOverdue: boolean;
}

interface UnfollowedTrialsListProps {
  items: UnfollowedTrial[];
}

export function UnfollowedTrialsList({ items }: UnfollowedTrialsListProps) {
  if (items.length === 0) {
    return (
      <div className="card-gold p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <UserX className="text-alert-red" size={18} />
          <h3 className="section-title text-base">试听未跟进</h3>
        </div>
        <EmptyState title="暂无待跟进试听" hint="所有试听都已及时跟进" />
      </div>
    );
  }

  return (
    <div className="card-gold p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserX className="text-alert-red" size={18} />
          <h3 className="section-title text-base">试听未跟进</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {items.some((i) => i.isOverdue) && (
            <span className="chip bg-red-50 text-alert-red border border-red-100">
              逾期 {items.filter((i) => i.isOverdue).length}
            </span>
          )}
          <span className="chip bg-deep-blue-50 text-deep-blue-600 border border-deep-blue-100">
            共 {items.length}
          </span>
        </div>
      </div>
      <div className="space-y-2.5 overflow-y-auto scrollbar-thin flex-1 pr-1">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
            className={cn(
              "relative p-3 rounded-lg border transition-all",
              item.isOverdue
                ? "border-alert-red/30 bg-red-50/40 hover:bg-red-50/70"
                : "border-deep-blue-100 bg-white hover:bg-deep-blue-50/40"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-deep-blue-800 truncate">
                  {item.leadName}
                </span>
                {item.isOverdue ? (
                  <span className="chip bg-alert-red text-white !px-2 !py-0 !text-[10px] flex-shrink-0">
                    已逾期
                  </span>
                ) : (
                  <span className="chip bg-warn-orange/10 text-warn-orange border border-warn-orange/20 !px-2 !py-0 !text-[10px] flex-shrink-0">
                    待跟进
                  </span>
                )}
                {item.status === "NO_SHOW" && (
                  <span className="chip bg-deep-blue-700 text-white !px-2 !py-0 !text-[10px] flex-shrink-0">
                    未到课
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-deep-blue-500">
                <Clock size={11} />
                <span className="truncate">
                  {formatDateTime(item.trialAt)}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  item.isOverdue ? "text-alert-red" : "text-warn-orange"
                )}
              >
                <span>已过</span>
                <span className="font-medium num">{item.elapsedHours}</span>
                <span>小时</span>
                {!item.isOverdue && (
                  <span className="text-deep-blue-400">
                    /{item.thresholdHours}h
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-deep-blue-500">
                <Phone size={11} />
                <span className="num">{item.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-deep-blue-500">
                <UserCheck size={11} />
                <span className="truncate">{item.assigneeName}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
