"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  RotateCcw,
  Play,
  User,
  Calendar,
  TrendingUp,
  Link2,
  MessageSquare,
  Save,
  Edit2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { RemarkModal } from "@/components/RemarkModal";
import { Modal } from "@/components/Modal";
import { mockAnomalies, getMockMetricData, mockMetrics } from "@/services/mockData";
import type { Anomaly, Metric } from "@/types";
import {
  cn,
  formatNumber,
  formatPercent,
  formatDateTime,
  formatRelativeTime,
  formatDate,
} from "@/lib/utils";

const rootCauseCategories = [
  { value: "DATA_QUALITY", label: "数据质量问题" },
  { value: "BUSINESS_CHANGE", label: "业务变更" },
  { value: "SYSTEM_FAILURE", label: "系统故障" },
  { value: "EXTERNAL_FACTOR", label: "外部因素" },
  { value: "OTHER", label: "其他" },
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

interface TimelineEvent {
  id: string;
  time: Date;
  type: "detect" | "investigate" | "resolve" | "update";
  content: string;
  operator: string;
}

export default function AnomalyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const anomalyId = params.id as string;

  const anomaly = useMemo(() => {
    return mockAnomalies.find((a) => a.id === anomalyId) || mockAnomalies[0];
  }, [anomalyId]);

  const metric = useMemo(() => {
    return mockMetrics.find((m) => m.id === anomaly.metricId) || mockMetrics[0];
  }, [anomaly]);

  const [anomalyStatus, setAnomalyStatus] = useState(anomaly.status);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [remarkModalConfig, setRemarkModalConfig] = useState({
    title: "请输入备注",
    placeholder: "请输入操作备注...",
    onConfirm: async (remark: string) => {},
  });

  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisForm, setAnalysisForm] = useState({
    rootCauseCategory: anomaly.rootCauseCategory || "",
    rootCause: anomaly.rootCause || "",
    impactAssessment: anomaly.impactAssessment || "",
    resolution: anomaly.resolution || "",
  });

  const formatValue = (value: number): string => {
    if (metric.unit === "%") {
      return formatPercent(value);
    }
    return formatNumber(value);
  };

  const openRemarkModal = (config: {
    title: string;
    placeholder: string;
    onConfirm: (remark: string) => void | Promise<void>;
  }) => {
    setRemarkModalConfig(config);
    setRemarkModalOpen(true);
  };

  const handleStatusChange = (newStatus: string, action: string) => {
    openRemarkModal({
      title: action,
      placeholder: `请输入${action}的原因说明...`,
      onConfirm: async (remark) => {
        setAnomalyStatus(newStatus as any);
        console.log("操作备注:", remark);
      },
    });
  };

  const handleSaveAnalysis = () => {
    setAnalysisModalOpen(false);
    openRemarkModal({
      title: "保存分析结果",
      placeholder: "请输入本次分析更新的备注说明...",
      onConfirm: async (remark) => {
        console.log("保存分析结果:", analysisForm);
        console.log("操作备注:", remark);
      },
    });
  };

  const timelineEvents: TimelineEvent[] = [
    {
      id: "event-1",
      time: anomaly.createdAt,
      type: "detect",
      content: `异常检测：${anomaly.metricName} 实际值 ${formatValue(anomaly.actualValue)}，预期值 ${formatValue(anomaly.expectedValue)}，偏离 ${formatPercent(anomaly.deviationPercent)}`,
      operator: "系统自动检测",
    },
    {
      id: "event-2",
      time: new Date(anomaly.createdAt.getTime() + 1000 * 60 * 30),
      type: "investigate",
      content: `已分配给 ${anomaly.assigneeName} 进行调查处理`,
      operator: "系统",
    },
    {
      id: "event-3",
      time: new Date(anomaly.createdAt.getTime() + 1000 * 60 * 60),
      type: "update",
      content: anomaly.rootCause || "正在调查异常原因...",
      operator: anomaly.assigneeName || "负责人",
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "detect":
        return <AlertTriangle className="w-4 h-4 text-danger" />;
      case "investigate":
        return <Play className="w-4 h-4 text-primary" />;
      case "resolve":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "update":
        return <MessageSquare className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "detect":
        return "border-danger bg-danger/10";
      case "investigate":
        return "border-primary bg-primary/10";
      case "resolve":
        return "border-success bg-success/10";
      case "update":
        return "border-warning bg-warning/10";
      default:
        return "border-muted bg-muted/10";
    }
  };

  const anomalyChartData = useMemo(() => {
    const baseData = getMockMetricData(anomaly.metricId);
    const anomalyDate = formatDate(anomaly.detectedAt);

    return [
      {
        dataKey: "metric",
        name: anomaly.metricName,
        color: "#3B82F6",
        data: baseData,
      },
    ];
  }, [anomaly]);

  const anomalyPoints = useMemo(() => {
    return [
      {
        date: formatDate(anomaly.detectedAt),
        value: anomaly.actualValue,
        metricName: anomaly.metricName,
        severity: anomaly.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      },
    ];
  }, [anomaly]);

  const relatedMetrics = useMemo(() => {
    return mockMetrics
      .filter((m) => m.id !== anomaly.metricId)
      .slice(0, 3)
      .map((m) => ({
        metric: m,
        data: getMockMetricData(m.id),
      }));
  }, [anomaly.metricId]);

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "异常管理", href: "/anomalies" },
            { label: "异常分析" },
          ]}
        />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">异常分析</h1>
              <StatusBadge status={getSeverityType(anomaly.severity)}>
                {severityLabels[anomaly.severity]}
              </StatusBadge>
              <StatusBadge status={getStatusType(anomalyStatus)}>
                {statusLabels[anomalyStatus]}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted mt-1">
              检测时间：{formatDateTime(anomaly.detectedAt)}（{formatRelativeTime(anomaly.detectedAt)}）
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {anomalyStatus === "OPEN" && (
              <Button
                variant="primary"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => handleStatusChange("INVESTIGATING", "标记处理中")}
              >
                标记处理中
              </Button>
            )}
            {anomalyStatus === "INVESTIGATING" && (
              <Button
                variant="primary"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleStatusChange("RESOLVED", "标记已解决")}
              >
                标记已解决
              </Button>
            )}
            {(anomalyStatus === "RESOLVED" || anomalyStatus === "IGNORED") && (
              <Button
                variant="outline"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => handleStatusChange("INVESTIGATING", "重新打开")}
              >
                重新打开
              </Button>
            )}
            {anomalyStatus === "OPEN" && (
              <Button
                variant="outline"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleStatusChange("IGNORED", "标记已忽略")}
              >
                标记已忽略
              </Button>
            )}
          </div>
        </div>

        <Card title="异常基本信息">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted">指标名称</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{anomaly.metricName}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">实际值</p>
              <p className="text-xl font-bold text-danger font-display">
                {formatValue(anomaly.actualValue)}
                <span className="text-sm font-normal text-muted ml-1">
                  {metric.unit === "%" ? "" : metric.unit}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">预期值</p>
              <p className="text-xl font-semibold text-muted font-display">
                {formatValue(anomaly.expectedValue)}
                <span className="text-sm font-normal ml-1">
                  {metric.unit === "%" ? "" : metric.unit}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">偏离幅度</p>
              <p className="text-xl font-bold text-danger font-display">
                ↓ {formatPercent(anomaly.deviationPercent)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">检测时间</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <span className="text-foreground">{formatDateTime(anomaly.detectedAt)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">负责人</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {anomaly.assigneeName?.charAt(0) || "?"}
                </div>
                <span className="text-foreground">{anomaly.assigneeName || "未分配"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">严重级别</p>
              <StatusBadge status={getSeverityType(anomaly.severity)}>
                {severityLabels[anomaly.severity]}
              </StatusBadge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted">当前状态</p>
              <StatusBadge status={getStatusType(anomalyStatus)}>
                {statusLabels[anomalyStatus]}
              </StatusBadge>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>波动趋势</span>
              </div>
            </div>
          }
          description="异常发生前后的指标波动情况，红色虚线标注异常发生时间点"
        >
          <TrendChart
            series={anomalyChartData}
            anomalyPoints={anomalyPoints}
            height={350}
            showLegend={false}
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span>原因分析</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-4 h-4" />}
                  onClick={() => setAnalysisModalOpen(true)}
                >
                  编辑分析
                </Button>
              </div>
            }
            description="异常原因分类、影响评估和处理方案"
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">原因分类</p>
                <p className="text-foreground">
                  {anomaly.rootCauseCategory
                    ? rootCauseCategories.find((c) => c.value === anomaly.rootCauseCategory)?.label
                    : "待分析"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">根本原因</p>
                <p className="text-foreground">{anomaly.rootCause || "待分析"}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">影响评估</p>
                <p className="text-foreground">{anomaly.impactAssessment || "待评估"}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">处理方案</p>
                <p className="text-foreground">{anomaly.resolution || "待制定"}</p>
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>处理过程</span>
              </div>
            }
            description="异常处理的时间线记录"
          >
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-card-border" />
              <div className="space-y-6">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="relative flex gap-4">
                    <div
                      className={cn(
                        "relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2",
                        getEventColor(event.type)
                      )}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <span>{formatDateTime(event.time)}</span>
                        <span>·</span>
                        <span>{event.operator}</span>
                      </div>
                      <p className="text-foreground mt-1">{event.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              <span>关联指标分析</span>
            </div>
          }
          description="相关指标的同期波动情况，帮助判断异常影响范围"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedMetrics.map(({ metric: m, data }) => (
              <Card key={m.id} bordered={false} className="bg-muted/5 shadow-none p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted">{m.code}</p>
                  </div>
                  <StatusBadge
                    status={
                      m.status === "NORMAL"
                        ? "normal"
                        : m.status === "WARNING"
                        ? "warning"
                        : "critical"
                    }
                    size="sm"
                  >
                    {m.status === "NORMAL"
                      ? "正常"
                      : m.status === "WARNING"
                      ? "警告"
                      : "严重"}
                  </StatusBadge>
                </div>
                <div className="mb-2">
                  <p className="text-2xl font-bold font-display text-foreground">
                    {m.unit === "%" ? formatPercent(m.currentValue) : formatNumber(m.currentValue)}
                    <span className="text-sm font-normal text-muted ml-1">
                      {m.unit === "%" ? "" : m.unit}
                    </span>
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      m.changeRate > 0 && "text-success",
                      m.changeRate < 0 && "text-danger"
                    )}
                  >
                    {m.changeRate > 0 ? "↑" : m.changeRate < 0 ? "↓" : ""}{" "}
                    {formatPercent(Math.abs(m.changeRate))}
                  </p>
                </div>
                <TrendChart
                  series={[
                    {
                      dataKey: `related-${m.id}`,
                      name: m.name,
                      color: m.status === "NORMAL" ? "#10B981" : "#F59E0B",
                      data,
                    },
                  ]}
                  height={120}
                  showLegend={false}
                  showGrid={false}
                  className="!-mx-2"
                />
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        title={remarkModalConfig.title}
        placeholder={remarkModalConfig.placeholder}
        onConfirm={async (remark) => {
          await remarkModalConfig.onConfirm(remark);
          setRemarkModalOpen(false);
        }}
      />

      <Modal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        title="编辑异常分析"
        onConfirm={handleSaveAnalysis}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              原因分类 <span className="text-danger">*</span>
            </label>
            <select
              value={analysisForm.rootCauseCategory}
              onChange={(e) =>
                setAnalysisForm((prev) => ({
                  ...prev,
                  rootCauseCategory: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">请选择原因分类</option>
              {rootCauseCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              根本原因 <span className="text-danger">*</span>
            </label>
            <textarea
              value={analysisForm.rootCause}
              onChange={(e) =>
                setAnalysisForm((prev) => ({ ...prev, rootCause: e.target.value }))
              }
              placeholder="请详细描述异常的根本原因"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              影响评估 <span className="text-danger">*</span>
            </label>
            <textarea
              value={analysisForm.impactAssessment}
              onChange={(e) =>
                setAnalysisForm((prev) => ({
                  ...prev,
                  impactAssessment: e.target.value,
                }))
              }
              placeholder="请评估异常对业务的影响范围和程度"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              处理方案 <span className="text-danger">*</span>
            </label>
            <textarea
              value={analysisForm.resolution}
              onChange={(e) =>
                setAnalysisForm((prev) => ({ ...prev, resolution: e.target.value }))
              }
              placeholder="请描述具体的处理方案和改进措施"
              rows={3}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
