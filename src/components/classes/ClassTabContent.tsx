"use client";

import { useState } from "react";
import { CalendarDays, Users, Clock, Palette, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils";
import { StatusChip, classStatusVariant, consumptionStatusVariant } from "@/components/ui/StatusChip";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { WorksGallery } from "@/components/classes/WorksGallery";

export type ClassTabType = "schedule" | "students" | "consumptions" | "works";

const TABS: { key: ClassTabType; label: string; Icon: any }[] = [
  { key: "schedule", label: "课程表", Icon: CalendarDays },
  { key: "students", label: "学员管理", Icon: Users },
  { key: "consumptions", label: "消课记录", Icon: Clock },
  { key: "works", label: "学员作品", Icon: Palette },
];

const LESSON_STATUS: Record<string, string> = {
  PLANNED: "已排课", IN_PROGRESS: "进行中",
  COMPLETED: "已完成", CANCELLED: "已取消",
};

const CONSUMPTION_STATUS_LABELS: Record<string, string> = {
  NORMAL: "正常", EXCEPTION: "异常", RECONCILED: "已对账",
};

interface ClassTabContentProps {
  classId: string;
  initialSchedule: any[];
  initialStudents: any[];
  studentsTotal: number;
  initialConsumptions: any[];
  initialWorks: any[];
  worksTotal: number;
}

export function ClassTabContent({
  classId,
  initialSchedule,
  initialStudents,
  studentsTotal,
  initialConsumptions,
  initialWorks,
  worksTotal,
}: ClassTabContentProps) {
  const [activeTab, setActiveTab] = useState<ClassTabType>("schedule");
  const [studentsPage, setStudentsPage] = useState(1);
  const [worksPage, setWorksPage] = useState(1);
  const pageSize = 20;

  const renderTabBar = () => (
    <div className="flex items-center gap-1 p-2 bg-deep-blue-50/40 border-b border-deep-blue-50 overflow-x-auto scrollbar-thin rounded-t-xl">
      {TABS.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
              active
                ? "bg-white text-deep-blue-700 shadow-sm border border-deep-blue-100"
                : "text-deep-blue-500 hover:text-deep-blue-700 hover:bg-white/50",
            )}
          >
            <Icon size={16} className={cn(active ? "text-ink-gold-500" : "text-deep-blue-400")} />
            {label}
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-ink-gold-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderSchedule = () => (
    <div className="p-4 space-y-4">
      <div className="card overflow-hidden">
        <DataTable
          data={initialSchedule as any[]}
          columns={[
            { key: "title", header: "课程标题", render: (row: any) => (
              <div>
                <div className="font-medium text-deep-blue-800">{row.title}</div>
                {row.room && <div className="text-xs text-deep-blue-400">📍 {row.room}</div>}
              </div>
            )},
            { key: "startAt", header: "上课时间", render: (row: any) => (
              <div>
                <div className="num text-deep-blue-700">{formatDateTime(row.startAt)}</div>
                <div className="text-xs text-deep-blue-400 flex items-center gap-1">
                  <Clock size={10} />
                  {row.durationHours}课时
                </div>
              </div>
            )},
            { key: "attendance", header: "出勤情况", align: "center", render: (row: any) => {
              const total = row.totalStudents || 0;
              const present = row.presentCount || 0;
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <div>
                  <div className="num text-deep-blue-700">
                    <span className="text-success-green font-medium">{present}</span>
                    <span className="text-deep-blue-400"> / {total}</span>
                  </div>
                  <div className="w-24 h-1.5 bg-deep-blue-100 rounded-full overflow-hidden mt-1 mx-auto">
                    <div className="h-full bg-success-green rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <div className="text-xs text-deep-blue-400 num mt-0.5">{rate}%</div>
                </div>
              );
            }},
            { key: "status", header: "状态", render: (row: any) => (
              <span className={cn(
                "chip border text-xs",
                row.status === "COMPLETED" && "bg-green-50 text-success-green border-green-200",
                row.status === "IN_PROGRESS" && "bg-blue-50 text-deep-blue-600 border-blue-200",
                row.status === "PLANNED" && "bg-orange-50 text-warn-orange border-orange-200",
                row.status === "CANCELLED" && "bg-slate-50 text-deep-blue-500 border-slate-200",
              )}>
                {LESSON_STATUS[row.status] || row.status}
              </span>
            )},
            { key: "actions", header: "操作", width: "100px", render: () => (
              <button className="text-ink-gold-600 hover:text-ink-gold-700 text-sm font-medium">
                查看详情
              </button>
            )},
          ]}
        />
      </div>
    </div>
  );

  const renderStudents = () => {
    const start = (studentsPage - 1) * pageSize;
    const pagedStudents = initialStudents.slice(start, start + pageSize);
    return (
      <div className="p-4 space-y-0">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-deep-blue-500">
            共 <span className="num text-deep-blue-700 font-medium">{studentsTotal}</span> 名学员
          </div>
          <button className="btn-secondary text-xs">
            <Users size={14} />
            导入学员
          </button>
        </div>
        <DataTable
          data={pagedStudents as any[]}
          columns={[
            { key: "name", header: "学员姓名", render: (row: any) => (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-gold-400 to-ink-gold-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {row.name?.charAt(0) || "?"}
                </div>
                <div>
                  <div className="font-medium text-deep-blue-800">{row.name}</div>
                  <div className="text-xs text-deep-blue-400">{row.phone || "未绑定电话"}</div>
                </div>
              </div>
            )},
            { key: "grade", header: "年级", render: (row: any) => (
              <span className="chip bg-deep-blue-50 text-deep-blue-600 border-deep-blue-100">
                {row.grade || "未填写"}
              </span>
            )},
            { key: "hours", header: "课时情况", render: (row: any) => {
              const consumed = row.consumedHours || 0;
              const total = row.totalHours || 0;
              const remaining = Math.max(0, total - consumed);
              return (
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="num text-deep-blue-700">剩余 <span className="text-ink-gold-600 font-medium">{remaining}</span></span>
                    <span className="text-deep-blue-300">/</span>
                    <span className="num text-deep-blue-500">已消 {consumed}</span>
                  </div>
                  <div className="w-32 h-1.5 bg-deep-blue-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        remaining / Math.max(total, 1) < 0.2 ? "bg-alert-red" :
                        remaining / Math.max(total, 1) < 0.5 ? "bg-warn-orange" : "bg-success-green"
                      )}
                      style={{ width: `${total > 0 ? (remaining / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            }},
            { key: "status", header: "状态", render: (row: any) => (
              <span className={cn(
                "chip border text-xs",
                row.status === "ACTIVE" && "bg-green-50 text-success-green border-green-200",
                row.status === "INACTIVE" && "bg-slate-50 text-deep-blue-500 border-slate-200",
                row.status === "GRADUATED" && "bg-ink-gold-50 text-ink-gold-600 border-ink-gold-200",
                row.status === "TRANSFERRED" && "bg-blue-50 text-deep-blue-600 border-blue-200",
              )}>
                {row.status === "ACTIVE" ? "在读" :
                 row.status === "INACTIVE" ? "休学" :
                 row.status === "GRADUATED" ? "毕业" :
                 row.status === "TRANSFERRED" ? "转班" : row.status}
              </span>
            )},
            { key: "actions", header: "操作", width: "100px", render: () => (
              <div className="flex items-center gap-2">
                <button className="text-deep-blue-500 hover:text-deep-blue-700 text-xs">档案</button>
                <button className="text-ink-gold-600 hover:text-ink-gold-700 text-xs font-medium">详情</button>
              </div>
            )},
          ]}
        />
        <Pagination
          page={studentsPage}
          pageSize={pageSize}
          total={studentsTotal}
          onPageChange={setStudentsPage}
        />
      </div>
    );
  };

  const renderConsumptions = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-deep-blue-500">
          共 <span className="num text-deep-blue-700 font-medium">{initialConsumptions.length}</span> 条消课记录
        </div>
        <button className="btn-secondary text-xs">
          <CheckCircle2 size={14} />
          批量对账
        </button>
      </div>
      <DataTable
        data={initialConsumptions as any[]}
        columns={[
          { key: "studentName", header: "学员", render: (row: any) => (
            <div>
              <div className="font-medium text-deep-blue-800">{row.studentName}</div>
            </div>
          )},
          { key: "lessonTitle", header: "关联课程", render: (row: any) => (
            <div>
              <div className="text-deep-blue-700">{row.lessonTitle || "手动消课"}</div>
            </div>
          )},
          { key: "hours", header: "消课时长", align: "center", render: (row: any) => (
            <span className="num text-deep-blue-800 font-semibold">{row.hours}课时</span>
          )},
          { key: "operatorName", header: "操作人", render: (row: any) => (
            <span className="text-deep-blue-600">{row.operatorName || "-"}</span>
          )},
          { key: "createdAt", header: "操作时间", render: (row: any) => (
            <span className="num text-deep-blue-500 text-xs">{formatDateTime(row.createdAt)}</span>
          )},
          { key: "status", header: "状态", render: (row: any) => (
            <StatusChip variant={consumptionStatusVariant(row.status)}>
              {CONSUMPTION_STATUS_LABELS[row.status] || row.status}
            </StatusChip>
          )},
          { key: "remark", header: "备注", render: (row: any) => (
            <span className="text-deep-blue-500 text-xs truncate max-w-[120px] block">
              {row.remark || "-"}
            </span>
          )},
        ]}
      />
    </div>
  );

  const renderWorks = () => (
    <WorksGallery
      works={initialWorks}
      total={worksTotal}
      page={worksPage}
      pageSize={pageSize}
      onPageChange={setWorksPage}
    />
  );

  return (
    <div className="card overflow-hidden">
      {renderTabBar()}
      {activeTab === "schedule" && renderSchedule()}
      {activeTab === "students" && renderStudents()}
      {activeTab === "consumptions" && renderConsumptions()}
      {activeTab === "works" && renderWorks()}
    </div>
  );
}
