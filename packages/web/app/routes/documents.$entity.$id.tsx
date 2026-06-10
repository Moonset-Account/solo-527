import { json, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useState } from "react";
import type { ApiResponse, ChangeHistory, Quote, PurchaseRequest, FrameworkAgreement } from "@app/shared";
import { api, formatDate, formatDateTime, formatMoney } from "~/lib/api";
import { ChangeHistoryView } from "~/components/ChangeHistoryView";

type EntityType = "purchase-request" | "quote" | "agreement";

export const loader = async ({ params, request }) => {
  const url = new URL(request.url);
  const entityType = params.entity as EntityType;
  const entityId = params.id;

  let document: any = null;
  let history: ChangeHistory[] = [];
  let relatedQuotes: Quote[] = [];
  let relatedAgreement: FrameworkAgreement | null = null;

  try {
    if (entityType === "purchase-request") {
      const docRes = await api.get<PurchaseRequest>(`/api/purchase-requests/${entityId}`);
      if (docRes.success && docRes.data) document = docRes.data;

      const histRes = await api.get(`/api/purchase-requests/${entityId}/history`);
      if (histRes.success) history = histRes.data || [];

      const quotesRes = await api.get<Quote[]>("/api/quotes", { purchaseRequestId: entityId, pageSize: 50 });
      if (quotesRes.success) relatedQuotes = quotesRes.data || [];
    } else if (entityType === "quote") {
      const docRes = await api.get(`/api/quotes/${entityId}`);
      if (docRes.success && docRes.data) document = docRes.data;

      const histRes = await api.get(`/api/quotes/${entityId}/history`);
      if (histRes.success) history = histRes.data || [];

      if (document?.purchaseRequestId) {
        const prRes = await api.get<PurchaseRequest>(`/api/purchase-requests/${document.purchaseRequestId}`);
        if (prRes.success && prRes.data) relatedAgreement = prRes.data as any;
      }
    } else if (entityType === "agreement") {
      const docRes = await api.get(`/api/agreements/${entityId}`);
      if (docRes.success && docRes.data) document = docRes.data;

      const histRes = await api.get(`/api/agreements/${entityId}/history`);
      if (histRes.success) history = histRes.data || [];
    }
  } catch (e) {}

  const diffRes = await api.get<any>(`/api/agreements/diff/${entityType}/${entityId}`).catch(() => null);

  return json({ entityType, entityId, document, history, relatedQuotes, relatedAgreement, diff: diffRes?.data });
};

