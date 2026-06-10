import { json, useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import type { QualificationAlert, QualificationAlertStatus, Supplier, ApiResponse } from "@app/shared";
import { api, formatDate, formatDateTime } from "~/lib/api";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;

  const [alerts, suppliers] = await Promise.all([
    api.get<QualificationAlert[]>("/api/suppliers/qualifications/alerts", { status, pageSize: 50 }),
    api.get<Supplier[]>("/api/suppliers", { pageSize: 10 }),
  ]);

  return json({ alerts, suppliers });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const alertId = formData.get("alertId") as string;
  const resolution = formData.get("resolution") as string;

  let result: ApiResponse<any>;

  if (intent === "check") {
    result = await api.post("/api/suppliers/qualifications/check");
  } else if (intent === "assign") {
    result = await api.post(`/api/suppliers/qualifications/alerts/${alertId}/assign`);
  } else if (intent === "resolve") {
    result = await api.post(`/api/suppliers/qualifications/alerts/${alertId}/resolve`, { resolution });
  } else {
    return json({ success: false, error: "无效操作" });
  }

  return json(result);
};

const STATUS_MAP: Record<QualificationAlertStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "待分配", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  processing: { label: "处理中", color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
  resolved: { label: "已完成", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" },
};

const ISSUE_TYPE_MAP: Record<string, { label: string; icon: string; severity: string }> = {
  expired: { label: "已过期", icon: "🚨", severity: "critical" },
  expiring: { label: "即将到期", icon: "⚠️", severity: "warning" },
  invalid: { label: "资质无效", icon: "❌", severity: "critical" },
};

export default function QualificationAlerts() {
  const { alerts, suppliers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [statusFilter, setStatusFilter] = useState<QualificationAlertStatus | "">("");
  const [selectedAlert, setSelectedAlert] = useState<QualificationAlert | null>(null);
  const [resolution, setResolution] = useState("");

  const alertList = (alerts.data || []) as QualificationAlert[];
  const supplierList = (suppliers.data || []) as Supplier[];

  const criticalCount = alertList.filter(a => a.issueType === "expired" || a.issueType === "invalid").length;
  const warningCount = alertList.filter(a => a.issueType === "expiring").length;
  const pendingCount = alertList.filter(a => a.status === "pending").length;
  const processingCount = alertList.filter(a => a.status === "processing").length;

  const triggerCheck = () => {
    fetcher.submit({ intent: "check" }, { method: "post" });
  };

  const handleAssign = (alert: QualificationAlert) => {
    fetcher.submit({ intent: "assign", alertId: alert.id }, { method: "post" });
  };

  const handleResolve = () => {
    if (!selectedAlert || !resolution.trim()) {
      alert("请填写处理说明");
      return;
    }
    fetcher.submit(
      { intent: "resolve", alertId: selectedAlert.id, resolution },
      { method: "post" }
    );
    setSelectedAlert(null);
    setResolution("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "资质异常总数", value: alertList.length, icon: "🔔", color: "from-red-500 to-orange-500", desc: "需关注的供应商资质" },
          { label: "严重过期", value: criticalCount, icon: "🚨", color: "from-rose-600 to-red-600", desc: "已过期或无效资质" },
          { label: "即将到期", value: warningCount, icon: "⚠️", color: "from-amber-500 to-orange-500", desc: "30天内即将到期" },
          { label: "待分配处理", value: pendingCount, icon: "📋", color: "from-indigo-500 to-purple-500", desc: "等待协同员接单" },
        ].map((card, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full`}></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">{card.label}</span>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="mt-3 text-3xl font-bold text-slate-800 tracking-tight">
                {card.value.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-400">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">资质异常提醒列表</h2>
            <p className="text-sm text-slate-500 mt-1">
              系统自动检测供应商资质有效期，异常情况将生成提醒工单
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={triggerCheck}
              disabled={fetcher.state !== "idle"}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow transition disabled:opacity-50"
            >
              <span>🔄</span>
              {fetcher.state !== "idle" ? "检测中..." : "立即检测资质"}
            </button>
            {processingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-sm text-amber-800 font-medium">
                  有 {processingCount} 条正在处理中
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === ""
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            全部 ({alertList.length})
          </button>
          {(Object.keys(STATUS_MAP) as QualificationAlertStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {STATUS_MAP[status].label} ({alertList.filter(a => a.status === status).length})
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100">
          {alertList
            .filter(a => !statusFilter || a.status === statusFilter)
            .map(alert => {
              const issue = ISSUE_TYPE_MAP[alert.issueType] || ISSUE_TYPE_MAP.expiring;
              const statusInfo = STATUS_MAP[alert.status];
              const isUrgent = alert.issueType !== "expiring" || alert.daysLeft <= 7;
              return (
                <div
                  key={alert.id}
                  className={`p-6 hover:bg-slate-50/70 transition-all ${
                    alert.status === "resolved" ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-5 flex-wrap">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${
                      issue.severity === "critical"
                        ? "bg-gradient-to-br from-red-100 to-rose-100"
                        : "bg-gradient-to-br from-amber-100 to-orange-100"
                    }`}>
                      {issue.icon}
                    </div>

                    <div className="flex-1 min-w-[250px]">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-bold text-slate-800">
                          {alert.supplierName}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color} ${statusInfo.bg} border`}>
                          {statusInfo.label}
                        </span>
                        {isUrgent && alert.status !== "resolved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                            🔥 紧急
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">📄 资质文件：</span>
                          <span className="font-medium text-slate-800">{alert.qualificationName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">📅 到期日期：</span>
                          <span className={`font-medium ${alert.daysLeft <= 0 ? "text-red-600" : ""}`}>
                            {formatDate(alert.expiryDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">⏱️：</span>
                          <span className={`font-semibold ${
                            alert.daysLeft <= 0
                              ? "text-red-600"
                              : alert.daysLeft <= 7
                              ? "text-orange-600"
                              : "text-amber-600"
                          }`}>
                            {alert.daysLeft <= 0
                              ? `已过期 ${Math.abs(alert.daysLeft)} 天`
                              : `还剩 ${alert.daysLeft} 天`}
                          </span>
                        </div>
                      </div>

                      {alert.assigneeName && (
                        <div className="mt-3 flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {alert.assigneeName[0]}
                            </div>
                            <span className="text-slate-700 font-medium">{alert.assigneeName}</span>
                            <span className="text-slate-400">负责处理</span>
                          </div>
                          {alert.respondedAt && (
                            <span className="text-slate-400 text-xs">
                              接单于 {formatDateTime(alert.respondedAt)}
                            </span>
                          )}
                        </div>
                      )}

                      {alert.resolution && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm">
                          <div className="text-xs text-emerald-700 font-semibold mb-1">✅ 处理结果</div>
                          <p className="text-emerald-900">{alert.resolution}</p>
                          {alert.resolvedAt && (
                            <p className="text-xs text-emerald-600 mt-2">
                              完成于 {formatDateTime(alert.resolvedAt)}
                              {alert.approvalDurationHours !== undefined && (
                                <span className="ml-3">
                                  · 审批时长 {alert.approvalDurationHours.toFixed(1)} 小时
                                  <span className="ml-1 text-emerald-700">(已写入看板)</span>
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {alert.status === "pending" && (
                        <button
                          onClick={() => handleAssign(alert)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow hover:shadow-md transition"
                        >
                          📝 接单处理
                        </button>
                      )}
                      {alert.status === "processing" && (
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-xl shadow hover:shadow-md transition"
                        >
                          ✅ 处理完成
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {alertList.length === 0 && (
            <div className="p-16 text-center text-slate-500">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-semibold text-slate-700">太棒了！没有资质异常提醒</p>
              <p className="text-slate-500 mt-2">点击"立即检测资质"按钮主动检查一次</p>
            </div>
          )}
        </div>
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-xl font-bold text-slate-800">处理完成确认</h3>
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium">{selectedAlert.supplierName}</span> · {selectedAlert.qualificationName}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                处理说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                rows={4}
                placeholder="请详细描述处理情况，例如：供应商已更新资质文件，上传最新营业执照扫描件，有效期至2026年12月..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
              />
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm">
                <p className="text-amber-900">
                  💡 <strong>提示：</strong>确认提交后，本次处理的审批时长将自动计算并写入
                  <span className="font-semibold mx-1">「审批时长看板」</span>，用于月底核对差异。
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={fetcher.state !== "idle"}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl shadow hover:shadow-md transition disabled:opacity-50"
              >
                {fetcher.state !== "idle" ? "提交中..." : "确认完成 ✅"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
