import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(price: number) {
  return `¥${price.toFixed(2)}`;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    draft: "bg-gray-100 text-gray-800",
    ongoing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
    registered: "bg-blue-100 text-blue-800",
    waitlisted: "bg-yellow-100 text-yellow-800",
    checked_in: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    available: "bg-green-100 text-green-800",
    reserved: "bg-yellow-100 text-yellow-800",
    sold: "bg-gray-100 text-gray-800",
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
    draft: "草稿",
    ongoing: "进行中",
    completed: "已完成",
    cancelled: "已取消",
    registered: "已报名",
    waitlisted: "候补",
    checked_in: "已签到",
    processing: "处理中",
    available: "可购买",
    reserved: "已预留",
    sold: "已售出",
    low: "低",
    medium: "中",
    high: "高",
    no_show: "未到场",
    late: "迟到",
    cancelled_late: "迟到取消",
    admin: "管理员",
    club_leader: "社团负责人",
    department_head: "部门负责人",
    member: "普通成员",
    student: "学生认证",
    club_leader_verify: "社团负责人认证",
    department: "部门认证",
  };
  return texts[status] || status;
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
