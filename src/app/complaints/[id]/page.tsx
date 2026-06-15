"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Modal } from "@/components/modal";
import { formatDate } from "@/lib/utils";
import { complaintStatusConfig } from "@/lib/status-config";
import { ArrowLeft, ShieldAlert, User, Calendar, Clock, Paperclip, History, Send, CheckCircle2, XCircle } from "lucide-react";
import { ComplaintStatus } from "@prisma/client";

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus | "">("");
  const [response, setResponse] = useState("");

  const { data: complaint, isLoading, refetch } = api.complaint.getById.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: user } = api.user.me.useQuery();

  const processComplaint = api.complaint.updateStatus.useMutation({
    onSuccess: () => {
      setShowProcessModal(false);
      setNewStatus("");
      setResponse("");
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

  if (!complaint) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">举报记录不存在</p>
          <Link href="/complaints" className="text-blue-600 hover:text-blue-700">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleProcess = () => {
    if (!newStatus || !response.trim()) return;
    processComplaint.mutate({
      id: complaint.id,
      status: newStatus as ComplaintStatus,
      response,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/complaints"
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{complaint.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span>ID: {complaint.id}</span>
                <StatusBadge status={complaint.status} type="complaint" />
              </div>
            </div>
          </div>

          {isAdmin && complaint.status === "PENDING" && (
            <button
              onClick={() => setShowProcessModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
            >
              <Send className="h-4 w-4" />
              处理举报
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">举报详情</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">举报内容</label>
                <p className="mt-1 text-zinc-700 whitespace-pre-wrap">{complaint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-500">提交人</p>
                    <p className="text-zinc-700">
                      {complaint.submittedBy?.name} ({complaint.submittedBy?.email})
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-500">提交时间</p>
                    <p className="text-zinc-700">{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>
              </div>

              {complaint.repairRequest && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">关联报修单</p>
                  <Link
                    href={`/repairs/${complaint.repairRequestId}`}
                    className="text-blue-700 hover:text-blue-800 font-medium"
                  >
                    {complaint.repairRequest.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={complaint.repairRequest.status} type="repair" />
                  </div>
                </div>
              )}

              {complaint.trade && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium mb-1">关联交易</p>
                  <Link
                    href={`/trades/${complaint.tradeId}`}
                    className="text-green-700 hover:text-green-800 font-medium"
                  >
                    {complaint.trade.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={complaint.trade.status} type="trade" />
                  </div>
                </div>
              )}

              {complaint.attachments.length > 0 && (
                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">附件</label>
                  <div className="space-y-2">
                    {complaint.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg"
                      >
                        <Paperclip className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-zinc-700">{att.fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {complaint.response && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">处理回复</h2>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{complaint.respondedBy?.name}</span>
                    <span className="text-xs text-zinc-500">
                      {complaint.respondedBy?.role === "ADMIN" ? "管理员" : "宿管"}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatDate(complaint.respondedAt!)}
                  </span>
                </div>
                <p className="text-zinc-700 whitespace-pre-wrap">{complaint.response}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              处理日志
            </h2>
            <div className="space-y-4">
              {complaint.auditLogs.map((log) => (
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
      </div>

      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="处理举报"
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
              disabled={!newStatus || !response.trim() || processComplaint.isPending}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processComplaint.isPending ? "处理中..." : "确认处理"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              处理结果
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewStatus("RESOLVED")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  newStatus === "RESOLVED"
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">已解决</span>
              </button>
              <button
                type="button"
                onClick={() => setNewStatus("DISMISSED")}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  newStatus === "DISMISSED"
                    ? "border-red-500 bg-red-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">已驳回</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              回复内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="请输入对举报人的回复内容..."
              rows={4}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
