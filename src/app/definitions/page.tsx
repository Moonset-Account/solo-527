"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Eye, History, Plus, Filter } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { RemarkModal } from "@/components/RemarkModal";
import { mockMetricDefinitions, mockMetrics, mockUsers } from "@/services/mockData";
import { formatDateTime } from "@/lib/utils";
import type { MetricDefinition } from "@/types";
import type { ApprovalStatus } from "@prisma/client";

const approvalStatusMap: Record<ApprovalStatus, { label: string; status: "pending" | "success" | "critical" }> = {
  PENDING: { label: "待审批", status: "pending" },
  APPROVED: { label: "已通过", status: "success" },
  REJECTED: { label: "已拒绝", status: "critical" },
};

export default function DefinitionsPage() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<MetricDefinition[]>([]);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<MetricDefinition | null>(null);
  const [formData, setFormData] = useState({
    metricId: "",
    name: "",
    description: "",
    calculationLogic: "",
    sqlQuery: "",
    dataSource: "",
    businessOwner: "",
    technicalOwner: "",
    changeReason: "",
    changeImpact: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const fetchDefinitions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/definitions");
      const data = await res.json();
      if (data.success) {
        const currentDefinitions = data.data.filter((d: MetricDefinition) => d.isCurrent);
        setDefinitions(currentDefinitions);
      }
    } catch {
      const currentDefinitions = mockMetricDefinitions.filter((d) => d.isCurrent);
      setDefinitions(currentDefinitions);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDefinitions = filterStatus === "ALL"
    ? definitions
    : definitions.filter((d) => d.approvalStatus === filterStatus);

  const stats = {
    pending: definitions.filter((d) => d.approvalStatus === "PENDING").length,
    approved: definitions.filter((d) => d.approvalStatus === "APPROVED").length,
    rejected: definitions.filter((d) => d.approvalStatus === "REJECTED").length,
  };

  const handleCreateVersion = (record: MetricDefinition) => {
    setSelectedDefinition(record);
    setFormData({
      metricId: record.metricId,
      name: record.name,
      description: record.description || "",
      calculationLogic: record.calculationLogic,
      sqlQuery: record.sqlQuery || "",
      dataSource: record.dataSource || "",
      businessOwner: record.businessOwner || "",
      technicalOwner: record.technicalOwner || "",
      changeReason: "",
      changeImpact: "",
    });
    setCreateModalOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.changeReason.trim()) {
      alert("请填写变更原因");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCreateModalOpen(false);
        fetchDefinitions();
        setFormData({
          metricId: "",
          name: "",
          description: "",
          calculationLogic: "",
          sqlQuery: "",
          dataSource: "",
          businessOwner: "",
          technicalOwner: "",
          changeReason: "",
          changeImpact: "",
        });
      }
    } catch (err) {
      console.error("Create definition error:", err);
      alert("创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<MetricDefinition>[] = [
    {
      key: "name",
      title: "指标名称",
      dataIndex: "name",
      render: (value, record) => (
        <Link href={`/definitions/${record.id}`} className="text-primary hover:underline font-medium">
          {value as string}
        </Link>
      ),
    },
    {
      key: "version",
      title: "当前版本",
      dataIndex: "version",
      render: (value) => <span className="font-mono">v{value as number}</span>,
      align: "center",
    },
    {
      key: "businessOwnerName",
      title: "业务负责人",
      dataIndex: "businessOwnerName",
      render: (value) => value || "-",
    },
    {
      key: "technicalOwnerName",
      title: "技术负责人",
      dataIndex: "technicalOwnerName",
      render: (value) => value || "-",
    },
    {
      key: "approvalStatus",
      title: "审批状态",
      dataIndex: "approvalStatus",
      render: (value) => {
        const config = approvalStatusMap[value as ApprovalStatus];
        return <StatusBadge status={config.status}>{config.label}</StatusBadge>;
      },
      align: "center",
    },
    {
      key: "updatedAt",
      title: "更新时间",
      dataIndex: "createdAt",
      render: (value) => formatDateTime(value as Date),
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "id",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/definitions/${record.id}`);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            详情
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/definitions/${record.id}?tab=history`);
            }}
          >
            <History className="w-4 h-4 mr-1" />
            历史
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateVersion(record);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            新版本
          </Button>
        </div>
      ),
      width: "280px",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "口径管理", href: "/definitions" }, { label: "口径列表" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">口径维护</h1>
            <p className="text-muted mt-1">管理所有指标的口径定义和版本历史</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted">待审批</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted">已通过</p>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-sm text-muted">已拒绝</p>
                <p className="text-2xl font-bold text-danger">{stats.rejected}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold">口径列表</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ApprovalStatus | "ALL")}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ALL">全部状态</option>
                  <option value="PENDING">待审批</option>
                  <option value="APPROVED">已通过</option>
                  <option value="REJECTED">已拒绝</option>
                </select>
              </div>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredDefinitions}
            loading={isLoading}
            rowKey="id"
            onRowClick={(record) => router.push(`/definitions/${record.id}`)}
          />
        </Card>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="创建新版本"
        size="xl"
        confirmText="提交审批"
        onConfirm={handleSubmitCreate}
        confirmLoading={submitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                指标名称 <span className="text-danger">*</span>
              </label>
              <select
                value={formData.metricId}
                onChange={(e) => {
                  const metric = mockMetrics.find((m) => m.id === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    metricId: e.target.value,
                    name: metric?.name || prev.name,
                  }));
                }}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择指标</option>
                {mockMetrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">显示名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="口径显示名称"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
              placeholder="口径描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              计算逻辑 <span className="text-danger">*</span>
            </label>
            <textarea
              value={formData.calculationLogic}
              onChange={(e) => setFormData((prev) => ({ ...prev, calculationLogic: e.target.value }))}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
              rows={3}
              placeholder="详细描述指标的计算逻辑"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">SQL 查询</label>
            <textarea
              value={formData.sqlQuery}
              onChange={(e) => setFormData((prev) => ({ ...prev, sqlQuery: e.target.value }))}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
              rows={4}
              placeholder="可选：对应的 SQL 查询语句"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">数据源</label>
            <input
              type="text"
              value={formData.dataSource}
              onChange={(e) => setFormData((prev) => ({ ...prev, dataSource: e.target.value }))}
              className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="数据来源说明"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">业务负责人</label>
              <select
                value={formData.businessOwner}
                onChange={(e) => setFormData((prev) => ({ ...prev, businessOwner: e.target.value }))}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">技术负责人</label>
              <select
                value={formData.technicalOwner}
                onChange={(e) => setFormData((prev) => ({ ...prev, technicalOwner: e.target.value }))}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-card-border pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                变更原因 <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.changeReason}
                onChange={(e) => setFormData((prev) => ({ ...prev, changeReason: e.target.value }))}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
                placeholder="请详细说明变更的原因"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-1">变更影响</label>
              <textarea
                value={formData.changeImpact}
                onChange={(e) => setFormData((prev) => ({ ...prev, changeImpact: e.target.value }))}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
                placeholder="说明变更可能带来的影响"
              />
            </div>
          </div>
        </div>
      </Modal>

      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        onConfirm={async (remark) => {
          console.log("Remark:", remark);
          setRemarkModalOpen(false);
        }}
      />
    </Layout>
  );
}
