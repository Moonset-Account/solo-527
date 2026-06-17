"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Users,
  Shield,
  FileText,
  DollarSign,
  Edit2,
  Search,
  Calendar,
  Filter,
  Check,
  X,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { RemarkModal } from "@/components/RemarkModal";
import { mockUsers, mockAuditLogs } from "@/services/mockData";
import { formatDateTime, cn } from "@/lib/utils";
import type { AuditLog } from "@/types";
import type { UserRole, EntityType } from "@prisma/client";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "系统管理员",
  OPERATIONS_MANAGER: "运营经理",
  OPERATIONS_SPECIALIST: "运营专员",
  SALES_DIRECTOR: "销售总监",
  VIEWER: "查看者",
};

const roleColors: Record<UserRole, "info" | "success" | "warning" | "critical" | "pending"> = {
  ADMIN: "info",
  OPERATIONS_MANAGER: "success",
  OPERATIONS_SPECIALIST: "warning",
  SALES_DIRECTOR: "critical",
  VIEWER: "pending",
};

const entityTypeLabels: Record<EntityType, string> = {
  METRIC: "指标",
  METRIC_THRESHOLD: "指标阈值",
  ANOMALY: "异常",
  DEFINITION_CHANGE: "口径变更",
  DELIVERY_PROJECT: "交付项目",
  REVIEW_REPORT: "复盘报表",
  USER_PERMISSION: "用户权限",
  SYSTEM_CONFIG: "系统配置",
  SUBSCRIPTION: "订阅",
  ALERT_RULE: "告警规则",
};

const actionLabels: Record<string, string> = {
  UPDATE_THRESHOLD: "更新阈值",
  UPDATE_PERMISSION: "更新权限",
  UPDATE_DEFINITION: "更新口径",
  CREATE_DEFINITION: "创建口径",
  APPROVE_DEFINITION: "审批口径",
  UPDATE_PROGRESS: "更新进度",
  GENERATE_REPORT: "生成报表",
  CREATE_USER: "创建用户",
  UPDATE_USER: "更新用户",
  DELETE_USER: "删除用户",
  UPDATE_CONFIG: "更新配置",
};

const permissionMatrix: Record<UserRole, string[]> = {
  ADMIN: ["所有权限"],
  OPERATIONS_MANAGER: [
    "查看指标",
    "管理指标",
    "查看异常",
    "处理异常",
    "查看口径",
    "创建口径版本",
    "审批口径",
    "查看交付项目",
    "管理交付项目",
    "生成复盘报表",
    "管理订阅",
    "管理告警规则",
  ],
  OPERATIONS_SPECIALIST: [
    "查看指标",
    "查看异常",
    "处理异常",
    "查看口径",
    "创建口径版本",
    "查看交付项目",
    "更新项目进度",
    "管理订阅",
  ],
  SALES_DIRECTOR: [
    "查看指标",
    "查看异常",
    "查看口径",
    "查看交付项目",
    "查看复盘报表",
  ],
  VIEWER: ["查看指标", "查看异常", "查看口径"],
};

interface AmountConfig {
  id: string;
  name: string;
  key: string;
  value: number;
  unit: string;
  description: string;
}

