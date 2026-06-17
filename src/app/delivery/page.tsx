"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  Calendar,
  User,
  Flag,
  MessageSquare,
  Plus,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { RemarkModal } from "@/components/RemarkModal";
import { mockDeliveryProjects, mockReviewReports, mockMetrics } from "@/services/mockData";
import { formatDate, formatDateTime, formatPercent, formatNumber, cn } from "@/lib/utils";
import type { DeliveryProject, ReviewReport, Milestone } from "@/types";
import type { DeliveryStatus, MilestoneStatus } from "@prisma/client";

const deliveryStatusMap: Record<DeliveryStatus, { label: string; status: "pending" | "success" | "info" | "warning" }> = {
  PENDING: { label: "待开始", status: "pending" },
  IN_PROGRESS: { label: "进行中", status: "info" },
  COMPLETED: { label: "已完成", status: "success" },
  DELAYED: { label: "已延期", status: "warning" },
};

const milestoneStatusMap: Record<MilestoneStatus, { label: string; status: "pending" | "success" | "info" }> = {
  PENDING: { label: "待开始", status: "pending" },
  IN_PROGRESS: { label: "进行中", status: "info" },
  COMPLETED: { label: "已完成", status: "success" },
};

const severityColors: Record<string, string> = {
  LOW: "bg-blue-500",
  MEDIUM: "bg-warning",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-danger",
};

const categoryLabels: Record<string, string> = {
  DATA_QUALITY: "数据质量",
  BUSINESS_CHANGE: "业务变更",
  SYSTEM_FAILURE: "系统故障",
  EXTERNAL_FACTOR: "外部因素",
  OTHER: "其他",
};

