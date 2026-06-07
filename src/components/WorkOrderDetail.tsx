"use client";

import { WorkOrder, STATUS_LABELS, STATUS_COLORS } from "@/types";
import { cn, formatDate, formatDuration, maskTenantName } from "@/lib/utils";
import {
  Clock,
  CheckCircle,
  User,
  Star,
  RefreshCw,
  AlertCircle,
  FileText,
  Image,
  MessageSquare,
  Calendar,
  Check,
  X,
} from "lucide-react";

interface WorkOrderDetailProps {
  order: WorkOrder;
  onClose?: () => void;
}

const timelineSteps = [
  { key: "pending", label: "创建工单", icon: FileText },
  { key: "confirmed", label: "供应商确认", icon: CheckCircle },
  { key: "in_progress", label: "上门维修", icon: Clock },
  { key: "completed", label: "维修完成", icon: CheckCircle },
  { key: "closed", label: "工单关闭", icon: CheckCircle },
];

export default function WorkOrderDetail({ order, onClose }: WorkOrderDetailProps) {
  const currentStepIndex = timelineSteps.findIndex((s) => s.key === order.status);
  const maskedTenant = maskTenantName(order.tenantName);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">{order.orderNo}</h2>
              <span className={cn("badge", STATUS_COLORS[order.status])}>
                {STATUS_LABELS[order.status]}
              </span>
              {order.isRepeat && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-md font-medium">
                  <RefreshCw className="w-3 h-3" />
                  复修工单
                </span>
              )}
              {order.isHoliday && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-md font-medium">
                  节假日工单
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {order.buildingName} {order.roomNo} · {order.roomType}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">工单生命周期</h3>
            <div className="relative">
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200" />
              <div className="space-y-4">
                {timelineSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center relative z-10",
                          isCompleted
                            ? "bg-primary-500 text-white"
                            : "bg-white border-2 border-slate-200 text-slate-400"
                        )}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          )}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(order.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {order.materials.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                材料消耗明细
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">
                        材料名称
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">
                        数量
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">
                        单价
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">
                        小计
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {order.materials.map((mat) => (
                      <tr key={mat.id}>
                        <td className="px-4 py-2.5 text-slate-700">{mat.name}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {mat.quantity} {mat.unit}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">¥{mat.price}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                          ¥{mat.quantity * mat.price}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-4 py-2.5 text-right font-medium text-slate-700">
                        合计
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-primary-600">
                        ¥{order.materials.reduce((sum, m) => sum + m.quantity * m.price, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {order.photos.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Image className="w-4 h-4" />
                材料照片
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {order.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg bg-slate-200 overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt={`材料照片 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.appealRecords.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                供应商申诉
              </h3>
              {order.appealRecords.map((record) => (
                <div key={record.id} className="bg-white rounded-lg p-4">
                  <p className="text-sm text-slate-700">{record.reason}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">租户确认:</span>
                      {record.tenantConfirmation !== undefined ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                            record.tenantConfirmation
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          )}
                        >
                          {record.tenantConfirmation ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {record.tenantConfirmation ? "已确认" : "未确认"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">待确认</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>
                  {record.photos.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {record.photos.map((p, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 rounded bg-slate-100 overflow-hidden"
                        >
                          <img
                            src={p}
                            alt={`申诉照片 ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">工单信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">维修类型</span>
                <span className="text-slate-900 font-medium">{order.repairType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">供应商</span>
                <span className="text-slate-900 font-medium">{order.supplierName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">响应时长</span>
                <span
                  className={cn(
                    "font-medium",
                    order.responseTime && order.responseTime > 120
                      ? "text-red-600"
                      : "text-slate-900"
                  )}
                >
                  {formatDuration(order.responseTime)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">创建时间</span>
                <span className="text-slate-700">{formatDate(order.createdAt)}</span>
              </div>
              {order.parentOrderNo && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">关联原工单</span>
                  <span className="text-primary-600 font-medium">{order.parentOrderNo}</span>
                </div>
              )}
            </div>
          </div>

          {order.tenantRating !== undefined && (
            <div className="bg-slate-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" />
                租户评价
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-5 h-5",
                        star <= order.tenantRating!
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-slate-900">{order.tenantRating}.0</span>
              </div>
              {order.tenantFeedback && (
                <p className="text-sm text-slate-600 bg-white rounded-lg p-3 border border-slate-200">
                  {order.tenantFeedback}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                评价用户: {maskedTenant}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
