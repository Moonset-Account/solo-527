"use client";

import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { trpc } from "@/lib/trpc/client";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDate, formatDateTime } from "@/lib/utils";
import { BookOpen, Activity, Download, Search, Filter } from "lucide-react";

export function AuditTabs() {
  const [activeTab, setActiveTab] = useState("versions");

  return (
    <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
      <TabsPrimitive.List className="inline-flex items-center gap-1 p-1 bg-deep-blue-50/60 rounded-lg mb-5">
        <TabsPrimitive.Trigger
          value="versions"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-deep-blue-700 data-[state=active]:shadow-sm text-deep-blue-500 hover:text-deep-blue-700"
        >
          <BookOpen size={14} />题库版本
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger
          value="logs"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-deep-blue-700 data-[state=active]:shadow-sm text-deep-blue-500 hover:text-deep-blue-700"
        >
          <Activity size={14} />操作日志
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger
          value="downloads"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-deep-blue-700 data-[state=active]:shadow-sm text-deep-blue-500 hover:text-deep-blue-700"
        >
          <Download size={14} />下载记录
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>

      <TabsPrimitive.Content value="versions">
        <QuestionBankVersionsTab />
      </TabsPrimitive.Content>
      <TabsPrimitive.Content value="logs">
        <OperationLogsTab />
      </TabsPrimitive.Content>
      <TabsPrimitive.Content value="downloads">
        <DownloadLogsTab />
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}

type QBV = {
  id: string;
  versionNo: string;
  major?: string;
  enabledAt: Date;
  classesUsing: string[];
  changelog?: string;
  downloadUrl?: string;
};

function QuestionBankVersionsTab() {
  const [page, setPage] = useState(1);
  const { data } = trpc.audit.questionBankVersions.useQuery({ page, pageSize: 10 });
  const items: QBV[] = (data?.items ?? []) as QBV[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue-300" />
          <input placeholder="搜索版本号..." className="input pl-9" />
        </div>
      </div>
      <DataTable<QBV>
        columns={[
          { key: "versionNo", header: "版本号", width: "140px", render: (r) => (
            <span className="font-mono text-sm text-deep-blue-700 font-semibold">{r.versionNo}</span>
          )},
          { key: "major", header: "适用专业", width: "120px", render: (r) => r.major ?? "-" },
          { key: "enabledAt", header: "启用时间", width: "140px", render: (r) => formatDate(r.enabledAt) },
          { key: "classesUsing", header: "使用班级", render: (r) => (
            <div className="flex flex-wrap gap-1">
              {r.classesUsing.length > 0 ? r.classesUsing.map((c: string) => (
                <span key={c} className="chip bg-deep-blue-50 text-deep-blue-600 text-[11px]">{c}</span>
              )) : <span className="text-deep-blue-400 text-xs">未使用</span>}
            </div>
          )},
          { key: "changelog", header: "更新说明", render: (r) => (
            <span className="text-xs text-deep-blue-500 line-clamp-1">{r.changelog ?? "-"}</span>
          )},
          { key: "actions", header: "操作", width: "120px", align: "right", render: (r) => r.downloadUrl && (
            <a href={r.downloadUrl} className="text-xs text-ink-gold-600 hover:text-ink-gold-700 underline underline-offset-2">下载</a>
          )},
        ]}
        data={items}
        rowKey={(r) => r.id}
      />
      {data && <Pagination page={page} pageSize={10} total={data.total} onPageChange={setPage} />}
    </div>
  );
}

type LogV = {
  id: string;
  staffName: string;
  staffRole: string;
  module: string;
  action: string;
  targetType?: string;
  ip?: string;
  createdAt: Date;
};

function OperationLogsTab() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ module: string; action: string; staffId: string }>({ module: "", action: "", staffId: "" });
  const { data } = trpc.audit.operationLogs.useQuery({
    module: filters.module || undefined,
    action: filters.action || undefined,
    staffId: filters.staffId || undefined,
    page, pageSize: 10,
  });
  const items: LogV[] = (data?.items ?? []) as LogV[];

  const modules = ["全部", "LEAD", "TRIAL", "CONSUMPTION", "FEEDBACK", "STAFF", "EXPORT", "CAMPUS", "SETTING"];
  const actions = ["全部", "CREATE", "UPDATE", "DELETE", "MARK_READ", "REPLY", "RECONCILE"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-deep-blue-400" />
        <select
          value={filters.module}
          onChange={(e) => setFilters({ ...filters, module: e.target.value })}
          className="input w-auto !py-1.5 text-xs"
        >
          {modules.map((m) => (
            <option key={m} value={m === "全部" ? "" : m}>{m}</option>
          ))}
        </select>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="input w-auto !py-1.5 text-xs"
        >
          {actions.map((a) => (
            <option key={a} value={a === "全部" ? "" : a}>{a}</option>
          ))}
        </select>
      </div>
      <DataTable<LogV>
        columns={[
          { key: "staffName", header: "操作人", width: "100px", render: (r) => (
            <div>
              <div className="text-sm text-deep-blue-700">{r.staffName}</div>
              <div className="text-[11px] text-deep-blue-400">{r.staffRole}</div>
            </div>
          )},
          { key: "module", header: "模块", width: "100px", render: (r) => (
            <StatusChip variant="info" size="sm">{r.module}</StatusChip>
          )},
          { key: "action", header: "操作", width: "100px", render: (r) => (
            <span className="text-xs font-medium text-deep-blue-600">{r.action}</span>
          )},
          { key: "targetType", header: "目标类型", width: "100px", render: (r) => r.targetType ?? "-" },
          { key: "ip", header: "IP地址", width: "130px", render: (r) => r.ip ?? "-" },
          { key: "createdAt", header: "时间", width: "160px", render: (r) => formatDateTime(r.createdAt) },
        ]}
        data={items}
        rowKey={(r) => r.id}
      />
      {data && <Pagination page={page} pageSize={10} total={data.total} onPageChange={setPage} />}
    </div>
  );
}

