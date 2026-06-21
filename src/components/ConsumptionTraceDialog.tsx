"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { X, Clock, User, FileText, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { cn, formatDateTime, formatDate } from "@/lib/utils";
import { StatusChip, consumptionStatusVariant } from "@/components/ui/StatusChip";

interface Props {
  open: boolean;
  onClose: () => void;
  consumptionId: string;
}

export function ConsumptionTraceDialog({ open, onClose, consumptionId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = trpc.consumptions.trace.useQuery(consumptionId, { enabled: open });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-deep-blue-50">
          <div>
            <h3 className="text-lg font-semibold text-deep-blue-700">课时消耗追溯</h3>
            <p className="text-xs text-deep-blue-400 mt-0.5">查看完整的消耗明细与修订记录</p>
          </div>
          <button onClick={onClose} className="btn-secondary !px-2 !py-1.5">
            <X size={16} />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="p-12 text-center text-sm text-deep-blue-400">加载中...</div>
        ) : (
          <div className="overflow-y-auto scrollbar-thin flex-1">
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">学生</div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-deep-blue-500" />
                    <span className="text-sm font-medium text-deep-blue-700">{data.student?.name}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">消耗状态</div>
                  <StatusChip variant={consumptionStatusVariant(data.consumption.status)}>
                    {data.consumption.status === "NORMAL" ? "正常" : data.consumption.status === "EXCEPTION" ? "异常" : "已对账"}
                  </StatusChip>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">班级</div>
                  <div className="text-sm text-deep-blue-700">{data.classInfo?.name ?? "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">消耗课时</div>
                  <div className="text-sm font-semibold text-deep-blue-700 num">{data.consumption.hours} 节</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">课程</div>
                  <div className="text-sm text-deep-blue-700">{data.lesson?.title ?? "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">上课时间</div>
                  <div className="flex items-center gap-1.5 text-sm text-deep-blue-700">
                    <Clock size={13} className="text-deep-blue-400" />
                    {data.lesson?.startAt ? formatDateTime(data.lesson.startAt) : "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">操作人</div>
                  <div className="text-sm text-deep-blue-700">{data.operator?.name ?? "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-deep-blue-400">消耗时间</div>
                  <div className="text-sm text-deep-blue-700">{formatDateTime(data.consumption.createdAt)}</div>
                </div>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full btn-secondary"
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{expanded ? "收起详细信息" : "展开详细信息"}</span>
              </button>

              <div className={cn("space-y-5", !expanded && "hidden")}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-deep-blue-700">
                    <User size={16} className="text-ink-gold-500" />考勤记录
                  </div>
                  <div className="card !rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-deep-blue-50/60">
                          <th className="table-head !py-2 !text-left">学生</th>
                          <th className="table-head !py-2 !text-left">考勤</th>
                          <th className="table-head !py-2 !text-left">签到时间</th>
                          <th className="table-head !py-2 !text-left">备注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.attendance.map((a: any) => (
                          <tr key={a.id} className="border-t border-deep-blue-50">
                            <td className="table-cell !py-2">{data.student?.name}</td>
                            <td className="table-cell !py-2">
                              <StatusChip variant={a.status === "PRESENT" ? "success" : a.status === "LATE" ? "warn" : a.status === "ABSENT" ? "danger" : "info"}>
                                {a.status === "PRESENT" ? "出勤" : a.status === "LATE" ? "迟到" : a.status === "ABSENT" ? "缺勤" : "请假"}
                              </StatusChip>
                            </td>
                            <td className="table-cell !py-2 text-deep-blue-600">{a.signedAt ? formatDateTime(a.signedAt) : "-"}</td>
                            <td className="table-cell !py-2 text-deep-blue-500">{a.remark ?? "-"}</td>
                          </tr>
                        ))}
                        {data.attendance.length === 0 && (
                          <tr><td colSpan={4} className="table-cell !py-4 text-center text-deep-blue-400">暂无考勤记录</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {data.questionBank && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-deep-blue-700">
                      <BookOpen size={16} className="text-ink-gold-500" />题库版本
                    </div>
                    <div className="card !rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-deep-blue-500">版本号</span>
                        <span className="text-deep-blue-700 font-medium">{data.questionBank.versionNo}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-deep-blue-500">启用时间</span>
                        <span className="text-deep-blue-700">{formatDate(data.questionBank.enabledAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-deep-blue-500">专业</span>
                        <span className="text-deep-blue-700">{data.questionBank.major ?? "-"}</span>
                      </div>
                      {data.questionBank.changelog && (
                        <div className="pt-2 border-t border-deep-blue-50 text-sm text-deep-blue-600">
                          <div className="text-deep-blue-400 text-xs mb-1">更新说明</div>
                          {data.questionBank.changelog}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-deep-blue-700">
                    <FileText size={16} className="text-ink-gold-500" />修订时间线
                  </div>
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-deep-blue-100" />
                    {data.revisions.map((r: any, i: number) => (
                      <div key={r.id} className="relative">
                        <div className={cn(
                          "absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white",
                          i === data.revisions.length - 1 ? "bg-ink-gold-500" : "bg-deep-blue-300"
                        )} />
                        <div className="card !rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-deep-blue-600">{r.operatorName}</span>
                              <span className="text-xs text-deep-blue-300">·</span>
                              <span className="text-xs text-deep-blue-400">{formatDateTime(r.createdAt)}</span>
                            </div>
                          </div>
                          {r.afterData?.status && (
                            <StatusChip variant={consumptionStatusVariant(r.afterData.status)} size="sm">
                              状态变更为 {r.afterData.status === "NORMAL" ? "正常" : r.afterData.status === "EXCEPTION" ? "异常" : "已对账"}
                            </StatusChip>
                          )}
                          {r.afterData?.remark && (
                            <div className="text-xs text-deep-blue-500">备注：{r.afterData.remark}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {data.revisions.length === 0 && (
                      <div className="text-sm text-deep-blue-400 text-center py-4">暂无修订记录</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
