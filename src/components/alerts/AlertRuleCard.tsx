"use client";

import { Pencil, Trash2, AlertTriangle, Clock } from "lucide-react";
import {
  severityConfig,
  periodConfig,
  thresholdTypeConfig,
  directionConfig,
  formatDate,
} from "@/utils/format";

type AlertPeriod = "DAY" | "WEEK" | "MONTH";
type ThresholdType = "ABSOLUTE" | "PERCENTAGE";
type AlertDirection = "ABOVE" | "BELOW" | "BOTH";
type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface AlertRule {
  id: string;
  name: string;
  metricId: string;
  metric: { id: string; name: string; code: string; unit: string };
  period: string;
  thresholdType: string;
  thresholdValue: number;
  direction: string;
  severity: string;
  channels: { type: string; recipients: string[] }[];
  isEnabled: boolean;
  createdBy: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
  _count: { anomalies: number };
}

interface AlertRuleCardProps {
  rule: AlertRule;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AlertRuleCard({ rule, onToggle, onEdit, onDelete }: AlertRuleCardProps) {
  const severity = severityConfig[rule.severity as AlertSeverity];
  const period = periodConfig[rule.period as AlertPeriod];
  const thresholdType = thresholdTypeConfig[rule.thresholdType as ThresholdType];
  const direction = directionConfig[rule.direction as AlertDirection];

  const channelLabels: Record<string, string> = {
    in_app: "站内信",
    email: "邮件",
    wework: "企业微信",
  };

  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${severity.dot} flex-shrink-0`} />
            <h3 className="text-sm font-semibold text-neutral-800 truncate">
              {rule.name}
            </h3>
            <span className={`badge ${severity.bg} ${severity.color} flex-shrink-0`}>
              {severity.label}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">监控指标</p>
              <p className="text-sm text-neutral-700 font-medium">{rule.metric.name}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">统计周期</p>
              <p className="text-sm text-neutral-700 font-medium">{period.label}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">阈值条件</p>
              <p className="text-sm text-neutral-700 font-medium">
                {direction.label}
                <span className="font-mono ml-1">
                  {rule.thresholdType === "PERCENTAGE"
                    ? `${Math.abs(rule.thresholdValue)}%`
                    : rule.thresholdValue}
                </span>
                <span className="text-neutral-400 ml-1">({thresholdType.label})</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">告警渠道</p>
              <div className="flex flex-wrap gap-1">
                {rule.channels.map((ch, i) => (
                  <span key={i} className="badge badge-neutral">
                    {channelLabels[ch.type] || ch.type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {rule._count.anomalies} 次异常
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              更新于 {formatDate(rule.updatedAt)}
            </span>
            <span>创建者: {rule.createdBy.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rule.isEnabled}
              onChange={() => onToggle(rule.id)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
          </label>

          <div className="flex items-center gap-1 opacity-50 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(rule.id)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-primary-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
