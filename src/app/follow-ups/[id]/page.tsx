"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { cn, formatDate, formatDateTime, calculateAge } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

const statusTransitions: Record<string, { target: string; label: string }[]> = {
  PENDING: [
    { target: "IN_PROGRESS", label: "开始随访" },
    { target: "LOST", label: "标记失访" },
  ],
  IN_PROGRESS: [
    { target: "COMPLETED", label: "完成随访" },
    { target: "LOST", label: "标记失访" },
  ],
  COMPLETED: [],
  LOST: [
    { target: "PENDING", label: "重新开启" },
  ],
};

export default function FollowUpDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: task, isLoading } = trpc.followUp.getById.useQuery({ id });
  const { data: auditLogs } = trpc.auditLog.getByEntity.useQuery({
    entityType: "FollowUpTask",
    entityId: id,
  });

  const [recordContent, setRecordContent] = useState("");
  const [patientFeedback, setPatientFeedback] = useState("");
  const [summary, setSummary] = useState("");
  const [qualityScore, setQualityScore] = useState(0);
  const [showScorePicker, setShowScorePicker] = useState(false);

  const addRecordMutation = trpc.followUp.addRecord.useMutation({
    onSuccess: () => {
      setRecordContent("");
      setPatientFeedback("");
    },
  });

  const updateStatusMutation = trpc.followUp.updateStatus.useMutation();

  const updateSummaryMutation = trpc.medicalRecord.updateSummary.useMutation({
    onSuccess: () => {
      setSummary("");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-indigo-primary/60">加载中...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <p className="text-amber">未找到随访任务</p>
      </div>
    );
  }

  const transitions = statusTransitions[task.status] ?? [];

  return (
    <div className="p-6">
      <header className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Link
              href="/follow-ups"
              className="text-sm text-indigo-deep/60 hover:text-green-herbal font-sans"
            >
              &larr; 随访列表
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge status={task.status} />
            <Link
              href={`/patients/${task.patientId}`}
              className="text-xl font-serif font-bold text-indigo-deep hover:text-green-herbal"
            >
              {task.patient?.name ?? "未知患者"}
            </Link>
            <span className="text-sm text-indigo-deep/60 font-sans">
              截止日期: {formatDate(task.dueDate)}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
            <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
              患者信息
            </h2>
            <dl className="space-y-2 font-sans text-sm">
              <div className="flex justify-between">
                <dt className="text-indigo-deep/50">姓名</dt>
                <dd className="text-indigo-deep font-medium">
                  {task.patient?.name ?? "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-indigo-deep/50">性别</dt>
                <dd className="text-indigo-deep font-medium">
                  {task.patient?.gender === "MALE" ? "男" : "女"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-indigo-deep/50">年龄</dt>
                <dd className="text-indigo-deep font-medium">
                  {task.patient?.birthDate
                    ? `${calculateAge(task.patient.birthDate)}岁`
                    : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-indigo-deep/50">电话</dt>
                <dd className="text-indigo-deep font-medium">
                  {task.patient?.phone ?? "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-indigo-deep/50">过敏史</dt>
                <dd className="text-indigo-deep font-medium">
                  {task.patient?.allergies || "无"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
            <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
              诊疗记录
            </h2>
            <dl className="space-y-2 font-sans text-sm">
              <div>
                <dt className="text-indigo-deep/50 mb-1">主诉</dt>
                <dd className="text-indigo-deep font-medium">
                  {task.medicalRecord?.chiefComplaint ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-indigo-deep/50 mb-1">诊断</dt>
                <dd className="text-indigo-deep">
                  {task.medicalRecord?.diagnosis ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-indigo-deep/50 mb-1">处方</dt>
                <dd className="text-indigo-deep">
                  {task.medicalRecord?.prescription ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-indigo-deep/50 mb-1">小结</dt>
                <dd className="text-indigo-deep">
                  {task.medicalRecord?.summary || "暂无"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark mb-6">
          <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
            编辑小结
          </h2>
          <textarea
            value={summary || task.medicalRecord?.summary || ""}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal resize-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                if (task.medicalRecord?.id) {
                  updateSummaryMutation.mutate({
                    id: task.medicalRecord.id,
                    summary: summary || task.medicalRecord.summary || "",
                  });
                }
              }}
              disabled={!task.medicalRecord?.id || updateSummaryMutation.isPending}
              className="rounded-lg bg-green-herbal px-4 py-2 text-sm font-sans text-white hover:bg-green-herbal/90 disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark mb-6">
          <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
            随访记录
          </h2>
          {task.followUpRecords && task.followUpRecords.length > 0 ? (
            <div className="relative pl-8 mb-6">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-beige-dark" />
              {task.followUpRecords.map((rec) => (
                <div key={rec.id} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-green-herbal border-2 border-white" />
                  <div className="bg-beige-warm rounded-lg p-4 border border-beige-dark">
                    <p className="text-xs text-indigo-deep/50 font-sans mb-1">
                      {formatDateTime(rec.createdAt)} | 操作人:{" "}
                      {rec.operatorId}
                    </p>
                    <p className="text-sm text-indigo-deep font-sans">
                      {rec.content}
                    </p>
                    {rec.patientFeedback && (
                      <p className="text-xs text-green-herbal/70 font-sans mt-1">
                        患者反馈: {rec.patientFeedback}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-indigo-deep/40 font-sans text-sm mb-6">
              暂无随访记录
            </p>
          )}

          <div className="border-t border-beige-dark pt-4">
            <h3 className="text-sm font-serif font-bold text-indigo-deep mb-3">
              添加记录
            </h3>
            <textarea
              value={recordContent}
              onChange={(e) => setRecordContent(e.target.value)}
              placeholder="随访内容..."
              rows={3}
              className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep placeholder:text-indigo-deep/40 focus:outline-none focus:ring-2 focus:ring-green-herbal resize-none mb-3"
            />
            <textarea
              value={patientFeedback}
              onChange={(e) => setPatientFeedback(e.target.value)}
              placeholder="患者反馈（可选）..."
              rows={2}
              className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep placeholder:text-indigo-deep/40 focus:outline-none focus:ring-2 focus:ring-green-herbal resize-none mb-3"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (recordContent) {
                    addRecordMutation.mutate({
                      followUpTaskId: id,
                      content: recordContent,
                      patientFeedback: patientFeedback || undefined,
                    });
                  }
                }}
                disabled={!recordContent || addRecordMutation.isPending}
                className="rounded-lg bg-green-herbal px-4 py-2 text-sm font-sans text-white hover:bg-green-herbal/90 disabled:opacity-40"
              >
                提交记录
              </button>
            </div>
          </div>
        </section>

        {transitions.length > 0 && (
          <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark mb-6">
            <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
              状态变更
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {transitions.map((t) => (
                <div key={t.target} className="relative">
                  <button
                    onClick={() => {
                      if (t.target === "COMPLETED") {
                        setShowScorePicker(true);
                      } else {
                        updateStatusMutation.mutate({
                          id,
                          status: t.target as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "LOST",
                        });
                      }
                    }}
                    disabled={updateStatusMutation.isPending}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-sans font-medium disabled:opacity-40",
                      t.target === "COMPLETED"
                        ? "bg-green-herbal text-white hover:bg-green-herbal/90"
                        : t.target === "LOST"
                        ? "bg-amber-warning text-white hover:bg-amber-warning/90"
                        : "bg-indigo-deep text-white hover:bg-indigo-deep/90"
                    )}
                  >
                    {t.label}
                  </button>
                </div>
              ))}
            </div>

            {showScorePicker && (
              <div className="mt-4 p-4 rounded-lg bg-beige-warm border border-beige-dark">
                <p className="text-sm font-sans text-indigo-deep mb-2">
                  完成随访 - 请评分：
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setQualityScore(star)}
                      className={cn(
                        "w-8 h-8 rounded text-lg",
                        star <= qualityScore
                          ? "text-amber-warning"
                          : "text-beige-dark"
                      )}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-sans text-indigo-deep/60">
                    {qualityScore > 0 ? `${qualityScore}/5` : "未评分"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id,
                        status: "COMPLETED",
                        qualityScore: qualityScore > 0 ? qualityScore : undefined,
                      });
                      setShowScorePicker(false);
                      setQualityScore(0);
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="rounded-lg bg-green-herbal px-4 py-2 text-sm font-sans text-white hover:bg-green-herbal/90 disabled:opacity-40"
                  >
                    确认完成
                  </button>
                  <button
                    onClick={() => {
                      setShowScorePicker(false);
                      setQualityScore(0);
                    }}
                    className="rounded-lg border border-beige-dark px-4 py-2 text-sm font-sans text-indigo-deep hover:bg-beige-warm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {auditLogs && auditLogs.length > 0 && (
          <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
            <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
              审计日志
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-beige-dark bg-beige-warm">
                    <th className="px-4 py-2 text-left font-medium text-indigo-deep/70">
                      字段
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-indigo-deep/70">
                      旧值
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-indigo-deep/70">
                      新值
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-indigo-deep/70">
                      时间
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-indigo-deep/70">
                      操作人
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-beige-dark last:border-0"
                    >
                      <td className="px-4 py-2 text-indigo-deep font-medium">
                        {log.fieldName}
                      </td>
                      <td className="px-4 py-2 text-red-400 line-through">
                        {log.oldValue || "空"}
                      </td>
                      <td className="px-4 py-2 text-green-herbal">
                        {log.newValue || "空"}
                      </td>
                      <td className="px-4 py-2 text-indigo-deep/60">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-indigo-deep/60">
                        {log.operatorId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </div>
  );
}
