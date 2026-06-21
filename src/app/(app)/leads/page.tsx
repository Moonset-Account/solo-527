import Link from "next/link";
import { Phone, MessageSquare, CalendarPlus, User } from "lucide-react";
import { Page, PageHeader } from "@/components/Page";
import { StatusChip, leadStatusVariant, leadLevelVariant } from "@/components/ui/StatusChip";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { api } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import FilterBar from "@/components/leads/FilterBar";
import PaginationWrapper from "@/components/leads/PaginationWrapper";
import LeadsTableWrapper from "@/components/leads/LeadsTableWrapper";

const statusLabels: Record<string, string> = {
  NEW: "新线索",
  FOLLOWING: "跟进中",
  TRIAL_SCHEDULED: "待试听",
  TRIAL_DONE: "已试听",
  CONVERTED: "已转化",
  LOST: "已流失",
  ARCHIVED: "已归档",
};

const levelLabels: Record<string, string> = {
  HOT: "高意向",
  WARM: "中意向",
  COLD: "低意向",
};

const majorLabels: Record<string, string> = {
  FINE_ARTS: "美术",
  DESIGN: "设计",
  MEDIA: "数媒",
  MUSIC: "音乐",
  DANCE: "舞蹈",
  OTHER: "其他",
};

interface SearchParams {
  page?: string;
  source?: string;
  assigneeId?: string;
  status?: string;
  keyword?: string;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const a = await api();

  const page = Number(searchParams.page) || 1;
  const meta = await a.leads.meta();
  const list = await a.leads.list({
    page,
    pageSize: 10,
    source: searchParams.source,
    assigneeId: searchParams.assigneeId,
    status: searchParams.status as any,
    keyword: searchParams.keyword,
  });

  const total = Object.values(meta.counts).reduce((s, n) => s + n, 0);

  type Row = (typeof list.items)[number];

  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "学员信息",
      render: (r: Row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-deep-blue-100 flex items-center justify-center text-deep-blue-600 font-semibold text-sm shrink-0">
            {r.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-deep-blue-800 truncate">{r.name}</span>
              <StatusChip variant={leadLevelVariant(r.level)} size="sm">
                {levelLabels[r.level]}
              </StatusChip>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-deep-blue-500">
              <Phone size={12} />
              <span className="truncate">{r.phone}</span>
              {r.parentName && <span className="truncate">· 家长 {r.parentName}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "状态",
      width: "110px",
      render: (r: Row) => (
        <StatusChip variant={leadStatusVariant(r.status)} pulse={r.status === "NEW"}>
          {statusLabels[r.status]}
        </StatusChip>
      ),
    },
    {
      key: "intendedMajor",
      header: "意向专业",
      width: "90px",
      align: "center" as const,
      render: (r: Row) => (
        <span className="text-sm text-deep-blue-600">
          {r.intendedMajor ? majorLabels[r.intendedMajor] : "-"}
        </span>
      ),
    },
    {
      key: "source",
      header: "来源",
      width: "100px",
      align: "center" as const,
      render: (r: Row) => (
        <span className="text-sm text-deep-blue-500">{r.source || "-"}</span>
      ),
    },
    {
      key: "assigneeName",
      header: "负责人",
      width: "100px",
      render: (r: Row) => (
        <div className="flex items-center gap-1.5 text-sm text-deep-blue-600">
          <User size={14} className="text-deep-blue-400" />
          <span>{r.assigneeName}</span>
        </div>
      ),
    },
    {
      key: "stats",
      header: "跟进统计",
      width: "140px",
      align: "center" as const,
      render: (r: Row) => (
        <div className="flex items-center justify-center gap-3 text-xs text-deep-blue-500">
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            <span className="num">{r.followUpCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarPlus size={12} />
            <span className="num">{r.trialCount}</span>
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "创建时间",
      width: "140px",
      render: (r: Row) => (
        <span className="text-sm text-deep-blue-500">{formatDate(r.createdAt)}</span>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="线索管理"
        subtitle="跟踪和管理所有潜在学员线索"
        breadcrumb={[{ label: "首页", href: "/" }, { label: "线索管理" }]}
        actions={
          <Link href="#" className="btn-primary">
            + 新建线索
          </Link>
        }
      />

      <FilterBar
        sources={meta.sources}
        assignees={meta.assignees}
        counts={meta.counts}
        total={total}
      />

      <div className="space-y-0">
        <LeadsTableWrapper<Row>
          columns={columns}
          data={list.items}
          rowKey={(r) => r.id}
        />
        <PaginationWrapper
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
        />
      </div>
    </Page>
  );
}
