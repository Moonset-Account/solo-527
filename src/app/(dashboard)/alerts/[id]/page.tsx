"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCheck, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/trpc/client";
import {
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_LABELS,
  enumOptions,
} from "@/lib/label-maps";
import { formatDateTime } from "@/lib/utils";
import { AlertStatus } from "@prisma/client";

export default function AlertDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const query = api.alert.get.useQuery({ id });
  const utils = api.useUtils();
  const updateStatus = api.alert.updateStatus.useMutation();
  const setResolution = api.alert.setResolution.useMutation();
  const confirmBusiness = api.alert.confirmBusiness.useMutation();
  const meQuery = api.user.me.useQuery();
  const usersQuery = api.user.list.useQuery();
  const canAssign =
    meQuery.data?.role === "ADMIN" || meQuery.data?.role === "IT_MANAGER";
  const assignMutation = api.alert.assign.useMutation();

  const [note, setNote] = useState("");
  const [resolution, setRes] = useState("");
  const [confirmBy, setConfirmBy] = useState("");
  const [confirmNote, setConfirmNote] = useState("");

  if (query.isLoading) return <div className="card p-8 text-center">加载中…</div>;
  if (!query.data) return <div className="card p-8 text-center">未找到</div>;
  const a = query.data;

  const doStatus = async (s: AlertStatus) => {
    await updateStatus.mutateAsync({ id, status: s, note: note || undefined });
    setNote("");
    await utils.alert.get.invalidate({ id });
  };

  const doResolution = async () => {
    await setResolution.mutateAsync({ id, resolution });
    setRes("");
    await utils.alert.get.invalidate({ id });
  };

  const doConfirm = async () => {
    if (!confirmBy) return alert("请填写业务确认人");
    await confirmBusiness.mutateAsync({
      id,
      confirmedBy: confirmBy,
      note: confirmNote || undefined,
    });
    setConfirmBy("");
    setConfirmNote("");
    await utils.alert.get.invalidate({ id });
  };

  const nextStatus = buildNextStatus(a.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/alerts")}
        >
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        <h1 className="page-title truncate">{a.title}</h1>
        <span className={ALERT_SEVERITY_LABELS[a.severity].cls}>
          {ALERT_SEVERITY_LABELS[a.severity].label}
        </span>
        <span className={ALERT_STATUS_LABELS[a.status].cls}>
          {ALERT_STATUS_LABELS[a.status].label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2 space-y-5">
          <Section title="基本信息">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <dt className="text-slate-500">关联资产</dt>
              <dd>
                {a.asset ? (
                  <Link
                    href={`/assets/${a.asset.id}`}
                    className="text-primary-700 hover:underline"
                  >
                    {a.asset.name}{" "}
                    <span className="text-slate-500">({a.asset.ipAddress ?? a.asset.hostname})</span>
                  </Link>
                ) : (
                  "-"
                )}
              </dd>
              <dt className="text-slate-500">来源</dt>
              <dd>{a.source ?? "-"}</dd>
              <dt className="text-slate-500">创建人</dt>
              <dd>{a.creator?.name ?? a.creator?.email ?? "-"}</dd>
              <dt className="text-slate-500">处理人</dt>
              <dd>
                {canAssign ? (
                  <select
                    className="h-8"
                    value={a.assigneeId ?? ""}
                    onChange={async (e) => {
                      await assignMutation.mutateAsync({
                        id,
                        assigneeId: e.target.value || null,
                      });
                      await utils.alert.get.invalidate({ id });
                    }}
                  >
                    <option value="">未指派</option>
                    {(usersQuery.data ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name ?? u.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  a.assignee?.name ?? a.assignee?.email ?? "-"
                )}
              </dd>
              <dt className="text-slate-500">创建时间</dt>
              <dd>{formatDateTime(a.createdAt)}</dd>
              <dt className="text-slate-500">解决时间</dt>
              <dd>{formatDateTime(a.resolvedAt)}</dd>
              <dt className="text-slate-500">关闭时间</dt>
              <dd>{formatDateTime(a.closedAt)}</dd>
            </dl>
            {a.description && (
              <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <div className="mb-1 text-xs font-medium text-slate-500">
                  告警描述
                </div>
                {a.description}
              </div>
            )}
            {a.resolution && (
              <div className="mt-3 rounded-md bg-success-50 p-3 text-sm text-slate-700">
                <div className="mb-1 text-xs font-medium text-success-700">
                  解决说明
                </div>
                {a.resolution}
              </div>
            )}
          </Section>

          <Section title="处理动作">
            <div className="flex flex-wrap gap-2">
              {nextStatus.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn-primary"
                  onClick={() => doStatus(s as AlertStatus)}
                >
                  <Send className="h-4 w-4" />
                  变更为：{ALERT_STATUS_LABELS[s as AlertStatus].label}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <textarea
                rows={2}
                className="w-full"
                placeholder="处理备注（可选）"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="mb-2 text-sm font-medium">补充解决说明</div>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  className="flex-1"
                  placeholder="输入解决说明"
                  value={resolution}
                  onChange={(e) => setRes(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary self-end"
                  onClick={doResolution}
                >
                  <CheckCheck className="h-4 w-4" /> 保存
                </button>
              </div>
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="mb-2 flex items-center gap-1 text-sm font-medium">
                <UserCheck className="h-4 w-4 text-primary-600" /> 业务确认
                {a.businessConfirmed && (
                  <span className="badge bg-success-100 text-success-700 ml-2">
                    由 {a.businessConfirmedBy} 于{" "}
                    {formatDateTime(a.businessConfirmedAt)} 完成
                  </span>
                )}
              </div>
              {!a.businessConfirmed && (
                <div className="flex flex-wrap gap-2">
                  <input
                    className="w-48"
                    placeholder="业务确认人姓名"
                    value={confirmBy}
                    onChange={(e) => setConfirmBy(e.target.value)}
                  />
                  <input
                    className="flex-1"
                    placeholder="备注（可选）"
                    value={confirmNote}
                    onChange={(e) => setConfirmNote(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-success"
                    onClick={doConfirm}
                  >
                    完成确认
                  </button>
                </div>
              )}
            </div>
          </Section>

          <Section title="处理历史">
            <ul className="space-y-3">
              {a.histories.map((h) => (
                <li
                  key={h.id}
                  className="flex gap-3 rounded-md border border-slate-100 p-3"
                >
                  <div className="text-xs text-slate-400 w-36 shrink-0">
                    {formatDateTime(h.createdAt)}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {h.fromStatus && (
                        <span className={ALERT_STATUS_LABELS[h.fromStatus].cls}>
                          {ALERT_STATUS_LABELS[h.fromStatus].label}
                        </span>
                      )}
                      {h.fromStatus && <span className="text-slate-400">→</span>}
                      <span className={ALERT_STATUS_LABELS[h.toStatus].cls}>
                        {ALERT_STATUS_LABELS[h.toStatus].label}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {h.actor?.name ?? "系统"}
                      </span>
                    </div>
                    {h.note && (
                      <div className="mt-1 text-slate-600">{h.note}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="card p-5 h-fit">
          <div className="section-title">状态流转</div>
          <ul className="space-y-2 text-sm">
            {Object.values(AlertStatus).map((s) => (
              <li
                key={s}
                className="flex items-center justify-between rounded-md p-2"
                style={{
                  background:
                    s === a.status ? "rgb(239 246 255)" : undefined,
                }}
              >
                <span className={ALERT_STATUS_LABELS[s].cls}>
                  {ALERT_STATUS_LABELS[s].label}
                </span>
                <span className="text-xs text-slate-400">
                  {s === a.status ? "当前" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

function buildNextStatus(current: AlertStatus) {
  const order = [
    AlertStatus.OPEN,
    AlertStatus.ACKNOWLEDGED,
    AlertStatus.IN_PROGRESS,
    AlertStatus.RESOLVED,
    AlertStatus.CLOSED,
  ];
  const idx = order.indexOf(current);
  const next: AlertStatus[] = [];
  for (let i = Math.max(0, idx - 1); i < order.length; i++) {
    if (order[i] !== current) next.push(order[i]);
  }
  return next;
}
