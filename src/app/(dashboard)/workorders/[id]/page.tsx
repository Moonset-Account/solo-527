"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import {
  ClipboardList,
  ArrowLeft,
  Car,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: {
    label: "待分配",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
    icon: Clock,
  },
  ASSIGNED: {
    label: "已分配",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Users,
  },
  IN_PROGRESS: {
    label: "维修中",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  QUALITY_CHECK: {
    label: "待质检",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    icon: ShieldCheck,
  },
  COMPLETED: {
    label: "已完成",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle,
  },
  DELAYED: {
    label: "已延期",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    icon: AlertTriangle,
  },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "低", className: "bg-slate-100 text-slate-600" },
  NORMAL: { label: "普通", className: "bg-blue-100 text-blue-600" },
  HIGH: { label: "高", className: "bg-amber-100 text-amber-600" },
  URGENT: { label: "紧急", className: "bg-rose-100 text-rose-600" },
};

const availableStatuses = [
  { key: "ASSIGNED", label: "标记为已分配" },
  { key: "IN_PROGRESS", label: "开始维修" },
  { key: "QUALITY_CHECK", label: "提交质检" },
  { key: "COMPLETED", label: "完成工单" },
  { key: "DELAYED", label: "标记延期" },
];

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"items" | "quality" | "delay">("items");

  const { data: order, isLoading, error } = trpc.workOrder.get.useQuery({
    id: params.id,
  });

  const updateStatus = trpc.workOrder.updateStatus.useMutation({
    onSuccess: () => {
      utils.workOrder.get.invalidate({ id: params.id });
      utils.workOrder.list.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const removeItem = trpc.workOrder.removeItem.useMutation({
    onSuccess: () => {
      utils.workOrder.get.invalidate({ id: params.id });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (confirm(`确定要将工单状态更改为「${statusConfig[newStatus]?.label}」吗？`)) {
      updateStatus.mutate({
        id: params.id,
        status: newStatus as any,
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (confirm("确定要删除这个项目吗？")) {
      removeItem.mutate({ itemId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          href="/workorders"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工单列表
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">工单不存在或已被删除</p>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const isDelayed =
    order.status !== "COMPLETED" &&
    new Date(order.estimatedDelivery) < new Date();
  const partItems = order.items?.filter((i: any) => i.type === "PART") || [];
  const serviceItems = order.items?.filter((i: any) => i.type === "SERVICE") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/workorders"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {order.orderNo}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusConfig[order.status]?.className
                }`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig[order.status]?.label}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  priorityConfig[order.priority]?.className
                }`}
              >
                {priorityConfig[order.priority]?.label}
              </span>
              {isDelayed && order.status !== "DELAYED" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  已逾期
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {order.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.status !== "COMPLETED" && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm">
                变更状态
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {availableStatuses
                  .filter((s) => s.key !== order.status)
                  .map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleStatusChange(s.key)}
                      disabled={updateStatus.isPending}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <Link
            href={`/quality?workOrderId=${order.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            质检
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              车辆信息
            </h3>
            <Link
              href={`/vehicles/${order.vehicle?.id}`}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">
                  {order.vehicle?.plateNumber}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {order.vehicle?.brand} {order.vehicle?.model} ·{" "}
                  {order.vehicle?.year}款
                </p>
              </div>
            </Link>
            <div className="mt-3 text-sm">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">车主</span>
                <span className="text-slate-900 dark:text-white">
                  {order.vehicle?.ownerName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">联系电话</span>
                <span className="text-slate-900 dark:text-white font-mono">
                  {order.vehicle?.ownerPhone}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">当前里程</span>
                <span className="text-slate-900 dark:text-white font-mono">
                  {Number(order.vehicle?.mileage).toLocaleString()} km
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              时间与成本
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-slate-500 text-xs">创建时间</p>
                  <p className="text-slate-900 dark:text-white">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <Clock
                  className={`w-4 h-4 ${
                    isDelayed ? "text-rose-500" : "text-slate-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-slate-500 text-xs">预计交付</p>
                  <p
                    className={`${
                      isDelayed
                        ? "text-rose-500 font-medium"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {new Date(
                      order.estimatedDelivery
                    ).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
              {order.actualDelivery && (
                <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-slate-500 text-xs">实际交付</p>
                    <p className="text-emerald-600 dark:text-emerald-400">
                      {new Date(
                        order.actualDelivery
                      ).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-3">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">工时费用</span>
                  <span className="text-slate-900 dark:text-white font-mono">
                    ¥{Number(order.totalLaborCost).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">配件费用</span>
                  <span className="text-slate-900 dark:text-white font-mono">
                    ¥{Number(order.totalPartCost).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    合计
                  </span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400 font-mono">
                    ¥{Number(order.totalCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {order.schedules && order.schedules.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                排期信息
              </h3>
              {order.schedules.map((schedule: any) => (
                <div
                  key={schedule.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-2 last:mb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {schedule.team?.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {schedule.status === "SCHEDULED"
                        ? "待开始"
                        : schedule.status === "IN_PROGRESS"
                        ? "进行中"
                        : "已完成"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(schedule.scheduledDate).toLocaleDateString(
                      "zh-CN"
                    )}{" "}
                    {schedule.startTime} - {schedule.endTime}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("items")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "items"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  维修项目 ({order.items?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("quality")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "quality"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  质检记录 ({order.qualityChecks?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("delay")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "delay"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  延期记录 ({order.delayRecords?.length || 0})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "items" && (
                <div className="space-y-6">
                  {serviceItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        工时项目
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                项目名称
                              </th>
                              <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-24">
                                数量
                              </th>
                              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                                单价
                              </th>
                              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                                小计
                              </th>
                              {order.status !== "COMPLETED" && (
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-16">
                                  操作
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                            {serviceItems.map((item: any) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <td className="px-4 py-3 text-slate-900 dark:text-white">
                                  {item.name}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300 font-mono">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                                  ¥{Number(item.unitPrice).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono font-medium">
                                  ¥{Number(item.subtotal).toLocaleString()}
                                </td>
                                {order.status !== "COMPLETED" && (
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {partItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-500" />
                        配件清单
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                配件名称
                              </th>
                              <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-24">
                                数量
                              </th>
                              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                                单价
                              </th>
                              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-32">
                                小计
                              </th>
                              {order.status !== "COMPLETED" && (
                                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-16">
                                  操作
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                            {partItems.map((item: any) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <td className="px-4 py-3 text-slate-900 dark:text-white">
                                  {item.name}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300 font-mono">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                                  ¥{Number(item.unitPrice).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-mono font-medium">
                                  ¥{Number(item.subtotal).toLocaleString()}
                                </td>
                                {order.status !== "COMPLETED" && (
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {order.items?.length === 0 && (
                    <div className="py-8 text-center">
                      <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        暂无维修项目
                      </p>
                    </div>
                  )}

                  {order.status !== "COMPLETED" && (
                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium">
                        <Plus className="w-4 h-4" />
                        添加项目
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "quality" && (
                <div className="space-y-4">
                  {order.qualityChecks?.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        暂无质检记录
                      </p>
                      <Link
                        href={`/quality?workOrderId=${order.id}`}
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        登记质检
                      </Link>
                    </div>
                  ) : (
                    order.qualityChecks?.map((qc: any) => (
                      <div
                        key={qc.id}
                        className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                qc.result === "PASSED"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                                  : qc.result === "FAILED"
                                  ? "bg-rose-100 dark:bg-rose-900/30"
                                  : "bg-slate-200 dark:bg-slate-600"
                              }`}
                            >
                              <ShieldCheck
                                className={`w-5 h-5 ${
                                  qc.result === "PASSED"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : qc.result === "FAILED"
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-slate-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {qc.result === "PASSED"
                                  ? "质检通过"
                                  : qc.result === "FAILED"
                                  ? "质检未通过"
                                  : "待质检"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(qc.checkedAt).toLocaleString(
                                  "zh-CN"
                                )}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              qc.result === "PASSED"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : qc.result === "FAILED"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {qc.result === "PASSED"
                              ? "已通过"
                              : qc.result === "FAILED"
                              ? "未通过"
                              : "待处理"}
                          </span>
                        </div>
                        {qc.remarks && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-lg">
                            备注：{qc.remarks}
                          </p>
                        )}
                        {qc.items && qc.items.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {qc.items.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.result === "PASS"
                                      ? "bg-emerald-500"
                                      : item.result === "FAIL"
                                      ? "bg-rose-500"
                                      : "bg-slate-400"
                                  }`}
                                ></span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "delay" && (
                <div className="space-y-4">
                  {order.delayRecords?.length === 0 ? (
                    <div className="py-8 text-center">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        暂无延期记录
                      </p>
                    </div>
                  ) : (
                    order.delayRecords?.map((delay: any) => (
                      <div
                        key={delay.id}
                        className="border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 bg-rose-50 dark:bg-rose-900/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-rose-600 dark:text-rose-400 mb-1">
                              {new Date(
                                delay.createdAt
                              ).toLocaleString("zh-CN")}
                            </p>
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              延期原因：{delay.reason}
                            </h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                              影响范围
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {delay.impactScope}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                              处理动作
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {delay.actionTaken}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">
                              下一步计划
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {delay.nextStep}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              预计交付：
                              {new Date(
                                delay.newEstimatedDelivery
                              ).toLocaleDateString("zh-CN")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
