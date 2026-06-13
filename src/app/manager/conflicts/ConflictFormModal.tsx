"use client";

import { useState } from "react";
import { resolveConflict } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { CourtConflict } from "@/lib/types";
import { formatDate, formatTime, getConflictStatusColor, getConflictStatusName } from "@/lib/utils";

interface Props {
  conflict: CourtConflict;
  onClose: () => void;
}

export default function ConflictFormModal({ conflict, onClose }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"in_progress" | "resolved" | "closed">(
    conflict.status === "open" ? "in_progress" : (conflict.status as "in_progress" | "resolved" | "closed")
  );
  const [resolution, setResolution] = useState(conflict.resolution ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      formData.set("status", status);
      formData.set("resolution", resolution);
      await resolveConflict(conflict.id, formData);
      router.refresh();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">处理冲突</h3>
          <p className="text-sm text-slate-500 mt-1">
            {conflict.court?.name ?? "场地"} · {formatDate(conflict.conflict_date)}{" "}
            {formatTime(conflict.start_time)} - {formatTime(conflict.end_time)}
          </p>
        </div>
        <form action={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">当前状态</label>
            <div>
              <span className={`badge ${getConflictStatusColor(conflict.status)}`}>
                {getConflictStatusName(conflict.status)}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                涉及 {conflict.booking_ids.length} 个预约
              </span>
            </div>
          </div>

          {conflict.description && (
            <div>
              <label className="label">冲突描述</label>
              <div className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                {conflict.description}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="status" className="label">
              修改状态 <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as "in_progress" | "resolved" | "closed")}
              required
            >
              <option value="in_progress">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>

          <div>
            <label htmlFor="resolution" className="label">
              处理说明
              {(status === "resolved" || status === "closed") && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <textarea
              id="resolution"
              name="resolution"
              className="input min-h-[120px] resize-y"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="请填写处理方案和说明..."
              required={status === "resolved" || status === "closed"}
            />
            {(status === "resolved" || status === "closed") && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ 标记为已解决/已关闭后，将自动同步到安全报表
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "提交中..." : "确认提交"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
