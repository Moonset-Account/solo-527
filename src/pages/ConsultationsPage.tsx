"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { IntentionBadge, Badge } from "@/components/ui/Badges";
import Link from "next/link";
import type { LeadQuality } from "@prisma/client";

export default function ConsultationsPage() {
  const { page, pageSize, setPage } = usePagination(10);
  const [filters, setFilters] = useState<{
    intentionLevel?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [showNew, setShowNew] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const { data, isLoading, refetch } = api.consultation.list.useQuery({
    page,
    pageSize,
    intentionLevel: filters.intentionLevel,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">意向等级</label>
            <select
              className="input w-36"
              value={filters.intentionLevel ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, intentionLevel: e.target.value || undefined });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="A">A - 强烈意向</option>
              <option value="B">B - 一般意向</option>
              <option value="C">C - 意向弱</option>
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
        <button
          className="btn-dental"
          onClick={() => setShowCustomerModal(true)}
        >
          + 新建咨询
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">客户</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">主诉</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">诊断/方案</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">预估费用</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">意向</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">线索</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">填写人</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">加载中…</td></tr>
            ) : !data?.list.length ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">暂无咨询记录</td></tr>
            ) : (
              data.list.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/customers/${r.customerId}`} className="font-medium text-primary-700 hover:underline">
                      {r.customer?.name}
                    </Link>
                    <div className="text-xs text-slate-500">{r.customer?.phone}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={r.chiefComplaint}>
                    {r.chiefComplaint}
                  </td>
                  <td className="px-4 py-3 max-w-sm truncate" title={r.diagnosis ?? undefined}>
                    {r.diagnosis || r.treatmentPlan || "-"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.estimatedFee ? `¥${Number(r.estimatedFee).toLocaleString()}` : "-"}
                  </td>
                  <td className="px-4 py-3"><IntentionBadge level={r.intentionLevel} /></td>
                  <td className="px-4 py-3">
                    {r.leads?.length ? (
                      r.leads.map((l) => (
                        <Link key={l.id} href={`/leads/${l.id}`}>
                          <Badge variant="info" className="mr-1">#{l.id.slice(-4)}</Badge>
                        </Link>
                      ))
                    ) : (
                      <span className="text-slate-400">未关联</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.createdBy?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(r.consultationDate).toLocaleDateString("zh-CN")}
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

      <CreateCustomerModal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCreated={() => {
          setShowCustomerModal(false);
          setShowNew(true);
          refetch();
        }}
      />

      <NewConsultationModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onDone={() => {
          setShowNew(false);
          refetch();
        }}
      />
    </div>
  );
}

function CreateCustomerModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", source: "" });
  const create = api.customer.create.useMutation({
    onSuccess: (d) => onCreated(d.id),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="快速创建客户"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!form.name || !form.phone || create.isPending}
            onClick={() => create.mutate(form)}
          >
            创建并继续
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">姓名 *</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="请输入客户姓名"
          />
        </div>
        <div>
          <label className="label">手机号 *</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="请输入联系电话"
          />
        </div>
        <div>
          <label className="label">来源渠道</label>
          <select
            className="input"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            <option value="">请选择</option>
            <option value="到店">到店</option>
            <option value="美团">美团</option>
            <option value="大众点评">大众点评</option>
            <option value="抖音">抖音</option>
            <option value="朋友介绍">朋友介绍</option>
            <option value="电话营销">电话营销</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function NewConsultationModal({
  open, onClose, onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    customerId: "",
    chiefComplaint: "",
    dentalHistory: "",
    diagnosis: "",
    treatmentPlan: "",
    estimatedFee: "",
    intentionLevel: "",
    createLead: true,
    leadQuality: "POTENTIAL" as LeadQuality,
  });
  const { data: customers } = api.customer.list.useQuery(
    { page: 1, pageSize: 50 },
    { enabled: open }
  );
  const create = api.consultation.create.useMutation({
    onSuccess: () => onDone(),
  });

  const qualityHint = useMemo(() => {
    const fee = Number(form.estimatedFee || 0);
    const level = form.intentionLevel;
    if (level === "A") return { text: "⚠️ 高意向线索建议优先跟进", type: "success" };
    if (fee > 10000 && level === "B") return { text: "💡 高客单价中意向，值得重点维护", type: "warning" };
    if (level === "C") return { text: "📌 低意向，建议降低回访频次", type: "slate" };
    return null;
  }, [form.estimatedFee, form.intentionLevel]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="填写咨询记录"
      size="xl"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!form.customerId || !form.chiefComplaint || create.isPending}
            onClick={() =>
              create.mutate({
                ...form,
                estimatedFee: form.estimatedFee ? Number(form.estimatedFee) : undefined,
                intentionLevel: form.intentionLevel || undefined,
              })
            }
          >
            保存
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">客户 *</label>
          <select
            className="input"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          >
            <option value="">请选择客户</option>
            {customers?.list.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone} {c.source ? `(${c.source})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">主诉 *</label>
          <textarea
            className="input min-h-[80px]"
            value={form.chiefComplaint}
            onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
            placeholder="请填写客户主要诉求"
          />
        </div>
        <div className="col-span-2">
          <label className="label">牙科既往史</label>
          <textarea
            className="input min-h-[60px]"
            value={form.dentalHistory}
            onChange={(e) => setForm({ ...form, dentalHistory: e.target.value })}
            placeholder="是否有拔牙史、种植牙史、过敏史等"
          />
        </div>
        <div>
          <label className="label">初步诊断</label>
          <input
            className="input"
            value={form.diagnosis}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            placeholder="如：牙周炎、龋齿等"
          />
        </div>
        <div>
          <label className="label">预估费用 (元)</label>
          <input
            type="number"
            className="input"
            value={form.estimatedFee}
            onChange={(e) => setForm({ ...form, estimatedFee: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">治疗方案</label>
          <textarea
            className="input min-h-[80px]"
            value={form.treatmentPlan}
            onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
            placeholder="请给出具体的治疗建议方案"
          />
        </div>
        <div>
          <label className="label">客户意向等级</label>
          <select
            className="input"
            value={form.intentionLevel}
            onChange={(e) => setForm({ ...form, intentionLevel: e.target.value })}
          >
            <option value="">未评估</option>
            <option value="A">A - 强烈意向（近期有决策）</option>
            <option value="B">B - 一般意向（需要继续跟进）</option>
            <option value="C">C - 意向弱（价格敏感/观望）</option>
          </select>
        </div>
        <div>
          <label className="label">线索质量</label>
          <select
            className="input"
            value={form.leadQuality}
            onChange={(e) => setForm({ ...form, leadQuality: e.target.value as LeadQuality })}
          >
            <option value="HIGH">高意向</option>
            <option value="MEDIUM">中意向</option>
            <option value="LOW">低意向</option>
            <option value="POTENTIAL">待评估</option>
          </select>
        </div>
        {qualityHint && (
          <div className={`col-span-2 p-3 rounded-lg text-sm ${
            qualityHint.type === "success" ? "bg-emerald-50 text-emerald-700" :
            qualityHint.type === "warning" ? "bg-amber-50 text-amber-700" :
            "bg-slate-50 text-slate-600"
          }`}>
            {qualityHint.text}
          </div>
        )}
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="createLead"
            checked={form.createLead}
            onChange={(e) => setForm({ ...form, createLead: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="createLead" className="text-sm text-slate-700">
            保存后自动创建线索并进入跟进流程
          </label>
        </div>
      </div>
    </Modal>
  );
}