type DL = {
  id: string;
  fileName: string;
  module: string;
  operatorName: string;
  operatorRole: string;
  format: string;
  status: "PROCESSING" | "DONE" | "FAILED";
  downloadUrl?: string;
  createdAt: Date;
};

function DownloadLogsTab() {
  const [page, setPage] = useState(1);
  const reDownload = trpc.reports.reDownload.useMutation();
  const { data, refetch } = trpc.audit.downloadLogs.useQuery({ page, pageSize: 10 });
  const items: DL[] = (data?.items ?? []) as DL[];

  return (
    <div className="space-y-4">
      <DataTable<DL>
        columns={[
          { key: "fileName", header: "文件名", render: (r) => (
            <div className="flex items-center gap-2">
              <Download size={14} className="text-deep-blue-400" />
              <span className="text-sm text-deep-blue-700">{r.fileName}</span>
            </div>
          )},
          { key: "module", header: "模块", width: "100px", render: (r) => (
            <StatusChip variant="default" size="sm">{r.module}</StatusChip>
          )},
          { key: "operatorName", header: "操作人", width: "100px", render: (r) => (
            <div>
              <div className="text-sm text-deep-blue-700">{r.operatorName}</div>
              <div className="text-[11px] text-deep-blue-400">{r.operatorRole}</div>
            </div>
          )},
          { key: "format", header: "格式", width: "80px" },
          { key: "status", header: "状态", width: "100px", render: (r) => (
            <StatusChip variant={r.status === "DONE" ? "success" : r.status === "PROCESSING" ? "warn" : "danger"} size="sm">
              {r.status === "DONE" ? "完成" : r.status === "PROCESSING" ? "处理中" : "失败"}
            </StatusChip>
          )},
          { key: "createdAt", header: "创建时间", width: "160px", render: (r) => formatDateTime(r.createdAt) },
          { key: "actions", header: "操作", width: "100px", align: "right", render: (r) => (
            r.status === "DONE" ? (
              <button
                onClick={() => { reDownload.mutate(r.id); refetch(); }}
                className="text-xs text-ink-gold-600 hover:text-ink-gold-700 underline underline-offset-2"
              >
                重新下载
              </button>
            ) : null
          )},
        ]}
        data={items}
        rowKey={(r) => r.id}
      />
      {data && <Pagination page={page} pageSize={10} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
