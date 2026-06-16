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
} from "lucide-react";
import Link from "next/link";

const settingsTabs = [
  { key: "basic", label: "基础资料", icon: Database },
  { key: "logs", label: "操作日志", icon: History },
  { key: "exports", label: "导出任务", icon: Download },
];

const mockAuditLogs = [
  {
    id: "1",
    action: "CREATE",
    entityType: "WORK_ORDER",
    entityId: "WO202606170001",
    userName: "张三",
    userId: "user_001",
    createdAt: "2026-06-17T10:30:00",
  },
  {
    id: "2",
    action: "UPDATE",
    entityType: "PART",
    entityId: "P001",
    userName: "李四",
    userId: "user_002",
    createdAt: "2026-06-17T09:45:00",
  },
  {
    id: "3",
    action: "STATUS_CHANGE",
    entityType: "WORK_ORDER",
    entityId: "WO202606160003",
    userName: "王五",
    userId: "user_003",
    createdAt: "2026-06-17T09:30:00",
  },
  {
    id: "4",
    action: "OUTBOUND",
    entityType: "INVENTORY",
    entityId: "P002",
    userName: "赵六",
    userId: "user_004",
    createdAt: "2026-06-17T09:00:00",
  },
  {
    id: "5",
    action: "CREATE",
    entityType: "VEHICLE",
    entityId: "京F44444",
    userName: "张三",
    userId: "user_001",
    createdAt: "2026-06-16T16:20:00",
  },
];

const mockExportTasks = [
  {
    id: "1",
    type: "VEHICLES",
    typeName: "车辆数据导出",
    status: "COMPLETED",
    totalRecords: 256,
    processedRecords: 256,
    createdAt: "2026-06-17T08:00:00",
    completedAt: "2026-06-17T08:00:05",
  },
  {
    id: "2",
    type: "WORK_ORDERS",
    typeName: "工单数据导出",
    status: "PROCESSING",
    totalRecords: 1248,
    processedRecords: 756,
    createdAt: "2026-06-17T10:00:00",
  },
  {
    id: "3",
    type: "PARTS",
    typeName: "配件数据导出",
    status: "FAILED",
    totalRecords: 0,
    processedRecords: 0,
    createdAt: "2026-06-16T14:30:00",
  },
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
};

const entityTypeLabels: Record<string, string> = {
  VEHICLE: "车辆",
  WORK_ORDER: "工单",
  PART: "配件",
  INVENTORY: "库存",
  QUALITY_CHECK: "质检",
  SCHEDULE: "排期",
  DELAY_RECORD: "延期记录",
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: { label: "等待中", className: "bg-slate-100 text-slate-600", icon: Clock },
  PROCESSING: { label: "处理中", className: "bg-blue-100 text-blue-600", icon: Play },
  COMPLETED: { label: "已完成", className: "bg-emerald-100 text-emerald-600", icon: CheckCircle },
  FAILED: { label: "失败", className: "bg-rose-100 text-rose-600", icon: XCircle },
};

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">系统设置</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">管理基础资料、查看操作日志和导出任务</p>
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
                  <h3 className="font-semibold text-slate-900 dark:text-white">基础资料配置</h3>
                  <p className="text-sm text-slate-500 mt-1">管理配件分类、维修项目等基础数据</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">配件分类</p>
                      <p className="text-sm text-slate-500">管理配件的分类体系</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">维修项目</p>
                      <p className="text-sm text-slate-500">配置标准维修项目和工时费</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">班组管理</p>
                      <p className="text-sm text-slate-500">管理维修班组和人员</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">价格策略</p>
                      <p className="text-sm text-slate-500">配置价格计算规则和折扣</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">操作日志</h3>
                <p className="text-sm text-slate-500 mt-1">查看系统所有操作记录</p>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {mockAuditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <History className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-900 dark:text-white">
                            <span className="font-medium">{log.userName}</span>
                            <span className="text-slate-500 mx-2">·</span>
                            <span className="text-slate-500">
                              {actionLabels[log.action] || log.action}
                            </span>
                            <span className="text-slate-500 mx-2">·</span>
                            <span className="text-slate-500">
                              {entityTypeLabels[log.entityType] || log.entityType}
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
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  查看更多日志
                </button>
              </div>
            </div>
          )}

          {activeTab === "exports" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm">
                  <Download className="w-4 h-4" />
                  新建导出
                </button>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {mockExportTasks.map((task) => {
                    const config = statusConfig[task.status];
                    const StatusIcon = config.icon;
                    const progress = task.totalRecords > 0 
                      ? Math.round((task.processedRecords / task.totalRecords) * 100) 
                      : 0;

                    return (
                      <div key={task.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.className}`}>
                              <StatusIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {task.typeName}
                              </p>
                              <p className="text-xs text-slate-500">
                                创建于 {new Date(task.createdAt).toLocaleString("zh-CN")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {task.status === "COMPLETED" && (
                              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                下载
                              </button>
                            )}
                            {task.status === "FAILED" && (
                              <button className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                                重试
                              </button>
                            )}
                          </div>
                        </div>

                        {task.status === "PROCESSING" && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>导出进度</span>
                              <span>
                                {task.processedRecords} / {task.totalRecords} 条
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
                            共 {task.totalRecords} 条记录，完成于{" "}
                            {task.completedAt && new Date(task.completedAt).toLocaleTimeString("zh-CN")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
