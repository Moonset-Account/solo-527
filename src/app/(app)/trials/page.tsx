import { Page, PageHeader } from "@/components/Page";
import { DataTable } from "@/components/ui/DataTable";
import { StatusChip, trialStatusVariant } from "@/components/ui/StatusChip";
import { KPICard } from "@/components/ui/KPICards";
import { TrialsFilter } from "@/components/trials/TrialsFilter";
import { TrialsPagination } from "@/components/trials/TrialsPagination";
import { api } from "@/lib/trpc/server";
import { formatDateTime } from "@/lib/utils";
import { CalendarPlus, CalendarCheck, Users, UserX } from "lucide-react";
import Link from "next/link";

const MAJOR_LABELS: Record<string, string> = {
  FINE_ARTS: "美术", DESIGN: "设计", MEDIA: "传媒",
  MUSIC: "音乐", DANCE: "舞蹈", OTHER: "其他",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "待试听", COMPLETED: "已完成",
  CANCELLED: "已取消", NO_SHOW: "未到场",
};

export default async function TrialsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; followedUp?: string; keyword?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;
  const status = searchParams.status as any;
  const followedUp = searchParams.followedUp === "true"
    ? true
    : searchParams.followedUp === "false"
    ? false
    : undefined;
  const keyword = searchParams.keyword;

  const caller = await api();
  const result = await caller.trials.list({ page, pageSize, status, followedUp });

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekTrials = await caller.trials.scheduleList({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
  });

  const scheduledCount = weekTrials.filter((t: any) => t.status === "SCHEDULED").length;
  const completedCount = weekTrials.filter((t: any) => t.status === "COMPLETED").length;
  const noShowCount = weekTrials.filter((t: any) => t.status === "NO_SHOW").length;

  const filteredItems = keyword
    ? result.items.filter(
        (t: any) => t.leadName?.includes(keyword) || t.phone?.includes(keyword),
      )
    : result.items;

  return (
    <Page>
      <PageHeader
        title="试听管理"
        subtitle="管理所有试听安排、跟进与转化"
        breadcrumb={[{ label: "首页", href: "/" }, { label: "试听管理" }]}
        actions={
          <>
            <Link href="/trials/schedule" className="btn-secondary">
              <CalendarCheck size={16} />
              周历排期
            </Link>
            <button className="btn-primary">
              <CalendarPlus size={16} />
              新建试听
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="本周待试听" value={scheduledCount} Icon={CalendarCheck} tone="warm" suffix="场" />
        <KPICard label="本周已完成" value={completedCount} Icon={CalendarPlus} tone="success" suffix="场" />
        <KPICard label="本周总计" value={weekTrials.length} Icon={Users} tone="default" suffix="场" />
        <KPICard label="未到场" value={noShowCount} Icon={UserX} tone="danger" suffix="场" />
      </div>

      <TrialsFilter />

      <div className="space-y-0">
        <DataTable
          data={filteredItems as any[]}
          columns={[
            { key: "leadName", header: "学员姓名", render: (row: any) => (
              <div>
                <div className="font-medium text-deep-blue-800">{row.leadName}</div>
                <div className="text-xs text-deep-blue-400">{row.phone}</div>
              </div>
            )},
            { key: "intendedMajor", header: "意向专业", render: (row: any) => (
              <span className="chip bg-deep-blue-50 text-deep-blue-600 border-deep-blue-100">
                {MAJOR_LABELS[row.intendedMajor] || row.intendedMajor || "未填写"}
              </span>
            )},
            { key: "trialAt", header: "试听时间", render: (row: any) => (
              <div>
                <div className="num text-deep-blue-700">{formatDateTime(row.trialAt)}</div>
                <div className="text-xs text-deep-blue-400">{row.durationMinutes}分钟</div>
              </div>
            )},
            { key: "className", header: "试听班级/教师", render: (row: any) => (
              <div>
                <div className="text-deep-blue-700">{row.className || "未安排"}</div>
                <div className="text-xs text-deep-blue-400">{row.teacherName || "-"}</div>
              </div>
            )},
            { key: "assigneeName", header: "跟进人", render: (row: any) => (
              <span className="text-deep-blue-700">{row.assigneeName || "未分配"}</span>
            )},
            { key: "followedUp", header: "跟进状态", render: (row: any) => (
              <StatusChip variant={row.followedUp ? "success" : "warn"}>
                {row.followedUp ? "已跟进" : "待跟进"}
              </StatusChip>
            )},
            { key: "status", header: "状态", render: (row: any) => (
              <StatusChip variant={trialStatusVariant(row.status)}>
                {STATUS_LABELS[row.status] || row.status}
              </StatusChip>
            )},
            { key: "actions", header: "操作", width: "80px", render: () => (
              <button className="text-ink-gold-600 hover:text-ink-gold-700 text-sm font-medium">详情</button>
            )},
          ]}
        />
        <TrialsPagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </div>
    </Page>
  );
}