const ENTITY_LABELS: Record<EntityType, { label: string; icon: string; color: string }> = {
  "purchase-request": { label: "采购需求单", icon: "📋", color: "from-blue-500 to-indigo-600" },
  "quote": { label: "供应商报价单", icon: "💰", color: "from-emerald-500 to-teal-600" },
  "agreement": { label: "框架协议", icon: "📄", color: "from-purple-500 to-pink-600" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  quoting: "bg-purple-100 text-purple-700",
  comparing: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  ordered: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-slate-100 text-slate-600",
  reviewing: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-slate-100 text-slate-600",
  terminated: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", submitted: "已提交", quoting: "报价中", comparing: "比价中",
  approved: "已批准", ordered: "已下单", completed: "已完成", cancelled: "已取消",
  selected: "已中标", rejected: "已淘汰", reviewing: "审核中",
  active: "生效中", expired: "已过期", terminated: "已终止",
};

export default function DocumentDetail() {
  const { entityType, entityId, document, history, relatedQuotes, relatedAgreement, diff } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"detail" | "history" | "related">("detail");
  const [showDiffModal, setShowDiffModal] = useState(false);

  const meta = ENTITY_LABELS[entityType as EntityType];
  const versionCount = diff?.versionCount || history.length + 1;

  if (!document) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
        <div className="text-6xl mb-4">❓</div>
        <p className="text-xl font-semibold text-slate-700">未找到该单据</p>
        <p className="text-slate-500 mt-2">单据可能已被删除或不存在</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition"
        >
          返回上一页
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div className="flex gap-3">
          {history.length > 0 && (
            <button
              onClick={() => setShowDiffModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-medium hover:bg-amber-100 transition"
            >
              <span>🔍</span> 版本差异对比
            </button>
          )}
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition">
            <span>🖨️</span> 打印
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow hover:shadow-md transition">
            <span>✏️</span> 编辑单据
          </button>
        </div>
      </div>

      <div className={`bg-gradient-to-r ${meta.color} rounded-2xl p-8 text-white shadow-xl overflow-hidden relative`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16"></div>

        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl shadow-inner">
                {meta.icon}
              </div>
              <div>
                <div className="text-white/80 text-sm font-medium">{meta.label}</div>
                <h1 className="text-4xl font-bold tracking-tight mt-1">{document.code}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full">
                    👤 {entityType === "quote" ? document.supplierName : document.projectManagerName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full">
                    📅 创建于 {formatDate(document.createdAt)}
                  </span>
                  {versionCount > 1 && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-400/90 text-amber-950 px-3 py-1 rounded-full font-semibold">
                      📝 共 {versionCount} 个版本
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-5 py-2 rounded-xl text-sm font-bold shadow-lg bg-white/95 ${
                STATUS_COLORS[document.status] || "bg-slate-100 text-slate-700"
              }`}>
                {STATUS_LABELS[document.status] || document.status}
              </span>
              {document.totalAmount !== undefined && (
                <div className="mt-4">
                  <div className="text-white/70 text-sm">{entityType === "agreement" ? "协议总金额" : "单据金额"}</div>
                  <div className="text-4xl font-bold tracking-tight mt-1">{formatMoney(document.totalAmount)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100">
          <div className="flex">
            {[
              { key: "detail", label: "单据详情", icon: "📄" },
              { key: "history", label: `变更历史 (${history.length})`, icon: "📝" },
              { key: "related", label: `关联单据${relatedQuotes.length > 0 ? ` (${relatedQuotes.length})` : ""}`, icon: "🔗" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 bg-blue-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "detail" && (
            <div className="space-y-8">
              {entityType === "purchase-request" && (
                <>
                  <InfoSection title="项目信息">
                    <InfoGrid items={[
                      { label: "项目名称", value: document.projectName, span: 2 },
                      { label: "项目编号", value: document.projectCode },
                      { label: "所属部门", value: document.department },
                      { label: "项目负责人", value: document.projectManagerName },
                      { label: "需求到货日期", value: formatDate(document.requiredDate) },
                    ]} />
                    {document.description && (
                      <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 mb-2">需求描述</div>
                        <p className="text-slate-700 text-sm leading-relaxed">{document.description}</p>
                      </div>
                    )}
                  </InfoSection>

                  <MaterialItemsTable
                    title="采购材料清单"
                    items={document.items.map((it: any) => ({
                      ...it,
                      subtotal: (it.budgetPrice || 0) * it.quantity,
                      priceLabel: it.budgetPrice ? formatMoney(it.budgetPrice) : "-"
                    }))}
                    priceTitle="预算单价"
                    showCategory
                  />
                </>
              )}

              {entityType === "quote" && (
                <>
                  <InfoSection title="报价信息">
                    <InfoGrid items={[
                      { label: "供应商名称", value: document.supplierName, span: 2 },
                      { label: "报价有效期至", value: formatDate(document.validityDate) },
                      { label: "提交时间", value: formatDateTime(document.submittedAt) },
                    ]} />
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: "付款条款", value: document.paymentTerms || "未约定" },
                        { label: "交货条款", value: document.deliveryTerms || "未约定" },
                        { label: "质保期", value: document.warranty || "未约定" },
                      ].map((term, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="text-xs text-slate-500 mb-1">{term.label}</div>
                          <div className="text-sm font-medium text-slate-700">{term.value}</div>
                        </div>
                      ))}
                    </div>
                    {relatedAgreement && (
                      <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-xs font-semibold text-blue-600 mb-1">🔗 关联采购需求</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-blue-800">
                              {(relatedAgreement as any).code} - {(relatedAgreement as any).projectName}
                            </div>
                            <div className="text-xs text-blue-600 mt-0.5">
                              由 {(relatedAgreement as any).projectManagerName} 提交
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/documents/purchase-request/${document.purchaseRequestId}`)}
                            className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                          >
                            查看 →
                          </button>
                        </div>
                      </div>
                    )}
                  </InfoSection>

                  <MaterialItemsTable
                    title="报价明细清单"
                    items={document.items.map((it: any) => ({
                      ...it,
                      priceLabel: formatMoney(it.unitPrice),
                      deliveryDate: it.deliveryDate ? formatDate(it.deliveryDate) : undefined
                    }))}
                    priceTitle="报价单价"
                    showDelivery
                  />

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                    <div className="flex items-end justify-between flex-wrap gap-4">
                      <div>
                        <div className="text-emerald-800 text-sm font-semibold">💰 报价汇总</div>
                        <div className="text-xs text-emerald-600 mt-1">
                          共 {document.items.length} 项材料，合计数量 {document.items.reduce((s: number, i: any) => s + i.quantity, 0)} 件
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end gap-3 text-sm">
                          <span className="text-emerald-700">报价小计：</span>
                          <span className="font-semibold text-emerald-800">{formatMoney(document.totalAmount)}</span>
                        </div>
                        {document.taxRate !== undefined && (
                          <div className="flex items-center justify-end gap-3 text-sm">
                            <span className="text-emerald-700">税额 ({(document.taxRate * 100).toFixed(0)}%)：</span>
                            <span className="font-semibold text-emerald-800">{formatMoney(document.taxAmount || 0)}</span>
                          </div>
                        )}
                        {document.totalWithTax !== undefined && (
                          <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-200">
                            <span className="text-emerald-800 font-bold text-lg">含税总价：</span>
                            <span className="font-bold text-emerald-900 text-2xl">{formatMoney(document.totalWithTax)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {document.remark && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="text-xs font-semibold text-amber-700 mb-1">💬 供应商备注</div>
                      <p className="text-amber-900 text-sm">{document.remark}</p>
                    </div>
                  )}
                </>
              )}

              {entityType === "agreement" && (
                <>
                  <InfoSection title="协议信息">
                    <InfoGrid items={[
                      { label: "协议名称", value: document.name, span: 2 },
                      { label: "协议编号", value: document.code },
                      { label: "供应商", value: document.supplierName },
                      { label: "协议开始日期", value: formatDate(document.startDate) },
                      { label: "协议结束日期", value: formatDate(document.endDate) },
                    ]} />
                    {document.terms && (
                      <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 mb-2">协议条款</div>
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{document.terms}</p>
                      </div>
                    )}
                  </InfoSection>

                  <MaterialItemsTable
                    title="协议价材料清单"
                    items={document.items.map((it: any) => ({
                      ...it,
                      name: it.name,
                      quantity: it.maxQuantity || "-",
                      unitPrice: it.unitPrice,
                      priceLabel: formatMoney(it.unitPrice),
                      remark: `范围: ${it.minQuantity || 0} ~ ${it.maxQuantity || "∞"}`
                    }))}
                    priceTitle="协议单价"
                    showCategory={false}
                  />
                </>
              )}

              {document.attachments?.length > 0 && (
                <InfoSection title="附件资料">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {document.attachments.map((att: any, idx: number) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all"
                      >
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                          📄
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800 truncate">{att.originalName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {(att.size / 1024).toFixed(1)} KB · {formatDate(att.uploadedAt)}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </InfoSection>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {history.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="font-semibold text-amber-900">保留框架协议、采购需求、供应商报价的前后变化</p>
                      <p className="text-sm text-amber-800 mt-1">
                        以下为该单据自创建以来的所有关键字段变更记录，共 {history.length} 次修改，方便月底核对差异。
                        所有变更均不可删除，确保可追溯。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <ChangeHistoryView history={history as ChangeHistory[]} />
            </div>
          )}

          {activeTab === "related" && (
            <div className="space-y-6">
              {entityType === "purchase-request" && relatedQuotes.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">💰</span>
                    关联供应商报价 ({relatedQuotes.length} 份)
                  </h3>
                  <div className="space-y-4">
                    {relatedQuotes
                      .slice()
                      .sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0))
                      .map((quote, idx) => (
                        <div
                          key={quote.id}
                          className={`p-5 rounded-2xl border-2 transition-all hover:shadow-md cursor-pointer ${
                            idx === 0
                              ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300"
                              : "bg-white border-slate-200"
                          }`}
                          onClick={() => navigate(`/documents/quote/${quote.id}`)}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white ${
                                idx === 0
                                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                  : "bg-gradient-to-br from-slate-400 to-slate-500"
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-800 text-lg">{quote.supplierName}</span>
                                  {idx === 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                                      🏆 最低报价
                                    </span>
                                  )}
                                  {document.selectedQuoteId === quote.id && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                                      ✓ 已中标
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                  <span className="font-mono">{quote.code}</span>
                                  <span className="mx-2">·</span>
                                  <span>{quote.items.length} 项材料</span>
                                  <span className="mx-2">·</span>
                                  <span>提交于 {formatDate(quote.submittedAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-slate-800 tracking-tight">
                                {formatMoney(quote.totalAmount || 0)}
                              </div>
                              {idx > 0 && (
                                <div className="text-xs text-orange-600 font-medium mt-1">
                                  高出最低 {formatMoney((quote.totalAmount || 0) - (relatedQuotes[0].totalAmount || 0))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {entityType === "purchase-request" && relatedQuotes.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-5xl mb-3">⏳</div>
                  <p className="font-medium">暂无关联的供应商报价</p>
                  <p className="text-sm">等待供应商提交报价后即可查看比价</p>
                </div>
              )}

              {entityType !== "purchase-request" && (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-5xl mb-3">🔗</div>
                  <p className="font-medium">暂无可展示的关联单据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">🔍 版本差异对比视图</h3>
                <p className="text-sm text-slate-500 mt-1">单据编号：{document.code} · 共 {versionCount} 个版本</p>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="font-semibold text-blue-900">月底核对差异说明</p>
                    <p className="text-sm text-blue-800 mt-1">
                      左侧显示各版本的关键变更节点，右侧展示变更明细。可核对采购需求从创建到完成的全过程，
                      以及供应商报价、框架协议的每一次调整，确保差异有据可查。
                    </p>
                  </div>
                </div>
              </div>
              <ChangeHistoryView history={history as ChangeHistory[]} />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
        <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500"></span>
        {title}
      </h3>
      <div className="pl-4">{children}</div>
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string; span?: number }[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {items.map((item, idx) => (
        <div key={idx} className={item.span === 2 ? "md:col-span-2" : ""}>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{item.label}</div>
          <div className="text-base font-medium text-slate-800">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function MaterialItemsTable({
  title,
  items,
  priceTitle,
  showCategory,
  showDelivery
}: {
  title: string;
  items: any[];
  priceTitle: string;
  showCategory?: boolean;
  showDelivery?: boolean;
}) {
  const total = items.reduce((s, it) => s + (it.subtotal || it.unitPrice * (typeof it.quantity === "number" ? it.quantity : 0) || 0), 0);
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2 justify-between">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500"></span>
          {title}
        </span>
        <span className="text-sm font-medium text-slate-500">共 {items.length} 项</span>
      </h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 ml-4">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold text-slate-600">
              <th className="px-5 py-3.5 text-left w-12">#</th>
              {showCategory && <th className="px-5 py-3.5 text-left w-24">类别</th>}
              <th className="px-5 py-3.5 text-left">材料名称</th>
              <th className="px-5 py-3.5 text-left">规格型号</th>
              <th className="px-5 py-3.5 text-center w-20">单位</th>
              <th className="px-5 py-3.5 text-right w-28">数量</th>
              <th className="px-5 py-3.5 text-right w-32">{priceTitle}</th>
              {showDelivery && <th className="px-5 py-3.5 text-right w-32">交货日期</th>}
              <th className="px-5 py-3.5 text-right w-36">小计</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4 text-sm text-slate-400 font-medium">{idx + 1}</td>
                {showCategory && (
                  <td className="px-5 py-4">
                    <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                      {it.category}
                    </span>
                  </td>
                )}
                <td className="px-5 py-4 font-medium text-slate-800">
                  {it.name}
                  {it.remark && <div className="text-xs text-slate-500 mt-0.5">{it.remark}</div>}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{it.specification}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-700">{it.unit}</td>
                <td className="px-5 py-4 text-right font-medium text-slate-800">
                  {typeof it.quantity === "number" ? it.quantity.toLocaleString() : it.quantity}
                </td>
                <td className="px-5 py-4 text-right font-medium text-blue-700">{it.priceLabel}</td>
                {showDelivery && (
                  <td className="px-5 py-4 text-right text-sm text-slate-600">{it.deliveryDate || "-"}</td>
                )}
                <td className="px-5 py-4 text-right font-bold text-slate-800">
                  {formatMoney(it.subtotal || (typeof it.quantity === "number" ? it.unitPrice * it.quantity : 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gradient-to-r from-slate-50 to-blue-50/50 font-bold border-t-2 border-slate-200">
            <tr>
              <td colSpan={showCategory ? 7 : 6} className="px-5 py-4 text-right text-slate-700">
                合计：
              </td>
              {showDelivery && <td></td>}
              <td className="px-5 py-4 text-right text-xl text-blue-700">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
