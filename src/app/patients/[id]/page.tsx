"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { cn, formatDate, calculateAge, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export default function PatientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: patient, isLoading: patientLoading } =
    trpc.patient.getById.useQuery({ id });
  const { data: recordsData } = trpc.medicalRecord.list.useQuery({
    patientId: id,
    take: 50,
  });
  const { data: followUpsData } = trpc.followUp.list.useQuery({
    patientId: id,
    take: 50,
  });
  const { data: auditLogs } = trpc.auditLog.getByEntity.useQuery({
    entityType: "Patient",
    entityId: id,
  });

  if (patientLoading) {
    return (
      <div className="p-6">
        <p className="text-indigo-primary/60">加载中...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-amber">未找到患者信息</p>
      </div>
    );
  }

  const records = recordsData?.items ?? [];
  const followUps = followUpsData?.items ?? [];
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );
  const latestRecord = sortedRecords[sortedRecords.length - 1];
  const allNextVisitDates = sortedRecords
    .filter((r) => r.nextVisitDate)
    .map((r) => ({
      date: r.nextVisitDate!,
      visitDate: r.visitDate,
      isLatest: r.id === latestRecord?.id,
    }));

  return (
    <div className="p-6">
      <header className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Link
              href="/patients"
              className="text-sm text-indigo-deep/60 hover:text-green-herbal font-sans"
            >
              &larr; 患者列表
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-serif font-bold text-indigo-deep">
              {patient.name}
            </h1>
            <span className="inline-flex items-center rounded-full bg-indigo-deep/10 px-3 py-1 text-xs font-medium text-indigo-deep font-sans">
              {patient.gender === "MALE" ? "男" : "女"}
            </span>
            <span className="inline-flex items-center rounded-full bg-green-herbal/10 px-3 py-1 text-xs font-medium text-green-herbal font-sans">
              {calculateAge(patient.birthDate)}岁
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-warning/10 px-3 py-1 text-xs font-medium text-amber-warning font-sans">
              {patient.phone}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
              <h2 className="text-xl font-serif font-bold text-indigo-deep mb-4">
                主诉记录时间线
              </h2>
              {sortedRecords.length === 0 ? (
                <p className="text-indigo-deep/40 font-sans text-sm">
                  暂无就诊记录
                </p>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-beige-dark" />
                  {sortedRecords.map((record, index) => {
                    const prevRecord =
                      index > 0 ? sortedRecords[index - 1] : null;
                    const complaintChanged =
                      prevRecord &&
                      prevRecord.chiefComplaint !== record.chiefComplaint;
                    return (
                      <div key={record.id} className="relative mb-6 last:mb-0">
                        <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-green-herbal border-2 border-white" />
                        <div className="bg-beige-warm rounded-lg p-4 border border-beige-dark">
                          <p className="text-xs text-indigo-deep/50 font-sans mb-1">
                            {formatDate(record.visitDate)}
                          </p>
                          <p className="font-bold text-indigo-deep font-sans">
                            {record.chiefComplaint}
                          </p>
                          {complaintChanged && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-amber-warning font-sans">
                              <span>&rarr;</span>
                              <span className="line-through opacity-60">
                                {prevRecord!.chiefComplaint}
                              </span>
                              <span>变更</span>
                            </div>
                          )}
                          {record.diagnosis && (
                            <p className="mt-1 text-sm text-indigo-deep/70 font-sans">
                              诊断: {record.diagnosis}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
              <h2 className="text-xl font-serif font-bold text-indigo-deep mb-4">
                随访记录
              </h2>
              {followUps.length === 0 ? (
                <p className="text-indigo-deep/40 font-sans text-sm">
                  暂无随访任务
                </p>
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu) => (
                    <FollowUpItem key={fu.id} followUp={fu} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
              <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
                患者信息
              </h2>
              <dl className="space-y-3 font-sans text-sm">
                <div className="flex justify-between">
                  <dt className="text-indigo-deep/50">姓名</dt>
                  <dd className="text-indigo-deep font-medium">
                    {patient.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-deep/50">性别</dt>
                  <dd className="text-indigo-deep font-medium">
                    {patient.gender === "MALE" ? "男" : "女"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-deep/50">出生日期</dt>
                  <dd className="text-indigo-deep font-medium">
                    {formatDate(patient.birthDate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-deep/50">年龄</dt>
                  <dd className="text-indigo-deep font-medium">
                    {calculateAge(patient.birthDate)}岁
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-deep/50">电话</dt>
                  <dd className="text-indigo-deep font-medium">
                    {patient.phone}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-deep/50">过敏史</dt>
                  <dd className="text-indigo-deep font-medium">
                    {patient.allergies || "无"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
              <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
                复诊计划
              </h2>
              {allNextVisitDates.length === 0 ? (
                <p className="text-indigo-deep/40 font-sans text-sm">
                  暂无复诊计划
                </p>
              ) : (
                <div className="space-y-2">
                  {allNextVisitDates.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg p-3 text-sm font-sans",
                        item.isLatest
                          ? "border-2 border-green-herbal bg-green-herbal/5"
                          : "border border-beige-dark opacity-50"
                      )}
                    >
                      <p
                        className={cn(
                          "font-medium",
                          item.isLatest
                            ? "text-green-herbal"
                            : "text-indigo-deep/50"
                        )}
                      >
                        {formatDate(item.date)}
                      </p>
                      <p className="text-xs text-indigo-deep/40">
                        就诊日期: {formatDate(item.visitDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg bg-white p-6 shadow-sm border border-beige-dark">
              <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
                变更记录
              </h2>
              {(!auditLogs || auditLogs.length === 0) ? (
                <p className="text-indigo-deep/40 font-sans text-sm">
                  暂无变更记录
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs font-sans border-b border-beige-dark pb-2 last:border-0"
                    >
                      <p className="text-indigo-deep/50 mb-1">
                        {formatDateTime(log.createdAt)}
                      </p>
                      <p>
                        <span className="text-indigo-deep/70 font-medium">
                          {log.fieldName}
                        </span>
                        :{" "}
                        <span className="line-through text-red-400">
                          {log.oldValue || "空"}
                        </span>{" "}
                        &rarr;{" "}
                        <span className="text-green-herbal">
                          {log.newValue || "空"}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
    </div>
  );
}

function FollowUpItem({
  followUp,
}: {
  followUp: {
    id: string;
    status: string;
    dueDate: Date | string;
    qualityScore: number | null;
    assigneeId: string | null;
    followUpRecords?: { id: string; content: string; createdAt: Date | string; operatorId: string; patientFeedback: string }[];
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-beige-dark p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={followUp.status} />
          <span className="text-sm text-indigo-deep font-sans">
            截止: {formatDate(followUp.dueDate)}
          </span>
          {followUp.qualityScore && (
            <span className="text-xs text-amber-warning font-sans">
              评分: {followUp.qualityScore}/5
            </span>
          )}
        </div>
        <span className="text-indigo-deep/40 text-sm font-sans">
          {expanded ? "收起" : "展开"}
        </span>
      </div>
      {expanded && followUp.followUpRecords && followUp.followUpRecords.length > 0 && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-beige-dark">
          {followUp.followUpRecords.map((rec) => (
            <div key={rec.id} className="text-sm font-sans">
              <p className="text-indigo-deep/50 text-xs mb-1">
                {formatDateTime(rec.createdAt)} | 操作人: {rec.operatorId}
              </p>
              <p className="text-indigo-deep">{rec.content}</p>
              {rec.patientFeedback && (
                <p className="text-green-herbal/70 text-xs mt-1">
                  患者反馈: {rec.patientFeedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      {expanded && (!followUp.followUpRecords || followUp.followUpRecords.length === 0) && (
        <p className="mt-3 text-indigo-deep/40 text-sm font-sans pl-4">
          暂无随访记录
        </p>
      )}
    </div>
  );
}

