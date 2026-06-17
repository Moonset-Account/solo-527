"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, TrendingDown, Minus, Eye } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { mockMetrics } from "@/services/mockData";
import type { Metric } from "@/types";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

const categoryOptions = [
  { value: "", label: "全部类别" },
  { value: "USER_GROWTH", label: "用户增长" },
  { value: "RETENTION", label: "用户留存" },
  { value: "CONVERSION", label: "转化" },
  { value: "REVENUE", label: "收入" },
  { value: "ENGAGEMENT", label: "用户参与" },
];

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "NORMAL", label: "正常" },
  { value: "WARNING", label: "警告" },
  { value: "CRITICAL", label: "严重" },
];

const categoryLabels: Record<string, string> = {
  USER_GROWTH: "用户增长",
  RETENTION: "用户留存",
  CONVERSION: "转化",
  REVENUE: "收入",
  ENGAGEMENT: "用户参与",
};

export default function MetricsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredMetrics = useMemo(() => {
    return mockMetrics.filter((metric) => {
      const matchesSearch =
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || metric.category === categoryFilter;
      const matchesStatus = !statusFilter || metric.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, categoryFilter, statusFilter]);

  const getStatusType = (status: string): "normal" | "warning" | "critical" => {
    switch (status) {
      case "NORMAL":
        return "normal";
      case "WARNING":
        return "warning";
      case "CRITICAL":
        return "critical";
      default:
        return "normal";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "NORMAL":
        return "正常";
      case "WARNING":
        return "警告";
      case "CRITICAL":
        return "严重";
      default:
        return status;
    }
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === "%") {
      return formatPercent(value);
    }
    return formatNumber(value);
  };

  const columns: Column<Metric>[] = [
    {
      key: "name",
      title: "指标名称",
      dataIndex: "name",
      sortable: true,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{record.name}</p>
            <p className="text-xs text-muted">{record.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      title: "代码",
      dataIndex: "code",
      sortable: true,
      render: (value) => <span className="font-mono text-sm text-muted">{value}</span>,
    },
    {
      key: "category",
      title: "类别",
      dataIndex: "category",
      sortable: true,
      render: (value) => (
        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          {categoryLabels[value as string] || value}
        </span>
      ),
    },
    {
      key: "currentValue",
      title: "当前值",
      dataIndex: "currentValue",
      sortable: true,
      align: "right",
      render: (value, record) => (
        <div className="text-right">
          <span className="font-semibold text-foreground font-display">
            {formatValue(value as number, record.unit)}
          </span>
          <span className="text-muted text-sm ml-1">{record.unit === "%" ? "" : record.unit}</span>
        </div>
      ),
    },
    {
      key: "changeRate",
      title: "变化率",
      dataIndex: "changeRate",
      sortable: true,
      align: "right",
      render: (value, record) => {
        const rate = value as number;
        const TrendIcon = rate > 0 ? TrendingUp : rate < 0 ? TrendingDown : Minus;
        return (
          <div
            className={cn(
              "flex items-center justify-end gap-1 font-medium font-display",
              rate > 0 && "text-success",
              rate < 0 && "text-danger",
              rate === 0 && "text-muted"
            )}
          >
            <TrendIcon className="w-4 h-4" />
            <span>{formatPercent(Math.abs(rate))}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "状态",
      dataIndex: "status",
      sortable: true,
      align: "center",
      render: (value) => (
        <StatusBadge status={getStatusType(value as string)}>
          {getStatusLabel(value as string)}
        </StatusBadge>
      ),
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
            router.push(`/metrics/${record.id}`);
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "指标管理" }]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">指标列表</h1>
            <p className="text-sm text-muted mt-1">管理和查看所有业务指标</p>
          </div>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="搜索指标名称或代码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
            </div>
          </div>

          <DataTable
            columns={columns as any}
            data={filteredMetrics as any}
            rowKey="id"
            pageSize={10}
            onRowClick={(record) => router.push(`/metrics/${(record as any).id}`)}
          />
        </Card>
      </div>
    </Layout>
  );
}