export default function DeliveryPage() {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "reports">("projects");

  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DeliveryProject | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [progressLoading, setProgressLoading] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null);
  const [reportDetailModalOpen, setReportDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, reportsRes] = await Promise.all([
        fetch("/api/delivery/projects"),
        fetch("/api/delivery/reports"),
      ]);
      const projectsData = await projectsRes.json();
      const reportsData = await reportsRes.json();
      if (projectsData.success) setProjects(projectsData.data);
      if (reportsData.success) setReports(reportsData.data);
    } catch {
      setProjects(mockDeliveryProjects);
      setReports(mockReviewReports);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = (project: DeliveryProject) => {
    setSelectedProject(project);
    setNewProgress(project.progress);
    setRemarkModalOpen(true);
  };

  const handleSubmitProgress = async (remark: string) => {
    if (!selectedProject) return;
    setProgressLoading(true);
    try {
      const res = await fetch(`/api/delivery/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newProgress, remark }),
      });
      const data = await res.json();
      if (data.success) {
        setRemarkModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Update progress error:", err);
      alert("更新失败，请重试");
    } finally {
      setProgressLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedMonth) return;
    setReportLoading(true);
    try {
      const res = await fetch("/api/delivery/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await res.json();
      if (data.success) {
        setReportModalOpen(false);
        fetchData();
        setSelectedReport(data.data);
        setReportDetailModalOpen(true);
      }
    } catch (err) {
      console.error("Generate report error:", err);
      alert("生成失败，请重试");
    } finally {
      setReportLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-success";
    if (progress >= 50) return "bg-primary";
    if (progress >= 20) return "bg-warning";
    return "bg-danger";
  };

  const renderMilestone = (milestone: Milestone) => {
    const config = milestoneStatusMap[milestone.status];
    return (
      <div key={milestone.id} className="flex items-center gap-3 py-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            milestone.status === "COMPLETED" ? "bg-success" : milestone.status === "IN_PROGRESS" ? "bg-primary" : "bg-muted"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground">{milestone.name}</div>
          <div className="text-xs text-muted">{formatDate(milestone.dueDate)}</div>
        </div>
        <StatusBadge status={config.status} size="sm">
          {config.label}
        </StatusBadge>
      </div>
    );
  };

  const metricColumns: Column<ReviewReport["metricsSummary"][0]>[] = [
    {
      key: "metricName",
      title: "指标名称",
      dataIndex: "metricName",
    },
    {
      key: "targetValue",
      title: "目标值",
      dataIndex: "targetValue",
      render: (value) => formatNumber(value as number),
      align: "right",
    },
    {
      key: "actualValue",
      title: "实际值",
      dataIndex: "actualValue",
      render: (value) => formatNumber(value as number),
      align: "right",
    },
    {
      key: "completionRate",
      title: "完成率",
      dataIndex: "completionRate",
      render: (value) => {
        const rate = value as number;
        return (
          <span className={cn(
            "font-medium",
            rate >= 1 ? "text-success" : rate >= 0.8 ? "text-warning" : "text-danger"
          )}>
            {formatPercent(rate)}
          </span>
        );
      },
      align: "right",
    },
    {
      key: "anomalyCount",
      title: "异常数",
      dataIndex: "anomalyCount",
      render: (value) => (
        <span className={cn(
          (value as number) > 0 ? "text-danger" : "text-success"
        )}>
          {value as number}
        </span>
      ),
      align: "center",
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const latestReport = reports[0];

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "交付管理", href: "/delivery" }, { label: activeTab === "projects" ? "项目列表" : "复盘报表" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">交付进度</h1>
            <p className="text-muted mt-1">管理项目交付进度和月底复盘</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setReportModalOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              生成复盘报表
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-card-border">
          {[
            { key: "projects", label: "项目列表", icon: <Truck className="w-4 h-4" /> },
            { key: "reports", label: "复盘报表", icon: <BarChart3 className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "projects" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => {
              const statusConfig = deliveryStatusMap[project.status];
              const latestRemark = project.remarks[project.remarks.length - 1];
              return (
                <Card key={project.id} hoverable>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-muted mt-1 line-clamp-2">{project.description}</p>
                      </div>
                      <StatusBadge status={statusConfig.status}>{statusConfig.label}</StatusBadge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {project.ownerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">项目进度</span>
                        <span className="text-sm font-bold text-primary">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", getProgressColor(project.progress))}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Flag className="w-4 h-4 text-primary" />
                        里程碑
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {project.milestones.map(renderMilestone)}
                      </div>
                    </div>

                    {latestRemark && (
                      <div className="p-3 bg-muted/5 rounded-lg">
                        <div className="text-xs text-muted mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          最新备注 · {formatDateTime(latestRemark.createdAt)} · {latestRemark.createdByName}
                        </div>
                        <p className="text-sm text-foreground">{latestRemark.content}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleUpdateProgress(project)}
                      >
                        更新进度
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "reports" && latestReport && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {latestReport.month} 月度复盘报表
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport(latestReport);
                  setReportDetailModalOpen(true);
                }}
              >
                查看详情
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">交付完成率</p>
                    <p className="text-2xl font-bold text-success">
                      {formatPercent(latestReport.deliverySummary.onTimeRate)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted">
                  完成 {latestReport.deliverySummary.completedProjects} / {latestReport.deliverySummary.totalProjects} 个项目
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">本月异常总数</p>
                    <p className="text-2xl font-bold text-danger">{latestReport.anomaliesSummary.total}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted">
                  平均解决时间 {formatNumber(latestReport.anomaliesSummary.avgResolutionTime, 1)} 小时
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">指标平均完成率</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPercent(
                        latestReport.metricsSummary.reduce((sum, m) => sum + m.completionRate, 0) /
                          latestReport.metricsSummary.length
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted">
                  共 {latestReport.metricsSummary.length} 个核心指标
                </div>
              </Card>
            </div>

            <Card title="月度指标完成情况">
              <DataTable
                columns={metricColumns}
                data={latestReport.metricsSummary}
                pagination={false}
                rowKey="metricId"
              />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="异常统计 - 按严重级别">
                <div className="space-y-4">
                  {Object.entries(latestReport.anomaliesSummary.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center gap-4">
                      <div className={cn("w-3 h-3 rounded-full", severityColors[severity] || "bg-muted")} />
                      <span className="text-sm text-foreground w-20">
                        {severity === "CRITICAL" ? "严重" : severity === "HIGH" ? "高级" : severity === "MEDIUM" ? "中级" : "低级"}
                      </span>
                      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", severityColors[severity] || "bg-muted")}
                          style={{
                            width: `${(count as number / latestReport.anomaliesSummary.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count as number}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="异常统计 - 按原因分类">
                <div className="space-y-4">
                  {Object.entries(latestReport.anomaliesSummary.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center gap-4">
                      <span className="text-sm text-foreground w-24">{categoryLabels[category] || category}</span>
                      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(count as number / latestReport.anomaliesSummary.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count as number}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {reports.length > 1 && (
              <Card title="历史报表">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.slice(1).map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-muted/5 rounded-lg border border-card-border hover:border-primary/30 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedReport(report);
                        setReportDetailModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{report.month}</span>
                        <Clock className="w-4 h-4 text-muted" />
                      </div>
                      <div className="text-sm text-muted">
                        生成时间：{formatDateTime(report.generatedAt)}
                      </div>
                      <div className="text-sm text-muted">
                        生成人：{report.generatedByName}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-success">完成率 {formatPercent(report.deliverySummary.onTimeRate)}</span>
                        <span className="text-danger">异常 {report.anomaliesSummary.total} 个</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        onConfirm={handleSubmitProgress}
        title="更新项目进度"
        placeholder="请输入进度更新的备注说明..."
        confirmText="确认更新"
        loading={progressLoading}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            项目进度：{newProgress}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={newProgress}
            onChange={(e) => setNewProgress(Number(e.target.value))}
            className="w-full h-2 bg-muted/20 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </RemarkModal>

      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="生成复盘报表"
        confirmText="生成报表"
        onConfirm={handleGenerateReport}
        confirmLoading={reportLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              选择月份 <span className="text-danger">*</span>
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <p className="text-sm text-muted">
            系统将根据所选月份的指标数据、异常记录和项目交付情况，自动生成复盘报表。
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={reportDetailModalOpen}
        onClose={() => setReportDetailModalOpen(false)}
        title={`${selectedReport?.month} 月度复盘报表详情`}
        size="xl"
        showConfirm={false}
        footer={
          <div className="flex items-center justify-end px-6 py-4 border-t border-card-border">
            <Button variant="outline" size="sm" onClick={() => setReportDetailModalOpen(false)}>
              关闭
            </Button>
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {formatPercent(selectedReport.deliverySummary.onTimeRate)}
                </div>
                <div className="text-sm text-muted">交付完成率</div>
              </div>
              <div className="text-center p-4 bg-danger/5 rounded-lg">
                <div className="text-2xl font-bold text-danger">
                  {selectedReport.anomaliesSummary.total}
                </div>
                <div className="text-sm text-muted">异常总数</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatNumber(selectedReport.anomaliesSummary.avgResolutionTime, 1)}h
                </div>
                <div className="text-sm text-muted">平均解决时间</div>
              </div>
            </div>

            <DataTable
              columns={metricColumns}
              data={selectedReport.metricsSummary}
              pagination={false}
              rowKey="metricId"
            />

            <div className="grid grid-cols-2 gap-4">
              <Card title="按严重级别">
                <div className="space-y-2">
                  {Object.entries(selectedReport.anomaliesSummary.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="text-sm">
                        {severity === "CRITICAL" ? "严重" : severity === "HIGH" ? "高级" : severity === "MEDIUM" ? "中级" : "低级"}
                      </span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="按原因分类">
                <div className="space-y-2">
                  {Object.entries(selectedReport.anomaliesSummary.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{categoryLabels[category] || category}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="text-sm text-muted text-right">
              生成人：{selectedReport.generatedByName} · {formatDateTime(selectedReport.generatedAt)}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
