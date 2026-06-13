"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import {
  AbnormalTypeBadge,
  SeverityBadge,
  ResponseNodeBadge,
  Badge,
} from "@/components/ui/Badges";
import type {
  AbnormalType,
  AbnormalSeverity,
  AbnormalStatus,
  ResponseNode,
} from "@prisma/client";

type AbnormalTypeEnum = "DUPLICATE_LEAD" | "NO_RESPONSE" | "OVERDUE" | "COMPLAINT" | "OTHER";
type SeverityEnum = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
type StatusEnum = "PENDING" | "PROCESSING" | "RESOLVED";
type ResponseNodeEnum =
  | "INITIAL_CONTACT"
  | "FIRST_FOLLOWUP"
  | "SECOND_FOLLOWUP"
  | "APPOINTMENT_CONFIRM"
  | "PRE_VISIT_REMINDER"
  | "POST_VISIT_FOLLOWUP"
  | "TREATMENT_FOLLOWUP"
  | "PAYMENT_REMINDER";

export default function AbnormalsPage() {
  const { page, pageSize, setPage } = usePagination(15);
  const [filters, setFilters] = useState<{
    type?: AbnormalTypeEnum;
    status?: StatusEnum;
    severity?: SeverityEnum;
    handlerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showHandle, setShowHandle] = useState(false);

  const { data: stats } = api.abnormal.stats.useQuery();
  const { data: users } = api.user.list.useQuery();
  const { data: me } = api.user.me.useQuery();
  const { data, isLoading, refetch } = api.abnormal.list.useQuery({
    page,
    pageSize,
    type: filters.type,
    status: filters.status,
    severity: filters.severity,
    handlerId: filters.handlerId,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
  });
  const { data: detail } = api.abnormal.detail.useQuery(selectedId ?? "", {
    enabled: !!selectedId,
  });

  const isManager = me?.role === "MANAGER" || me?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="异常总数"
          value={stats?.total ?? 0}
          icon="📋"
          color="bg-slate-50 text-slate-700"
        />
        <StatCard
          title="待处理"
          value={stats?.pending ?? 0}
          icon="⏳"
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="处理中"
          value={stats?.processing ?? 0}
          icon="🔧"
          color="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="紧急异常"
          value={stats?.critical ?? 0}
          icon="🚨"
          color="bg-red-50 text-red-700"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="font-semibold">异常记录列表</h3>
          <button className="btn-dental" onClick={() => setShowNew(true)}>
            + 新建异常
          </button>
        </div>

        <div className="p-4 flex flex-wrap gap-3 items-end border-b border-slate-200">
          <div>
            <label className="label">类型</label>
            <select
              className="input w-36"
              value={filters.type ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, type: (e.target.value || undefined) as AbnormalTypeEnum });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="DUPLICATE_LEAD">线索撞单</option>
              <option value="NO_RESPONSE">无响应</option>
              <option value="OVERDUE">超期</option>
              <option value="COMPLAINT">投诉</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <div>
            <label className="label">状态</label>
            <select
              className="input w-32"
              value={filters.status ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, status: (e.target.value || undefined) as StatusEnum });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="PENDING">待处理</option>
              <option value="PROCESSING">处理中</option>
              <option value="RESOLVED">已解决</option>
            </select>
          </div>
          <div>
            <label className="label">严重程度</label>
            <select
              className="input w-28"
              value={filters.severity ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, severity: (e.target.value || undefined) as SeverityEnum });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="LOW">低</option>
              <option value="NORMAL">普通</option>
              <option value="HIGH">高</option>
              <option value="CRITICAL">紧急</option>
            </select>
          </div>
          <div>
            <label className="label">责任人</label>
            <select
              className="input w-32"
              value={filters.handlerId ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, handlerId: e.target.value || undefined });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">日期从</label>
            <input
              type="date"
              className="input w-40"
              value={filters.dateFrom ?? ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="label">至</label>
            <input
              type="date"
              className="input w-40"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <button
            onClick={() => {
              setFilters({});
              setPage(1);
            }}
            className="btn-secondary"
          >
            重置
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">类型</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">标题 / 描述</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">撞单原因</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">响应节点</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">严重程度</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">报告人</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">责任人</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">创建时间</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={10} className="text-center py-12 text-slate-400">加载中…</td></tr>
            ) : !data?.list.length ? (
              <tr><td colSpan={10} className="text-center py-12 text-slate-400">暂无异常记录</td></tr>
            ) : (
              data.list.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <AbnormalTypeBadge type={r.type} />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="font-medium cursor-pointer text-primary-700 hover:underline"
                      onClick={() => setSelectedId(r.id)}
                    >
                      {r.title}
                    </div>
                    {r.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate" title={r.duplicateReason ?? undefined}>
                    {r.duplicateReason || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ResponseNodeBadge node={r.responseNode} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={r.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status as StatusEnum} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.reporter?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.handler?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {isManager && (
                        <button
                          className="text-xs text-primary-600 hover:underline"
                          onClick={() => {
                            setSelectedId(r.id);
                            setShowAssign(true);
                          }}
                        >
                          分配
                        </button>
                      )}
                      <button
                        className="text-xs text-emerald-600 hover:underline ml-1"
                        onClick={() => {
                          setSelectedId(r.id);
                          setShowHandle(true);
                        }}
                      >
                        处理
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          total={data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onChange={setPage}
        />
      </div>

      <NewAbnormalModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onDone={() => {
          setShowNew(false);
          refetch();
        }}
      />

      <AssignHandlerModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        abnormalId={selectedId}
        users={users ?? []}
        onDone={() => {
          setShowAssign(false);
          refetch();
        }}
      />

      <HandleModal
        open={showHandle}
        onClose={() => setShowHandle(false)}
        abnormalId={selectedId}
        detail={detail}
        onDone={() => {
          setShowHandle(false);
          refetch();
        }}
      />

      <DetailModal
        open={!showAssign && !showHandle && !!selectedId}
        onClose={() => setSelectedId(null)}
        detail={detail}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: StatusEnum }) {
  const map: Record<StatusEnum, { label: string; variant: "warning" | "info" | "success" }> = {
    PENDING: { label: "待处理", variant: "warning" },
    PROCESSING: { label: "处理中", variant: "info" },
    RESOLVED: { label: "已解决", variant: "success" },
  };
  const conf = map[status] ?? { label: status, variant: "info" };
  return <Badge variant={conf.variant}>{conf.label}</Badge>;
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`p-5 rounded-xl ${color} transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm opacity-80 mb-1">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="text-3xl opacity-60">{icon}</div>
      </div>
    </div>
  );
}

function NewAbnormalModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    type: "OTHER" as AbnormalTypeEnum,
    leadId: "",
    title: "",
    description: "",
    duplicateReason: "",
    responseNode: "" as ResponseNodeEnum | "",
    severity: "NORMAL" as SeverityEnum,
  });
  const create = api.abnormal.create.useMutation({
    onSuccess: () => onDone(),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建异常记录"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!form.title || create.isPending}
            onClick={() =>
              create.mutate({
                ...form,
                leadId: form.leadId || undefined,
                description: form.description || undefined,
                duplicateReason: form.duplicateReason || undefined,
                responseNode: (form.responseNode || undefined) as ResponseNode | undefined,
              })
            }
          >
            提交
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">异常类型 *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AbnormalTypeEnum })}
            >
              <option value="DUPLICATE_LEAD">线索撞单</option>
              <option value="NO_RESPONSE">无响应</option>
              <option value="OVERDUE">超期</option>
              <option value="COMPLAINT">投诉</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <div>
            <label className="label">严重程度 *</label>
            <select
              className="input"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as SeverityEnum })}
            >
              <option value="LOW">低</option>
              <option value="NORMAL">普通</option>
              <option value="HIGH">高</option>
              <option value="CRITICAL">紧急</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">关联线索 ID（可选）</label>
          <input
            className="input"
            placeholder="输入线索 ID"
            value={form.leadId}
            onChange={(e) => setForm({ ...form, leadId: e.target.value })}
          />
        </div>
        <div>
          <label className="label">标题 *</label>
          <input
            className="input"
            placeholder="请输入异常标题"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="label">描述</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="请详细描述异常情况"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        {form.type === "DUPLICATE_LEAD" && (
          <div>
            <label className="label">撞单原因</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="请描述撞单原因（相同手机号、相同项目等）"
              value={form.duplicateReason}
              onChange={(e) => setForm({ ...form, duplicateReason: e.target.value })}
            />
          </div>
        )}
        <div>
          <label className="label">响应节点</label>
          <select
            className="input"
            value={form.responseNode}
            onChange={(e) => setForm({ ...form, responseNode: e.target.value as ResponseNodeEnum | "" })}
          >
            <option value="">未标记</option>
            <option value="INITIAL_CONTACT">初次触达</option>
            <option value="FIRST_FOLLOWUP">第一次回访</option>
            <option value="SECOND_FOLLOWUP">第二次回访</option>
            <option value="APPOINTMENT_CONFIRM">预约确认</option>
            <option value="PRE_VISIT_REMINDER">到店前提醒</option>
            <option value="POST_VISIT_FOLLOWUP">到店后跟进</option>
            <option value="TREATMENT_FOLLOWUP">治疗回访</option>
            <option value="PAYMENT_REMINDER">回款提醒</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function AssignHandlerModal({
  open,
  onClose,
  abnormalId,
  users,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  abnormalId: string | null;
  users: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const [handlerId, setHandlerId] = useState("");
  const assign = api.abnormal.assignHandler.useMutation({
    onSuccess: () => onDone(),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="分配责任人"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!handlerId || !abnormalId || assign.isPending}
            onClick={() => abnormalId && assign.mutate({ id: abnormalId, handlerId })}
          >
            确认分配
          </button>
        </>
      }
    >
      <div>
        <label className="label">选择责任人 *</label>
        <select
          className="input"
          value={handlerId}
          onChange={(e) => setHandlerId(e.target.value)}
        >
          <option value="">请选择</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
}

function HandleModal({
  open,
  onClose,
  abnormalId,
  detail,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  abnormalId: string | null;
  detail: { handleNote?: string | null; status?: string } | null | undefined;
  onDone: () => void;
}) {
  const [handleNote, setHandleNote] = useState("");
  const [resolved, setResolved] = useState(false);
  const handle = api.abnormal.handle.useMutation({
    onSuccess: () => onDone(),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="处理异常"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!handleNote.trim() || !abnormalId || handle.isPending}
            onClick={() => abnormalId && handle.mutate({ id: abnormalId, handleNote, resolved })}
          >
            提交处理
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">处理备注 *</label>
          <textarea
            className="input min-h-[100px]"
            placeholder="请填写处理说明或措施"
            value={handleNote}
            onChange={(e) => setHandleNote(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="resolved"
            checked={resolved}
            onChange={(e) => setResolved(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="resolved" className="text-sm text-slate-700">
            标记为已解决
          </label>
        </div>
        {detail?.handleNote && (
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">上次处理备注：</div>
            <div className="text-sm text-slate-700">{detail.handleNote}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailModal({
  open,
  onClose,
  detail,
}: {
  open: boolean;
  onClose: () => void;
  detail: any;
}) {
  if (!open || !detail) return null;

  return (
    <Modal open={open} onClose={onClose} title="异常详情" size="xl">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <AbnormalTypeBadge type={detail.type} />
          <SeverityBadge severity={detail.severity} />
          <ResponseNodeBadge node={detail.responseNode} />
          <StatusBadge status={detail.status as StatusEnum} />
        </div>
        <div>
          <div className="text-sm text-slate-500 mb-1">标题</div>
          <div className="font-medium">{detail.title}</div>
        </div>
        {detail.description && (
          <div>
            <div className="text-sm text-slate-500 mb-1">描述</div>
            <div className="text-slate-700 whitespace-pre-wrap">{detail.description}</div>
          </div>
        )}
        {detail.duplicateReason && (
          <div>
            <div className="text-sm text-slate-500 mb-1">撞单原因</div>
            <div className="text-slate-700">{detail.duplicateReason}</div>
          </div>
        )}
        {detail.handleNote && (
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-xs text-emerald-600 mb-1">处理备注</div>
            <div className="text-sm text-emerald-800 whitespace-pre-wrap">{detail.handleNote}</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div>
            <div className="text-xs text-slate-500">报告人</div>
            <div className="text-sm">{detail.reporter?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">责任人</div>
            <div className="text-sm">{detail.handler?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">创建时间</div>
            <div className="text-sm">{new Date(detail.createdAt).toLocaleString("zh-CN")}</div>
          </div>
          {detail.handledAt && (
            <div>
              <div className="text-xs text-slate-500">处理时间</div>
              <div className="text-sm">{new Date(detail.handledAt).toLocaleString("zh-CN")}</div>
            </div>
          )}
        </div>
        {detail.logs?.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="text-sm font-medium mb-2">操作日志</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {detail.logs.map((log: any) => (
                <div key={log.id} className="text-xs rounded-lg bg-slate-50 p-2">
                  <div className="flex justify-between">
                    <span className="text-slate-700">
                      {log.operator?.name ?? "系统"} · {log.detail}
                    </span>
                    <span className="text-slate-400">
                      {new Date(log.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
