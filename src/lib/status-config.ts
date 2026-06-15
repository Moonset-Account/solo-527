import type { RepairStatus, ComplaintStatus, RefundStatus, TradeStatus, NotificationStatus, ExportStatus } from "@prisma/client";

export const repairStatusConfig: Record<RepairStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "待处理", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  ASSIGNED: { label: "已分配", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  IN_PROGRESS: { label: "处理中", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  COMPLETED: { label: "已完成", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  CANCELLED: { label: "已取消", color: "text-gray-700", bgColor: "bg-gray-50 border-gray-200" },
  REJECTED: { label: "已拒绝", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

export const complaintStatusConfig: Record<ComplaintStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "待处理", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  UNDER_REVIEW: { label: "审核中", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  RESOLVED: { label: "已解决", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  DISMISSED: { label: "已驳回", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

export const refundStatusConfig: Record<RefundStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "待处理", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  APPROVED: { label: "已批准", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  REJECTED: { label: "已拒绝", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
  COMPLETED: { label: "已完成", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
};

export const tradeStatusConfig: Record<TradeStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "待交易", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  IN_PROGRESS: { label: "交易中", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  COMPLETED: { label: "已完成", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  CANCELLED: { label: "已取消", color: "text-gray-700", bgColor: "bg-gray-50 border-gray-200" },
  DISPUTED: { label: "有争议", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

export const notificationStatusConfig: Record<NotificationStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "待发送", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  SENT: { label: "已发送", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  DELIVERED: { label: "已送达", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
  READ: { label: "已读", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
};

export const exportStatusConfig: Record<ExportStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "排队中", color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  PROCESSING: { label: "处理中", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
  COMPLETED: { label: "已完成", color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  FAILED: { label: "失败", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

export const repairCategoryConfig: Record<string, { label: string; icon: string }> = {
  PLUMBING: { label: "水电维修", icon: "🔧" },
  ELECTRICAL: { label: "电器维修", icon: "⚡" },
  FURNITURE: { label: "家具维修", icon: "🪑" },
  APPLIANCE: { label: "家电维修", icon: "📺" },
  DOOR_LOCK: { label: "门锁维修", icon: "🔑" },
  WINDOW: { label: "窗户维修", icon: "🪟" },
  OTHER: { label: "其他", icon: "📋" },
};

export const userRoleConfig: Record<string, { label: string; color: string }> = {
  STUDENT: { label: "学生", color: "text-blue-700" },
  DORM_MANAGER: { label: "宿管", color: "text-purple-700" },
  ADMIN: { label: "管理员", color: "text-red-700" },
};
