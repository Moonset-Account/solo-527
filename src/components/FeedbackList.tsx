"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Pagination } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateTime } from "@/lib/utils";
import { FeedbackReply } from "@/components/FeedbackReply";
import { Search, Mail, MailOpen, CheckCheck, MessageSquare, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackStatus = "UNREAD" | "READ" | "";

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

export function FeedbackList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<FeedbackStatus>("");
  const [keyword, setKeyword] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const utils = trpc.useUtils();
  const markRead = trpc.feedback.markRead.useMutation({
    onSuccess: () => utils.feedback.list.invalidate(),
  });

  const { data } = trpc.feedback.list.useQuery({
    page, pageSize: 10,
    status: status || undefined,
    keyword: keyword || undefined,
  });

  const items: FeedbackItem[] = (data?.items ?? []) as FeedbackItem[];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkAllRead = () => {
    const unreadIds = items.filter((f) => f.status === "UNREAD").map((f) => f.id);
    if (unreadIds.length > 0) markRead.mutate(unreadIds);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-4 cursor-pointer transition-all hover:shadow-md" onClick={() => { setStatus(""); setPage(1); }}>
          <div className="flex items-center justify-between mb-2">
            <MessageSquare size={18} className={cn(status === "" ? "text-ink-gold-500" : "text-deep-blue-400")} />
            <span className={cn("chip", status === "" ? "bg-ink-gold-500 text-white" : "bg-deep-blue-50 text-deep-blue-600")}>全部</span>
          </div>
          <div className="text-2xl font-bold text-deep-blue-700 num">{data?.total ?? 0}</div>
          <div className="text-[11px] text-deep-blue-400 mt-1">总反馈数</div>
        </div>
        <div className="card p-4 cursor-pointer transition-all hover:shadow-md" onClick={() => { setStatus("UNREAD"); setPage(1); }}>
          <div className="flex items-center justify-between mb-2">
            <Mail size={18} className={cn(status === "UNREAD" ? "text-alert-red" : "text-deep-blue-400")} />
            <span className={cn("chip", status === "UNREAD" ? "bg-alert-red text-white" : "bg-red-50 text-alert-red")}>未读</span>
          </div>
          <div className={cn("text-2xl font-bold num", status === "UNREAD" ? "text-alert-red" : "text-deep-blue-700")}>{unreadCount}</div>
          <div className="text-[11px] text-deep-blue-400 mt-1">待处理反馈</div>
        </div>
        <div className="card p-4 cursor-pointer transition-all hover:shadow-md" onClick={() => { setStatus("READ"); setPage(1); }}>
          <div className="flex items-center justify-between mb-2">
            <MailOpen size={18} className={cn(status === "READ" ? "text-success-green" : "text-deep-blue-400")} />
            <span className={cn("chip", status === "READ" ? "bg-success-green text-white" : "bg-green-50 text-success-green")}>已读</span>
          </div>
          <div className={cn("text-2xl font-bold num", status === "READ" ? "text-success-green" : "text-deep-blue-700")}>
            {Math.max(0, (data?.total ?? 0) - unreadCount)}
          </div>
          <div className="text-[11px] text-deep-blue-400 mt-1">已处理反馈</div>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-deep-blue-400" />
          <div className="inline-flex items-center gap-1 p-1 bg-deep-blue-50/60 rounded-lg">
            {([
              { v: "", label: "全部" },
              { v: "UNREAD", label: "未读" },
              { v: "READ", label: "已读" },
            ] as const).map((t) => (
              <button
                key={t.v}
                onClick={() => { setStatus(t.v); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  status === t.v
                    ? "bg-white text-deep-blue-700 shadow-sm"
                    : "text-deep-blue-500 hover:text-deep-blue-700",
                )}
              >{t.label}</button>
            ))}
          </div>
          <div className="relative w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue-300" />
            <input
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索标题/内容/学生..."
              className="input pl-9 !py-1.5 text-xs"
            />
          </div>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="btn-secondary !py-1.5 text-xs"
        >
          <CheckCheck size={13} />全部标记已读
        </button>
      </div>

      <div className="space-y-2">
        {items.map((f) => (
          <div
            key={f.id}
            onClick={() => setSelectedFeedback(f)}
            className={cn(
              "card p-4 cursor-pointer transition-all hover:shadow-md",
              f.status === "UNREAD" && "border-l-4 !border-l-alert-red"
            )}
          >
            <div className="flex gap-4">
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
                f.status === "UNREAD"
                  ? "bg-gradient-to-br from-alert-red/80 to-alert-red text-white"
                  : "bg-gradient-to-br from-deep-blue-400 to-deep-blue-600 text-white"
              )}>
                {f.avatarInitial}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-sm font-semibold text-deep-blue-700">{f.studentName}</span>
                    <span className="chip bg-deep-blue-50 text-deep-blue-600 text-[11px]">{f.className}</span>
                    <StatusChip variant={f.status === "UNREAD" ? "warn" : "default"} pulse={f.status === "UNREAD"} size="sm">
                      {f.status === "UNREAD" ? "未读" : "已读"}
                    </StatusChip>
                    {f.reply && (
                      <span className="chip bg-ink-gold-50 text-ink-gold-600 text-[11px] border border-ink-gold-100">
                        已回复
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-deep-blue-400 flex-shrink-0">{formatDateTime(f.createdAt)}</span>
                </div>
                <div className="text-sm font-medium text-deep-blue-700 truncate">{f.title}</div>
                <p className="text-xs text-deep-blue-500 line-clamp-2 leading-relaxed">{f.content}</p>
                {f.reply && (
                  <div className="bg-ink-gold-50/50 rounded-lg p-3 border border-ink-gold-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-ink-gold-700">{f.repliedBy} 回复</span>
                      <span className="text-[11px] text-deep-blue-400">
                        {f.repliedAt ? formatDateTime(f.repliedAt) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-deep-blue-600 line-clamp-1">{f.reply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="card p-12 text-center text-sm text-deep-blue-400">
            <MailOpen size={40} className="mx-auto mb-3 text-deep-blue-200" />
            暂无反馈记录
          </div>
        )}
      </div>

      {data && <Pagination page={page} pageSize={10} total={data.total} onPageChange={setPage} />}

      {selectedFeedback && (
        <FeedbackReply
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onReplied={() => { utils.feedback.list.invalidate(); setSelectedFeedback(null); }}
        />
      )}
    </div>
  );
}
