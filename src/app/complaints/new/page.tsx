"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Send, AlertCircle, ShieldAlert } from "lucide-react";

export default function NewComplaintPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    repairRequestId: "",
    tradeId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createComplaint = api.complaint.create.useMutation({
    onSuccess: (data) => {
      router.push(`/complaints/${data.id}`);
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "请输入举报标题";
    if (!formData.description.trim()) newErrors.description = "请输入举报描述";
    if (!formData.repairRequestId && !formData.tradeId) {
      newErrors.relation = "请选择关联的报修单或交易";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createComplaint.mutate({
      ...formData,
      repairRequestId: formData.repairRequestId || undefined,
      tradeId: formData.tradeId || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/complaints"
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">提交举报</h1>
            <p className="text-zinc-500 mt-1">我们会认真处理每一份举报</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                举报标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请简要描述举报问题"
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.title ? "border-red-500" : "border-zinc-200"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                关联记录 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-zinc-500 mb-1 block">关联报修单ID</label>
                  <input
                    type="text"
                    value={formData.repairRequestId}
                    onChange={(e) => setFormData({ ...formData, repairRequestId: e.target.value, tradeId: "" })}
                    placeholder="请输入报修单ID"
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="text-center text-zinc-400 text-sm">或</div>
                <div>
                  <label className="text-sm text-zinc-500 mb-1 block">关联交易ID</label>
                  <input
                    type="text"
                    value={formData.tradeId}
                    onChange={(e) => setFormData({ ...formData, tradeId: e.target.value, repairRequestId: "" })}
                    placeholder="请输入交易ID"
                    className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {errors.relation && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.relation}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                详细描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述举报的问题、原因和相关情况..."
                rows={6}
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
                  errors.description ? "border-red-500" : "border-zinc-200"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/complaints"
              className="px-6 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={createComplaint.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              {createComplaint.isPending ? "提交中..." : "提交举报"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
