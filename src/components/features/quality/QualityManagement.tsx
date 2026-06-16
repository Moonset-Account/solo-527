"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/trpc/react";
import Link from "next/link";

const tabs = [
  { key: "pending", label: "待质检", icon: Clock, result: "PENDING" },
  { key: "passed", label: "已通过", icon: CheckCircle, result: "PASSED" },
  { key: "failed", label: "未通过", icon: XCircle, result: "FAILED" },
  { key: "delayed", label: "延期工单", icon: AlertTriangle, result: null },
];

const resultConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "待质检",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  PASSED: {
    label: "已通过",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  FAILED: {
    label: "未通过",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

const itemResultColors: Record<string, string> = {
  PENDING: "bg-slate-200 dark:bg-slate-600",
  PASS: "bg-emerald-500",
  FAIL: "bg-rose-500",
  NA: "bg-slate-300",
};

export function QualityManagement() {
  const [activeTab, setActiveTab] = useState("pending");

  const selectedResult = tabs.find((t) => t.key === activeTab)?.result;

  const { data: qualityData, isLoading: qualityLoading } =
    trpc.quality.list.useQuery(
      {
        page: 1,
        pageSize: 50,
        result: selectedResult || undefined,
      },
      {
        enabled: activeTab !== "delayed",
      }
    );

  const { data: delayData, isLoading: delayLoading } =
    trpc.delay.list.useQuery(
      {
        page: 1,
        pageSize: 50,
      },
      {
        enabled: activeTab === "delayed",
      }
    );

  const { data: statsData, isLoading: statsLoading } =
    trpc.stats.dashboard.useQuery();

  const isLoading =
    (activeTab !== "delayed" && qualityLoading) ||
    (activeTab === "delayed" && delayLoading) ||
    statsLoading;

  const qualityChecks = qualityData?.data || [];
  const delayRecords = delayData?.data || [];

  const pendingCount = statsData?.qualityPending || 0;
  const passedCount = statsData?.qualityPassed || 0;
  const failedCount = statsData?.qualityFailed || 0;
  const delayedCount = statsData?.delayedOrders || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            质检交付
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            管理质检流程和交付确认
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium">
          <ClipboardCheck className="w-4 h-4" />
          登记质检
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "待质检",
            value: pendingCount,
            icon: Clock,
            color: "bg-amber-500",
          },
          {
            label: "今日完成",
            value: passedCount,
            icon: CheckCircle,
            color: "bg-emerald-500",
          },
          {
            label: "未通过",
            value: failedCount,
            icon: XCircle,
            color: "bg-rose-500",
          },
          {
            label: "延期工单",
            value: delayedCount,
            icon: AlertTriangle,
            color: "bg-orange-500",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-card border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500">加载数据...</p>
            </div>
          ) : activeTab === "delayed" ? (
            <div className="space-y-4">
              {delayRecords.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 dark:text-slate-400">
                    暂无延期工单
                  </p>
                </div>
              ) : (
                delayRecords.map((delay: any) => {
                  const workOrder = delay.workOrder;
                  const vehicle = workOrder?.vehicle;
                  const originalDelivery = workOrder?.estimatedDelivery
                    ? new Date(workOrder.estimatedDelivery)
                    : null;
                  const newDelivery = delay.newEstimatedDelivery
                    ? new Date(delay.newEstimatedDelivery)
                    : null;
                  const delayDays =
                    originalDelivery && newDelivery
                      ? Math.ceil(
                          (newDelivery.getTime() - originalDelivery.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0;

                  return (
                    <div
                      key={delay.id}
                      className="border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 bg-rose-50 dark:bg-rose-900/10"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {vehicle?.plateNumber || "未知车辆"}
                            </h3>
                            <span className="text-sm text-slate-500">
                              {vehicle?.brand} {vehicle?.model}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
                              延期 {delayDays} 天
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-mono">
                            {workOrder?.orderNo}
                          </p>
                        </div>
                        <Link
                          href={`/workorders/${workOrder?.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium flex items-center gap-1"
                        >
                          查看详情
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/50">
                        <div>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                            延期原因
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {delay.reason}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                            影响范围
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {delay.impactScope}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                            预计新交付
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {newDelivery?.toLocaleDateString("zh-CN")}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/50">
                        <div>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                            处理动作
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {delay.actionTaken}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                            下一步计划
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {delay.nextStep}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {qualityChecks.length === 0 ? (
                <div className="py-12 text-center">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 dark:text-slate-400">
                    暂无质检记录
                  </p>
                </div>
              ) : (
                qualityChecks.map((qc: any) => {
                  const workOrder = qc.workOrder;
                  const vehicle = workOrder?.vehicle;

                  return (
                    <div
                      key={qc.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {vehicle?.plateNumber || "未知车辆"}
                            </h3>
                            <span className="text-sm text-slate-500">
                              {vehicle?.brand} {vehicle?.model}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                resultConfig[qc.result]?.className
                              }`}
                            >
                              {resultConfig[qc.result]?.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-mono">
                            工单号：{workOrder?.orderNo}
                            {qc.checkedAt && (
                              <>
                                {" · "}
                                {new Date(qc.checkedAt).toLocaleString(
                                  "zh-CN"
                                )}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/workorders/${workOrder?.id}`}
                            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
                          >
                            工单详情
                          </Link>
                          <button className="px-3 py-1.5 text-sm bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 rounded-lg transition-colors font-medium">
                            {qc.result === "PENDING" ? "处理质检" : "查看"}
                          </button>
                        </div>
                      </div>

                      {qc.items && qc.items.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {qc.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  itemResultColors[item.result] ||
                                  "bg-slate-300"
                                }`}
                              ></span>
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {item.name}
                              </span>
                              {item.remark && (
                                <span className="text-xs text-slate-500">
                                  ({item.remark})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {qc.remarks && (
                        <p className="text-sm text-rose-600 dark:text-rose-400 mt-3 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                          备注：{qc.remarks}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
