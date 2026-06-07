"use client";

import { WorkOrder, STATUS_LABELS, STATUS_COLORS } from "@/types";
import { cn, formatDate, formatDuration, maskTenantName } from "@/lib/utils";
import { RefreshCw, Clock, Star, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

interface WorkOrderTableProps {
  orders: WorkOrder[];
  onOrderClick?: (order: WorkOrder) => void;
}

export default function WorkOrderTable({ orders, onOrderClick }: WorkOrderTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                工单编号
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                楼栋/房间
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                维修类型
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                供应商
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                状态
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                响应时长
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                评分
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                标签
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onOrderClick?.(order)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      {order.orderNo}
                    </span>
                    <Link
                      href={`/work-orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-primary-500 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm text-slate-900">{order.buildingName}</p>
                  <p className="text-xs text-slate-500">{order.roomNo} · {order.roomType}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-slate-700">{order.repairType}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-slate-700">{order.supplierName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("badge", STATUS_COLORS[order.status])}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(order.createdAt)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className={cn(
                      "w-3.5 h-3.5",
                      order.responseTime && order.responseTime > 120 ? "text-red-500" : "text-slate-400"
                    )} />
                    <span className={cn(
                      order.responseTime && order.responseTime > 120 ? "text-red-600 font-medium" : "text-slate-600"
                    )}>
                      {formatDuration(order.responseTime)}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {order.tenantRating ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {order.tenantRating}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 flex-wrap">
                    {order.isRepeat && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-md font-medium">
                        <RefreshCw className="w-3 h-3" />
                        复修
                      </span>
                    )}
                    {order.isHoliday && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-md font-medium">
                        节假日
                      </span>
                    )}
                    {order.appealRecords.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md font-medium">
                        申诉中
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-slate-500">暂无符合条件的工单</p>
        </div>
      )}
    </div>
  );
}
