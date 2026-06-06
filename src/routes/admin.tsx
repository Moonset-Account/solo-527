import { createSignal, createEffect, For, onMount } from "solid-js";
import { A } from "@solidjs/router";

interface Notification {
  id: string;
  type: string;
  visitor_id?: string;
  record_id?: string;
  message: string;
  is_read: number;
  created_at: number;
}

interface BlacklistItem {
  id: string;
  plate_number: string;
  reason: string;
  added_by: string;
  added_at: number;
  expires_at?: number;
  is_active: number;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  operator: string;
  operator_role: string;
  old_value?: string;
  new_value?: string;
  remark?: string;
  created_at: number;
}

interface ReportData {
  summary: {
    totalVisitors: number;
    totalEntries: number;
    timeoutCount: number;
    timeoutRate: string;
    manualEntries: number;
    offlineEntries: number;
    blacklistBlocks: number;
  };
  operatorStats: Array<{ operator: string; operator_role: string; count: number }>;
  actionStats: Array<{ action: string; count: number }>;
  buildingStats: Array<{ building: string; count: number }>;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = createSignal<"dashboard" | "timeout" | "blacklist" | "audit">("dashboard");
  const [notifications, setNotifications] = createSignal<Notification[]>([]);
  const [unreadCount, setUnreadCount] = createSignal(0);
  const [blacklist, setBlacklist] = createSignal<BlacklistItem[]>([]);
  const [auditLogs, setAuditLogs] = createSignal<AuditLog[]>([]);
  const [report, setReport] = createSignal<ReportData | null>(null);
  const [timeoutVehicles, setTimeoutVehicles] = createSignal<any[]>([]);
  const [showAddBlacklist, setShowAddBlacklist] = createSignal(false);
  const [newBlacklist, setNewBlacklist] = createSignal({ plateNumber: "", reason: "", expiresAt: "" });
  const [message, setMessage] = createSignal<{ type: "success" | "error"; text: string } | null>(null);
  const [auditFilter, setAuditFilter] = createSignal({ operator: "", action: "", entityType: "" });
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    loadNotifications();
    loadReport();
    setInterval(() => {
      loadUnreadCount();
      if (activeTab() === "timeout") loadTimeoutVehicles();
    }, 10000);
  });

  createEffect(() => {
    if (activeTab() === "timeout") loadTimeoutVehicles();
    if (activeTab() === "blacklist") loadBlacklist();
    if (activeTab() === "audit") loadAuditLogs();
  });

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?unread=true");
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      setUnreadCount(data.count);
    } catch (e) {}
  };

  const loadReport = async () => {
    try {
      const res = await fetch("/api/audit/report");
      const data = await res.json();
      setReport(data);
    } catch (e) {
      console.error("Failed to load report:", e);
    }
  };

  const loadTimeoutVehicles = async () => {
    try {
      const res = await fetch("/api/records/timeout");
      const data = await res.json();
      setTimeoutVehicles(data);
    } catch (e) {
      console.error("Failed to load timeout vehicles:", e);
    }
  };

  const loadBlacklist = async () => {
    try {
      const res = await fetch("/api/blacklist");
      const data = await res.json();
      setBlacklist(data);
    } catch (e) {
      console.error("Failed to load blacklist:", e);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let url = "/api/audit";
      const params = new URLSearchParams();
      if (auditFilter().operator) params.append("operator", auditFilter().operator);
      if (auditFilter().action) params.append("action", auditFilter().action);
      if (auditFilter().entityType) params.append("entityType", auditFilter().entityType);
      if (params.toString()) url += "?" + params.toString();

      const res = await fetch(url);
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlacklist = async (e: Event) => {
    e.preventDefault();
    if (!newBlacklist().plateNumber || !newBlacklist().reason) {
      setMessage({ type: "error", text: "请填写车牌和原因" });
      return;
    }

    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: newBlacklist().plateNumber,
          reason: newBlacklist().reason,
          addedBy: "admin",
          expiresAt: newBlacklist().expiresAt ? new Date(newBlacklist().expiresAt).getTime() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");

      setMessage({ type: "success", text: "已添加到黑名单" });
      setShowAddBlacklist(false);
      setNewBlacklist({ plateNumber: "", reason: "", expiresAt: "" });
      loadBlacklist();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveBlacklist = async (id: string) => {
    if (!confirm("确定要从黑名单中移除该车辆吗？")) return;

    try {
      await fetch(`/api/blacklist/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator: "admin" }),
      });
      loadBlacklist();
      setMessage({ type: "success", text: "已从黑名单移除" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      loadNotifications();
      setUnreadCount(0);
    } catch (e) {}
  };

  const exportCSV = async () => {
    try {
      const res = await fetch("/api/audit/export?format=csv");
      const csv = await res.text();
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      create: "创建",
      update: "更新",
      delete: "删除",
      cancel: "取消",
      entry: "入场",
      exit: "离场",
      add: "添加",
      blacklist_block: "黑名单拦截",
    };
    return map[action] || action;
  };

  const tabs = [
    { id: "dashboard", label: "📊 仪表盘", color: "#667eea" },
    { id: "timeout", label: `⏰ 超时车辆${unreadCount() > 0 ? ` (${unreadCount()})` : ""}`, color: "#f56565" },
    { id: "blacklist", label: "🚫 黑名单", color: "#e53e3e" },
    { id: "audit", label: "📋 审计日志", color: "#4299e1" },
  ] as const;

  return (
    <div style="min-height: 100vh; background: #f7fafc;">
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="max-width: 1400px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <A href="/" style="text-decoration: none; color: #667eea; font-weight: 600;">← 返回</A>
            <h1 style="font-size: 20px; color: #2d3748; margin: 0;">📊 物业后台管理</h1>
          </div>
          <button
            onClick={markAllRead}
            style="position: relative; padding: 8px 16px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 14px;"
          >
            🔔 通知
            {unreadCount() > 0 && (
              <span style="position: absolute; top: -6px; right: -6px; background: #f56565; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px;">
                {unreadCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style="background: white; border-bottom: 1px solid #e2e8f0;">
        <div style="max-width: 1400px; margin: 0 auto; display: flex; gap: 4px; padding: 0 24px;">
          <For each={tabs}>
            {(tab) => (
              <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 24px",
                  border: "none",
                  background: activeTab() === tab.id ? tab.color + "10" : "transparent",
                  color: activeTab() === tab.id ? tab.color : "#4a5568",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeTab() === tab.id ? "600" : "400",
                  borderBottom: `3px solid ${activeTab() === tab.id ? tab.color : "transparent"}`,
                }}
              >
                {tab.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
        {message() && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: message()!.type === "success" ? "#c6f6d5" : "#fed7d7",
              color: message()!.type === "success" ? "#22543d" : "#742a2a",
            }}
          >
            {message()!.text}
          </div>
        )}

        {activeTab() === "dashboard" && report() && (
          <div>
            <h2 style="font-size: 18px; color: #2d3748; margin-bottom: 20px;">数据概览</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">总访客数</div>
                <div style="font-size: 32px; font-weight: 700; color: #667eea;">{report()!.summary.totalVisitors}</div>
              </div>
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">总入场次数</div>
                <div style="font-size: 32px; font-weight: 700; color: #48bb78;">{report()!.summary.totalEntries}</div>
              </div>
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">超时次数</div>
                <div style="font-size: 32px; font-weight: 700; color: #f56565;">{report()!.summary.timeoutCount}</div>
                <div style="font-size: 12px; color: #a0aec0;">超时率: {report()!.summary.timeoutRate}</div>
              </div>
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">人工放行</div>
                <div style="font-size: 32px; font-weight: 700; color: #ed8936;">{report()!.summary.manualEntries}</div>
              </div>
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">离线记录</div>
                <div style="font-size: 32px; font-weight: 700; color: #9f7aea;">{report()!.summary.offlineEntries}</div>
              </div>
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 14px; color: #718096; margin-bottom: 8px;">黑名单拦截</div>
                <div style="font-size: 32px; font-weight: 700; color: #e53e3e;">{report()!.summary.blacklistBlocks}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="font-size: 16px; color: #2d3748; margin-bottom: 16px;">操作人统计</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                  <For each={report()!.operatorStats}>
                    {(stat) => (
                      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="color: #4a5568;">{stat.operator} <span style="color: #a0aec0; font-size: 12px;">({stat.operator_role})</span></span>
                        <span style="font-weight: 600; color: #2d3748;">{stat.count}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="font-size: 16px; color: #2d3748; margin-bottom: 16px;">操作类型统计</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                  <For each={report()!.actionStats}>
                    {(stat) => (
                      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="color: #4a5568;">{actionLabel(stat.action)}</span>
                        <span style="font-weight: 600; color: #2d3748;">{stat.count}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="font-size: 16px; color: #2d3748; margin-bottom: 16px;">楼栋来访统计</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                  <For each={report()!.buildingStats}>
                    {(stat) => (
                      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                        <span style="color: #4a5568;">{stat.building}</span>
                        <span style="font-weight: 600; color: #2d3748;">{stat.count}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab() === "timeout" && (
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="font-size: 18px; color: #2d3748; margin: 0;">超时未离场车辆 ({timeoutVehicles().length})</h2>
              <button
                onClick={loadTimeoutVehicles}
                style="padding: 8px 16px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
              >
                🔄 刷新
              </button>
            </div>
            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #fed7d7;">
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">车牌</th>
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">访客</th>
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">电话</th>
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">楼栋</th>
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">接待人</th>
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">入场时间</th>
                      <th style="text-align: left; padding: 12px 8px; color: #c53030;">应离场时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={timeoutVehicles()}>
                      {(v) => (
                        <tr style="border-bottom: 1px solid #fff5f5; background: #fff5f5;">
                          <td style="padding: 12px 8px; font-family: monospace; font-weight: 600; color: #c53030;">{v.plate_number}</td>
                          <td style="padding: 12px 8px; color: #742a2a;">{v.name}</td>
                          <td style="padding: 12px 8px; color: #742a2a;">{v.phone}</td>
                          <td style="padding: 12px 8px; color: #742a2a;">{v.building}</td>
                          <td style="padding: 12px 8px; color: #742a2a;">{v.host_name} ({v.host_phone})</td>
                          <td style="padding: 12px 8px; color: #742a2a;">{new Date(v.entry_time).toLocaleString("zh-CN")}</td>
                          <td style="padding: 12px 8px; color: #c53030; font-weight: 600;">{new Date(v.visitor_end_time).toLocaleString("zh-CN")}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
                {timeoutVehicles().length === 0 && (
                  <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    ✅ 暂无超时车辆
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab() === "blacklist" && (
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="font-size: 18px; color: #2d3748; margin: 0;">黑名单管理 ({blacklist().filter(b => b.is_active).length})</h2>
              <button
                onClick={() => setShowAddBlacklist(true)}
                style="padding: 10px 20px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
              >
                + 添加黑名单
              </button>
            </div>

            {showAddBlacklist && (
              <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="font-size: 16px; color: #c53030; margin-bottom: 16px;">添加黑名单车辆</h3>
                <form onSubmit={handleAddBlacklist} style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                  <div>
                    <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">车牌号码 *</label>
                    <input
                      type="text"
                      value={newBlacklist().plateNumber}
                      onInput={(e) => setNewBlacklist({ ...newBlacklist(), plateNumber: e.target.value.toUpperCase() })}
                      placeholder="例如：京A12345"
                      style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; text-transform: uppercase;"
                    />
                  </div>
                  <div>
                    <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">过期时间（可选）</label>
                    <input
                      type="datetime-local"
                      value={newBlacklist().expiresAt}
                      onInput={(e) => setNewBlacklist({ ...newBlacklist(), expiresAt: e.target.value })}
                      style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                    />
                  </div>
                  <div>
                    <label style="display: block; font-size: 14px; color: #4a5568; margin-bottom: 6px;">原因 *</label>
                    <input
                      type="text"
                      value={newBlacklist().reason}
                      onInput={(e) => setNewBlacklist({ ...newBlacklist(), reason: e.target.value })}
                      placeholder="请输入拉黑原因"
                      style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                    />
                  </div>
                  <div style="display: flex; gap: 8px; align-items: flex-end;">
                    <button
                      type="button"
                      onClick={() => setShowAddBlacklist(false)}
                      style="padding: 10px 20px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      style="padding: 10px 20px; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                    >
                      添加
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #e2e8f0;">
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">车牌</th>
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">原因</th>
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">添加人</th>
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">添加时间</th>
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">过期时间</th>
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">状态</th>
                      <th style="text-align: left; padding: 12px 8px; color: #4a5568;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={blacklist()}>
                      {(item) => (
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                          <td style="padding: 12px 8px; font-family: monospace; font-weight: 600; color: #c53030;">{item.plate_number}</td>
                          <td style="padding: 12px 8px; color: #4a5568;">{item.reason}</td>
                          <td style="padding: 12px 8px; color: #4a5568;">{item.added_by}</td>
                          <td style="padding: 12px 8px; color: #718096;">{new Date(item.added_at).toLocaleString("zh-CN")}</td>
                          <td style="padding: 12px 8px; color: #718096;">{item.expires_at ? new Date(item.expires_at).toLocaleString("zh-CN") : "永久"}</td>
                          <td style="padding: 12px 8px;">
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              background: item.is_active ? "#fed7d7" : "#e2e8f0",
                              color: item.is_active ? "#c53030" : "#718096",
                            }}>
                              {item.is_active ? "生效中" : "已失效"}
                            </span>
                          </td>
                          <td style="padding: 12px 8px;">
                            {item.is_active && (
                              <button
                                onClick={() => handleRemoveBlacklist(item.id)}
                                style="padding: 6px 12px; background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; border-radius: 4px; cursor: pointer; font-size: 12px;"
                              >
                                移除
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
                {blacklist().length === 0 && (
                  <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    暂无黑名单记录
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab() === "audit" && (
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
              <h2 style="font-size: 18px; color: #2d3748; margin: 0;">审计日志</h2>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <select
                  value={auditFilter().entityType}
                  onChange={(e) => setAuditFilter({ ...auditFilter(), entityType: e.target.value })}
                  style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                >
                  <option value="">全部类型</option>
                  <option value="visitor">访客</option>
                  <option value="parking_record">停车记录</option>
                  <option value="blacklist">黑名单</option>
                </select>
                <select
                  value={auditFilter().action}
                  onChange={(e) => setAuditFilter({ ...auditFilter(), action: e.target.value })}
                  style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                >
                  <option value="">全部操作</option>
                  <option value="create">创建</option>
                  <option value="update">更新</option>
                  <option value="delete">删除</option>
                  <option value="cancel">取消</option>
                  <option value="entry">入场</option>
                  <option value="exit">离场</option>
                  <option value="blacklist_block">黑名单拦截</option>
                </select>
                <input
                  type="text"
                  placeholder="操作人"
                  value={auditFilter().operator}
                  onInput={(e) => setAuditFilter({ ...auditFilter(), operator: e.target.value })}
                  style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;"
                />
                <button
                  onClick={loadAuditLogs}
                  style="padding: 8px 16px; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                >
                  查询
                </button>
                <button
                  onClick={exportCSV}
                  style="padding: 8px 16px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                >
                  📥 导出CSV
                </button>
              </div>
            </div>

            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              {loading() ? (
                <div style="text-align: center; padding: 40px; color: #a0aec0;">加载中...</div>
              ) : (
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #e2e8f0;">
                        <th style="text-align: left; padding: 10px 8px; color: #4a5568;">时间</th>
                        <th style="text-align: left; padding: 10px 8px; color: #4a5568;">操作</th>
                        <th style="text-align: left; padding: 10px 8px; color: #4a5568;">实体类型</th>
                        <th style="text-align: left; padding: 10px 8px; color: #4a5568;">操作人</th>
                        <th style="text-align: left; padding: 10px 8px; color: #4a5568;">角色</th>
                        <th style="text-align: left; padding: 10px 8px; color: #4a5568;">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={auditLogs()}>
                        {(log) => (
                          <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 10px 8px; color: #718096; white-space: nowrap;">{new Date(log.created_at).toLocaleString("zh-CN")}</td>
                            <td style="padding: 10px 8px;">
                              <span style="padding: 3px 8px; border-radius: 4px; font-size: 12px; background: #ebf8ff; color: #2b6cb0;">
                                {actionLabel(log.action)}
                              </span>
                            </td>
                            <td style="padding: 10px 8px; color: #4a5568;">{log.entity_type}</td>
                            <td style="padding: 10px 8px; font-weight: 500; color: #2d3748;">{log.operator}</td>
                            <td style="padding: 10px 8px; color: #718096;">{log.operator_role}</td>
                            <td style="padding: 10px 8px; color: #4a5568; max-width: 300px;">{log.remark || "-"}</td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                  {auditLogs().length === 0 && (
                    <div style="text-align: center; padding: 40px; color: #a0aec0;">
                      暂无审计日志
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
