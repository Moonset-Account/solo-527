"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Modal } from "@/components/modal";
import { formatDate, formatCurrency, formatFileSize } from "@/lib/utils";
import { repairCategoryConfig } from "@/lib/status-config";
import {
  ArrowLeft,
  Wrench,
  User,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
  History,
  Send,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
} from "lucide-react";
import { RepairStatus } from "@prisma/client";

export default function RepairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<RepairStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");

  const { data: repair, isLoading, refetch } = api.repair.getById.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: user } = api.user.me.useQuery();

  const addComment = api.repair.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      refetch();
    },
  });

  const updateStatus = api.repair.updateStatus.useMutation({
    onSuccess: () => {
      setShowStatusModal(false);
      setNewStatus("");
      setStatusNote("");
      refetch();
    },
  });

  const createComplaint = api.complaint.create.useMutation({
    onSuccess: () => {
      setShowComplaintModal(false);
      setComplaintTitle("");
      setComplaintDescription("");
      refetch();
    },
  });

  const createRefund = api.refund.create.useMutation({
    onSuccess: () => {
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
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

  if (!repair) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">报修单不存在</p>
          <Link href="/repairs" className="text-blue-600 hover:text-blue-700">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate({
      repairRequestId: repair.id,
      content: comment,
      isInternal: isAdmin,
    });
  };

  const handleStatusChange = () => {
    if (!newStatus) return;
    updateStatus.mutate({
      id: repair.id,
      status: newStatus as RepairStatus,
      note: statusNote,
    });
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDescription.trim()) return;
    createComplaint.mutate({
      title: complaintTitle,
      description: complaintDescription,
      repairRequestId: repair.id,
    });
  };

  const handleCreateRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAmount || !refundReason.trim()) return;
    createRefund.mutate({
      repairRequestId: repair.id,
      amount: parseFloat(refundAmount),
      reason: refundReason,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/repairs"
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{repair.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span>ID: {repair.id}</span>
                <StatusBadge status={repair.status} type="repair" />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                更新状态
              </button>
            </div>
          )}

          {!isAdmin && repair.reportedById === user?.id && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowComplaintModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 text-orange-700 font-medium hover:bg-orange-50 transition-colors"
              >
                <AlertTriangle className="h-4 w-4" />
                提交举报
              </button>
              {repair.status === "COMPLETED" && repair.actualCost && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 font-medium hover:bg-red-50 transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  申请退款
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">报修详情</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-500">问题描述</label>
                  <p className="mt-1 text-zinc-700 whitespace-pre-wrap">{repair.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Wrench className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">分类</p>
                      <p className="text-zinc-700">
                        {repairCategoryConfig[repair.category]?.label || repair.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">位置</p>
                      <p className="text-zinc-700">
                        {repair.dormNumber} {repair.roomNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">报修人</p>
                      <p className="text-zinc-700">
                        {repair.reportedBy?.name} ({repair.reportedBy?.studentId})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">提交时间</p>
                      <p className="text-zinc-700">{formatDate(repair.createdAt)}</p>
                    </div>
                  </div>
                  {repair.assignedTo && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-zinc-500">处理人</p>
                        <p className="text-zinc-700">{repair.assignedTo.name}</p>
                      </div>
                    </div>
                  )}
                  {repair.scheduledAt && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-zinc-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-zinc-500">预约时间</p>
                        <p className="text-zinc-700">{formatDate(repair.scheduledAt)}</p>
                      </div>
                    </div>
                  )}
                  {repair.completedAt && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-zinc-500">完成时间</p>
                        <p className="text-zinc-700">{formatDate(repair.completedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(repair.estimatedCost || repair.actualCost) && (
                  <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">费用信息</p>
                      <div className="flex gap-4 mt-1">
                        {repair.estimatedCost && (
                          <span className="text-zinc-700">
                            预估: {formatCurrency(repair.estimatedCost.toNumber())}
                          </span>
                        )}
                        {repair.actualCost && (
                          <span className="text-zinc-900 font-medium">
                            实际: {formatCurrency(repair.actualCost.toNumber())}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {repair.relatedTrade && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">关联二手交易</p>
                      <Link
                        href={`/trades/${repair.relatedTradeId}`}
                        className="text-blue-700 hover:text-blue-800 font-medium"
                      >
                        {repair.relatedTrade.title}
                      </Link>
                      <p className="text-sm text-blue-600">
                        {repair.relatedTrade.seller?.name} → {repair.relatedTrade.buyer?.name || "未交易"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {repair.photos.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  现场照片 ({repair.photos.length})
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {repair.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden bg-zinc-100"
                    >
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                      <p className="text-xs text-zinc-500 p-2 truncate">{photo.fileName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                备注交流 ({repair.comments.length})
              </h2>

              <div className="space-y-4 mb-6">
                {repair.comments.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">暂无备注</p>
                ) : (
                  repair.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-4 rounded-lg ${
                        comment.isInternal ? "bg-orange-50 border border-orange-200" : "bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{comment.author.name}</span>
                          <span className="text-xs text-zinc-500">
                            {comment.author.role === "ADMIN" ? "管理员" : comment.author.role === "DORM_MANAGER" ? "宿管" : "学生"}
                          </span>
                          {comment.isInternal && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              内部备注
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-zinc-700 whitespace-pre-wrap">{comment.content}</p>
                      {comment.attachments.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {comment.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 text-sm text-zinc-600"
                            >
                              <Paperclip className="h-4 w-4" />
                              <span>{att.fileName}</span>
                              <span className="text-zinc-400">({formatFileSize(att.fileSize)})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isAdmin ? "添加备注（内部）..." : "添加备注..."}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || addComment.isLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                变更日志
              </h2>
              <div className="space-y-4">
                {repair.auditLogs.map((log) => (
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

            {repair.activities.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-4">活动参与记录</h2>
                <div className="space-y-2">
                  {repair.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-zinc-700">{activity.activityName}</p>
                        <p className="text-xs text-zinc-500">
                          {activity.user?.name} · {formatDate(activity.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{activity.points} 分</span>
                    </div>
                  ))}
                </div>
                {repair.activities.length > 10 && (
                  <p className="text-sm text-orange-600 mt-3">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    活动参与次数超额（{repair.activities.length}/10）
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {repair.complaints.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-4">相关举报</h2>
                <div className="space-y-3">
                  {repair.complaints.map((c) => (
                    <div key={c.id} className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-zinc-900">{c.title}</span>
                        <StatusBadge status={c.status} type="complaint" />
                      </div>
                      <p className="text-sm text-zinc-600 line-clamp-2">{c.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {c.submittedBy?.name} · {formatDate(c.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {repair.refunds.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-4">退款记录</h2>
                <div className="space-y-3">
                  {repair.refunds.map((r) => (
                    <div key={r.id} className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-zinc-900">
                          {formatCurrency(r.amount.toNumber())}
                        </span>
                        <StatusBadge status={r.status} type="refund" />
                      </div>
                      <p className="text-sm text-zinc-600 line-clamp-2">{r.reason}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {r.requestedBy?.name} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">操作提示</h2>
              <div className="space-y-2 text-sm text-zinc-600">
                <p>• 状态变更会自动通知报修人</p>
                <p>• 内部备注仅管理员可见</p>
                <p>• 所有操作都会记录审计日志</p>
                <p>• 退款需管理员审批后处理</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="更新报修状态"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStatusChange}
              disabled={!newStatus || updateStatus.isLoading}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateStatus.isLoading ? "更新中..." : "确认更新"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              新状态
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries({
                PENDING: { label: "待处理", icon: Clock },
                ASSIGNED: { label: "已分配", icon: User },
                IN_PROGRESS: { label: "处理中", icon: RefreshCw },
                COMPLETED: { label: "已完成", icon: CheckCircle2 },
                CANCELLED: { label: "已取消", icon: XCircle },
                REJECTED: { label: "已拒绝", icon: XCircle },
              }).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewStatus(key as RepairStatus)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    newStatus === key
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              备注说明（可选）
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="添加状态变更的说明..."
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title="提交举报"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowComplaintModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateComplaint}
              disabled={!complaintTitle.trim() || !complaintDescription.trim() || createComplaint.isLoading}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createComplaint.isLoading ? "提交中..." : "提交举报"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              举报标题
            </label>
            <input
              type="text"
              value={complaintTitle}
              onChange={(e) => setComplaintTitle(e.target.value)}
              placeholder="简要描述举报问题"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              详细描述
            </label>
            <textarea
              value={complaintDescription}
              onChange={(e) => setComplaintDescription(e.target.value)}
              placeholder="请详细描述举报的原因和情况..."
              rows={4}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="申请退款"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowRefundModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateRefund}
              disabled={!refundAmount || !refundReason.trim() || createRefund.isLoading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRefund.isLoading ? "提交中..." : "提交申请"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 rounded-lg">
            <p className="text-sm text-zinc-600">
              报修单实际费用: {formatCurrency(repair.actualCost?.toNumber() || 0)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              退款金额（元）
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={repair.actualCost?.toNumber() || 0}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="请输入退款金额"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              退款原因
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="请详细说明退款原因..."
              rows={4}
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
