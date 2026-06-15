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
  MapPin,
  MessageSquare,
  Image as ImageIcon,
  History,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import { TradeStatus } from "@prisma/client";

export default function TradeDetailPage() {
  const params = useParams();
  const [comment, setComment] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<TradeStatus | "">("");
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRepairId, setLinkRepairId] = useState("");

  const { data: trade, isLoading, refetch } = api.trade.getById.useQuery(
    { id: params.id as string },
    { enabled: !!params.id }
  );

  const { data: user } = api.user.me.useQuery();

  const addComment = api.trade.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      refetch();
    },
  });

  const updateStatus = api.trade.updateStatus.useMutation({
    onSuccess: () => {
      setShowStatusModal(false);
      setNewStatus("");
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

  const linkToRepair = api.trade.linkToRepair.useMutation({
    onSuccess: () => {
      setShowLinkModal(false);
      setLinkRepairId("");
      refetch();
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-500">加载中...</div>
        </div>
      </AppLayout>
    );
  }

  if (!trade) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">商品不存在</p>
          <Link href="/trades" className="text-blue-600 hover:text-blue-700">
            返回列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isSeller = trade.sellerId === user?.id;
  const isBuyer = trade.buyerId === user?.id;
  const isAdmin = user?.role === "ADMIN" || user?.role === "DORM_MANAGER";
  const canEdit = isSeller || isBuyer || isAdmin;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate({
      tradeId: trade.id,
      content: comment,
    });
  };

  const handleStatusChange = () => {
    if (!newStatus) return;
    updateStatus.mutate({
      id: trade.id,
      status: newStatus as TradeStatus,
    });
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDescription.trim()) return;
    createComplaint.mutate({
      title: complaintTitle,
      description: complaintDescription,
      tradeId: trade.id,
    });
  };

  const handleLinkToRepair = () => {
    if (!linkRepairId.trim()) return;
    linkToRepair.mutate({
      tradeId: trade.id,
      repairRequestId: linkRepairId,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/trades"
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{trade.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span>ID: {trade.id}</span>
                <StatusBadge status={trade.status} type="trade" />
              </div>
            </div>
          </div>

          {canEdit && trade.status !== "COMPLETED" && trade.status !== "CANCELLED" && (
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

          {!isSeller && !isAdmin && (
            <button
              onClick={() => setShowComplaintModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 text-orange-700 font-medium hover:bg-orange-50 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              举报
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 text-blue-700 font-medium hover:bg-blue-50 transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              关联报修
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="aspect-video bg-zinc-100 flex items-center justify-center">
                <DollarSign className="h-24 w-24 text-zinc-300" />
              </div>
              {trade.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 p-4 border-t border-zinc-200">
                  {trade.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square bg-zinc-100 rounded-lg flex items-center justify-center"
                    >
                      <ImageIcon className="h-8 w-8 text-zinc-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-zinc-900">商品详情</h2>
                <span className="text-3xl font-bold text-green-600">
                  {formatCurrency(trade.price.toNumber())}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-500">商品描述</label>
                  <p className="mt-1 text-zinc-700 whitespace-pre-wrap">{trade.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">卖家</p>
                      <p className="text-zinc-700">{trade.seller?.name}</p>
                      <p className="text-xs text-zinc-500">{trade.seller?.dormNumber}</p>
                    </div>
                  </div>
                  {trade.buyer && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-zinc-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-zinc-500">买家</p>
                        <p className="text-zinc-700">{trade.buyer.name}</p>
                        <p className="text-xs text-zinc-500">{trade.buyer.dormNumber}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">分类</p>
                      <p className="text-zinc-700">{trade.category}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">成色</p>
                      <p className="text-zinc-700">{trade.condition}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-zinc-500">发布时间</p>
                      <p className="text-zinc-700">{formatDate(trade.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {trade.repairRequests.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-500">关联报修单</label>
                    {trade.repairRequests.map((repair) => (
                      <Link
                        key={repair.id}
                        href={`/repairs/${repair.id}`}
                        className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <p className="text-blue-700 font-medium">{repair.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={repair.status} type="repair" />
                          <span className="text-xs text-blue-500">{formatDate(repair.createdAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {trade.complaints.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-500">相关举报</label>
                    {trade.complaints.map((c) => (
                      <div key={c.id} className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-900">{c.title}</span>
                          <StatusBadge status={c.status} type="complaint" />
                        </div>
                        <p className="text-sm text-zinc-600 mt-1 line-clamp-1">{c.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                交流区 ({trade.comments.length})
              </h2>

              <div className="space-y-4 mb-6">
                {trade.comments.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">暂无留言</p>
                ) : (
                  trade.comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-zinc-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{comment.author.name}</span>
                          <span className="text-xs text-zinc-500">
                            {comment.author.role === "ADMIN" ? "管理员" : comment.author.role === "DORM_MANAGER" ? "宿管" : "学生"}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-zinc-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="留言交流..."
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
                {trade.auditLogs.map((log) => (
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

          <div className="space-y-6">
            {trade.activities.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h2 className="font-semibold text-zinc-900 mb-4">活动参与</h2>
                <div className="space-y-2">
                  {trade.activities.map((activity) => (
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
              </div>
            )}

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">交易须知</h2>
              <div className="space-y-2 text-sm text-zinc-600">
                <p>• 请当面验货，确认商品完好</p>
                <p>• 建议在公共场合交易</p>
                <p>• 保留交易凭证，以备纠纷</p>
                <p>• 如有争议可提交举报</p>
                <p>• 平台不承担交易担保责任</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="更新交易状态"
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
                IN_PROGRESS: { label: "交易中", icon: RefreshCw },
                COMPLETED: { label: "已完成", icon: CheckCircle2 },
                CANCELLED: { label: "取消交易", icon: XCircle },
                DISPUTED: { label: "有争议", icon: AlertTriangle },
              }).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewStatus(key as TradeStatus)}
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
        </div>
      </Modal>

      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title="举报商品"
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
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="关联报修单"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowLinkModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleLinkToRepair}
              disabled={!linkRepairId.trim() || linkToRepair.isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {linkToRepair.isLoading ? "关联中..." : "确认关联"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            将此二手交易与报修单关联，便于后续追踪和管理。
          </p>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              报修单ID
            </label>
            <input
              type="text"
              value={linkRepairId}
              onChange={(e) => setLinkRepairId(e.target.value)}
              placeholder="请输入报修单ID"
              className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
