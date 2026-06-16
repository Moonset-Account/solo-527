"use client";

import { useState } from "react";
import {
  Settings,
  Database,
  FileText,
  Download,
  History,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Search,
} from "lucide-react";
import { trpc } from "@/trpc/react";
import Link from "next/link";

const settingsTabs = [
  { key: "basic", label: "基础资料", icon: Database },
  { key: "logs", label: "操作日志", icon: History },
  { key: "exports", label: "导出任务", icon: Download },
];

const actionLabels: Record<string, string> = {
  CREATE: "创建",
  UPDATE: "更新",
  DELETE: "删除",
  STATUS_CHANGE: "状态变更",
  INBOUND: "入库",
  OUTBOUND: "出库",
  ASSIGN: "分配",
  PRICE_UPDATE: "价格更新",
  LOGIN: "登录",
  EXPORT: "导出",
};

const entityTypeLabels: Record<string, string> = {
  VEHICLE: "车辆",
  WORK_ORDER: "工单",
  PART: "配件",
  INVENTORY: "库存",
  QUALITY_CHECK: "质检",
  SCHEDULE: "排期",
  DELAY_RECORD: "延期记录",
  EXPORT_TASK: "导出任务",
  USER: "用户",
  TEAM: "班组",
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: { label: "等待中", className: "bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300", icon: Clock },
  PROCESSING: { label: "处理中", className: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", icon: Play },
  COMPLETED: { label: "已完成", className: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  FAILED: { label: "失败", className: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400", icon: XCircle },
};

const exportTypeLabels: Record<string, string> = {
  VEHICLES: "车辆数据导出",
  WORK_ORDERS: "工单数据导出",
  PARTS: "配件数据导出",
  INVENTORY: "库存数据导出",
  SCHEDULES: "排期数据导出",
  QUALITY_CHECKS: "质检数据导出",
};

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [logsPage, setLogsPage] = useState(1);
  const [exportsPage, setExportsPage] = useState(1);
  const pageSize = 20;

  const { data: logsData, isLoading: logsLoading } =
    trpc.auditLog.list.useQuery(
      { page: logsPage, pageSize },
      {
        enabled: activeTab === "logs",
      }
    );

  const { data: exportsData, isLoading: exportsLoading, refetch: refetchExports } =
    trpc.export.list.useQuery(
      { page: exportsPage, pageSize },
      {
        enabled: activeTab === "exports",
      }
    );

  const createExport = trpc.export.create.useMutation({
    onSuccess: () => {
      refetchExports();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const retryExport = trpc.export.retry.useMutation({
    onSuccess: () => {
      refetchExports();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const logs = logsData?.data || [];
  const exports = exportsData?.data || [];
  const totalLogs = logsData?.total || 0;
  const totalExports = exportsData?.total || 0;

  const handleCreateExport = (type: string) => {
    if (confirm(`确定要创建「${exportTypeLabels[type] || type}」任务吗？`)) {
      createExport.mutate({ type });
    }
  };

  const handleDownload = (task: any) => {
    if (task.downloadUrl) {
      window.open(task.downloadUrl, "_blank");
    } else {
      alert("文件尚未生成，请稍后再试");
    }
  };

  const handleRetry = (taskId: string) => {
    if (confirm("确定要重试这个导出任务吗？")) {
      retryExport.mutate({ id: taskId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          系统设置
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          管理基础资料、查看操作日志和导出任务
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    activeTab === tab.key
                      ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    基础资料配置
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    管理配件分类、维修项目等基础数据
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        配件分类
                      </p>
                      <p className="text-sm text-slate-500">
                        管理配件的分类体系
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        维修项目
                      </p>
                      <p className="text-sm text-slate-500">
                        配置标准维修项目和工时费
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        班组管理
                      </p>
                      <p className="text-sm text-slate-500">
                        管理维修班组和人员
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        价格策略
                      </p>
                      <p className="text-sm text-slate-500">
                        配置价格计算规则和折扣
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    操作日志
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    查看系统所有操作记录，共 {totalLogs} 条
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索..."
                      className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
                    />
                  </div>
                </div>
              </div>

              {logsLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
                  <p className="mt-4 text-slate-500">加载日志...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 dark:text-slate-400">
                    暂无操作日志
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {logs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <History className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-900 dark:text-white">
                              <span className="font-medium">
                                {log.userName || "系统"}
                              </span>
                              <span className="text-slate-500 mx-2">
                                ·
                              </span>
                              <span className="text-slate-500">
                                {actionLabels[log.action] || log.action}
                              </span>
                              <span className="text-slate-500 mx-2">
                                ·
                              </span>
                              <span className="text-slate-500">
                                {entityTypeLabels[log.entityType] ||
                                  log.entityType}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              目标：{log.entityId}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {logs.length > 0 && logsPage * pageSize < totalLogs && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
                  <button
                    onClick={() => setLogsPage((p) => p + 1)}
                    disabled={logsLoading}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                  >
                    加载更多日志
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "exports" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">
                  共 {totalExports} 条导出任务
                </p>
                <div className="flex items-center gap-2">
                  {["VEHICLES", "WORK_ORDERS", "PARTS"].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleCreateExport(type)}
                      disabled={createExport.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {exportTypeLabels[type]?.replace("数据导出", "") || type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
                {exportsLoading ? (
                  <div className="py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500">加载导出任务...</p>
                  </div>
                ) : exports.length === 0 ? (
                  <div className="py-12 text-center">
                    <Download className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 dark:text-slate-400">
                      暂无导出任务
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      点击上方按钮创建新的导出任务
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {exports.map((task: any) => {
                      const config = statusConfig[task.status];
                      const StatusIcon = config.icon;
                      const progress =
                        task.totalRecords > 0
                          ? Math.round(
                              (task.processedRecords / task.totalRecords) * 100
                            )
                          : 0;

                      return (
                        <div
                          key={task.id}
                          className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${config.className}`}
                              >
                                <StatusIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {exportTypeLabels[task.type] || task.type}
                                </p>
                                <p className="text-xs text-slate-500">
                                  创建于{" "}
                                  {new Date(
                                    task.createdAt
                                  ).toLocaleString("zh-CN")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {task.status === "COMPLETED" && (
                                <button
                                  onClick={() => handleDownload(task)}
                                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  下载
                                </button>
                              )}
                              {task.status === "FAILED" && (
                                <button
                                  onClick={() => handleRetry(task.id)}
                                  disabled={retryExport.isPending}
                                  className="text-sm text-rose-600 hover:text-rose-700 font-medium disabled:opacity-50"
                                >
                                  {retryExport.isPending ? "重试中..." : "重试"}
                                </button>
                              )}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
                              >
                                {config.label}
                              </span>
                            </div>
                          </div>

                          {task.status === "PROCESSING" && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>导出进度</span>
                                <span>
                                  {task.processedRecords || 0} /{" "}
                                  {task.totalRecords || 0} 条
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {task.status === "COMPLETED" && (
                            <p className="text-xs text-slate-500 mt-2">
                              共 {task.totalRecords || 0} 条记录
                              {task.completedAt &&
                                `，完成于 ${new Date(
                                  task.completedAt
                                ).toLocaleTimeString("zh-CN")}`}
                            </p>
                          )}

                          {task.status === "FAILED" && task.errorMessage && (
                            <p className="text-xs text-rose-500 mt-2 bg-rose-50 dark:bg-rose-900/20 p-2 rounded">
                              错误：{task.errorMessage}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {exports.length > 0 && exportsPage * pageSize < totalExports && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
                    <button
                      onClick={() => setExportsPage((p) => p + 1)}
                      disabled={exportsLoading}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                    >
                      加载更多
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
