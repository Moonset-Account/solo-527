import type { PricingRule } from "./types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function formatDateTime(dateTimeStr: string): string {
  return new Date(dateTimeStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDayOfWeekName(day: number): string {
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return names[day] ?? "";
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800";
    case "manager":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

export function getRoleName(role: string): string {
  switch (role) {
    case "admin":
      return "管理员";
    case "manager":
      return "负责人";
    default:
      return "用户";
  }
}

export function getBookingStatusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "conflict":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getBookingStatusName(status: string): string {
  switch (status) {
    case "confirmed":
      return "已确认";
    case "pending":
      return "待支付";
    case "cancelled":
      return "已取消";
    case "completed":
      return "已完成";
    case "conflict":
      return "有冲突";
    default:
      return status;
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "unpaid":
      return "bg-yellow-100 text-yellow-800";
    case "refunded":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentStatusName(status: string): string {
  switch (status) {
    case "paid":
      return "已支付";
    case "unpaid":
      return "未支付";
    case "refunded":
      return "已退款";
    default:
      return status;
  }
}

export function getConflictStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getConflictStatusName(status: string): string {
  switch (status) {
    case "open":
      return "待处理";
    case "in_progress":
      return "处理中";
    case "resolved":
      return "已解决";
    case "closed":
      return "已关闭";
    default:
      return status;
  }
}

export function calculatePrice(
  rules: PricingRule[],
  date: string,
  startTime: string,
  endTime: string
): number {
  const d = new Date(date);
  const dayOfWeek = d.getDay();

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalMinutes = endMinutes - startMinutes;
  if (totalMinutes <= 0) return 0;

  const hours = totalMinutes / 60;

  let applicableRule: PricingRule | null = null;

  for (const rule of rules) {
    if (!rule.is_active) continue;
    if (rule.day_of_week !== null && rule.day_of_week !== dayOfWeek) continue;

    const ruleStart = timeToMinutes(rule.start_time);
    const ruleEnd = timeToMinutes(rule.end_time);

    if (startMinutes >= ruleStart && endMinutes <= ruleEnd) {
      applicableRule = rule;
      break;
    }
  }

  if (!applicableRule) {
    const defaultRule = rules.find((r) => r.is_active && r.day_of_week === null);
    applicableRule = defaultRule ?? null;
  }

  if (!applicableRule) {
    return 50 * hours;
  }

  return applicableRule.base_price * applicableRule.multiplier * hours;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export function generateWeekDates(startDate?: Date): string[] {
  const start = startDate ?? new Date();
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0] ?? "");
  }
  return dates;
}
