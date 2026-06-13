import { React from "react";

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "slate";
  className?: string;
}) {
  const styles = {
    default: "bg-primary-100 text-primary-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`badge ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function LeadQualityBadge({ quality }: { quality: string }) {
  const map: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    HIGH: { label: "高意向", variant: "success" },
    MEDIUM: { label: "中意向", variant: "warning" },
    LOW: { label: "低意向", variant: "slate" },
    POTENTIAL: { label: "待评估", variant: "info" },
  };
  const conf = map[quality] ?? { label: quality, variant: "default" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}

export function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    NEW: { label: "新建", variant: "info" },
    CONTACTING: { label: "跟进中", variant: "default" },
    APPOINTED: { label: "已预约", variant: "warning" },
    VISITED: { label: "已到店", variant: "success" },
    TREATING: { label: "治疗中", variant: "success" },
    CLOSED_WON: { label: "已成交", variant: "success" },
    CLOSED_LOST: { label: "已流失", variant: "danger" },
    SUSPENDED: { label: "已暂缓", variant: "slate" },
  };
  const conf = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    UNPAID: { label: "未付款", variant: "danger" },
    PARTIAL: { label: "部分付款", variant: "warning" },
    PAID: { label: "已付清", variant: "success" },
    REFUNDED: { label: "已退款", variant: "slate" },
  };
  const conf = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    LOW: { label: "低", variant: "slate" },
    NORMAL: { label: "普通", variant: "info" },
    HIGH: { label: "高", variant: "warning" },
    CRITICAL: { label: "紧急", variant: "danger" },
  };
  const conf = map[severity] ?? { label: severity, variant: "default" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}

export function AbnormalTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    DUPLICATE_LEAD: { label: "线索撞单", variant: "danger" },
    NO_RESPONSE: { label: "无响应", variant: "warning" },
    OVERDUE: { label: "超期", variant: "warning" },
    COMPLAINT: { label: "投诉", variant: "danger" },
    OTHER: { label: "其他", variant: "slate" },
  };
  const conf = map[type] ?? { label: type, variant: "default" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}

export function ResponseNodeBadge({ node }: { node?: string | null }) {
  const map: Record<string, string> = {
    INITIAL_CONTACT: "初次触达",
    FIRST_FOLLOWUP: "第一次回访",
    SECOND_FOLLOWUP: "第二次回访",
    APPOINTMENT_CONFIRM: "预约确认",
    PRE_VISIT_REMINDER: "到店前提醒",
    POST_VISIT_FOLLOWUP: "到店后跟进",
    TREATMENT_FOLLOWUP: "治疗回访",
    PAYMENT_REMINDER: "回款提醒",
  };
  if (!node) return <Badge variant="slate">未标记</Badge>;
  return <Badge variant="info">{map[node] ?? node}</Badge>;
}

export function IntentionBadge({ level }: { level?: string | null }) {
  if (!level) return null;
  const map: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    A: { label: "A 强烈意向", variant: "success" },
    B: { label: "B 一般意向", variant: "warning" },
    C: { label: "C 意向弱", variant: "slate" },
  };
  const conf = map[level] ?? { label: level, variant: "default" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}
