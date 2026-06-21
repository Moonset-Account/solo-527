"use client";

import { useState } from "react";
import { Send, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type FollowUpType = "PHONE" | "WECHAT" | "VISIT" | "OTHER";

const typeOptions: { value: FollowUpType; label: string; icon: string }[] = [
  { value: "PHONE", label: "电话", icon: "📞" },
  { value: "WECHAT", label: "微信", icon: "💬" },
  { value: "VISIT", label: "到访", icon: "🏢" },
  { value: "OTHER", label: "其他", icon: "📝" },
];

interface AddFollowUpFormProps {
  leadId: string;
}

export default function AddFollowUpForm({ leadId }: AddFollowUpFormProps) {
  const [type, setType] = useState<FollowUpType>("PHONE");
  const [content, setContent] = useState("");
  const [nextFollowAt, setNextFollowAt] = useState("");

  const utils = trpc.useUtils();
  const addFollowUp = trpc.leads.addFollowUp.useMutation({
    onSuccess: () => {
      setContent("");
      setNextFollowAt("");
      utils.leads.getById.invalidate(leadId);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addFollowUp.mutate({
      leadId,
      type,
      content: content.trim(),
      nextFollowAt: nextFollowAt || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-deep-blue-700">添加跟进记录</h3>
        <div className="flex gap-1.5">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                "chip border px-2.5 py-1 text-xs transition",
                type === opt.value
                  ? "bg-deep-blue-600 text-white border-deep-blue-600"
                  : "bg-white text-deep-blue-600 border-deep-blue-200 hover:bg-deep-blue-50"
              )}
            >
              <span className="mr-1">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="请输入跟进内容..."
        rows={3}
        className="input w-full resize-none mb-3"
      />

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex items-center">
          <Calendar size={16} className="absolute left-3 text-deep-blue-400" />
          <input
            type="datetime-local"
            value={nextFollowAt}
            onChange={(e) => setNextFollowAt(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={addFollowUp.isPending || !content.trim()}
          className="btn-primary gap-1.5 disabled:opacity-50"
        >
          <Send size={16} />
          {addFollowUp.isPending ? "提交中..." : "提交跟进"}
        </button>
      </div>
    </form>
  );
}
