"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { PhotoUpload } from "@/components/photo-upload";
import { repairCategoryConfig } from "@/lib/status-config";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import Link from "next/link";
import { RepairCategory } from "@prisma/client";

export default function NewRepairPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as RepairCategory | "",
    dormNumber: "",
    roomNumber: "",
    priority: 1,
  });
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createRepair = api.repair.create.useMutation({
    onSuccess: (data) => {
      router.push(`/repairs/${data.id}`);
    },
  });

  const handlePhotoUpload = (photoId: string) => {
    setPhotoIds((prev) => [...prev, photoId]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "请输入报修标题";
    if (!formData.description.trim()) newErrors.description = "请输入报修描述";
    if (!formData.category) newErrors.category = "请选择报修分类";
    if (!formData.dormNumber.trim()) newErrors.dormNumber = "请输入宿舍楼号";
    if (!formData.roomNumber.trim()) newErrors.roomNumber = "请输入房间号";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createRepair.mutate({
      ...formData,
      category: formData.category as RepairCategory,
      photoIds,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/repairs"
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">提交报修</h1>
            <p className="text-zinc-500 mt-1">填写报修信息，我们会尽快处理</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                报修标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请简要描述报修问题"
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
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
                报修分类 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(repairCategoryConfig).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: key as RepairCategory })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.category === key
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-sm font-medium text-zinc-700">{label}</div>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.category}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  宿舍楼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dormNumber}
                  onChange={(e) => setFormData({ ...formData, dormNumber: e.target.value })}
                  placeholder="如：1号楼"
                  className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                    errors.dormNumber ? "border-red-500" : "border-zinc-200"
                  }`}
                />
                {errors.dormNumber && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.dormNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  房间号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="如：101"
                  className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 ${
                    errors.roomNumber ? "border-red-500" : "border-zinc-200"
                  }`}
                />
                {errors.roomNumber && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.roomNumber}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                优先级
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: level })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.priority === level
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {level === 1 && "普通"}
                    {level === 2 && "较低"}
                    {level === 3 && "一般"}
                    {level === 4 && "紧急"}
                    {level === 5 && "非常紧急"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                详细描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述报修问题，包括具体位置、现象、发生时间等..."
                rows={5}
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none ${
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

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                上传照片
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                上传现场照片可以帮助维修人员更快了解问题
              </p>
              <PhotoUpload onUploadComplete={handlePhotoUpload} />
              {photoIds.length > 0 && (
                <p className="mt-2 text-sm text-zinc-600">
                  已上传 {photoIds.length} 张照片
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/repairs"
              className="px-6 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={createRepair.isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              {createRepair.isLoading ? "提交中..." : "提交报修"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
