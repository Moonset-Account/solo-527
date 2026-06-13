import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Filter,
  History,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileBarChart,
  Search,
  Calendar,
  Users,
  Clock,
  Zap,
  ChevronUp,
  Bell,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDailySeries, queryConsumptionRecords, getFeedbacks } from "@/server/services/reportService";
import { StudentModel } from "@/server/models/Student";
import { ClassInfoModel } from "@/server/models/ClassInfo";
import { formatDate, formatDateTime, cn, hoursShortageColor } from "@/shared/utils";
import type {
  AuditLog,
  ClassInfo,
  ConsumptionRecord,
  DailyReportItem,
  Feedback,
  ReportQuery,
  Student,
  User,
} from "@/shared/types";
import { submitFeedback as doSubmitFeedback } from "@/server/services/noticeService";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  const url = new URL(request.url);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 13);
  const startDate = url.searchParams.get("startDate") || formatDate(start);
  const endDate = url.searchParams.get("endDate") || formatDate(end);
  const classId = url.searchParams.get("classId") || undefined;
  const studentId = url.searchParams.get("studentId") || undefined;
  const query: ReportQuery = { startDate, endDate, classId, studentId };

  let classes: ClassInfo[] = [];
  let students: Student[] = [];
  try {
    classes = ((await (ClassInfoModel as any).find().lean()) as any[]).map((c) => ({ ...c, id: c._id.toString() }));
    const sFilter: any = classId ? { classId } : {};
    students = ((await (StudentModel as any).find(sFilter).lean()) as any[]).map((s) => ({
      ...s,
      id: s._id.toString(),
      className: classes.find((c) => c.id === s.classId)?.name || "",
    }));
  } catch {}

  const [records, dailySeries, feedbacks] = await Promise.all([
    queryConsumptionRecords(query).catch(() => [] as ConsumptionRecord[]),
    getDailySeries(query).catch(() => [] as DailyReportItem[]),
    getFeedbacks(query).catch(() => [] as Feedback[]),
  ]);

  const totalHours = records.reduce((sum, r) => sum + r.hours, 0);
  const abnormalCount = records.filter((r) => r.isInsufficient).length;

  return json({
    records,
    dailySeries,
    classes,
    students,
    feedbacks,
    query,
    summary: {
      totalRecords: records.length,
      totalHours,
      uniqueStudents: new Set(records.map((r) => r.studentId)).size,
      abnormalCount,
    },
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = (context as any).user as User | null;
  const ip = (context as any).ip as string;
  if (!user) return redirect("/login");
  const body = await request.json();
  if (body.type === "addFeedback") {
    await doSubmitFeedback(
      body.studentId,
      body.studentName,
      body.consumptionId,
      body.content,
      body.rating,
      user,
      ip
    );
    return json({ success: true });
  }
  return json({ success: false });
}

export default function ReportsIndex() {
  const data = useLoaderData<typeof loader>();
  const [params, setParams] = useSearchParams();
  const submit = useSubmit();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<{ id: string; name: string; consumptionId: string } | null>(null);

  const startDate = params.get("startDate") || data.query.startDate;
  const endDate = params.get("endDate") || data.query.endDate;
  const classId = params.get("classId") || "";
  const studentId = params.get("studentId") || "";

  const updateFilter = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">课时统计报表</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            操作留痕与家校反馈直接内嵌于每条记录，可展开查看，报表数据不脱节
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm">
            <Filter className="w-3.5 h-3.5" />
            高级筛选
          </button>
          <button className="btn-primary btn-sm" onClick={() => {
            const q = new URLSearchParams();
            if (startDate) q.set("startDate", startDate);
            if (endDate) q.set("endDate", endDate);
            if (classId) q.set("classId", classId);
            if (studentId) q.set("studentId", studentId);
            window.open(`/api/export?${q.toString()}`, "_blank");
          }}>
            <Download className="w-3.5 h-3.5" />
            导出 Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
        {[
          { label: "消耗课时", value: data.summary.totalHours.toFixed(1), unit: "h", icon: Zap, color: "text-slate-800", bg: "bg-slate-800", fg: "text-white" },
          { label: "消课记录", value: data.summary.totalRecords, unit: "条", icon: FileBarChart, color: "text-slate-800", bg: "bg-white", fg: "text-slate-800" },
          { label: "覆盖学员", value: data.summary.uniqueStudents, unit: "人", icon: Users, color: "text-slate-800", bg: "bg-white", fg: "text-slate-800" },
          { label: "异常记录", value: data.summary.abnormalCount, unit: "条", icon: AlertTriangle, color: data.summary.abnormalCount ? "text-amber-500" : "text-slate-500", bg: data.summary.abnormalCount ? "bg-amber-500" : "bg-white", fg: data.summary.abnormalCount ? "text-white" : "text-slate-800" },
        ].map((c) => (
          <div key={c.label} className={cn("p-4 rounded-lg2 border shadow-card", c.bg, c.bg !== "bg-white" ? c.fg : "bg-white border-slate-200")}>
            <div className={cn("text-xs font-medium", c.bg !== "bg-white" ? "text-white/80" : "text-slate-500")}>{c.label}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={cn("text-2xl font-black font-nums tracking-tight", c.bg !== "bg-white" ? "text-white" : c.color)}>{c.value}</span>
              <span className={cn("text-xs font-medium", c.bg !== "bg-white" ? "text-white/70" : "text-slate-400")}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 xl:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div>
            <label className="input-label">起始日期</label>
            <input type="date" value={startDate} onChange={(e) => updateFilter({ startDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="input-label">结束日期</label>
            <input type="date" value={endDate} onChange={(e) => updateFilter({ endDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="input-label">班级</label>
            <select value={classId} onChange={(e) => updateFilter({ classId: e.target.value, studentId: "" })} className="input appearance-none">
              <option value="">全部班级</option>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">学员</label>
            <select value={studentId} onChange={(e) => updateFilter({ studentId: e.target.value })} className="input appearance-none">
              <option value="">全部学员</option>
              {data.students
                .filter((s) => !classId || s.classId === classId)
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.className || "未分班"})</option>
                ))}
            </select>
          </div>
        </div>

        <div className="h-60 xl:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7785" }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7785" }} axisLine={false} tickLine={false} width={35} />
              <Tooltip
                cursor={{ fill: "rgba(31, 58, 95, 0.06)" }}
                contentStyle={{ fontSize: 12, borderRadius: 2, border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                formatter={(v: any) => [`${v}h`, "消耗课时"]}
                labelFormatter={(l) => `日期 ${l}`}
              />
              <Bar dataKey="totalHours" fill="#1F3A5F" radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-800/10 flex items-center justify-center">
              <FileBarChart className="w-4 h-4 text-slate-800" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">消课明细</div>
              <div className="text-[11px] text-slate-500">点击行展开查看操作留痕 · 家校反馈</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-nums">
            共 {data.records.length} 条记录
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70">
              <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="table-cell w-8"></th>
                <th className="table-cell">时间</th>
                <th className="table-cell">学员</th>
                <th className="table-cell">班级</th>
                <th className="table-cell">课时</th>
                <th className="table-cell hidden md:table-cell">题库版本</th>
                <th className="table-cell">操作人</th>
                <th className="table-cell">状态</th>
                <th className="table-cell hidden lg:table-cell">反馈</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.records.length === 0 && (
                <tr>
                  <td colSpan={9} className="table-cell text-center py-10 text-xs text-slate-400">
                    当前筛选条件下无消课记录
                  </td>
                </tr>
              )}
              {data.records.map((r, idx) => {
                const expanded = expandedRow === r.id;
                return (
                  <>
                    <tr
                      key={r.id}
                      className={cn(
                        "hover:bg-slate-50 cursor-pointer transition-colors",
                        idx % 2 === 1 && "bg-slate-50/40"
                      )}
                      onClick={() => setExpandedRow(expanded ? null : r.id)}
                    >
                      <td className="table-cell w-8 pl-4">
                        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </td>
                      <td className="table-cell font-nums text-slate-700 text-xs whitespace-nowrap">{r.createdAt.slice(5, 16)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                            {r.studentName.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">{r.studentName}</span>
                        </div>
                      </td>
                      <td className="table-cell text-slate-600 text-xs">{r.className || "-"}</td>
                      <td className="table-cell">
                        <span className={cn("font-bold font-nums", r.isInsufficient ? "text-amber-500" : "text-slate-800")}>
                          {r.hours.toFixed(1)}h
                        </span>
                        {r.isInsufficient && r.insufficientHours! > 0 && (
                          <span className="ml-1 text-[10px] text-red-500 font-nums">
                            (缺{r.insufficientHours})
                          </span>
                        )}
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <span className="chip-gray text-[10px]">{r.questionBankVersionName.split(" - ")[0]}</span>
                      </td>
                      <td className="table-cell text-slate-600 text-xs">{r.operatorName}</td>
                      <td className="table-cell">
                        {r.isInsufficient ? (
                          <span className="chip-amber">课时不足</span>
                        ) : (
                          <span className="chip-green">正常</span>
                        )}
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        {r.feedback ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(r.id);
                            }}
                            className="chip-blue text-[10px]"
                          >
                            <MessageSquare className="w-3 h-3" />
                            已反馈
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedbackFor({ id: r.studentId, name: r.studentName, consumptionId: r.id });
                            }}
                            className="chip-gray text-[10px] hover:chip-blue transition-colors"
                          >
                            + 添加反馈
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className={cn(idx % 2 === 1 ? "bg-slate-50/40" : "")}>
                        <td colSpan={9} className="table-cell pl-4 pr-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-6">
                            <AuditLogsPanel logs={r.auditLogs || []} />
                            <FeedbackPanel
                              record={r}
                              onAdd={() => setFeedbackFor({ id: r.studentId, name: r.studentName, consumptionId: r.id })}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EmbeddedFeedbacksSection feedbacks={data.feedbacks} />

      {feedbackFor && (
        <FeedbackModal
          initial={feedbackFor}
          onClose={() => setFeedbackFor(null)}
          onSubmit={(payload) => {
            submit({ ...payload, type: "addFeedback" }, { method: "POST", encType: "application/json" as any });
            setFeedbackFor(null);
          }}
        />
      )}
    </div>
  );
}

type JsonAuditLog = Omit<AuditLog, "detail"> & { detail?: Record<string, any> };
type JsonConsumptionRecord = Omit<ConsumptionRecord, "auditLogs" | "feedback"> & {
  auditLogs?: JsonAuditLog[];
  feedback?: Feedback;
};

function AuditLogsPanel({ logs }: { logs: JsonAuditLog[] }) {
  return (
    <div className="rounded-lg2 border border-slate-200 bg-white overflow-hidden">
      <div className="px-3.5 py-2.5 bg-slate-50/60 border-b border-slate-200 flex items-center gap-2">
        <History className="w-3.5 h-3.5 text-slate-600" />
        <div className="text-xs font-bold text-slate-700">操作留痕（只读）</div>
      </div>
      <ul className="p-3.5 space-y-3 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">暂无操作日志</div>
        ) : (
          logs.map((l) => (
            <li key={l.id} className="relative pl-5">
              <span className="absolute left-0 top-1 w-2 h-2 rounded-full bg-slate-800 ring-4 ring-slate-50" />
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-slate-800">{l.userName}</span>
                <span className="text-[10px] text-slate-400 font-nums">{l.createdAt.slice(5, 16)}</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                {describeAudit(l)}
              </div>
              {l.ip && (
                <div className="mt-0.5 text-[10px] text-slate-400 font-mono">IP {l.ip}</div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function describeAudit(l: JsonAuditLog) {
  const d = l.detail || {};
  switch (l.action) {
    case "create_consumption":
      return `消课 · 学员${d.studentName || "-"} 扣${d.hours || "-"}课时 · 版本${d.version || "-"}${d.isInsufficient ? ` · ⚠️ 不足${d.shortage || 0}h` : ""}`;
    case "adjust_hours":
      return `调整课时 · ${JSON.stringify(d).slice(0, 60)}`;
    case "update_schedule":
      return `修改课表 · ${JSON.stringify(d).slice(0, 60)}`;
    case "publish_notice":
      return `发布通知 · 发送给${d.recipients || "-"}位家长`;
    case "create_feedback":
      return `新增家校反馈 · 内容：${(d.content || "").slice(0, 30)}`;
    case "confirm_receipt":
      return `回执审核 · ${d.feedback ? "含反馈" : "无反馈"}`;
    default:
      return l.action;
  }
}

function FeedbackPanel({ record, onAdd }: { record: JsonConsumptionRecord; onAdd: () => void }) {
  return (
    <div className="rounded-lg2 border border-slate-200 bg-white overflow-hidden">
      <div className="px-3.5 py-2.5 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
          <div className="text-xs font-bold text-slate-700">家校反馈（联动报表）</div>
        </div>
        {!record.feedback && (
          <button onClick={onAdd} className="chip-blue text-[10px]">
            + 添加反馈
          </button>
        )}
      </div>
      <div className="p-3.5">
        {record.feedback ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{record.studentName} 家长</span>
              {record.feedback.rating && (
                <span className="text-amber-400 text-xs">
                  {"★".repeat(record.feedback.rating)}
                  <span className="text-slate-200">{"★".repeat(5 - record.feedback.rating)}</span>
                </span>
              )}
              <span className="ml-auto text-[10px] text-slate-400 font-nums">{record.feedback.createdAt.slice(5, 16)}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg2 p-2.5 border border-slate-100">
              {record.feedback.content}
            </p>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            暂无反馈，家长反馈将直接写入此消课记录并同步月度复盘
          </div>
        )}
      </div>
    </div>
  );
}

function EmbeddedFeedbacksSection({ feedbacks }: { feedbacks: Feedback[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-mint-500/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-mint-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">家校反馈汇总</div>
            <div className="text-[11px] text-slate-500">与上方消课记录联动，点击反馈可追溯对应消课</div>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-nums">共 {feedbacks.length} 条</span>
      </div>
      <div className="p-5">
        {feedbacks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">所选区间暂无反馈</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {feedbacks.slice(0, 6).map((f) => (
              <div key={f.id} className="p-3.5 rounded-lg2 border border-slate-200 bg-slate-50/40 hover:border-mint-500/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-[10px] font-bold text-white flex items-center justify-center">
                    {f.studentName?.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{f.studentName}</span>
                  {f.rating && (
                    <span className="text-amber-400 text-[10px]">
                      {"★".repeat(f.rating)}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-slate-400 font-nums">{f.createdAt.slice(5, 16)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{f.content}</p>
                {f.source === "consumption" && f.consumptionId && (
                  <div className="mt-2 text-[10px] text-mint-500 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    关联消课记录 · 数据已写入报表
                  </div>
                )}
                {f.source === "notice_receipt" && (
                  <div className="mt-2 text-[10px] text-slate-600 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    来自通知回执 · 已同步月度复盘
                  </div>
                )}
                {(!f.source || f.source === "manual") && f.writerRole === "parent" && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    家长反馈 · 已同步月度复盘
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: { id: string; name: string; consumptionId: string };
  onClose: () => void;
  onSubmit: (p: any) => void;
}) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="text-sm font-bold text-slate-900">添加家校反馈</div>
          <button onClick={onClose} className="btn-ghost btn-sm"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">对应学员</div>
            <div className="text-sm font-bold text-slate-800">{initial.name}</div>
          </div>
          <div>
            <label className="input-label">满意度</label>
            <div className="flex gap-1.5 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={rating >= n ? "text-amber-400" : "text-slate-200"}
                >★</button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">反馈内容</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="家长反馈内容，将同步写入对应消课记录与月度复盘报表…"
              className="input resize-none"
            />
          </div>
        </div>
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline btn-sm">取消</button>
          <button
            disabled={!content.trim()}
            onClick={() => onSubmit({ studentId: initial.id, studentName: initial.name, consumptionId: initial.consumptionId, content, rating })}
            className="btn-primary btn-sm"
          >保存</button>
        </div>
      </div>
    </div>
  );
}

function X(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }
