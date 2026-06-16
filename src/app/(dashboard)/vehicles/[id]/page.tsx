"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/react";
import {
  Car,
  ArrowLeft,
  Phone,
  FileText,
  Calendar,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "待分配",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
  },
  ASSIGNED: {
    label: "已分配",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  IN_PROGRESS: {
    label: "维修中",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  QUALITY_CHECK: {
    label: "待质检",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  COMPLETED: {
    label: "已完成",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  DELAYED: {
    label: "已延期",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: vehicle, isLoading, error } = trpc.vehicle.get.useQuery({
    id: params.id,
  });

  const deleteVehicle = trpc.vehicle.delete.useMutation({
    onSuccess: () => {
      utils.vehicle.list.invalidate();
      router.push("/vehicles");
    },
    onError: (error) => {
      alert(error.message);
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (confirm("确定要删除这辆车吗？相关联的工单会导致删除失败。")) {
      setIsDeleting(true);
      deleteVehicle.mutate({ id: params.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          返回车辆列表
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
          <Car className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">车辆不存在或已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vehicles"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {vehicle.plateNumber}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {vehicle.brand} {vehicle.model} · {vehicle.year}款
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workorders/new?vehicleId=${vehicle.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            创建工单
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "删除中..." : "删除"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              基本信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  车牌号
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {vehicle.plateNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  车架号
                </span>
                <span className="font-mono text-sm text-slate-900 dark:text-white">
                  {vehicle.vin}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  品牌型号
                </span>
                <span className="text-slate-900 dark:text-white">
                  {vehicle.brand} {vehicle.model}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  年款/颜色
                </span>
                <span className="text-slate-900 dark:text-white">
                  {vehicle.year}款 · {vehicle.color}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  当前里程
                </span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {Number(vehicle.mileage).toLocaleString()} km
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  登记时间
                </span>
                <span className="text-slate-900 dark:text-white">
                  {new Date(vehicle.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              车主信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {vehicle.ownerName?.[0] || "-"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {vehicle.ownerName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {vehicle.ownerPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                维修历史
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                共 {vehicle.workOrders?.length || 0} 条记录
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {vehicle.workOrders?.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 dark:text-slate-400">
                    暂无维修记录
                  </p>
                </div>
              ) : (
                vehicle.workOrders?.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/workorders/${order.id}`}
                    className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            {new Date(order.createdAt)
                              .getDate()
                              .toString()
                              .padStart(2, "0")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString(
                              "zh-CN",
                              { month: "short" }
                            )}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white font-mono">
                              {order.orderNo}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                statusConfig[order.status]?.className
                              }`}
                            >
                              {statusConfig[order.status]?.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {order.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white font-mono">
                          ¥{Number(order.totalCost).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          预计交付：
                          {new Date(
                            order.estimatedDelivery
                          ).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
