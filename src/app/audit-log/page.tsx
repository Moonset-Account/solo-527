"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  RefreshCw,
  FileEdit,
  Bookmark,
  CheckSquare,
  BarChart3,
} from "lucide-react";

const ENTITY_TYPES = ["FEEDBACK", "TODO", "KNOWLEDGE_ENTRY", "KNOWLEDGE_HIT", "IMPROVEMENT"] as const;
const ACTIONS = ["CREATED", "STATUS_CHANGED", "RESULT_UPDATED", "VERSION_UPDATED", "COMPLETED", "RECORDED"] as const;
const ENTITY_LABELS: Record<string, string> = {
  FEEDBACK: "反馈", TODO: "待办", KNOWLEDGE_ENTRY: "知识条目", KNOWLEDGE_HIT: "知识命中", IMPROVEMENT: "改进动作",
};

function ActionIcon({ action }: { action: string }) {
  const props = { className: "h-4 w-4" };
  switch (action) {
    case "CREATED": return <PlusCircle {...props} />;
    case "STATUS_CHANGED": return <RefreshCw {...props} />;
    case "RESULT_UPDATED": return <FileEdit {...props} />;
    case "VERSION_UPDATED": return <Bookmark {...props} />;
    case "COMPLETED": return <CheckSquare {...props} />;
    case "RECORDED": return <BarChart3 {...props} />;
    default: return <Shield {...props} />;
  }
}

export default function AuditLogPage() {
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data } = trpc.auditLog.list.useQuery({
    entityType: entityType || undefined,
    action: action || undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    page,
    limit: 20,
  });

  const resetFilters = () => {
    setEntityType(""); setAction(""); setStartDate(""); setEndDate(""); setPage(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">实体类型</label>
              <Select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}>
                <option value="">全部</option>
                {ENTITY_TYPES.map(t => <option key={t} value={t}>{ENTITY_LABELS[t]}</option>)}
              </Select>
            </div>
            <div>
              <label className="label">操作类型</label>
              <Select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
                <option value="">全部</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <div>
              <label className="label">开始日期</label>
              <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="label">结束日期</label>
              <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button variant="ghost" size="sm" onClick={resetFilters}>重置筛选</Button>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {data?.items.map(item => {
          const isExpanded = expandedId === item.id;
          return (
            <Card key={item.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
              <CardBody className="!py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600">
                    <ActionIcon action={item.action} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">{item.user?.name || "未知用户"}</span>
                      <Badge variant={item.action === "CREATED" ? "in_progress" : "pending"}>{item.action}</Badge>
                      <Badge variant="low">{ENTITY_LABELS[item.entityType] || item.entityType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-mono-data">{item.entityId.slice(0, 8)}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 ml-11">
                    {item.oldValue && (
                      <div className="text-sm">
                        <span className="text-slate-500">旧值：</span>
                        <span className="diff-remove px-1.5 py-0.5 rounded text-xs font-mono-data">{item.oldValue}</span>
                      </div>
                    )}
                    {item.newValue && (
                      <div className="text-sm">
                        <span className="text-slate-500">新值：</span>
                        <span className="diff-add px-1.5 py-0.5 rounded text-xs font-mono-data">{item.newValue}</span>
                      </div>
                    )}
                    {!item.oldValue && !item.newValue && (
                      <p className="text-sm text-slate-400">无详细变更信息</p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
        {data?.items.length === 0 && (
          <EmptyState icon={Shield} title="暂无审计日志" description="当前筛选条件下没有审计记录" />
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-slate-500 font-mono-data">{page} / {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}
