import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

const actionLabels: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
};

const entityLabels: Record<string, string> = {
  schedule: "排班",
  coach: "教练",
  pricing_rule: "价格规则",
  court: "场地",
  waiting_list: "候补名单",
  booking: "预约",
  safety_report: "安全报表",
  profile: "用户资料",
  user: "用户",
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
};

export default async function AuditLogsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const logsData = (logs as AuditLog[]) ?? [];

  const stats = {
    total: logsData.length,
    create: logsData.filter((l) => l.action === "create").length,
    update: logsData.filter((l) => l.action === "update").length,
    delete: logsData.filter((l) => l.action === "delete").length,
  };

  function formatValueChange(
    oldVal: Record<string, unknown> | null,
    newVal: Record<string, unknown> | null
  ): React.ReactNode {
    if (!oldVal && !newVal) return null;

    const allKeys = new Set<string>();
    if (oldVal) Object.keys(oldVal).forEach((k) => allKeys.add(k));
    if (newVal) Object.keys(newVal).forEach((k) => allKeys.add(k));

    const sensitiveKeys = ["created_at", "updated_at", "created_by", "updated_by"];
    const changedFields: { key: string; old: unknown; new: unknown }[] = [];

    allKeys.forEach((key) => {
      if (sensitiveKeys.includes(key)) return;
      const o = oldVal?.[key];
      const n = newVal?.[key];
      if (JSON.stringify(o) !== JSON.stringify(n)) {
        changedFields.push({ key, old: o, new: n });
      }
    });

    if (changedFields.length === 0) {
      return <span className="text-slate-400">无字段变更记录</span>;
    }

    return (
      <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
        {changedFields.map((field) => (
          <div
            key={field.key}
            className="flex flex-col sm:flex-row sm:items-center gap-1 py-1 border-b border-slate-100 last:border-0"
          >
            <span className="font-medium text-slate-600 sm:w-24 flex-shrink-0">
              {field.key}:
            </span>
            <span className="flex flex-wrap items-center gap-2">
              {field.old !== undefined && field.old !== null && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded line-clamp-2">
                  {String(field.old).slice(0, 50)}
                </span>
              )}
              {field.new !== undefined && field.new !== null && (
                <>
                  {field.old !== undefined && field.old !== null && (
                    <span className="text-slate-400">→</span>
                  )}
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded line-clamp-2">
                    {String(field.new).slice(0, 50)}
                  </span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">操作日志</h1>
          <p className="text-sm text-slate-500 mt-1">
            记录管理员和负责人的所有配置修改操作，仅管理员可查看
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-slate-500 mb-1">总操作数</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 mb-1">创建操作</p>
          <p className="text-3xl font-bold text-green-600">{stats.create}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 mb-1">更新操作</p>
          <p className="text-3xl font-bold text-blue-600">{stats.update}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500 mb-1">删除操作</p>
          <p className="text-3xl font-bold text-red-600">{stats.delete}</p>
        </div>
      </div>

      {logsData.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            暂无操作日志
          </h3>
          <p className="text-sm text-slate-500">
            系统还没有记录任何管理操作
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logsData.map((log) => (
            <details key={log.id} className="card open:shadow-md group">
              <summary className="p-5 cursor-pointer list-none flex items-center gap-4 hover:bg-slate-50/50 rounded-xl">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    actionColors[log.action] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {actionLabels[log.action]?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`badge ${actionColors[log.action] ?? "bg-gray-100"}`}>
                      {actionLabels[log.action] ?? log.action}
                    </span>
                    <span className="badge bg-slate-100 text-slate-700">
                      {entityLabels[log.entity_type] ?? log.entity_type}
                    </span>
                    <span className="font-medium text-slate-800">
                      {log.user_name ?? "系统用户"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                    <span>操作时间：{formatDateTime(log.created_at)}</span>
                    {log.entity_id && (
                      <span className="font-mono opacity-70">
                        ID: {log.entity_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 group-open:rotate-180 transition-transform text-lg flex-shrink-0">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      操作人信息
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                      <div>
                        <span className="text-slate-500">用户ID：</span>
                        <span className="font-mono text-slate-700">
                          {log.user_id ?? "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">用户名：</span>
                        <span className="text-slate-700">
                          {log.user_name ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      变更详情
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-3">
                      {formatValueChange(log.old_value, log.new_value)}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
