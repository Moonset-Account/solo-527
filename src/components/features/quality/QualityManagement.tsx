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
import Link from "next/link";

const mockQualityChecks = [
  {
    id: "1",
    workOrderNo: "WO202606170001",
    vehiclePlate: "京A12345",
    vehicleBrand: "丰田",
    vehicleModel: "凯美瑞",
    result: "PENDING",
    checkedAt: null,
    items: [
      { name: "发动机检查", result: "PENDING" },
      { name: "刹车系统", result: "PENDING" },
      { name: "灯光系统", result: "PENDING" },
    ],
  },
  {
    id: "2",
    workOrderNo: "WO202606160003",
    vehiclePlate: "京B67890",
    vehicleBrand: "大众",
    vehicleModel: "帕萨特",
    result: "PASSED",
    checkedAt: "2026-06-16T14:30:00",
    inspector: "李工",
    items: [
      { name: "发动机检查", result: "PASS" },
      { name: "变速箱检查", result: "PASS" },
      { name: "底盘检查", result: "PASS" },
    ],
  },
  {
    id: "3",
    workOrderNo: "WO202606160005",
    vehiclePlate: "京C11111",
    vehicleBrand: "本田",
    vehicleModel: "雅阁",
    result: "FAILED",
    checkedAt: "2026-06-16T16:00:00",
    inspector: "王工",
    remarks: "左前灯亮度不达标，需要返工",
    items: [
      { name: "外观钣金", result: "PASS" },
      { name: "喷漆质量", result: "PASS" },
      { name: "灯光系统", result: "FAIL", remark: "左前灯亮度不够" },
    ],
  },
];

const mockDelayedOrders = [
  {
    id: "1",
    workOrderNo: "WO202606150002",
    vehiclePlate: "京D22222",
    vehicleBrand: "奥迪",
    vehicleModel: "A6L",
    originalDelivery: "2026-06-16",
    newDelivery: "2026-06-18",
    reason: "配件缺货，等待到货",
    impactScope: "影响1台车辆交付，客户可能不满",
    delayDays: 2,
  },
];

const tabs = [
  { key: "pending", label: "待质检", icon: Clock },
  { key: "passed", label: "已通过", icon: CheckCircle },
  { key: "failed", label: "未通过", icon: XCircle },
  { key: "delayed", label: "延期工单", icon: AlertTriangle },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">质检交付</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理质检流程和交付确认</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium">
          <ClipboardCheck className="w-4 h-4" />
          登记质检
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "待质检", value: 5, icon: Clock, color: "bg-amber-500" },
          { label: "今日完成", value: 12, icon: CheckCircle, color: "bg-emerald-500" },
          { label: "未通过", value: 2, icon: XCircle, color: "bg-rose-500" },
          { label: "延期工单", value: 1, icon: AlertTriangle, color: "bg-orange-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-card border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
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
          {activeTab === "delayed" ? (
            <div className="space-y-4">
              {mockDelayedOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 bg-rose-50 dark:bg-rose-900/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {order.vehiclePlate}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {order.vehicleBrand} {order.vehicleModel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
                          延期 {order.delayDays} 天
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-mono">
                        {order.workOrderNo}
                      </p>
                    </div>
                    <Link
                      href={`/quality/delay/${order.id}`}
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
                      <p className="text-sm text-slate-700 dark:text-slate-300">{order.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                        影响范围
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {order.impactScope}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                        预计新交付
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {order.newDelivery}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mockQualityChecks
                .filter((qc) => {
                  if (activeTab === "pending") return qc.result === "PENDING";
                  if (activeTab === "passed") return qc.result === "PASSED";
                  if (activeTab === "failed") return qc.result === "FAILED";
                  return true;
                })
                .map((qc) => (
                  <div
                    key={qc.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {qc.vehiclePlate}
                          </h3>
                          <span className="text-sm text-slate-500">
                            {qc.vehicleBrand} {qc.vehicleModel}
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
                          工单号：{qc.workOrderNo}
                          {qc.checkedAt && (
                            <>
                              {" · "}
                              {new Date(qc.checkedAt).toLocaleString("zh-CN")}
                            </>
                          )}
                          {qc.inspector && <> · {qc.inspector}</>}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 text-sm bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 rounded-lg transition-colors font-medium">
                        处理质检
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {qc.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              itemResultColors[item.result]
                            }`}
                          ></span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {qc.remarks && (
                      <p className="text-sm text-rose-600 dark:text-rose-400 mt-3 bg-rose-50 dark:bg-rose-900/20 p-2 rounded">
                        备注：{qc.remarks}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