const defaultAmountConfigs: AmountConfig[] = [
  {
    id: "config-1",
    name: "告警金额阈值",
    key: "alert_amount_threshold",
    value: 100000,
    unit: "元",
    description: "当金额波动超过此阈值时触发告警",
  },
  {
    id: "config-2",
    name: "严重异常金额阈值",
    key: "critical_anomaly_amount",
    value: 500000,
    unit: "元",
    description: "超过此金额的异常将被标记为严重级别",
  },
  {
    id: "config-3",
    name: "月度目标金额",
    key: "monthly_target_amount",
    value: 5000000,
    unit: "元",
    description: "月度 GMV 目标金额",
  },
  {
    id: "config-4",
    name: "预算上限",
    key: "budget_limit",
    value: 10000000,
    unit: "元",
    description: "单项目预算上限",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "logs" | "amount">("users");
  const [users, setUsers] = useState(mockUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [amountConfigs, setAmountConfigs] = useState<AmountConfig[]>(defaultAmountConfigs);
  const [isLoading, setIsLoading] = useState(true);

  const [actionType, setActionType] = useState<string>("ALL");
  const [entityType, setEntityType] = useState<EntityType | "ALL">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("VIEWER");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [remarkType, setRemarkType] = useState<"user" | "amount">("user");
  const [remarkTargetId, setRemarkTargetId] = useState("");
  const [remarkLoading, setRemarkLoading] = useState(false);

  const [editAmountModalOpen, setEditAmountModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AmountConfig | null>(null);
  const [editAmountValue, setEditAmountValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch {
      setAuditLogs(mockAuditLogs);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    let match = true;
    if (actionType !== "ALL") {
      match = match && log.action === actionType;
    }
    if (entityType !== "ALL") {
      match = match && log.entityType === entityType;
    }
    if (startDate) {
      match = match && new Date(log.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      match = match && new Date(log.createdAt) <= new Date(endDate + "T23:59:59");
    }
    return match;
  });

  const handleEditUser = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPermissions(permissionMatrix[user.role] || []);
    setEditUserModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setEditRole(role);
    setEditPermissions(permissionMatrix[role] || []);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    setRemarkType("user");
    setRemarkTargetId(selectedUser.id);
    setRemarkModalOpen(true);
  };

  const handleConfirmUserChange = async (remark: string) => {
    if (!selectedUser) return;
    setRemarkLoading(true);
    try {
      const res = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_USER",
          entityType: "USER_PERMISSION" as EntityType,
          entityId: selectedUser.id,
          oldValue: { role: selectedUser.role },
          newValue: { role: editRole, permissions: editPermissions },
          remark,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, role: editRole } : u))
        );
        setEditUserModalOpen(false);
        setRemarkModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Update user error:", err);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: editRole } : u))
      );
      setEditUserModalOpen(false);
      setRemarkModalOpen(false);
      fetchData();
    } finally {
      setRemarkLoading(false);
    }
  };

  const handleEditAmount = (config: AmountConfig) => {
    setSelectedConfig(config);
    setEditAmountValue(config.value);
    setEditAmountModalOpen(true);
  };

  const handleSaveAmount = () => {
    if (!selectedConfig) return;
    setRemarkType("amount");
    setRemarkTargetId(selectedConfig.id);
    setRemarkModalOpen(true);
  };

  const handleConfirmAmountChange = async (remark: string) => {
    if (!selectedConfig) return;
    setRemarkLoading(true);
    try {
      const res = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_CONFIG",
          entityType: "SYSTEM_CONFIG" as EntityType,
          entityId: selectedConfig.id,
          oldValue: { value: selectedConfig.value },
          newValue: { value: editAmountValue },
          remark,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAmountConfigs((prev) =>
          prev.map((c) => (c.id === selectedConfig.id ? { ...c, value: editAmountValue } : c))
        );
        setEditAmountModalOpen(false);
        setRemarkModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Update config error:", err);
      setAmountConfigs((prev) =>
        prev.map((c) => (c.id === selectedConfig.id ? { ...c, value: editAmountValue } : c))
      );
      setEditAmountModalOpen(false);
      setRemarkModalOpen(false);
      fetchData();
    } finally {
      setRemarkLoading(false);
    }
  };

  const userColumns: Column<typeof mockUsers[0]>[] = [
    {
      key: "name",
      title: "姓名",
      dataIndex: "name",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "email",
      title: "邮箱",
      dataIndex: "email",
    },
    {
      key: "department",
      title: "部门",
      dataIndex: "department",
    },
    {
      key: "role",
      title: "角色",
      dataIndex: "role",
      render: (value) => {
        const role = value as UserRole;
        return (
          <StatusBadge status={roleColors[role]}>{roleLabels[role]}</StatusBadge>
        );
      },
      align: "center",
    },
    {
      key: "actions",
      title: "操作",
      dataIndex: "id",
      render: (_, record) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEditUser(record);
          }}
        >
          <Edit2 className="w-4 h-4 mr-1" />
          编辑角色
        </Button>
      ),
      width: "120px",
      align: "center",
    },
  ];

  const logColumns: Column<AuditLog>[] = [
    {
      key: "action",
      title: "操作类型",
      dataIndex: "action",
      render: (value) => actionLabels[value as string] || (value as string),
    },
    {
      key: "entityType",
      title: "对象类型",
      dataIndex: "entityType",
      render: (value) => entityTypeLabels[value as EntityType] || (value as string),
    },
    {
      key: "operatorName",
      title: "操作人",
      dataIndex: "operatorName",
    },
    {
      key: "remark",
      title: "备注",
      dataIndex: "remark",
      render: (value) => (
        <span className="text-sm text-muted line-clamp-1">{value as string}</span>
      ),
    },
    {
      key: "createdAt",
      title: "操作时间",
      dataIndex: "createdAt",
      render: (value) => formatDateTime(value as Date),
    },
  ];

  const allActions = Array.from(new Set(auditLogs.map((l) => l.action)));
  const allEntityTypes = Array.from(new Set(auditLogs.map((l) => l.entityType)));

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "系统设置", href: "/settings" }, { label: activeTab === "users" ? "用户管理" : activeTab === "roles" ? "角色权限" : activeTab === "logs" ? "操作日志" : "金额设置" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
            <p className="text-muted mt-1">管理用户、角色权限、审计日志和系统配置</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-card-border flex-wrap">
          {[
            { key: "users", label: "用户管理", icon: <Users className="w-4 h-4" /> },
            { key: "roles", label: "角色权限", icon: <Shield className="w-4 h-4" /> },
            { key: "logs", label: "操作日志", icon: <FileText className="w-4 h-4" /> },
            { key: "amount", label: "金额设置", icon: <DollarSign className="w-4 h-4" /> },
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

        {activeTab === "users" && (
          <Card title="用户列表" description="管理系统用户的角色和权限">
            <DataTable
              columns={userColumns}
              data={users}
              pagination={false}
              rowKey="id"
            />
          </Card>
        )}

        {activeTab === "roles" && (
          <Card title="角色权限矩阵" description="各角色对应的系统权限配置">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/5 border-b border-card-border">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      权限
                    </th>
                    {Object.keys(roleLabels).map((role) => (
                      <th
                        key={role}
                        className="px-4 py-3 text-center text-sm font-semibold text-foreground"
                      >
                        {roleLabels[role as UserRole]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "查看指标",
                    "管理指标",
                    "查看异常",
                    "处理异常",
                    "查看口径",
                    "创建口径版本",
                    "审批口径",
                    "查看交付项目",
                    "管理交付项目",
                    "更新项目进度",
                    "生成复盘报表",
                    "管理订阅",
                    "管理告警规则",
                    "用户管理",
                    "系统配置",
                  ].map((permission, idx) => (
                    <tr
                      key={permission}
                      className={cn(
                        "border-b border-card-border last:border-b-0",
                        idx % 2 === 0 && "bg-muted/3"
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-foreground">{permission}</td>
                      {Object.keys(roleLabels).map((role) => {
                        const roleEnum = role as UserRole;
                        const hasPermission =
                          roleEnum === "ADMIN" ||
                          permissionMatrix[roleEnum]?.includes(permission);
                        return (
                          <td key={role} className="px-4 py-3 text-center">
                            {hasPermission ? (
                              <Check className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "logs" && (
          <Card title="操作日志" description="系统所有操作的审计记录">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ALL">全部操作</option>
                  {allActions.map((action) => (
                    <option key={action} value={action}>
                      {actionLabels[action] || action}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as EntityType | "ALL")}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="ALL">全部类型</option>
                  {allEntityTypes.map((type) => (
                    <option key={type} value={type}>
                      {entityTypeLabels[type as EntityType] || type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-muted">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <DataTable
              columns={logColumns}
              data={filteredLogs}
              loading={isLoading}
              rowKey="id"
              pageSize={10}
            />
          </Card>
        )}

        {activeTab === "amount" && (
          <Card title="金额设置" description="配置系统中金额相关的阈值参数">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {amountConfigs.map((config) => (
                <div
                  key={config.id}
                  className="p-4 bg-muted/5 rounded-lg border border-card-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{config.name}</h4>
                      <p className="text-sm text-muted mt-1">{config.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAmount(config)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {config.value.toLocaleString()}
                    <span className="text-sm text-muted ml-1">{config.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title="编辑用户角色"
        confirmText="保存修改"
        onConfirm={handleSaveUser}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/5 rounded-lg">
              <div className="font-medium text-foreground">{selectedUser.name}</div>
              <div className="text-sm text-muted">{selectedUser.email}</div>
              <div className="text-sm text-muted">{selectedUser.department}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                角色 <span className="text-danger">*</span>
              </label>
              <select
                value={editRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {Object.entries(roleLabels).map(([role, label]) => (
                  <option key={role} value={role}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                权限列表
              </label>
              <div className="p-4 bg-muted/5 rounded-lg space-y-2">
                {editPermissions.length > 0 ? (
                  editPermissions.map((perm) => (
                    <div key={perm} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">{perm}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted">暂无权限</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={editAmountModalOpen}
        onClose={() => setEditAmountModalOpen(false)}
        title="修改金额配置"
        confirmText="保存修改"
        onConfirm={handleSaveAmount}
      >
        {selectedConfig && (
          <div className="space-y-4">
            <div>
              <div className="font-medium text-foreground">{selectedConfig.name}</div>
              <p className="text-sm text-muted mt-1">{selectedConfig.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                当前值
              </label>
              <div className="text-lg font-bold text-muted line-through">
                {selectedConfig.value.toLocaleString()} {selectedConfig.unit}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                新值 <span className="text-danger">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editAmountValue}
                  onChange={(e) => setEditAmountValue(Number(e.target.value))}
                  className="flex-1 px-4 py-2 bg-background border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="0"
                />
                <span className="text-muted">{selectedConfig.unit}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <RemarkModal
        isOpen={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        onConfirm={remarkType === "user" ? handleConfirmUserChange : handleConfirmAmountChange}
        title="请输入修改备注"
        placeholder={remarkType === "user" ? "请说明修改用户角色和权限的原因..." : "请说明修改金额配置的原因..."}
        confirmText="确认修改"
        loading={remarkLoading}
      />
    </Layout>
  );
}
