import { Badge } from "@/components/ui/badge";
import type { ProjectStatus, QuoteStatus, AddonStatus, RepairStatus } from "@prisma/client";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const variants: Record<ProjectStatus, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive" }> = {
    PENDING_QUOTE: { label: "待报价", variant: "warning" },
    QUOTE_CONFIRMED: { label: "报价已确认", variant: "info" },
    IN_PROGRESS: { label: "进行中", variant: "default" },
    ADDON_PENDING: { label: "待增项确认", variant: "warning" },
    COMPLETED: { label: "已完成", variant: "success" },
    CANCELLED: { label: "已取消", variant: "destructive" },
  };

  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const variants: Record<QuoteStatus, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive" }> = {
    DRAFT: { label: "草稿", variant: "secondary" },
    PENDING_CONFIRMATION: { label: "待确认", variant: "warning" },
    CONFIRMED: { label: "已确认", variant: "success" },
    REJECTED: { label: "已拒绝", variant: "destructive" },
  };

  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function AddonStatusBadge({ status }: { status: AddonStatus }) {
  const variants: Record<AddonStatus, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive" }> = {
    DRAFT: { label: "草稿", variant: "secondary" },
    PENDING_CONFIRMATION: { label: "待确认", variant: "warning" },
    CONFIRMED: { label: "已确认", variant: "success" },
    REJECTED: { label: "已拒绝", variant: "destructive" },
  };

  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function RepairStatusBadge({ status, isOverdue }: { status: RepairStatus; isOverdue?: boolean }) {
  if (status !== "COMPLETED" && isOverdue) {
    return <Badge variant="destructive">已超时</Badge>;
  }

  const variants: Record<RepairStatus, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive" }> = {
    REPORTED: { label: "已上报", variant: "warning" },
    IN_PROGRESS: { label: "处理中", variant: "info" },
    COMPLETED: { label: "已完成", variant: "success" },
    OVERDUE: { label: "已超时", variant: "destructive" },
  };

  const { label, variant } = variants[status];
  return <Badge variant={variant}>{label}</Badge>;
}
