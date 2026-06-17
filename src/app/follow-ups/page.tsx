"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "", label: "全部" },
  { value: "PENDING", label: "待随访" },
  { value: "IN_PROGRESS", label: "随访中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "LOST", label: "已失访" },
];

export default function FollowUpsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assigneeInput, setAssigneeInput] = useState("");

  const filterStatus = status || undefined;

  const { data, isLoading } = trpc.followUp.list.useQuery({
    status: filterStatus as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "LOST" | undefined,
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });

  const assignMutation = trpc.followUp.assign.useMutation({
    onSuccess: () => {
      setAssignId(null);
      setAssigneeInput("");
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      <main>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif font-bold text-indigo-deep">
            随访管理
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-green-herbal px-4 py-2 text-sm font-medium text-white hover:bg-green-herbal/90 font-sans"
          >
            新建随访任务
          </button>
        </div>

        <div className="mb-6 flex items-center gap-4 flex-wrap rounded-lg bg-white p-4 shadow-sm border border-beige-dark">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="搜索患者姓名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep placeholder:text-indigo-deep/40 focus:outline-none focus:ring-2 focus:ring-green-herbal"
          />
          <input
            type="date"
            className="rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal"
          />
        </div>

        {isLoading ? (
          <p className="text-indigo-deep/60 font-sans">加载中...</p>
        ) : (
          <>
            <div className="rounded-lg bg-white shadow-sm border border-beige-dark overflow-hidden">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-beige-dark bg-beige-warm">
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      患者姓名
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      主治医师
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      主诉
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      截止日期
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      随访专员
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      质量评分
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-indigo-deep/70">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/follow-ups/${item.id}`)}
                      className="border-b border-beige-dark last:border-0 hover:bg-beige-warm/50 cursor-pointer"
                    >
                      <td className="px-4 py-3 text-indigo-deep font-medium">
                        {item.patient?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-indigo-deep/70">
                        {item.medicalRecord?.doctorId ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-indigo-deep/70 max-w-[200px] truncate">
                        {item.medicalRecord?.chiefComplaint ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-indigo-deep/70">
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-indigo-deep/70">
                        {item.assigneeId ?? "未分配"}
                      </td>
                      <td className="px-4 py-3 text-indigo-deep/70">
                        {item.qualityScore != null
                          ? `${item.qualityScore}/5`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignId(item.id);
                            setAssigneeInput(item.assigneeId ?? "");
                          }}
                          className="rounded bg-indigo-deep/10 px-2 py-1 text-xs text-indigo-deep hover:bg-indigo-deep/20 font-sans"
                        >
                          分配
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-indigo-deep/40"
                      >
                        暂无随访任务
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2 font-sans">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-beige-dark bg-white px-3 py-1.5 text-sm text-indigo-deep disabled:opacity-40"
                >
                  上一页
                </button>
                <span className="text-sm text-indigo-deep/60">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-beige-dark bg-white px-3 py-1.5 text-sm text-indigo-deep disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-beige-dark">
              <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
                新建随访任务
              </h2>
              <CreateForm onClose={() => setShowCreate(false)} />
            </div>
          </div>
        )}

        {assignId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl border border-beige-dark">
              <h2 className="text-lg font-serif font-bold text-indigo-deep mb-4">
                分配随访专员
              </h2>
              <input
                type="text"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                placeholder="随访专员ID"
                className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep mb-4 focus:outline-none focus:ring-2 focus:ring-green-herbal"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setAssignId(null);
                    setAssigneeInput("");
                  }}
                  className="rounded-lg border border-beige-dark px-4 py-2 text-sm font-sans text-indigo-deep hover:bg-beige-warm"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (assignId && assigneeInput) {
                      assignMutation.mutate({
                        id: assignId,
                        assigneeId: assigneeInput,
                      });
                    }
                  }}
                  disabled={!assigneeInput || assignMutation.isPending}
                  className="rounded-lg bg-green-herbal px-4 py-2 text-sm font-sans text-white hover:bg-green-herbal/90 disabled:opacity-40"
                >
                  确认分配
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const [patientId, setPatientId] = useState("");
  const [medicalRecordId, setMedicalRecordId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const createMutation = trpc.followUp.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-indigo-deep/70 font-sans mb-1">
          患者ID
        </label>
        <input
          type="text"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-indigo-deep/70 font-sans mb-1">
          诊疗记录ID
        </label>
        <input
          type="text"
          value={medicalRecordId}
          onChange={(e) => setMedicalRecordId(e.target.value)}
          className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-indigo-deep/70 font-sans mb-1">
          随访专员ID（可选）
        </label>
        <input
          type="text"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-indigo-deep/70 font-sans mb-1">
          截止日期
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-lg border border-beige-dark bg-beige-warm px-3 py-2 text-sm font-sans text-indigo-deep focus:outline-none focus:ring-2 focus:ring-green-herbal"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-beige-dark px-4 py-2 text-sm font-sans text-indigo-deep hover:bg-beige-warm"
        >
          取消
        </button>
        <button
          onClick={() => {
            if (patientId && medicalRecordId && dueDate) {
              createMutation.mutate({
                patientId,
                medicalRecordId,
                assigneeId: assigneeId || undefined,
                dueDate: new Date(dueDate),
              });
            }
          }}
          disabled={!patientId || !medicalRecordId || !dueDate || createMutation.isPending}
          className="rounded-lg bg-green-herbal px-4 py-2 text-sm font-sans text-white hover:bg-green-herbal/90 disabled:opacity-40"
        >
          创建
        </button>
      </div>
    </div>
  );
}
