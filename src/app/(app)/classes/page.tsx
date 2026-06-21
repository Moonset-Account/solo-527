import { Page, PageHeader } from "@/components/Page";
import { DataTable } from "@/components/ui/DataTable";
import { StatusChip, classStatusVariant } from "@/components/ui/StatusChip";
import { KPICard } from "@/components/ui/KPICards";
import { ClassesFilter } from "@/components/classes/ClassesFilter";
import { ClassesPagination } from "@/components/classes/ClassesPagination";
import { api } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import { GraduationCap, Users, Clock, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

const MAJOR_LABELS: Record<string, string> = {
  FINE_ARTS: "美术", DESIGN: "设计", MEDIA: "传媒",
  MUSIC: "音乐", DANCE: "舞蹈", OTHER: "其他",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待开课", ONGOING: "进行中",
  FINISHED: "已结课", SUSPENDED: "已暂停",
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; major?: string; keyword?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;
  const status = searchParams.status as any;
  const major = searchParams.major as any;
  const keyword = searchParams.keyword;

  const caller = await api();
  const result = await caller.classes.list({ page, pageSize, status, major, keyword });

  const allClasses = await caller.classes.list({ page: 1, pageSize: 9999 });
  const ongoingCount = allClasses.items.filter((c: any) => c.status === "ONGOING").length;
  const pendingCount = allClasses.items.filter((c: any) => c.status === "PENDING").length;
  const totalStudents = allClasses.items.reduce((s: number, c: any) => s + (c.studentCount || 0), 0);
  const totalHours = allClasses.items.reduce((s: number, c: any) => s + (c.totalHours || 0), 0);

  return (
    <Page>
      <PageHeader
        title="教学一线台"
        subtitle="管理所有班级、课程安排与学员情况"
        breadcrumb={[{ label: "首页", href: "/" }, { label: "教学一线台" }]}
        actions={
          <button className="btn-primary">
            <Plus size={16} />
            新建班级
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="进行中班级" value={ongoingCount} Icon={GraduationCap} tone="success" suffix="个" />
        <KPICard label="待开课班级" value={pendingCount} Icon={Clock} tone="warm" suffix="个" />
        <KPICard label="总学员数" value={totalStudents} Icon={Users} tone="default" suffix="人" />
        <KPICard label="总课时数" value={totalHours} Icon={AlertTriangle} tone="default" suffix="课时" />
      </div>

      <ClassesFilter />

      <div className="space-y-0">
        <DataTable
          data={result.items as any[]}
          onClickRow={(row: any) => {
            if (typeof window !== "undefined") {
              window.location.href = `/classes/${row.id}`;
            }
          }}
          columns={[
            { key: "name", header: "班级名称", render: (row: any) => (
              <div>
                <div className="font-medium text-deep-blue-800">{row.name}</div>
                <div className="text-xs text-deep-blue-400">
                  {MAJOR_LABELS[row.major] || row.major} · {row.maxStudents}人上限
                </div>
              </div>
            )},
            { key: "teacherNames", header: "授课老师", render: (row: any) => (
              <div className="flex flex-wrap gap-1">
                {(row.teacherNames || []).map((name: string, i: number) => (
                  <span key={i} className="chip bg-ink-gold-50 text-ink-gold-700 border-ink-gold-200">
                    {name}
                  </span>
                ))}
                {(!row.teacherNames || row.teacherNames.length === 0) && (
                  <span className="text-deep-blue-400 text-xs">未安排</span>
                )}
              </div>
            )},
            { key: "studentCount", header: "学员数", align: "center", render: (row: any) => (
              <div>
                <span className="num text-deep-blue-800 font-semibold text-lg">{row.studentCount || 0}</span>
                <span className="text-deep-blue-400 text-xs"> / {row.maxStudents}</span>
              </div>
            )},
            { key: "totalHours", header: "总课时", align: "center", render: (row: any) => (
              <div>
                <div className="num text-deep-blue-700 font-medium">{row.totalHours}课时</div>
                <div className="text-xs text-deep-blue-400">
                  已消 <span className="num text-ink-gold-600">{row.consumedHours || 0}</span> 课时
                </div>
              </div>
            )},
            { key: "startDate", header: "开课时间", render: (row: any) => (
              <div className="num text-deep-blue-700">
                {row.startDate ? formatDate(row.startDate) : "未排期"}
                {row.endDate && (
                  <div className="text-xs text-deep-blue-400 num">
                    至 {formatDate(row.endDate)}
                  </div>
                )}
              </div>
            )},
            { key: "status", header: "状态", render: (row: any) => (
              <StatusChip variant={classStatusVariant(row.status)}>
                {STATUS_LABELS[row.status] || row.status}
              </StatusChip>
            )},
            { key: "actions", header: "操作", width: "80px", render: (row: any) => (
              <Link
                href={`/classes/${row.id}`}
                className="text-ink-gold-600 hover:text-ink-gold-700 text-sm font-medium inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                进入
              </Link>
            )},
          ]}
        />
        <ClassesPagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </div>
    </Page>
  );
}
