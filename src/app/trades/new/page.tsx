"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { PhotoUpload } from "@/components/photo-upload";
import {
  ArrowLeft,
  Send,
  AlertCircle,
  DollarSign,
  Tag,
  Package,
} from "lucide-react";

export default function NewTradePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "九成新",
  });
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTrade = api.trade.create.useMutation({
    onSuccess: (data) => {
      router.push(`/trades/${data.id}`);
    },
  });

  const handlePhotoUpload = (photoId: string) => {
    setPhotoIds((prev) => [...prev, photoId]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "请输入商品标题";
    if (!formData.description.trim()) newErrors.description = "请输入商品描述";
    if (!formData.price || parseFloat(formData.price) < 0) newErrors.price = "请输入有效价格";
    if (!formData.category.trim()) newErrors.category = "请输入商品分类";
    if (!formData.condition.trim()) newErrors.condition = "请选择商品成色";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createTrade.mutate({
      ...formData,
      price: parseFloat(formData.price),
      photoIds,
    });
  };

  const categories = ["电器", "家具", "书籍", "衣物", "数码产品", "生活用品", "运动器材", "其他"];
  const conditions = ["全新", "九成新", "八成新", "七成新", "六成新及以下"];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/trades"
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">发布二手商品</h1>
            <p className="text-zinc-500 mt-1">填写商品信息，发布到二手市场</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                商品标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入商品标题"
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  价格（元） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.price ? "border-red-500" : "border-zinc-200"
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.price}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.category ? "border-red-500" : "border-zinc-200"
                  }`}
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Package className="h-4 w-4 inline mr-1" />
                成色 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {conditions.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: cond })}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      formData.condition === cond
                        ? "bg-green-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              {errors.condition && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.condition}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                商品描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述商品情况、使用时长、有无瑕疵等..."
                rows={5}
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
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
                商品照片
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                上传商品照片可以提高成交率
              </p>
              <PhotoUpload onUploadComplete={handlePhotoUpload} />
              {photoIds.length > 0 && (
                <p className="mt-2 text-sm text-zinc-600">
                  已上传 {photoIds.length} 张照片
                </p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              交易须知
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 请如实描述商品情况，不得发布虚假信息</li>
              <li>• 建议当面验货，确认商品完好后再付款</li>
              <li>• 建议在公共场合进行交易，注意人身安全</li>
              <li>• 保留交易凭证，以备纠纷处理</li>
              <li>• 平台不承担交易担保责任，交易需谨慎</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/trades"
              className="px-6 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={createTrade.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              {createTrade.isPending ? "发布中..." : "发布商品"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
