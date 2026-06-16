"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const CATEGORIES = [
  { value: "PRODUCT", label: "产品" },
  { value: "SERVICE", label: "服务" },
  { value: "BILLING", label: "账单" },
  { value: "TECHNICAL", label: "技术" },
  { value: "OTHER", label: "其他" },
] as const;

const URGENCIES = [
  { value: "LOW", label: "低", color: "text-slate-600 border-slate-300" },
  { value: "MEDIUM", label: "中", color: "text-amber-600 border-amber-300" },
  { value: "HIGH", label: "高", color: "text-orange-600 border-orange-300" },
  { value: "CRITICAL", label: "紧急", color: "text-rose-600 border-rose-300" },
] as const;

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FeedbackSubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PRODUCT");
  const [urgency, setUrgency] = useState("MEDIUM");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.feedback.create.useMutation();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) continue;
        const data = await res.json();
        setAttachments((prev) => [
          ...prev,
          { name: data.name, url: data.url, size: data.size, mimeType: data.mimeType },
        ]);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createMutation.mutateAsync({
      title,
      description,
      category: category as "PRODUCT" | "SERVICE" | "BILLING" | "TECHNICAL" | "OTHER",
      urgency: urgency as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    setCreatedId(result.id);
  };

  if (createdId) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Card>
          <CardBody className="text-center py-12">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">提交成功</h2>
            <p className="text-slate-500 mb-4">您的反馈已成功提交，我们会尽快处理。</p>
            <p className="text-sm text-slate-400 mb-6">
              反馈编号：<span className="font-mono-data font-medium text-slate-700">{createdId.slice(0, 8).toUpperCase()}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={() => {
                setCreatedId(null);
                setTitle("");
                setDescription("");
                setCategory("PRODUCT");
                setUrgency("MEDIUM");
                setAttachments([]);
              }}>
                继续提交
              </Button>
              <Button variant="secondary" onClick={() => (window.location.href = "/feedback/my")}>
                查看我的反馈
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">提交反馈</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardBody className="space-y-5">
            <div>
              <label className="label">标题</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="简要描述您的反馈"
                required
              />
            </div>

            <div>
              <label className="label">详细描述</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述您遇到的问题或建议..."
                rows={5}
                required
              />
            </div>

            <div>
              <label className="label">分类</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="label">紧急程度</label>
              <div className="flex flex-wrap gap-3 mt-1">
                {URGENCIES.map((u) => (
                  <label
                    key={u.value}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                      urgency === u.value
                        ? `${u.color} border-current bg-opacity-5 bg-current`
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={u.value}
                      checked={urgency === u.value}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{u.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">附件</label>
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  {uploading ? "上传中..." : "点击选择文件上传"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg"
                    >
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={createMutation.isPending}
              disabled={!title || !description}
            >
              提交反馈
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
