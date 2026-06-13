"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import {
  LeadQualityBadge,
  LeadStatusBadge,
  PaymentStatusBadge,
  Badge,
} from "@/components/ui/Badges";
import type { LeadQuality, LeadStatus, FollowUpMethod, PaymentStatus } from "@prisma/client";
import dayjs from "dayjs";

type TabKey = "followups" | "plans" | "payments" | "logs";

export default function LeadDetailPage({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data: lead, isLoading, refetch } = api.lead.detail.useQuery(id);
  const { data: stages } = api.stage.list.useQuery();
  const { data: users } = api.user.list.useQuery();
  const me = api.user.me.useQuery();

  const [tab, setTab] = useState<TabKey>("followups");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null);

  const updateLead = api.lead.update.useMutation({
    onSuccess: () => {
      setShowEditModal(false);
      refetch();
    },
  });

  if (isLoading || !lead) {
    return <div className="text-center py-20 text-slate-400">加载中…</div>;
  }

  const totalPaid = lead.payments.reduce(
    (s, p) => s + Number(p.paidAmount),
    0
  );
  const totalDue = lead.payments.reduce(
    (s, p) => s + Number(p.totalAmount),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="btn-secondary">← 返回列表</button>
        <h2 className="text-xl font-bold text-slate-800">{lead.title}</h2>
        <LeadQualityBadge quality={lead.quality} />
        <LeadStatusBadge status={lead.status} />
        {lead.isAnomaly && <Badge variant="danger">异常</Badge>}
        <div className="ml-auto flex gap-2 flex-wrap">
          <button className="btn-secondary" onClick={() => setShowPlanModal(true)}>
            + 新建回访
          </button>
          <button className="btn-secondary" onClick={() => setShowPaymentModal(true)}>
            + 新增回款
          </button>
          <button className="btn-primary" onClick={() => setShowEditModal(true)}>
            修改线索
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 text-xs mb-1">预估金额</div>
                  <div className="text-xl font-bold text-slate-800">
                    ¥{(Number(lead.estimatedAmount) || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">已回款</div>
                  <div className="text-xl font-bold text-emerald-600">
                    ¥{totalPaid.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">待回款</div>
                  <div className="text-xl font-bold text-amber-600">
                    ¥{(totalDue - totalPaid).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">跟进次数</div>
                  <div className="text-xl font-bold text-slate-800">
                    {lead.followUpCount}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-slate-500">阶段：</span>
                  <span className="font-medium">
                    {lead.stage?.name ?? "未设置"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">责任人：</span>
                  <span className="font-medium">
                    {lead.assignedTo?.name ?? "未分配"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">上次跟进：</span>
                  <span className="font-medium">
                    {lead.lastFollowAt
                      ? dayjs(lead.lastFollowAt).format("MM-DD HH:mm")
                      : "从未跟进"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">下次回访：</span>
                  <span className="font-medium">
                    {lead.nextFollowAt
                      ? dayjs(lead.nextFollowAt).format("MM-DD HH:mm")
                      : "未安排"}
                  </span>
                </div>
              </div>
              {lead.description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-slate-500 text-xs mb-2">线索描述</div>
                  <div className="text-slate-700 whitespace-pre-wrap">{lead.description}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex gap-1 border-b border-slate-200 -mb-4">
                {[
                  { k: "followups", label: `跟进记录 (${lead.followUpPlans.filter(p => p.isCompleted).length})` },
                  { k: "plans", label: `回访计划 (${lead.followUpPlans.filter(p => !p.isCompleted).length})` },
                  { k: "payments", label: `回款 (${lead.payments.length})` },
                  { k: "logs", label: `操作日志 (${lead.logs.length})` },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k as TabKey)}
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
              {tab === "followups" && (
                <div className="space-y-3">
                  {lead.followUpPlans.filter(p => p.isCompleted).length === 0 ? (
                    <div className="text-center py-12 text-slate-400">暂无跟进记录</div>
                  ) : (
                    lead.followUpPlans
                      .filter(p => p.isCompleted)
                      .map((plan) => (
                        <div key={plan.id} className="p-4 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="success">已完成</Badge>
                              <span className="text-xs text-slate-500">
                                计划：{dayjs(plan.planDate).format("YYYY-MM-DD HH:mm")}
                              </span>
                              <span className="text-xs text-slate-500">
                                完成：{plan.completedAt ? dayjs(plan.completedAt).format("YYYY-MM-DD HH:mm") : ""}
                              </span>
                              <Badge variant="info">{methodText(plan.method)}</Badge>
                            </div>
                          </div>
                          <div className="text-sm mb-2 text-slate-700">
                            <b>计划内容：</b>{plan.content}
                          </div>
                          <div className="text-sm text-slate-700 p-3 bg-emerald-50 rounded-lg">
                            <b>跟进结果：</b>{plan.result}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {tab === "plans" && (
                <div className="space-y-3">
                  {lead.followUpPlans.filter(p => !p.isCompleted).length === 0 ? (
                    <div className="text-center py-12 text-slate-400">暂无待执行的回访计划</div>
                  ) : (
                    lead.followUpPlans
                      .filter(p => !p.isCompleted)
                      .map((plan) => (
                        <div key={plan.id} className="p-4 rounded-lg border border-slate-200 hover:shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="warning">待执行</Badge>
                              <span className="text-sm font-medium">
                                {dayjs(plan.planDate).format("YYYY-MM-DD HH:mm")}
                              </span>
                              <Badge variant="info">{methodText(plan.method)}</Badge>
                            </div>
                            <button
                              className="btn-primary !py-1 !px-3 text-xs"
                              onClick={() => setShowCompleteModal(plan.id)}
                            >
                              标记完成
                            </button>
                          </div>
                          <div className="text-sm text-slate-700">{plan.content}</div>
                          <div className="text-xs text-slate-500 mt-2">
                            创建人：{plan.createdBy?.name ?? "系统"} · 状态：待执行
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {tab === "payments" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2">项目</th>
                        <th className="text-right px-3 py-2">应收</th>
                        <th className="text-right px-3 py-2">已收</th>
                        <th className="text-right px-3 py-2">未收</th>
                        <th className="text-left px-3 py-2">状态</th>
                        <th className="text-left px-3 py-2">到期日</th>
                        <th className="text-right px-3 py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lead.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-3">{p.itemName}</td>
                          <td className="px-3 py-3 text-right">
                            ¥{Number(p.totalAmount).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-emerald-600 font-medium">
                            ¥{Number(p.paidAmount).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-red-600">
                            ¥{(Number(p.totalAmount) - Number(p.paidAmount)).toLocaleString()}
                          </td>
                          <td className="px-3 py-3">
                            <PaymentStatusBadge status={p.status} />
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">
                            {p.dueDate ? dayjs(p.dueDate).format("MM-DD") : "-"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {p.status !== "PAID" && p.status !== "REFUNDED" && (
                              <button
                                className="btn-secondary !py-1 !px-3 text-xs"
                                onClick={() => setShowAddPaymentModal(p.id)}
                              >
                                追加回款
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!lead.payments.length && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            暂无回款记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "logs" && (
                <div className="space-y-3">
                  {lead.logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">暂无操作日志</div>
                  ) : (
                    lead.logs.map((log) => (
                      <div key={log.id} className="p-4 rounded-lg bg-slate-50 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.action === "CREATE" ? "info" : log.action === "DELETE" ? "danger" : "default"}>
                              {actionText(log.action)}
                            </Badge>
                            <span className="font-medium">{log.operator?.name ?? "系统"}</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")}
                          </span>
                        </div>
                        {log.detail && (
                          <div className="text-slate-700 mb-2">{log.detail}</div>
                        )}
                        {log.fieldName && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-200 text-xs">
                            <div>
                              <div className="text-slate-500 mb-1">
                                字段：{log.fieldName}
                              </div>
                              {log.oldValue !== undefined && log.oldValue !== null && (
                                <div className="text-red-600">
                                  旧值：{formatValue(log.oldValue)}
                                </div>
                              )}
                              {log.newValue !== undefined && log.newValue !== null && (
                                <div className="text-emerald-600">
                                  新值：{formatValue(log.newValue)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">关联客户</h3>
            </div>
            <div className="card-body space-y-3 text-sm">
              <Link
                href={`/customers/${lead.customerId}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-medium text-primary-700">{lead.customer?.name}</div>
                  <div className="text-xs text-slate-500">{lead.customer?.phone}</div>
                </div>
                <span className="ml-auto text-slate-400">→</span>
              </Link>
              <div>
                <span className="text-slate-500">性别/年龄：</span>
                <span className="font-medium">
                  {lead.customer?.gender ?? "-"} / {lead.customer?.age ?? "-"} 岁
                </span>
              </div>
              <div>
                <span className="text-slate-500">邮箱：</span>
                <span className="font-medium">{lead.customer?.email ?? "-"}</span>
              </div>
              <div>
                <span className="text-slate-500">来源：</span>
                <span className="font-medium">{lead.customer?.source ?? "-"}</span>
              </div>
              {lead.customer?.tags?.length ? (
                <div>
                  <div className="text-slate-500 text-xs mb-2">标签</div>
                  <div className="flex flex-wrap gap-1">
                    {lead.customer.tags.map((t: any) => (
                      <span
                        key={t.tag.id}
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: t.tag.color }}
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {lead.customer?.remark && (
                <div>
                  <div className="text-slate-500 text-xs mb-1">客户备注</div>
                  <div className="text-slate-700 text-xs whitespace-pre-wrap">
                    {lead.customer.remark}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">线索信息</h3>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div>
                <span className="text-slate-500">创建人：</span>
                <span className="font-medium">{lead.createdBy?.name ?? "-"}</span>
              </div>
              <div>
                <span className="text-slate-500">创建时间：</span>
                <span className="font-medium">
                  {dayjs(lead.createdAt).format("YYYY-MM-DD HH:mm")}
                </span>
              </div>
              <div>
                <span className="text-slate-500">更新时间：</span>
                <span className="font-medium">
                  {dayjs(lead.updatedAt).format("YYYY-MM-DD HH:mm")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="修改线索"
        size="lg"
      >
        <EditLeadForm
          lead={lead}
          stages={stages ?? []}
          users={users ?? []}
          onClose={() => setShowEditModal(false)}
          onDone={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      </Modal>

      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="新增回款单"
        size="lg"
      >
        <NewPaymentForm
          lead={lead}
          onClose={() => setShowPaymentModal(false)}
          onDone={() => {
            setShowPaymentModal(false);
            refetch();
          }}
        />
      </Modal>

      {showAddPaymentModal && (
        <AddPaymentModal
          paymentId={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(null)}
          onDone={() => {
            setShowAddPaymentModal(null);
            refetch();
          }}
        />
      )}

      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="新建回访计划"
        size="lg"
      >
        <NewPlanForm
          leadId={lead.id}
          defaultAssignee={me.data?.id}
          onClose={() => setShowPlanModal(false)}
          onDone={() => {
            setShowPlanModal(false);
            refetch();
          }}
        />
      </Modal>

      {showCompleteModal && (
        <CompletePlanModal
          planId={showCompleteModal}
          onClose={() => setShowCompleteModal(null)}
          onDone={() => {
            setShowCompleteModal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function EditLeadForm({
  lead, stages, users, onClose, onDone,
}: {
  lead: any;
  stages: any[];
  users: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    title: lead.title,
    description: lead.description ?? "",
    quality: lead.quality as LeadQuality,
    status: lead.status as LeadStatus,
    estimatedAmount: lead.estimatedAmount ? String(lead.estimatedAmount) : "",
    stageId: lead.stageId ?? "",
    assignedToId: lead.assignedToId ?? "",
  });
  const mut = api.lead.update.useMutation({ onSuccess: onDone });

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
          <label className="label">状态</label>
          <select className="input" value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value as LeadStatus })}>
            <option value="NEW">新建</option>
            <option value="CONTACTING">跟进中</option>
            <option value="APPOINTED">已预约</option>
            <option value="VISITED">已到店</option>
            <option value="TREATING">治疗中</option>
            <option value="CLOSED_WON">已成交</option>
            <option value="CLOSED_LOST">已流失</option>
            <option value="SUSPENDED">已暂缓</option>
          </select>
        </div>
        <div>
          <label className="label">预估金额</label>
          <input type="number" className="input" value={f.estimatedAmount}
            onChange={(e) => setF({ ...f, estimatedAmount: e.target.value })} />
        </div>
        <div>
          <label className="label">阶段</label>
          <select className="input" value={f.stageId}
            onChange={(e) => setF({ ...f, stageId: e.target.value })}>
            <option value="">未设置</option>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">责任人</label>
          <select className="input" value={f.assignedToId}
            onChange={(e) => setF({ ...f, assignedToId: e.target.value })}>
            <option value="">未分配</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button
          className="btn-primary"
          disabled={!f.title || mut.isPending}
          onClick={() => mut.mutate({
            id: lead.id,
            title: f.title,
            description: f.description || undefined,
            quality: f.quality,
            status: f.status,
            estimatedAmount: f.estimatedAmount ? Number(f.estimatedAmount) : undefined,
            stageId: f.stageId || undefined,
            assignedToId: f.assignedToId || undefined,
          })}
        >
          保存修改
        </button>
      </div>
    </div>
  );
}

function NewPaymentForm({
  lead, onClose, onDone,
}: {
  lead: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const [f, setF] = useState({
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
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button
          className="btn-primary"
          disabled={!f.itemName || !f.totalAmount || mut.isPending}
          onClick={() => mut.mutate({
            customerId: lead.customerId,
            leadId: lead.id,
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
    </div>
  );
}

function AddPaymentModal({
  paymentId, onClose, onDone,
}: {
  paymentId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    amount: "",
    paymentMethod: "",
    remark: "",
  });
  const mut = api.payment.addPayment.useMutation({ onSuccess: onDone });

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="追加回款"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="label">回款金额 *</label>
          <input type="number" className="input" value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </div>
        <div>
          <label className="label">付款方式</label>
          <select className="input" value={f.paymentMethod}
            onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>
            <option value="">请选择</option>
            <option value="现金">现金</option>
            <option value="微信">微信</option>
            <option value="支付宝">支付宝</option>
            <option value="银行卡">银行卡</option>
            <option value="医保">医保</option>
            <option value="分期">分期</option>
          </select>
        </div>
        <div>
          <label className="label">备注</label>
          <textarea className="input min-h-[60px]" value={f.remark}
            onChange={(e) => setF({ ...f, remark: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!f.amount || mut.isPending}
            onClick={() => mut.mutate({
              id: paymentId,
              amount: Number(f.amount),
              paymentMethod: f.paymentMethod || undefined,
              remark: f.remark || undefined,
            })}
          >
            确认回款
          </button>
        </div>
      </div>
    </Modal>
  );
}

function NewPlanForm({
  leadId, defaultAssignee, onClose, onDone,
}: {
  leadId: string;
  defaultAssignee?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    planDate: dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm"),
    method: "PHONE" as FollowUpMethod,
    content: "",
  });
  const mut = api.followUp.plans.create.useMutation({ onSuccess: onDone });

  return (
    <div className="space-y-4">
      <div>
        <label className="label">计划日期 *</label>
        <input type="datetime-local" className="input" value={f.planDate}
          onChange={(e) => setF({ ...f, planDate: e.target.value })} />
      </div>
      <div>
        <label className="label">回访方式</label>
        <select className="input" value={f.method}
          onChange={(e) => setF({ ...f, method: e.target.value as FollowUpMethod })}>
          <option value="PHONE">电话</option>
          <option value="WECHAT">微信</option>
          <option value="SMS">短信</option>
          <option value="EMAIL">邮件</option>
          <option value="VISIT">到店</option>
          <option value="OTHER">其他</option>
        </select>
      </div>
      <div>
        <label className="label">回访内容 *</label>
        <textarea className="input min-h-[80px]" value={f.content}
          onChange={(e) => setF({ ...f, content: e.target.value })}
          placeholder="请填写本次回访的内容和注意事项" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="btn-secondary" onClick={onClose}>取消</button>
        <button
          className="btn-primary"
          disabled={!f.planDate || !f.content || mut.isPending}
          onClick={() => mut.mutate({
            leadId,
            planDate: new Date(f.planDate),
            method: f.method,
            content: f.content,
          })}
        >
          创建回访计划
        </button>
      </div>
    </div>
  );
}

function CompletePlanModal({
  planId, onClose, onDone,
}: {
  planId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [result, setResult] = useState("");
  const mut = api.followUp.plans.complete.useMutation({ onSuccess: onDone });

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="标记回访完成"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="label">回访结果 *</label>
          <textarea
            className="input min-h-[120px]"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="请填写本次回访的详细结果，包括客户反馈、下一步计划等"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button
            className="btn-primary"
            disabled={!result.trim() || mut.isPending}
            onClick={() => mut.mutate({ id: planId, result: result.trim() })}
          >
            确认完成
          </button>
        </div>
      </div>
    </Modal>
  );
}

function methodText(method: string) {
  return {
    PHONE: "电话", WECHAT: "微信", SMS: "短信",
    EMAIL: "邮件", VISIT: "到店", OTHER: "其他",
  }[method] ?? method;
}

function actionText(action: string) {
  return { CREATE: "创建", UPDATE: "更新", DELETE: "删除" }[action] ?? action;
}

function formatValue(v: any) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
