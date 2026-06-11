import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import {
  Bell,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  MailPlus,
  ListChecks,
  RefreshCw,
  Phone,
  MessageSquare,
  Download,
} from "lucide-react";
import { listNotices, getReceiptsByNotice, getReceiptStats, confirmReceipt } from "@/server/services/noticeService";
import type { Notice, NoticeReceipt, User } from "@/shared/types";
import { cn } from "@/shared/utils";
import { writeAudit } from "@/server/services/auditService";

export async function loader({ context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  if (user.role === "teacher") return redirect("/dashboard");
  const notices = await listNotices(30).catch(() => [] as Notice[]);
  const statsMap: Record<string, any> = {};
  const receiptsMap: Record<string, NoticeReceipt[]> = {};
  for (const n of notices.slice(0, 5)) {
    try {
      statsMap[n.id] = await getReceiptStats(n.id);
      receiptsMap[n.id] = await getReceiptsByNotice(n.id);
    } catch {}
  }
  return json({ notices, statsMap, receiptsMap });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = (context as any).user as User | null;
  const ip = (context as any).ip;
  if (!user) return redirect("/login");
  const body = await request.json();
  if (body.type === "confirm" && body.receiptId) {
    await confirmReceipt(user, body.receiptId, body.feedback, ip);
    return json({ success: true });
  }
  if (body.type === "batch_remind") {
    await writeAudit(user, "publish_notice", "notice", `remind-${Date.now()}`, { noticeIds: body.noticeIds || [] }, ip);
    return json({ success: true, count: body.count || 0 });
  }
  return json({ success: false });
}

export default function NoticesIndex() {
  const data = useLoaderData<typeof loader>();
  const [activeId, setActiveId] = useState<string | null>(data.notices[0]?.id || null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const activeNotice = data.notices.find((n) => n.id === activeId);
  const activeStats = activeNotice ? data.statsMap[activeNotice.id] || null : null;
  const activeReceipts = activeNotice ? data.receiptsMap[activeNotice.id] || [] : [];
  const unreceipted = activeReceipts.filter((r) => !r.isConfirmed).length;

  const totalUnreceipt = Object.values(data.statsMap).reduce(
    (sum: number, s: any) => sum + (s?.unconfirmed || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">通知回执后台</h1>
          <p className="text-xs text-slate-500 mt-0.5">发布通知、收集回执、数据直接关联月度复盘报表</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            一键催发未回执（{totalUnreceipt}）
          </button>
          <button onClick={() => navigate("/notices/new")} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />
            新建通知
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={<Send className="w-4 h-4" />} label="已发通知" value={data.notices.length.toString()} unit="条" bg="bg-slate-800" fg="text-white" />
        <StatCard icon={<Eye className="w-4 h-4" />} label="总回执量" value={(Object.values(data.statsMap).reduce((s: any, v: any) => s + (v?.confirmed || 0), 0) as number).toString()} unit="份" bg="bg-white" fg="text-slate-800" />
        <StatCard icon={<ListChecks className="w-4 h-4" />} label="回执率" value={totalUnreceipt === 0 ? "100" : Math.round(((Object.values(data.statsMap).reduce((s: any, v: any) => s + (v?.confirmed || 0), 0) as number) / Math.max(1, Object.values(data.statsMap).reduce((s: any, v: any) => s + (v?.total || 0), 0) as number)) * 100).toString()} unit="%" bg="bg-white" fg="text-slate-800" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="未回执" value={(totalUnreceipt as unknown as string)} unit="份" bg={totalUnreceipt > 0 ? "bg-amber-500" : "bg-white"} fg={totalUnreceipt > 0 ? "text-white" : "text-slate-800"} />
        <StatCard icon={<MessageSquare className="w-4 h-4" />} label="含反馈" value={Object.values(data.receiptsMap).flat().filter((r: any) => r?.feedback).length.toString()} unit="条" bg="bg-white" fg="text-slate-800" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <div className="card overflow-hidden max-h-[70vh] flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <div className="text-sm font-bold text-slate-900">通知列表</div>
          </div>
          <ul className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {data.notices.length === 0 && (
              <li className="p-8 text-center text-xs text-slate-400">暂无通知，点击右上角新建</li>
            )}
            {data.notices.map((n) => {
              const active = n.id === activeId;
              const s = data.statsMap[n.id];
              return (
                <li
                  key={n.id}
                  onClick={() => setActiveId(n.id)}
                  className={cn(
                    "px-4 py-3.5 cursor-pointer transition-all relative",
                    active ? "bg-white shadow-sm" : "hover:bg-slate-50"
                  )}
                >
                  {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800" />}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="text-sm font-bold text-slate-900 line-clamp-1 flex-1 pr-2">{n.title}</div>
                    {s && s.unconfirmed > 0 && (
                      <span className="chip-amber shrink-0">{s.unconfirmed}待回</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2 line-clamp-2">{n.content.slice(0, 60)}…</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{n.senderName || "-"} · {n.publishedAt.slice(5, 16)}</span>
                    {s && (
                      <span className="font-nums text-slate-600 font-bold">
                        {s.confirmed}/{s.total}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card overflow-hidden flex flex-col max-h-[70vh]">
          {!activeNotice ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-10 text-center">
              请在左侧选择通知查看详情
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-black text-slate-900 tracking-tight">{activeNotice.title}</div>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline btn-sm"><Download className="w-3 h-3" />导出回执</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                  <span className="chip-gray">{activeNotice.targetType === "all" ? "全机构" : activeNotice.targetType === "class" ? "指定班级" : "指定学员"}</span>
                  <span>发送人 {activeNotice.senderName}</span>
                  <span>·</span>
                  <span className="font-nums">{activeNotice.publishedAt}</span>
                  <span>·</span>
                  <span>回执截止 {activeNotice.receiptDeadline}</span>
                </div>
              </div>

              {activeStats && (
                <div className="px-5 py-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50/50">
                  <StatMini label="总发送" value={activeStats.total} color="text-slate-800" />
                  <StatMini label="已读" value={activeStats.read} color="text-mint-500" />
                  <StatMini label="已回执" value={activeStats.confirmed} color="text-slate-800" />
                  <StatMini label="未读" value={activeStats.unread} color="text-slate-500" />
                  <StatMini label="超时未回" value={activeStats.unconfirmed} color="text-amber-500" />
                </div>
              )}

              <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700">回执明细</span>
                <span className="text-[11px] text-slate-400">共 {activeReceipts.length} 位</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <input placeholder="搜索学员姓名/电话…" className="input h-8 text-xs max-w-[180px]" />
                  {unreceipted > 0 && (
                    <button
                      onClick={() => {
                        fetcher.submit({ type: "batch_remind", count: unreceipted, noticeIds: [activeId] }, { method: "POST", encType: "application/json" as any });
                      }}
                      className="btn-warn btn-sm"
                    >
                      <Bell className="w-3 h-3" />
                      催发未回执（{unreceipted}）
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {activeReceipts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">暂无回执数据</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {activeReceipts.map((r) => {
                      const expanded = expandedId === r.id;
                      return (
                        <li key={r.id}>
                          <div
                            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => setExpandedId(expanded ? null : r.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                              {r.studentName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-bold text-slate-900">{r.studentName}</span>
                                {r.isConfirmed ? (
                                  <span className="chip-green flex items-center gap-0.5">
                                    <CheckCircle className="w-3 h-3" />已回执
                                  </span>
                                ) : r.isRead ? (
                                  <span className="chip-amber">已读未回</span>
                                ) : (
                                  <span className="chip-gray">未读</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-nums">
                                {r.parentPhone}
                                {(r.readAt || r.confirmedAt) && ` · ${r.confirmedAt || r.readAt}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {r.feedback && (
                                <span className="chip-blue">
                                  <MessageSquare className="w-3 h-3" />
                                  反馈
                                </span>
                              )}
                              {!r.isConfirmed && (
                                <ReceiptConfirmButton receiptId={r.id} />
                              )}
                              {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>
                          {expanded && (
                            <div className="px-5 pb-4 pl-16">
                              <div className="p-3.5 rounded-lg2 border border-slate-200 bg-slate-50/40 space-y-2">
                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                  <div>
                                    <span className="text-slate-400">家长：</span>
                                    <span className="text-slate-700 font-medium">{r.parentName || "-"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">联系电话：</span>
                                    <span className="font-nums text-slate-700">{r.parentPhone}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">阅读时间：</span>
                                    <span className="font-nums text-slate-700">{r.readAt || "未读"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">回执时间：</span>
                                    <span className="font-nums text-slate-700">{r.confirmedAt || "未回执"}</span>
                                  </div>
                                </div>
                                {r.feedback && (
                                  <div className="pt-2 border-t border-slate-200/70">
                                    <div className="text-[11px] text-slate-400 mb-1">家长反馈：</div>
                                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-100 leading-relaxed">
                                      {r.feedback}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceiptConfirmButton({ receiptId }: { receiptId: string }) {
  const fetcher = useFetcher();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        fetcher.submit({ type: "confirm", receiptId }, { method: "POST", encType: "application/json" as any });
      }}
      className="chip-green shrink-0 hover:opacity-90"
    >
      代确认回执
    </button>
  );
}

function StatCard({
  icon, label, value, unit, bg, fg,
}: {
  icon: React.ReactNode; label: string; value: string; unit: string; bg: string; fg: string;
}) {
  return (
    <div className={cn(
      "p-4 rounded-lg2 border shadow-card flex items-center gap-3 overflow-hidden",
      bg, bg.includes("white") ? "border-slate-200" : "border-transparent"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-lg2 flex items-center justify-center shrink-0",
        bg.includes("white") ? "bg-slate-100 text-slate-700" : "bg-white/10",
        fg.includes("white") && "text-white"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-xs font-medium truncate", fg, !bg.includes("white") && "opacity-80")}>{label}</div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={cn("text-xl font-black font-nums tracking-tight", fg)}>{value}</span>
          <span className={cn("text-xs font-medium", fg, !bg.includes("white") && "opacity-70")}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn("text-2xl font-black font-nums", color)}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
