"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { CustomerModal } from "@/components/ui/CustomerModal";
import {
  LeadQualityBadge,
  LeadStatusBadge,
  PaymentStatusBadge,
  IntentionBadge,
  Badge,
} from "@/components/ui/Badges";
import type { LeadQuality } from "@prisma/client";
import dayjs from "dayjs";

export default function CustomerDetailPage({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data: customer, isLoading, refetch } = api.customer.detail.useQuery(id);
  const { data: tags } = api.tag.list.useQuery();
  const [showEdit, setShowEdit] = useState(false);
  const [showConsult, setShowConsult] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [tab, setTab] = useState<"consult" | "lead" | "payment" | "info">("info");

  if (isLoading || !customer) {
    return <div className="text-center py-20 text-slate-400">加载中…</div>;
  }

  const totalPaid = customer.payments.reduce(
    (s, p) => s + Number(p.paidAmount),
    0
  );
  const totalDue = customer.payments.reduce(
    (s, p) => s + Number(p.totalAmount),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-secondary">← 返回列表</button>
        <h2 className="text-xl font-bold text-slate-800">{customer.name}</h2>
        <span className="text-slate-500 text-sm">{customer.phone}</span>
        {customer.tags.map((t) => (
          <span
            key={t.tag.id}
            className="text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: t.tag.color }}
          >
            {t.tag.name}
          </span>
        ))}
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary" onClick={() => setShowConsult(true)}>
            + 新增咨询
          </button>
          <button className="btn-secondary" onClick={() => setShowLead(true)}>
            + 创建线索
          </button>
          <button className="btn-secondary" onClick={() => setShowPayment(true)}>
            + 创建回款
          </button>
          <button className="btn-primary" onClick={() => setShowEdit(true)}>
            编辑客户
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">客户档案</h3>
          </div>
          <div className="card-body space-y-3 text-sm">
            <InfoRow label="性别/年龄">
              {customer.gender ?? "-"} / {customer.age ?? "-"} 岁
            </InfoRow>
            <InfoRow label="邮箱">{customer.email ?? "-"}</InfoRow>
            <InfoRow label="联系电话">{customer.phone}</InfoRow>
            <InfoRow label="地址">{customer.address ?? "-"}</InfoRow>
            <InfoRow label="来源渠道">
              {customer.source ? (
                <Badge variant="info">{customer.source}</Badge>
              ) : (
                "-"
              )}
            </InfoRow>
            <InfoRow label="建档时间">
              {dayjs(customer.createdAt).format("YYYY-MM-DD HH:mm")}
            </InfoRow>
            <div>
              <div className="text-xs text-slate-500 mb-1">备注</div>
              <div className="text-slate-700 whitespace-pre-wrap">
                {customer.remark ?? "暂无"}
              </div>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header">
            <div className="flex gap-1 border-b border-slate-200 -mb-4">
              {[
                { k: "info", label: "业务概览" },
                { k: "consult", label: `咨询记录 (${customer.consultations.length})` },
                { k: "lead", label: `跟进线索 (${customer.leads.length})` },
                { k: "payment", label: `回款记录 (${customer.payments.length})` },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k as typeof tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                    tab === t.k
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {tab === "info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <KPI label="咨询次数" value={customer.consultations.length} icon="📝" />
                  <KPI label="进行中线索" value={customer.leads.filter((l) => !["CLOSED_WON", "CLOSED_LOST", "SUSPENDED"].includes(l.status)).length} icon="🎯" />
                  <KPI label="总应收" value={`¥${totalDue.toLocaleString()}`} icon="📊" />
                  <KPI label="总实收" value={`¥${totalPaid.toLocaleString()}`} icon="💰" highlight={true} />
                </div>
                {customer.leads.length ? (
                  <div>
                    <div className="text-sm font-medium mb-3">当前跟进中的线索</div>
                    <div className="space-y-2">
                      {customer.leads
                        .filter((l) => !["CLOSED_WON", "CLOSED_LOST"].includes(l.status))
                        .map((l) => (
                          <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-3">
                              <LeadQualityBadge quality={l.quality} />
                              <div>
                                <div className="font-medium">{l.title}</div>
                                <div className="text-xs text-slate-500">
                                  阶段：{l.stage?.name ?? "未设置"} · 下次回访：
                                  {l.nextFollowAt
                                    ? dayjs(l.nextFollowAt).format("MM-DD HH:mm")
                                    : "未安排"}
                                </div>
                              </div>
                            </div>
                            <Link href={`/leads/${l.id}`} className="btn-primary !py-1 !px-3 text-xs">
                              去跟进 →
                            </Link>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {tab === "consult" && (
              <div className="space-y-3">
                {customer.consultations.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg border border-slate-200 hover:shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {dayjs(r.consultationDate).format("YYYY-MM-DD HH:mm")}
                        </span>
                        <IntentionBadge level={r.intentionLevel} />
                        <span className="text-xs text-slate-500">填写：{r.createdBy?.name}</span>
                      </div>
                    </div>
                    <div className="text-sm grid grid-cols-2 gap-3">
                      <div><b>主诉：</b>{r.chiefComplaint}</div>
                      <div><b>诊断：</b>{r.diagnosis ?? "-"}</div>
                      <div className="col-span-2"><b>方案：</b>{r.treatmentPlan ?? "-"}</div>
                      {r.estimatedFee && (
                        <div><b>预估费用：</b>¥{Number(r.estimatedFee).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                ))}
                {!customer.consultations.length && (
                  <div className="text-center py-12 text-slate-400">暂无咨询记录</div>
                )}
              </div>
            )}

            {tab === "lead" && (
              <div className="space-y-3">
                {customer.leads.map((l) => (
                  <div key={l.id} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <LeadQualityBadge quality={l.quality} />
                        <LeadStatusBadge status={l.status} />
                        <span className="font-medium">{l.title}</span>
                      </div>
                      <Link href={`/leads/${l.id}`} className="text-xs text-primary-600 hover:underline">详情 →</Link>
                    </div>
                    <div className="text-xs text-slate-500 grid grid-cols-3 gap-3">
                      <div>阶段：{l.stage?.name ?? "-"}</div>
                      <div>责任人：{l.assignedTo?.name ?? "未分配"}</div>
                      <div>回访次数：{l.followUpCount}</div>
                      <div>预估金额：¥{(Number(l.estimatedAmount) || 0).toLocaleString()}</div>
                      <div>已回款：¥{l.payments.reduce((s, p) => s + Number(p.paidAmount), 0).toLocaleString()}</div>
                      <div>下次回访：{l.nextFollowAt ? dayjs(l.nextFollowAt).format("MM-DD HH:mm") : "未安排"}</div>
                    </div>
                  </div>
                ))}
                {!customer.leads.length && (
                  <div className="text-center py-12 text-slate-400">暂无线索</div>
                )}
              </div>
            )}

            {tab === "payment" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2">项目</th>
                      <th className="text-left px-3 py-2">应收</th>
                      <th className="text-left px-3 py-2">已收</th>
                      <th className="text-left px-3 py-2">未收</th>
                      <th className="text-left px-3 py-2">状态</th>
                      <th className="text-left px-3 py-2">创建</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2">{p.itemName}</td>
                        <td className="px-3 py-2">¥{Number(p.totalAmount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-emerald-600">¥{Number(p.paidAmount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-red-600">¥{(Number(p.totalAmount) - Number(p.paidAmount)).toLocaleString()}</td>
                        <td className="px-3 py-2"><PaymentStatusBadge status={p.status} /></td>
                        <td className="px-3 py-2 text-xs text-slate-500">
                          {dayjs(p.createdAt).format("MM-DD")}
                        </td>
                      </tr>
                    ))}
                    {!customer.payments.length && (
                      <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无回款记录</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <CustomerModal
          open={true}
          onClose={() => setShowEdit(false)}
          tags={tags ?? []}
          onDone={() => {
            setShowEdit(false);
            refetch();
          }}
          initial={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            gender: customer.gender,
            age: customer.age,
            email: customer.email,
            address: customer.address,
            source: customer.source,
            remark: customer.remark,
            tagIds: customer.tags.map((t: any) => t.tagId),
          }}
        />
      )}

      <Modal
        open={showConsult}
        onClose={() => setShowConsult(false)}
        title="新增咨询记录"
        size="lg"
        footer={<button className="btn-secondary" onClick={() => setShowConsult(false)}>关闭</button>}
      >
        <QuickConsultForm
          customerId={customer.id}
          onDone={() => {
            setShowConsult(false);
            refetch();
          }}
        />
      </Modal>

      <Modal
        open={showLead}
        onClose={() => setShowLead(false)}
        title="创建线索"
        footer={<button className="btn-secondary" onClick={() => setShowLead(false)}>关闭</button>}
      >
        <QuickLeadForm
          customerId={customer.id}
          onDone={() => {
            setShowLead(false);
            refetch();
          }}
        />
      </Modal>

      <Modal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        title="创建回款单"
        footer={<button className="btn-secondary" onClick={() => setShowPayment(false)}>关闭</button>}
      >
        <QuickPaymentForm
          customerId={customer.id}
          leads={customer.leads.map((l) => ({ id: l.id, title: l.title }))}
          onDone={() => {
            setShowPayment(false);
            refetch();
          }}
        />
      </Modal>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 max-w-[60%] text-right">{children}</span>
    </div>
  );
}

function KPI({
  label, value, icon, highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? "bg-emerald-50" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">{label}</span>
        <span>{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-emerald-700" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}

function QuickConsultForm({
  customerId, onDone,
}: { customerId: string; onDone: () => void }) {
  const [f, setF] = useState({
    chiefComplaint: "",
    diagnosis: "",
    treatmentPlan: "",
    estimatedFee: "",
    intentionLevel: "",
    createLead: true,
    leadQuality: "POTENTIAL" as LeadQuality,
  });
  const mut = api.consultation.create.useMutation({ onSuccess: onDone });
  return (
    <div className="space-y-4">
      <div>
        <label className="label">主诉 *</label>
        <textarea className="input min-h-[60px]" value={f.chiefComplaint}
          onChange={(e) => setF({ ...f, chiefComplaint: e.target.value })} />
      </div>
      <div>
        <label className="label">诊断</label>
        <input className="input" value={f.diagnosis}
          onChange={(e) => setF({ ...f, diagnosis: e.target.value })} />
      </div>
      <div>
        <label className="label">治疗方案</label>
        <textarea className="input min-h-[60px]" value={f.treatmentPlan}
          onChange={(e) => setF({ ...f, treatmentPlan: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">预估费用</label>
          <input type="number" className="input" value={f.estimatedFee}
            onChange={(e) => setF({ ...f, estimatedFee: e.target.value })} />
        </div>
        <div>
          <label className="label">意向等级</label>
          <select className="input" value={f.intentionLevel}
            onChange={(e) => setF({ ...f, intentionLevel: e.target.value })}>
            <option value="">未评估</option>
            <option value="A">A 强烈</option>
            <option value="B">B 一般</option>
            <option value="C">C 弱</option>
          </select>
        </div>
        <div>
          <label className="label">线索质量</label>
          <select className="input" value={f.leadQuality}
            onChange={(e) => setF({ ...f, leadQuality: e.target.value as LeadQuality })}>
            <option value="HIGH">高意向</option>
            <option value="MEDIUM">中意向</option>
            <option value="LOW">低意向</option>
            <option value="POTENTIAL">待评估</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4"
              checked={f.createLead}
              onChange={(e) => setF({ ...f, createLead: e.target.checked })} />
            自动创建线索
          </label>
        </div>
      </div>
      <button
        className="btn-primary w-full"
        disabled={!f.chiefComplaint || mut.isPending}
        onClick={() => mut.mutate({
          customerId,
          chiefComplaint: f.chiefComplaint,
          diagnosis: f.diagnosis || undefined,
          treatmentPlan: f.treatmentPlan || undefined,
          estimatedFee: f.estimatedFee ? Number(f.estimatedFee) : undefined,
          intentionLevel: f.intentionLevel || undefined,
          createLead: f.createLead,
          leadQuality: f.leadQuality,
        })}
      >
        保存
      </button>
    </div>
  );
}

function QuickLeadForm({
  customerId, onDone,
}: { customerId: string; onDone: () => void }) {
  const [f, setF] = useState({
    title: "",
    description: "",
    quality: "POTENTIAL" as LeadQuality,
    estimatedAmount: "",
  });
  const mut = api.lead.create.useMutation({ onSuccess: onDone });
  return (
    <div className="space-y-4">
      <div>
        <label className="label">线索标题 *</label>
        <input className="input" value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })} />
      </div>
      <div>
        <label className="label">描述</label>
        <textarea className="input min-h-[80px]" value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">质量</label>
          <select className="input" value={f.quality}
            onChange={(e) => setF({ ...f, quality: e.target.value as LeadQuality })}>
            <option value="HIGH">高意向</option>
            <option value="MEDIUM">中意向</option>
            <option value="LOW">低意向</option>
            <option value="POTENTIAL">待评估</option>
          </select>
        </div>
        <div>
          <label className="label">预估金额</label>
          <input type="number" className="input" value={f.estimatedAmount}
            onChange={(e) => setF({ ...f, estimatedAmount: e.target.value })} />
        </div>
      </div>
      <button
        className="btn-primary w-full"
        disabled={!f.title || mut.isPending}
        onClick={() => mut.mutate({
          customerId,
          title: f.title,
          description: f.description || undefined,
          quality: f.quality,
          estimatedAmount: f.estimatedAmount ? Number(f.estimatedAmount) : undefined,
        })}
      >
        创建线索
      </button>
    </div>
  );
}

function QuickPaymentForm({
  customerId, leads, onDone,
}: {
  customerId: string;
  leads: { id: string; title: string }[];
  onDone: () => void;
}) {
  const [f, setF] = useState({
    leadId: "",
    itemName: "",
    totalAmount: "",
    paidAmount: "",
    dueDate: "",
    paymentMethod: "",
    remark: "",
  });
  const mut = api.payment.create.useMutation({ onSuccess: onDone });
  return (
    <div className="space-y-4">
      <div>
        <label className="label">关联线索</label>
        <select className="input" value={f.leadId}
          onChange={(e) => setF({ ...f, leadId: e.target.value })}>
          <option value="">不关联</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">项目名称 *</label>
        <input className="input" value={f.itemName}
          onChange={(e) => setF({ ...f, itemName: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">应收金额 *</label>
          <input type="number" className="input" value={f.totalAmount}
            onChange={(e) => setF({ ...f, totalAmount: e.target.value })} />
        </div>
        <div>
          <label className="label">已收金额</label>
          <input type="number" className="input" value={f.paidAmount}
            onChange={(e) => setF({ ...f, paidAmount: e.target.value })} />
        </div>
        <div>
          <label className="label">到期日</label>
          <input type="date" className="input" value={f.dueDate}
            onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
        </div>
        <div>
          <label className="label">付款方式</label>
          <select className="input" value={f.paymentMethod}
            onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>
            <option value="">未付</option>
            <option value="现金">现金</option>
            <option value="微信">微信</option>
            <option value="支付宝">支付宝</option>
            <option value="银行卡">银行卡</option>
            <option value="医保">医保</option>
            <option value="分期">分期</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">备注</label>
        <textarea className="input min-h-[60px]" value={f.remark}
          onChange={(e) => setF({ ...f, remark: e.target.value })} />
      </div>
      <button
        className="btn-primary w-full"
        disabled={!f.itemName || !f.totalAmount || mut.isPending}
        onClick={() => mut.mutate({
          customerId,
          leadId: f.leadId || undefined,
          itemName: f.itemName,
          totalAmount: Number(f.totalAmount),
          paidAmount: Number(f.paidAmount || 0),
          dueDate: f.dueDate ? new Date(f.dueDate) : undefined,
          paymentMethod: f.paymentMethod || undefined,
          remark: f.remark || undefined,
        })}
      >
        创建回款单
      </button>
    </div>
  );
}
