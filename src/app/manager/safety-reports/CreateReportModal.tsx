"use client";

import { useState } from "react";
import { createSafetyReport } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { Court } from "@/lib/types";

interface Props {
  courts: Court[];
  onClose: () => void;
}

export default function CreateReportModal({ courts, onClose }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0] ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      await createSafetyReport(formData);
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
          <h3 className="text-lg font-semibold text-slate-800">创建手动安全报表</h3>
          <p className="text-sm text-slate-500 mt-1">
            填写设备检查和场地情况
          </p>
        </div>
        <form action={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="report_date" className="label">
                报表日期 <span className="text-red-500">*</span>
              </label>
              <input
                id="report_date"
                name="report_date"
                type="date"
                className="input"
                defaultValue={today}
                required
              />
            </div>
            <div>
              <label htmlFor="court_id" className="label">
                关联场地
              </label>
              <select id="court_id" name="court_id" className="input">
                <option value="">全部场地</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} ({court.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="conflict_count" className="label">
              冲突数
            </label>
            <input
              id="conflict_count"
              name="conflict_count"
              type="number"
              min="0"
              className="input"
              defaultValue="0"
            />
          </div>

          <div>
            <label htmlFor="resolution_summary" className="label">
              处理摘要
            </label>
            <textarea
              id="resolution_summary"
              name="resolution_summary"
              className="input min-h-[80px] resize-y"
              placeholder="冲突处理情况总结..."
            />
          </div>

          <div>
            <label htmlFor="equipment_check_notes" className="label">
              设备检查备注
            </label>
            <textarea
              id="equipment_check_notes"
              name="equipment_check_notes"
              className="input min-h-[80px] resize-y"
              placeholder="网柱、球网、灯光等设备检查情况..."
            />
          </div>

          <div>
            <label htmlFor="court_condition" className="label">
              场地状况
            </label>
            <textarea
              id="court_condition"
              name="court_condition"
              className="input min-h-[80px] resize-y"
              placeholder="地面、墙面、设施等状况..."
            />
          </div>

          <div>
            <label htmlFor="incident_notes" className="label">
              事件/事故记录
            </label>
            <textarea
              id="incident_notes"
              name="incident_notes"
              className="input min-h-[80px] resize-y"
              placeholder="当日发生的事件或事故..."
            />
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
              {isSubmitting ? "提交中..." : "创建报表"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
