"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { formatDateTime } from "@/lib/utils";

const entityTypeLabels: Record<string, string> = {
  Patient: "患者",
  MedicalRecord: "病历",
  FollowUpTask: "随访任务",
  Appointment: "预约",
};

const fieldNamesByEntity: Record<string, string[]> = {
  Patient: ["name", "gender", "birthDate", "phone", "allergies"],
  MedicalRecord: [
    "chiefComplaint",
    "diagnosis",
    "prescription",
    "summary",
    "visitDate",
    "nextVisitDate",
  ],
  FollowUpTask: ["status", "dueDate", "completedAt", "qualityScore", "assigneeId"],
  Appointment: ["appointmentDate", "timeSlot", "status", "conflictId"],
};

const PAGE_SIZE = 20;

function ValueDiff({
  oldValue,
  newValue,
}: {
  oldValue: string | null;
  newValue: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-red-500 line-through text-sm truncate max-w-48">
        {oldValue || "-"}
      </span>
      <span className="text-gray-400">→</span>
      <span className="text-green-primary text-sm truncate max-w-48 font-medium">
        {newValue || "-"}
      </span>
    </div>
  );
}

function truncateValue(value: string | null, maxLen: number = 50): string {
  if (!value) return "-";
  return value.length > maxLen ? value.slice(0, maxLen) + "…" : value;
}

export default function AuditPage() {
  const [entityType, setEntityType] = useState<string>("");
  const [entityId, setEntityId] = useState<string>("");
  const [fieldName, setFieldName] = useState<string>("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = trpc.auditLog.list.useQuery({
    entityType: entityType || undefined,
    entityId: entityId || undefined,
    fieldName: fieldName || undefined,
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });

  const availableFields = entityType
    ? fieldNamesByEntity[entityType] ?? []
    : [];

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleEntityTypeChange = (value: string) => {
    setEntityType(value);
    setFieldName("");
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
  };

  return (
    <div className="p-6">
        <h1 className="text-2xl font-serif font-bold text-indigo-primary mb-8">
          变更审计
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">实体类型</label>
            <select
              value={entityType}
              onChange={(e) => handleEntityTypeChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-primary/30 min-w-[140px]"
            >
              <option value="">全部</option>
              {Object.entries(entityTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">实体ID</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="输入实体ID"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-primary/30 min-w-[200px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">字段名</label>
            <select
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-primary/30 min-w-[160px]"
            >
              <option value="">全部</option>
              {availableFields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-primary text-white rounded-lg text-sm hover:bg-indigo-light transition-colors"
          >
            查询
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-beige-warm/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  实体类型
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  实体ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  字段名
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  旧值
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  新值
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  修改时间
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  操作人
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    加载中…
                  </td>
                </tr>
              )}
              {!isLoading && data?.items.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-beige-warm/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-primary/10 text-indigo-primary text-xs font-medium">
                        {entityTypeLabels[item.entityType] ?? item.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">
                      {item.entityId}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {item.fieldName}
                    </td>
                    <td className="py-3 px-4">
                      {isExpanded ? (
                        <span className="text-red-500 line-through text-sm break-all">
                          {item.oldValue || "-"}
                        </span>
                      ) : (
                        <span className="text-red-500 line-through text-sm">
                          {truncateValue(item.oldValue)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isExpanded ? (
                        <span className="text-green-primary text-sm font-medium break-all">
                          {item.newValue || "-"}
                        </span>
                      ) : (
                        <span className="text-green-primary text-sm font-medium">
                          {truncateValue(item.newValue)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">
                      {item.operatorId}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && (!data || data.items.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    暂无审计记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-sm text-gray-500">
              共 {data?.total ?? 0} 条记录，第 {page + 1} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-beige-warm/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-beige-warm/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
