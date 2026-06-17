"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Eye,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { mockAnomalies } from "@/services/mockData";
import type { Anomaly } from "@/types";
import {
  cn,
  formatNumber,
  formatPercent,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "OPEN", label: "待处理" },
  { value: "INVESTIGATING", label: "处理中" },
  { value: "RESOLVED", label: "已解决" },
  { value: "IGNORED", label: "已忽略" },
];

const severityOptions = [
  { value: "", label: "全部级别" },
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "CRITICAL", label: "严重" },
];

const statusLabels: Record<string, string> = {
  OPEN: "待处理",
  INVESTIGATING: "处理中",
  RESOLVED: "已解决",
  IGNORED: "已忽略",
};

const severityLabels: Record<string, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重",
};

const getStatusType = (status: string): "warning" | "info" | "success" | "pending" => {
  switch (status) {
    case "OPEN":
      return "warning";
    case "INVESTIGATING":
      return "info";
    case "RESOLVED":
      return "success";
    case "IGNORED":
      return "pending";
    default:
      return "pending";
  }
};

const getSeverityType = (severity: string): "normal" | "warning" | "critical" => {
  switch (severity) {
    case "LOW":
    case "MEDIUM":
      return "normal";
    case "HIGH":
      return "warning";
    case "CRITICAL":
      return "critical";
    default:
      return "normal";
  }
};

export default function AnomaliesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const stats = useMemo(() => {
    return {
      pending: mockAnomalies.filter((a) => a.status === "OPEN").length,
      investigating: mockAnomalies.filter((a) => a.status === "INVESTIGATING").length,
      resolved: mockAnomalies.filter((a) => a.status === "RESOLVED").length,
      ignored: mockAnomalies.filter((a) => a.status === "IGNORED").length,
    };
  }, []);

  const filteredAnomalies = useMemo(() => {
    return mockAnomalies.filter((anomaly) => {
      const matchesSearch =
        anomaly.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anomaly.rootCause?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || anomaly.status === statusFilter;
      const matchesSeverity = !severityFilter || anomaly.severity === severityFilter;
      const matchesStart = !dateRange.startDate || anomaly.detectedAt >= new Date(dateRange.startDate);
      const matchesEnd =
        !dateRange.endDate || anomaly.detectedAt <= new Date(dateRange.endDate + "T23:59:59");
      return matchesSearch && matchesStatus && matchesSeverity && matchesStart && matchesEnd;
    });
  }, [searchTerm, statusFilter, severityFilter, dateRange]);

  const formatValue = (value: number, metricName: string): string => {
    if (metricName.includes("率") || metricName.includes("转化率")) {
      return formatPercent(value);
    }
    return formatNumber(value);
  };

  const columns: Column<Anomaly>[] = [
    {
      key: "detectedAt",
      title: "异常时间",
      dataIndex: "detectedAt",
      sortable: true,
      render: (value) => (
        <div>
          <p className="font-medium text-foreground">{formatDateTime(value as Date)}</p>
          <p className="text-xs text-muted">{formatRelativeTime(value as Date)}</p>
        </div>
      ),
    },
    {
      key: "metricName",
      title: "指标名称",
      dataIndex: "metricName",
      sortable: true,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              record.severity === "CRITICAL"
                ? "bg-danger/10"
                : record.severity === "HIGH"
                ? "bg-warning/10"
                : "bg-primary/10"
            )}
          >
            <AlertTriangle
              className={cn(
                "w-5 h-5",
                record.severity === "CRITICAL"
                  ? "text-danger"
                  : record.severity === "HIGH"
                  ? "text-warning"
                  : "text-primary"
              )}
            />
          </div>
          <span className="font-medium text-foreground">{record.metricName}</span>
        </div>
      ),
    },
    {
      key: "actualValue",
      title: "实际值",
      dataIndex: "actualValue",
      sortable: true,
      align: "right",
      render: (value, record) => (
        <span className="font-semibold font-display text-danger">
          {formatValue(value as number, record.metricName)}
        </span>
      ),
    },
    {
      key: "expectedValue",
      title: "预期值",
      dataIndex: "expectedValue",
      sortable: true,
      align: "right",
      render: (value, record) => (
        <span className="font-medium font-display text-muted">
          {formatValue(value as number, record.metricName)}
        </span>
      ),
    },
    {
      key: "deviationPercent",
      title: "偏离幅度",
      dataIndex: "deviationPercent",
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-semibold font-display text-danger">
          ↓ {formatPercent(value as number)}
        </span>
      ),
    },
    {
      key: "severity",
      title: "严重级别",
      dataIndex: "severity",
      sortable: true,
      align: "center",
      render: (value) => (
        <StatusBadge status={getSeverityType(value as string)}>
          {severityLabels[value as string]}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      title: "状态",
      dataIndex: "status",
      sortable: true,
      align: "center",
      render: (value) => (
        <StatusBadge status={getStatusType(value as string)}>
          {statusLabels[value as string]}
        </StatusBadge>
      ),
    },
    {
      key: "assigneeName",
      title: "负责人",
      dataIndex: "assigneeName",
      render: (value) => {
        if (!value) return <span className="text-muted">-</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
              {(value as string).charAt(0)}
            </div>
            <span className="text-foreground">{value as string}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "id",
      align: "center",
      render: (_, record) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/anomalies/${record.id}`);
          }}
        >
          分析
        </Button>
      ),
    },
  ];

  const statCards = [
    {
      label: "待处理",
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "处理中",
      value: stats.investigating,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "已解决",
      value: stats.resolved,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "已忽略",
      value: stats.ignored,
      icon: <MinusCircle className="w-5 h-5" />,
      color: "text-muted",
      bgColor: "bg-muted/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "异常管理" }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">异常列表</h1>
            <p className="text-sm text-muted mt-1">监控和处理指标异常波动</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className={cn("text-3xl font-bold mt-2 font-display", stat.color)}>
                    {stat.value}
                  </p>
                </div>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="搜索指标名称、异常原因..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {severityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <span className="text-sm text-muted flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                时间范围：
              </span>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <span className="text-muted">至</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <DataTable
            columns={columns as any}
            data={filteredAnomalies as any}
            rowKey="id"
            pageSize={10}
            onRowClick={(record) => router.push(`/anomalies/${(record as any).id}`)}
          />
        </Card>
      </div>
    </Layout>
  );
}
