import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Download,
  FileBarChart,
  MessageSquareText,
  Sparkles,
  Target,
  AlertTriangle,
  FileText,
  TrendingUp,
  Hash,
  Clock,
} from "lucide-react";
import { getMonthlyReport } from "@/server/services/reportService";
import type { MonthlyReport, User } from "@/shared/types";
import { cn } from "@/shared/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

export async function loader({ context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  if (user.role === "teacher") return redirect("/dashboard");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const report = await getMonthlyReport(year, month).catch(() => ({
    periodLabel: `${year}年${month + 1}月`,
    totalHours: 0,
    totalHoursLastMonth: 0,
    hoursChangeRate: 0,
    abnormalCount: 0,
    abnormalCountLastMonth: 0,
    feedbackCount: 0,
    topConsumptions: [],
    dailySeries: [],
    abnormalDetails: [],
  }));
  return json({ report });
}

export default function MonthlyReportPage() {
  const { report } = useLoaderData<typeof loader>();
  const hoursChangePositive = report.hoursChangeRate >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-slate-800" />
            月度复盘 · {report.periodLabel}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            数据包含课时消耗对比、异常课时标记、家长反馈关键词，一键导出用于机构月度复盘会议
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm"><FileText className="w-3.5 h-3.5" />上月对比</button>
          <button className="btn-primary btn-sm"><Download className="w-3.5 h-3.5" />导出复盘 PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="总消耗课时"
          value={report.totalHours.toFixed(1)}
          unit="h"
          bg="bg-slate-800"
          fg="text-white"
          suffix={
            <div className={cn("flex items-center gap-1 text-[11px]", hoursChangePositive ? "text-mint-300" : "text-red-300")}>
              {hoursChangePositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(report.hoursChangeRate)}% vs 上月
            </div>
          }
        />
        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="消课记录数"
          value={((report.dailySeries as any[]).reduce((s: number, d: any) => s + (d?.totalRecords || 0), 0)).toString()}
          unit="条"
          bg="bg-white"
          fg="text-slate-800"
        />
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="异常课时数"
          value={report.abnormalCount.toString()}
          unit="条"
          bg={report.abnormalCount ? "bg-amber-500" : "bg-white"}
          fg={report.abnormalCount ? "text-white" : "text-slate-800"}
          suffix={
            report.abnormalCount ? (
              <div className="text-[11px] text-white/80">
                {report.abnormalCountLastMonth} 条上月
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">无异常 ✨</div>
            )
          }
        />
        <MetricCard
          icon={<MessageSquareText className="w-5 h-5" />}
          label="家长反馈数"
          value={report.feedbackCount.toString()}
          unit="条"
          bg="bg-white"
          fg="text-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-800" />
              每日消耗课时趋势
            </div>
            <span className="text-[11px] text-slate-400 font-nums">{report.periodLabel}</span>
          </div>
          <div className="h-64 xl:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.dailySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7785" }} tickFormatter={(v) => v.slice(8)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7785" }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  cursor={{ fill: "rgba(31, 58, 95, 0.06)" }}
                  contentStyle={{ fontSize: 12, borderRadius: 2, border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  formatter={(v: any) => [`${v}h`, "消耗课时"]}
                />
                <Bar dataKey="totalHours" fill="#1F3A5F" radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            消课学员 TOP 榜
          </div>
          <div className="space-y-3">
            {report.topConsumptions.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-6">本月暂无数据</div>
            )}
            {report.topConsumptions.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 shrink-0 rounded flex items-center justify-center text-[11px] font-black",
                    i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-500 text-white" : i === 2 ? "bg-amber-700/70 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 truncate">{t.studentName}</span>
                    <span className="text-xs font-bold font-nums text-slate-900 shrink-0">{t.hours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-slate-800 to-slate-600 rounded-full"
                        style={{ width: `${Math.min(100, (t.hours / Math.max(report.topConsumptions[0]?.hours || 1, 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 w-16 truncate text-right">{t.className}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-sm font-bold text-slate-900">异常课时明细</div>
              <div className="text-[11px] text-slate-500">课时不足标记 · 用于重点跟进续费</div>
            </div>
            <span className="ml-auto chip-amber">{report.abnormalCount} 条</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {report.abnormalDetails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">本月无异常，继续保持 🎉</div>
            ) : (
              report.abnormalDetails.map((r, i) => (
                <div key={i} className="px-5 py-3 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 flex items-center justify-center shrink-0">
                        {r.studentName.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-900 truncate">{r.studentName}</span>
                      <span className="chip-gray text-[10px]">{r.className || "-"}</span>
                    </div>
                    <span className="text-xs font-nums text-red-600 font-bold">
                      缺 {(r.insufficientHours || 0).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>扣 {r.hours.toFixed(1)}h · {r.operatorName}</span>
                    <span className="font-nums">{r.createdAt.slice(5, 16)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2.5">
            <MessageSquareText className="w-4 h-4 text-mint-500" />
            <div>
              <div className="text-sm font-bold text-slate-900">家长反馈关键词</div>
              <div className="text-[11px] text-slate-500">
                用于复盘整体服务质量 · {report.feedbackCount} 条反馈
              </div>
            </div>
          </div>
          <div className="p-5">
            <KeywordCloud />
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <StatMini label="好评率" value="92%" accent="text-mint-500" />
              <StatMini label="续费率" value="78%" accent="text-slate-800" />
              <StatMini label="提到老师" value="64%" accent="text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-sm font-bold text-slate-900 mb-3">复盘摘要 · 机器生成建议</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InsightCard
            title="课时预警"
            desc={`${report.abnormalCount} 位学员课时不足，建议本周内联系续费，重点关注 TOP 3 班级。`}
            color="amber"
          />
          <InsightCard
            title="反馈改进"
            desc="家长多次提及『课后视频回放』需求，建议下月加入服务包，提升满意度。"
            color="mint"
          />
          <InsightCard
            title="运营建议"
            desc={`较上月${hoursChangePositive ? "增长" : "下降"} ${Math.abs(report.hoursChangeRate)}%，建议${hoursChangePositive ? "继续保持并扩大班级容量" : "策划暑假集训营拉新活动"}。`}
            color="slate"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, unit, bg, fg, suffix,
}: {
  icon: React.ReactNode; label: string; value: string; unit: string;
  bg: string; fg: string; suffix?: React.ReactNode;
}) {
  return (
    <div className={cn("p-4 xl:p-5 rounded-lg2 border shadow-card overflow-hidden", bg, bg.includes("white") ? "border-slate-200" : "border-transparent")}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={cn("text-xs font-medium", fg, !bg.includes("white") && "opacity-80")}>{label}</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={cn("text-3xl font-black font-nums tracking-tight", fg)}>{value}</span>
            <span className={cn("text-xs font-medium", fg, !bg.includes("white") && "opacity-70")}>{unit}</span>
          </div>
          {suffix}
        </div>
        <div className={cn(
          "w-9 h-9 rounded-lg2 flex items-center justify-center",
          bg.includes("white") ? "bg-slate-100 text-slate-700" : "bg-white/10"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="py-2.5 rounded-lg2 bg-slate-50 border border-slate-100">
      <div className={cn("text-lg font-black font-nums", accent)}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function KeywordCloud() {
  const keywords = useMemo(
    () => [
      { t: "耐心", s: 36, c: "text-slate-800" },
      { t: "专业", s: 32, c: "text-slate-700" },
      { t: "有趣", s: 30, c: "text-mint-500" },
      { t: "小周老师", s: 28, c: "text-amber-500" },
      { t: "进步大", s: 26, c: "text-slate-700" },
      { t: "回放", s: 24, c: "text-slate-600" },
      { t: "课程安排", s: 20, c: "text-slate-500" },
      { t: "沟通及时", s: 20, c: "text-mint-600" },
      { t: "续费", s: 18, c: "text-amber-600" },
      { t: "环境好", s: 16, c: "text-slate-500" },
      { t: "课后作业", s: 14, c: "text-slate-400" },
      { t: "小班教学", s: 14, c: "text-slate-600" },
      { t: "有效果", s: 18, c: "text-mint-500" },
    ],
    []
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-3 min-h-[120px]">
      {keywords.map((k) => (
        <span
          key={k.t}
          className={cn("font-bold tracking-tight px-1.5", k.c)}
          style={{ fontSize: `${k.s * 0.36}px` }}
        >
          {k.t}
        </span>
      ))}
    </div>
  );
}

function InsightCard({ title, desc, color }: { title: string; desc: string; color: "amber" | "mint" | "slate" }) {
  const map = {
    amber: "border-amber-500/30 bg-amber-500/5",
    mint: "border-mint-500/30 bg-mint-500/5",
    slate: "border-slate-800/20 bg-slate-50",
  } as const;
  return (
    <div className={cn("p-4 rounded-lg2 border", map[color])}>
      <div className="text-xs font-bold text-slate-800 mb-1.5">💡 {title}</div>
      <div className="text-[12px] text-slate-600 leading-relaxed">{desc}</div>
    </div>
  );
}
