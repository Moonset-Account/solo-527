import type { ChangeHistory, FieldChange } from "@app/shared";
import { formatDateTime } from "./api";

interface ChangeHistoryProps {
  history: ChangeHistory[];
  compact?: boolean;
}

function formatValue(value: any, type: string): string {
  if (value === null || value === undefined) return "（空）";
  if (type === "array" && Array.isArray(value)) {
    return `共 ${value.length} 项`;
  }
  if (type === "object" && typeof value === "object") {
    return JSON.stringify(value, null, 0);
  }
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value);
}

function isSignificantChange(change: FieldChange): boolean {
  if (change.type === "primitive") {
    return true;
  }
  if (change.type === "array") {
    const oldLen = Array.isArray(change.oldValue) ? change.oldValue.length : 0;
    const newLen = Array.isArray(change.newValue) ? change.newValue.length : 0;
    return oldLen !== newLen;
  }
  return false;
}

export function ChangeHistoryView({ history, compact = false }: ChangeHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-4xl mb-3">📝</div>
        <p>暂无变更记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, idx) => {
        const significantChanges = item.changes.filter(isSignificantChange);
        return (
          <div key={item.id || idx} className="relative pl-8">
            {idx < history.length - 1 && (
              <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-slate-200"></div>
            )}
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>

            <div className={`border border-slate-200 rounded-xl ${compact ? 'p-4' : 'p-5'} bg-white hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center font-semibold text-purple-700 text-sm">
                    {item.changedByName?.[0] || "?"}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {item.changedByName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {item.changes.filter(isSignificantChange).length} 处变更
                  </span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                    {item.entityCode}
                  </span>
                </div>
              </div>

              {item.changeReason && (
                <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 border-l-2 border-blue-400">
                  💬 {item.changeReason}
                </div>
              )}

              <div className="space-y-2">
                {item.changes.filter(isSignificantChange).map((change, cIdx) => (
                  <div
                    key={cIdx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 items-center"
                  >
                    <div className="md:col-span-3 font-medium text-slate-700 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {change.fieldLabel || change.field}
                    </div>
                    <div className="md:col-span-4 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 shrink-0">
                        原值
                      </span>
                      <span className="text-sm text-red-700 line-through decoration-red-300 break-all">
                        {formatValue(change.oldValue, change.type)}
                      </span>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <div className="md:col-span-4 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 shrink-0">
                        新值
                      </span>
                      <span className="text-sm text-green-700 font-medium break-all">
                        {formatValue(change.newValue, change.type)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
