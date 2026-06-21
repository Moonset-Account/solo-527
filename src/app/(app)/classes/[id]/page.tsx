import { Page, PageHeader } from "@/components/Page";
import { StatusChip, classStatusVariant } from "@/components/ui/StatusChip";
import { KPICard } from "@/components/ui/KPICards";
import { ClassTabContent } from "@/components/classes/ClassTabContent";
import { api } from "@/lib/trpc/server";
import { formatDate } from "@/lib/utils";
import {
  GraduationCap, Users, Clock, Star, ChevronLeft,
  CalendarDays, FileEdit, UserPlus,
} from "lucide-react";
import Link from "next/link";

const MAJOR_LABELS: Record<string, string> = {
  FINE_ARTS: "美术", DESIGN: "设计", MEDIA: "传媒",
  MUSIC: "音乐", DANCE: "舞蹈", OTHER: "其他",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待开课", ONGOING: "进行中",
  FINISHED: "已结课", SUSPENDED: "已暂停",
};

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const classId = params.id;
  const caller = await api();

  const cls = await caller.classes.getById(classId);
  if (!cls) {
    return (
      <Page>
        <div className="py-20 text-center">
          <div className="text-deep-blue-400 text-lg">班级不存在</div>
          <Link href="/classes" className="btn-secondary mt-4 inline-flex">
            <ChevronLeft size={16} /> 返回班级列表
          </Link>
        </div>
      </Page>
    );
  }

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [schedule, students, consumptions, works] = await Promise.all([
    caller.classes.getSchedule({
      classId,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    }),
    caller.classes.getStudents({ classId, page: 1, pageSize: 100 }),
    caller.classes.getConsumptions(classId),
    caller.works.listByClass({ classId, page: 1, pageSize: 100 }),
  ]);

  const totalConsumedHours = (consumptions as any[]).reduce((s, c) => s + (c.hours || 0), 0);
  const avgScore = works.items.length > 0
    ? Math.round(
        works.items
          .filter((w: any) => w.latestFeedback)
          .reduce((s: number, w: any) => s + (w.latestFeedback?.overallScore || 0), 0) /
        Math.max(1, works.items.filter((w: any) => w.latestFeedback).length),
      )
    : 0;

  return (
    <Page>
      <PageHeader
        title={cls.name}
        subtitle={`${MAJOR_LABELS[cls.major] || cls.major}专业`}
        breadcrumb={[
          { label: "首页", href: "/" },
          { label: "教学一线台", href: "/classes" },
          { label: cls.name },
        ]}
        actions={
          <>
            <Link href="/classes" className="btn-secondary">
              <ChevronLeft size={16} />
              返回列表
            </Link>
            <button className="btn-secondary">
              <FileEdit size={16} />
              编辑班级
            </button>
            <button className="btn-gold">
              <UserPlus size={16} />
              添加学员
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="班级学员" value={cls.studentIds?.length || 0} Icon={Users} tone="default" suffix="人" />
        <KPICard label="已消课时" value={totalConsumedHours} Icon={Clock} tone="success" suffix="课时" />
        <KPICard label="总课时" value={cls.totalHours || 0} Icon={GraduationCap} tone="default" suffix="课时" />
        <KPICard label="作品均分" value={avgScore || "-"} Icon={Star} tone="warm" suffix="分" />
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-1">
            <div className="text-xs text-deep-blue-400">班级状态</div>
            <StatusChip variant={classStatusVariant(cls.status)} size="md">
              {STATUS_LABELS[cls.status] || cls.status}
            </StatusChip>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-deep-blue-400">授课老师</div>
            <div className="flex flex-wrap gap-1.5">
              {(cls.teachers || []).map((t: any, i: number) => (
                <span key={i} className="chip bg-ink-gold-50 text-ink-gold-700 border-ink-gold-200">
                  {t.name}
                </span>
              ))}
              {(!cls.teachers || cls.teachers.length === 0) && (
                <span className="text-deep-blue-400 text-sm">未安排</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-deep-blue-400 flex items-center gap-1">
              <CalendarDays size={11} />
              开课周期
            </div>
            <div className="num text-deep-blue-700 text-sm">
              {cls.startDate ? formatDate(cls.startDate) : "未排期"}
              {cls.endDate && ` ~ ${formatDate(cls.endDate)}`}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-deep-blue-400">题库版本</div>
            <div className="text-deep-blue-700 text-sm">
              {(cls.questionBank as any)?.versionNo || "未绑定"}
            </div>
          </div>
        </div>
        {cls.remark && (
          <div className="mt-4 pt-4 border-t border-deep-blue-50">
            <div className="text-xs text-deep-blue-400 mb-1.5">备注</div>
            <div className="text-sm text-deep-blue-600">{cls.remark}</div>
          </div>
        )}
      </div>

      <ClassTabContent
        classId={classId}
        initialSchedule={schedule as any[]}
        initialStudents={students.items as any[]}
        studentsTotal={students.total}
        initialConsumptions={consumptions as any[]}
        initialWorks={works.items as any[]}
        worksTotal={works.total}
      />
    </Page>
  );
}
