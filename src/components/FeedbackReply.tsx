"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Send, X, MessageCircle, Clock, User } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { StatusChip } from "@/components/ui/StatusChip";

interface FeedbackItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  avatarInitial: string;
  title: string;
  content: string;
  status: "UNREAD" | "READ";
  reply?: string;
  repliedBy?: string;
  repliedAt?: Date;
  createdAt: Date;
}

interface Props {
  feedback: FeedbackItem;
  onClose: () => void;
  onReplied: () => void;
}

export function FeedbackReply({ feedback, onClose, onReplied }: Props) {
  const [replyText, setReplyText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const utils = trpc.useUtils();
  const replyMutation = trpc.feedback.reply.useMutation({
    onSuccess: () => {
      utils.feedback.list.invalidate();
      utils.feedback.history.invalidate();
      onReplied();
    },
  });
  const markReadMutation = trpc.feedback.markRead.useMutation({
    onSuccess: () => utils.feedback.list.invalidate(),
  });
  const { data: history } = trpc.feedback.history.useQuery(
    { studentId: feedback.studentId, page: 1, pageSize: 10 },
    { enabled: showHistory },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (feedback.status === "UNREAD") {
      markReadMutation.mutate([feedback.id]);
    }
    replyMutation.mutate({ id: feedback.id, reply: replyText.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-deep-blue-50">
          <div>
            <h3 className="text-lg font-semibold text-deep-blue-700">家长反馈详情</h3>
            <p className="text-xs text-deep-blue-400 mt-0.5">
              {feedback.studentName} · {feedback.className}
            </p>
          </div>
          <button onClick={onClose} className="btn-secondary !px-2 !py-1.5">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 p-5 space-y-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-gold-400 to-ink-gold-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {feedback.avatarInitial}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip variant={feedback.status === "UNREAD" ? "warn" : "default"} pulse={feedback.status === "UNREAD"}>
                  {feedback.status === "UNREAD" ? "未读" : "已读"}
                </StatusChip>
                <span className="text-xs text-deep-blue-400 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDateTime(feedback.createdAt)}
                </span>
              </div>
              <div className="text-sm font-semibold text-deep-blue-700">{feedback.title}</div>
              <div className="text-sm text-deep-blue-600 leading-relaxed whitespace-pre-wrap bg-deep-blue-50/50 rounded-lg p-4">
                {feedback.content}
              </div>
            </div>
          </div>

          {feedback.reply && (
            <div className="flex gap-4 pl-14">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-deep-blue-500 to-deep-blue-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                <User size={16} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-deep-blue-600">{feedback.repliedBy}</span>
                  <span className="text-xs text-deep-blue-300">·</span>
                  <span className="text-xs text-deep-blue-400 flex items-center gap-1">
                    <Clock size={12} />
                    {feedback.repliedAt ? formatDateTime(feedback.repliedAt) : "-"}
                  </span>
                </div>
                <div className="text-sm text-deep-blue-600 leading-relaxed bg-ink-gold-50/50 rounded-lg p-4 border border-ink-gold-100">
                  {feedback.reply}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full btn-secondary"
          >
            <MessageCircle size={16} />
            <span>{showHistory ? "收起" : "查看"}该学生历史反馈（{history?.total ?? 0}）</span>
          </button>

          {showHistory && history && (
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pl-4 border-l-2 border-deep-blue-100">
              {history.items.map((h: any) => (
                <div key={h.id} className="space-y-1 pb-3 border-b border-deep-blue-50 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-deep-blue-700">{h.title}</span>
                    <span className="text-xs text-deep-blue-400">{formatDateTime(h.createdAt)}</span>
                  </div>
                  <p className="text-xs text-deep-blue-500 line-clamp-2">{h.content}</p>
                  {h.reply && (
                    <p className="text-xs text-ink-gold-600 bg-ink-gold-50/50 rounded p-2">回复：{h.reply}</p>
                  )}
                </div>
              ))}
              {history.items.length === 0 && (
                <div className="text-sm text-deep-blue-400 text-center py-4">暂无历史反馈</div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-deep-blue-50">
            <div>
              <label className="label">回复内容</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="请输入回复内容..."
                rows={4}
                className="input resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">取消</button>
              <button type="submit" className="btn-primary" disabled={!replyText.trim() || replyMutation.isPending}>
                <Send size={16} />
                发送回复
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
