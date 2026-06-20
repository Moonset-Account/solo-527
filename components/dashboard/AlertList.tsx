"use client";

import { Clock, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusText, formatDateTime, getPriorityColor } from "@/lib/utils";
import Link from "next/link";

interface Alert {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: string;
  type: "SLA_WARNING" | "SLA_BREACH" | "HIT_NOTIFICATION" | "KNOWLEDGE_EXPIRY";
  ticketId?: string;
  knowledgeId?: string;
  createdAt: Date;
  deadline?: Date;
}

const typeIcons = {
  SLA_WARNING: AlertTriangle,
  SLA_BREACH: AlertCircle,
  HIT_NOTIFICATION: Info,
  KNOWLEDGE_EXPIRY: AlertTriangle,
};

const typeColors = {
  SLA_WARNING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  SLA_BREACH: "bg-red-500/10 text-red-600 border-red-500/20 animate-breathe",
  HIT_NOTIFICATION: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  KNOWLEDGE_EXPIRY: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const typeLabels = {
  SLA_WARNING: "SLA预警",
  SLA_BREACH: "SLA超时",
  HIT_NOTIFICATION: "知识命中",
  KNOWLEDGE_EXPIRY: "知识过期",
};

const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "工单 #1001 即将超时",
    priority: "HIGH",
    status: "PENDING",
    type: "SLA_WARNING",
    ticketId: "T001",
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    deadline: new Date(Date.now() + 15 * 60 * 1000),
  },
  {
    id: "2",
    title: "工单 #998 已超时",
    priority: "HIGH",
    status: "ESCALATED",
    type: "SLA_BREACH",
    ticketId: "T002",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "新知识命中：退换货处理",
    priority: "MEDIUM",
    status: "PENDING",
    type: "HIT_NOTIFICATION",
    knowledgeId: "K001",
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "4",
    title: "知识条目即将失效",
    priority: "LOW",
    status: "PENDING_INVALID",
    type: "KNOWLEDGE_EXPIRY",
    knowledgeId: "K005",
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "5",
    title: "工单 #1005 响应超时",
    priority: "MEDIUM",
    status: "PROCESSING",
    type: "SLA_WARNING",
    ticketId: "T005",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    deadline: new Date(Date.now() + 30 * 60 * 1000),
  },
];

export function AlertList() {
  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          实时预警
        </CardTitle>
        <Badge variant="danger" className="animate-breathe">
          {mockAlerts.filter((a) => a.priority === "HIGH").length} 条紧急
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAlerts.map((alert, index) => {
          const Icon = typeIcons[alert.type];
          return (
            <div
              key={alert.id}
              className="group flex items-start gap-4 rounded-lg border border-slate-200/50 bg-white p-4 transition-all duration-200 hover:border-slate-200 hover:shadow-md animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${typeColors[alert.type]}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={typeColors[alert.type]}>
                    {typeLabels[alert.type]}
                  </Badge>
                  <span
                    className={`h-2 w-2 rounded-full ${getPriorityColor(alert.priority)}`}
                  />
                  <span className="text-xs text-slate-500">
                    {getStatusText(alert.priority)}优先级
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {alert.title}
                </p>
                <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(alert.createdAt)}
                  </span>
                  {alert.deadline && (
                    <span className="text-amber-600">
                      剩余 {Math.ceil((alert.deadline.getTime() - Date.now()) / 60000)} 分钟
                    </span>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="sm" asChild>
                <Link href={alert.ticketId ? `/trajectory/${alert.ticketId}` : `/hits`}>
                  查看
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
