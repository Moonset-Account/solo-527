import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  repairRequestId?: string;
  tradeId?: string;
  complaintId?: string;
  refundId?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(options: CreateNotificationOptions) {
  const {
    userId,
    type,
    title,
    content,
    repairRequestId,
    tradeId,
    complaintId,
    refundId,
    metadata,
  } = options;

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      repairRequestId,
      tradeId,
      complaintId,
      refundId,
      metadata: metadata as any,
    },
  });
}

export async function notifyRepairStatusChange(
  repairRequestId: string,
  userId: string,
  oldStatus: string,
  newStatus: string
) {
  return createNotification({
    userId,
    type: NotificationType.REPAIR_STATUS_UPDATE,
    title: "报修状态更新",
    content: `您的报修单状态已从 ${getStatusText(oldStatus)} 变更为 ${getStatusText(newStatus)}`,
    repairRequestId,
    metadata: { oldStatus, newStatus },
  });
}

export async function notifyComplaintUpdate(
  complaintId: string,
  userId: string,
  status: string
) {
  return createNotification({
    userId,
    type: NotificationType.COMPLAINT_UPDATE,
    title: "举报处理更新",
    content: `您的举报已被${getStatusText(status)}`,
    complaintId,
    metadata: { status },
  });
}

export async function notifyRefundUpdate(
  refundId: string,
  userId: string,
  status: string
) {
  return createNotification({
    userId,
    type: NotificationType.REFUND_UPDATE,
    title: "退款处理更新",
    content: `您的退款申请已${getStatusText(status)}`,
    refundId,
    metadata: { status },
  });
}

export async function notifyTradeUpdate(
  tradeId: string,
  userId: string,
  status: string
) {
  return createNotification({
    userId,
    type: NotificationType.TRADE_UPDATE,
    title: "交易状态更新",
    content: `您的交易状态已更新为${getStatusText(status)}`,
    tradeId,
    metadata: { status },
  });
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "待处理",
    ASSIGNED: "已分配",
    IN_PROGRESS: "处理中",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
    REJECTED: "已拒绝",
    UNDER_REVIEW: "审核中",
    RESOLVED: "已解决",
    DISMISSED: "已驳回",
    APPROVED: "已批准",
    DISPUTED: "有争议",
  };
  return statusMap[status] || status;
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      status: {
        in: ["PENDING", "SENT", "DELIVERED"],
      },
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });
}
