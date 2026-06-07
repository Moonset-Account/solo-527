"use client";

import { X, Clock, Package, User, MapPin, FileText, AlertCircle } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import type { ReturnRecord } from "@/lib/types";

export default function DetailPanel() {
  const { selectedRecord, detailPanelOpen, closeDetail } = useDashboardStore();

  if (!detailPanelOpen || !selectedRecord) return null;

  const record: ReturnRecord = selectedRecord;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={closeDetail}
      />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto animate-slide-in-right shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-800">
              退货单详情
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{record.returnId}</p>
          </div>
          <button
            onClick={closeDetail}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{record.productName}</p>
              <p className="text-xs text-slate-500">SKU: {record.sku}</p>
            </div>
          </div>

          {record.isRepeatUser && (
            <div className="flex items-center gap-3 p-4 bg-warning-50 rounded-lg border border-warning-200">
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-warning-800">重复退货用户</p>
                <p className="text-xs text-warning-600 mt-0.5">
                  该用户（已脱敏）历史退货次数≥3次，请注意识别
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              退货原因
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">一级原因</span>
                <span className="text-sm font-medium text-slate-700">{record.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">详细原因</span>
                <span className="text-sm font-medium text-slate-700">{record.reasonDetail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">质检结果</span>
                <span className={`text-sm font-medium ${
                  record.qualityResult === "通过" ? "text-success-600" : "text-warning-600"
                }`}>
                  {record.qualityResult}
                </span>
              </div>
              {record.customerRemark && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <span className="text-xs text-slate-500">客户备注</span>
                  <p className="text-sm text-slate-700 mt-1">{record.customerRemark}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              时间链路
            </h3>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-200" />
              <TimelineItem
                label="退货申请"
                time={record.applyTime}
                active
              />
              <TimelineItem
                label="质检完成"
                time={record.qualityTime}
              />
              <TimelineItem
                label="退款完成"
                time={record.refundTime}
              />
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">总退款周期</span>
                  <span className="font-semibold text-primary-600">{record.refundCycle} 天</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">客服处理时长</span>
                  <span className="font-medium text-slate-700">{record.serviceHandleTime} 分钟</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              渠道信息
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="店铺" value={record.store} />
              <InfoItem label="仓库" value={record.warehouse} />
              <InfoItem label="物流商" value={record.logistics} />
              <InfoItem label="关联订单" value={record.orderId} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              客服信息
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="处理客服" value={record.agentId} />
              <InfoItem label="用户标识" value={record.userHash.slice(0, 16) + "..."} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ label, time, active = false }: { label: string; time: string; active?: boolean }) {
  return (
    <div className="relative">
      <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${
        active ? "bg-primary-500 border-primary-500" : "bg-white border-slate-300"
      }`} />
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">{time}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{value}</p>
    </div>
  );
}
