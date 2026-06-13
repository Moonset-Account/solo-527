"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badges";

type ActionEnum = "CREATE" | "UPDATE" | "DELETE";

const ACTION_VARIANTS: Record<ActionEnum, "success" | "info" | "danger"> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
};

const ACTION_LABELS: Record<ActionEnum, string> = {
  CREATE: "创建",
  UPDATE: "更新",
  DELETE: "删除",
};

function formatValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 0);
  } catch {
    return String(v);
  }
}

function truncate(s: string, n: number) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function LogsPage() {
  const { page, pageSize, setPage } = usePagination(30);
  const [filters, setFilters] = useState<{
    entityType?: string;
    action?: ActionEnum;
    operatorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [groupByEntity, setGroupByEntity] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: entityTypes } = api.log.entityTypes.useQuery();
  const { data: users } = api.user.list.useQuery();
  const { data, isLoading } = api.log.list.useQuery({
    page,
    pageSize,
    entityType: filters.entityType,
    action: filters.action,
    operatorId: filters.operatorId,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : undefined,
  });

  const groupedData = useMemo(() => {
    if (!groupByEntity || !data?.list) return null;
    const groups: Record<string, any[]> = {};
    for (const log of data.list) {
      const key = `${log.entityType}:${log.entityId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    }
    return Object.entries(groups).map(([key, items]) => ({ key, items }));
  }, [groupByEntity, data?.list]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">操作日志</h2>
          <p className="text-sm text-slate-500 mt-1">查看系统所有操作记录，支持多维度筛选和追溯</p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={groupByEntity}
            onChange={(e) => setGroupByEntity(e.target.checked)}
          />
          <span className="text-sm">按实体分组</span>
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 items-end border-b border-slate-200">
          <div>
            <label className="label">实体类型</label>
            <select
              className="input w-40"
              value={filters.entityType ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, entityType: e.target.value || undefined });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              {entityTypes?.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type} ({t.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">操作类型</label>
            <select
              className="input w-32"
              value={filters.action ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, action: (e.target.value || undefined) as ActionEnum });
                setPage(1);
              }}
            >
              <option value="">全部</option>
              <option value="CREATE">创建</option>
              <option value="UPDATE">更新</option>
              <option value="DELETE">删除</option>
            </select>
          </div>
          <div>
            <label className="label">操作人</label>
            <select
              className="input w-32"
              value={filters.operatorId ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, operatorId: e.target.value || undefined });
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

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">加载中…</div>
        ) : !data?.list.length ? (
          <div className="p-12 text-center text-slate-400">暂无操作日志</div>
        ) : groupByEntity && groupedData ? (
          <div className="divide-y divide-slate-200 max-h-[65vh] overflow-y-auto">
            {groupedData.map((group) => (
              <div key={group.key} className="p-4">
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-1">
                  <Badge variant="default">{group.items[0].entityType}</Badge>
                  <code className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {group.items[0].entityId}
                  </code>
                  <span className="text-xs text-slate-400">
                    共 {group.items.length} 条操作
                  </span>
                </div>
                <div className="ml-6 border-l-2 border-slate-100 pl-4 space-y-3">
                  {group.items.map((log) => (
                    <LogItem
                      key={log.id}
                      log={log}
                      compact
                      onClick={() => setSelectedLog(log)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <Pagination
              total={data?.total ?? 0}
              page={page}
              pageSize={pageSize}
              onChange={setPage}
            />
          </div>
        ) : (
          <>
            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">时间</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">操作人</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">实体类型</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">动作</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">字段</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">旧值</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">新值</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.list.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {log.operator?.name ?? "系统"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{log.entityType}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTION_VARIANTS[log.action as ActionEnum]}>
                          {ACTION_LABELS[log.action as ActionEnum] ?? log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs max-w-[120px] truncate" title={log.fieldName ?? undefined}>
                        {log.fieldName || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate" title={formatValue(log.oldValue)}>
                        {truncate(formatValue(log.oldValue), 20)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate" title={formatValue(log.newValue)}>
                        {truncate(formatValue(log.newValue), 20)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate" title={log.detail ?? undefined}>
                        {log.detail || "查看 →"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              total={data?.total ?? 0}
              page={page}
              pageSize={pageSize}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="日志详情"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">操作时间</div>
                <div className="font-medium">
                  {new Date(selectedLog.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">操作人</div>
                <div className="font-medium">
                  {selectedLog.operator?.name ?? "系统"}
                  {selectedLog.operator?.email && (
                    <span className="text-slate-500 ml-1">
                      ({selectedLog.operator.email})
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">实体类型</div>
                <Badge variant="default">{selectedLog.entityType}</Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">动作</div>
                <Badge variant={ACTION_VARIANTS[selectedLog.action as ActionEnum]}>
                  {ACTION_LABELS[selectedLog.action as ActionEnum] ?? selectedLog.action}
                </Badge>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 mb-1">实体 ID</div>
                <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                  {selectedLog.entityId}
                </code>
              </div>
              {selectedLog.fieldName && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">字段</div>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                    {selectedLog.fieldName}
                  </code>
                </div>
              )}
            </div>
            {(selectedLog.oldValue !== null && selectedLog.oldValue !== undefined) && (
              <div>
                <div className="text-xs text-slate-500 mb-1">旧值</div>
                <pre className="bg-red-50 text-red-800 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
{formatValue(selectedLog.oldValue)}
                </pre>
              </div>
            )}
            {(selectedLog.newValue !== null && selectedLog.newValue !== undefined) && (
              <div>
                <div className="text-xs text-slate-500 mb-1">新值</div>
                <pre className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
{formatValue(selectedLog.newValue)}
                </pre>
              </div>
            )}
            {selectedLog.detail && (
              <div>
                <div className="text-xs text-slate-500 mb-1">操作说明</div>
                <div className="bg-slate-50 text-slate-800 text-sm p-3 rounded-lg">
                  {selectedLog.detail}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function LogItem({
  log,
  compact,
  onClick,
}: {
  log: any;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition ${compact ? "" : ""}`}
      onClick={onClick}
    >
      <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full bg-slate-300 border-2 border-white" />
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Badge variant={ACTION_VARIANTS[log.action as ActionEnum]}>
            {ACTION_LABELS[log.action as ActionEnum] ?? log.action}
          </Badge>
          {log.fieldName && (
            <code className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">
              {log.fieldName}
            </code>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{log.operator?.name ?? "系统"}</span>
          <span>
            {new Date(log.createdAt).toLocaleString("zh-CN", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
      {log.detail && (
        <div className="text-xs text-slate-600 mb-1">{log.detail}</div>
      )}
      {log.oldValue !== null && log.oldValue !== undefined && log.newValue !== null && log.newValue !== undefined && (
        <div className="flex gap-3 text-xs">
          <span className="text-red-600 truncate max-w-[200px]">
            -{truncate(formatValue(log.oldValue), 24)}
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-emerald-600 truncate max-w-[200px]">
            +{truncate(formatValue(log.newValue), 24)}
          </span>
        </div>
      )}
    </div>
  );
}
