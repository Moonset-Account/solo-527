"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Modal } from "@/components/modal";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  DollarSign,
  User,
  Calendar,
  Clock,
  FileText,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { RefundStatus } from "@prisma/client";

export default function RefundDetailPage() {
  const params = useParams();
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [newStatus, setNewStatus] = useState<"APPROVED" | "REJECTED" | "">("");
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const { data: refund, isLoading, refetch } = api.refund.getById.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: user } = api.user.me.useQuery();

  const processRefund = api.refund.process.useMutation({
    onSuccess: () => {
      setShowProcessModal(false);
      setNewStatus("");
      setNotes("");
      setTransactionId("");
      refetch();
    },
  });

  const isAdmin = user?.role === "ADMIN" || user?.role === "DORM_MANAGER";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-500">加载中...</div>
        </div>
      </AppLayout>
    );
  }

  if (!refund) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">退款记录不存在</p>
          <Link href="/refunds" className="text-blue-600 hover:text-blue-700">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleProcess = () => {
    if (!newStatus) return;
    processRefund.mutate({
      id: refund.id,
      status: newStatus,
      notes: notes || undefined,
      transactionId: transactionId || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/refunds"
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">退款详情</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span>ID: {refund.id}</span>
                <StatusBadge status={refund.status} type="refund" />
              </div>
            </div>
          </div>

          {isAdmin && refund.status === "PENDING" && (
            <button
              onClick={() => setShowProcessModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              处理退款
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg mb-6">
            <div>
              <p className="text-sm text-red-600">退款金额</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(refund.amount.toNumber())}
              </p>
            </div>
            {refund.transactionId && (
              <div className="text-right">
                <p className="text-sm text-zinc-500">交易号</p>
                <p className="font-mono text-sm text-zinc-700">{refund.transactionId}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-500">退款原因</label>
              <p className="mt-1 text-zinc-700 whitespace-pre-wrap">{refund.reason}</p>
            </div>

            {refund.notes && (
              <div>
                <label className="text-sm text-zinc-500">处理备注</label>
                <p className="mt-1 text-zinc-700">{refund.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-500">申请人</p>
                  <p className="text-zinc-700">{refund.requestedBy?.name}</p>
                  <p className="text-xs text-zinc-500">{refund.requestedBy?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-500">申请时间</p>
                  <p className="text-zinc-700">{formatDate(refund.createdAt)}</p>
                </div>
              </div>
              {refund.processedBy && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-500">处理人</p>
                    <p className="text-zinc-700">{refund.processedBy.name}</p>
                  </div>
                </div>
              )}
              {refund.processedAt && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-500">处理时间</p>
                    <p className="text-zinc-700">{formatDate(refund.processedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium mb-1">关联报修单</p>
              <Link
                href={`/repairs/${refund.repairRequestId}`}
                className="text-blue-700 hover:text-blue-800 font-medium"
              >
                {refund.repairRequest.title}
              </Link>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>实际费用: {formatCurrency(refund.repairRequest.actualCost?.toNumber() || 0)}</span>
                <StatusBadge status={refund.repairRequest.status} type="repair" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <History className="h-5 w-5" />
            处理日志
          </h2>
          <div className="space-y-4">
            {refund.auditLogs.map((log) => (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-300" />
                  <div className="w-px flex-1 bg-zinc-200" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-900">{log.user?.name}</span>
                    <span className="text-xs text-zinc-500">
                      {log.user?.role === "ADMIN" ? "管理员" : log.user?.role === "DORM_MANAGER" ? "宿管" : "学生"}
                    </span>
                    <span className="text-xs text-zinc-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-600">{log.description || log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="处理退款"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowProcessModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleProcess}
              disabled={!newStatus || processRefund.isPending}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                newStatus === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {processRefund.isPending ? "处理中..." : newStatus === "APPROVED" ? "确认批准" : "确认拒绝"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-sm text-red-600">退款金额</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(refund.amount.toNumber())}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              处理结果
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewStatus("APPROVED")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  newStatus === "APPROVED"
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">批准退款</span>
              </button>
              <button
                type="button"
                onClick={() => setNewStatus("REJECTED")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  newStatus === "REJECTED"
                    ? "border-red-500 bg-red-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">拒绝退款</span>
              </button>
            </div>
          </div>

          {newStatus === "APPROVED" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                交易号（可选）
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="请输入退款交易号"
                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              处理备注 {newStatus === "REJECTED" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={newStatus === "REJECTED" ? "请说明拒绝原因..." : "添加处理备注（可选）..."}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
