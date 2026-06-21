"use client";

import { useState } from "react";
import { ImageIcon, Star, MessageSquare, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/DataTable";

interface WorkItem {
  id: string;
  title: string;
  imageUrl: string;
  studentId: string;
  studentName: string;
  submittedAt: Date;
  remark?: string;
  latestFeedback?: {
    id: string;
    overallScore: number;
    compositionScore: number;
    colorScore: number;
    creativityScore: number;
    techniqueScore: number;
    comment: string;
    teacherId: string;
    createdAt: Date;
  };
}

interface WorksGalleryProps {
  works: WorkItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const SCORE_COLORS = [
  { threshold: 90, bg: "bg-green-50", text: "text-success-green", ring: "ring-green-200" },
  { threshold: 75, bg: "bg-ink-gold-50", text: "text-ink-gold-600", ring: "ring-ink-gold-200" },
  { threshold: 60, bg: "bg-orange-50", text: "text-warn-orange", ring: "ring-orange-200" },
  { threshold: 0, bg: "bg-red-50", text: "text-alert-red", ring: "ring-red-200" },
];

function getScoreStyle(score: number) {
  return SCORE_COLORS.find((s) => score >= s.threshold) || SCORE_COLORS[SCORE_COLORS.length - 1];
}

export function WorksGallery({ works, total, page, pageSize, onPageChange }: WorksGalleryProps) {
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const start = (page - 1) * pageSize;
  const pagedWorks = works.slice(start, start + pageSize);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-deep-blue-500">
          共 <span className="num text-deep-blue-700 font-medium">{total}</span> 幅作品
        </div>
        <button className="btn-primary text-xs">
          <ImageIcon size={14} />
          上传作品
        </button>
      </div>

      {pagedWorks.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="text-deep-blue-200 mb-4">
            <ImageIcon size={48} strokeWidth={1.2} />
          </div>
          <div className="text-deep-blue-500 font-medium mb-1">暂无作品</div>
          <div className="text-sm text-deep-blue-400">学员作品提交后将展示在这里</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pagedWorks.map((work) => {
            const score = work.latestFeedback?.overallScore ?? 0;
            const scoreStyle = score > 0 ? getScoreStyle(score) : null;
            return (
              <div
                key={work.id}
                onClick={() => setSelectedWork(work)}
                className="card overflow-hidden cursor-pointer group hover:shadow-card-hover transition-all"
              >
                <div className="relative aspect-[4/3] bg-deep-blue-50 overflow-hidden">
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white/90 backdrop-blur text-deep-blue-700 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <Eye size={11} />
                      查看
                    </span>
                  </div>
                  {scoreStyle && (
                    <div className={cn(
                      "absolute top-2 right-2 num text-sm font-bold w-9 h-9 rounded-full flex items-center justify-center ring-2 shadow-sm",
                      scoreStyle.bg, scoreStyle.text, scoreStyle.ring,
                    )}>
                      {score}
                    </div>
                  )}
                  {!work.latestFeedback && (
                    <div className="absolute top-2 right-2 chip bg-warn-orange text-white border-0 text-[10px]">
                      待点评
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-deep-blue-800 text-sm truncate flex-1">
                      {work.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-deep-blue-500">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-ink-gold-400 to-ink-gold-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {work.studentName?.charAt(0) || "?"}
                      </div>
                      <span>{work.studentName}</span>
                    </div>
                    <span className="num text-deep-blue-400 text-[11px]">
                      {formatDate(work.submittedAt, "MM-dd")}
                    </span>
                  </div>
                  {work.latestFeedback?.comment && (
                    <div className="text-xs text-deep-blue-500 line-clamp-2 bg-deep-blue-50/50 rounded-md p-2 border border-deep-blue-50">
                      💬 {work.latestFeedback.comment}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      )}

      {selectedWork && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedWork(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2">
              <div className="aspect-square md:aspect-auto md:h-full bg-deep-blue-50 relative">
                <img
                  src={selectedWork.imageUrl}
                  alt={selectedWork.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[90vh]">
                <div>
                  <h3 className="font-serif font-bold text-xl text-deep-blue-800 mb-1">
                    {selectedWork.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-deep-blue-500">
                    <span>👤 {selectedWork.studentName}</span>
                    <span className="num">📅 {formatDate(selectedWork.submittedAt, "yyyy-MM-dd")}</span>
                  </div>
                </div>

                {selectedWork.remark && (
                  <div className="card-gold p-3 text-sm text-deep-blue-600">
                    📝 {selectedWork.remark}
                  </div>
                )}

                {selectedWork.latestFeedback ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-deep-blue-700 flex items-center gap-2">
                      <Star className="text-ink-gold-500" size={16} fill="currentColor" />
                      教师点评
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "构图", score: selectedWork.latestFeedback.compositionScore ?? 0 },
                        { label: "色彩", score: selectedWork.latestFeedback.colorScore ?? 0 },
                        { label: "创意", score: selectedWork.latestFeedback.creativityScore ?? 0 },
                        { label: "技法", score: selectedWork.latestFeedback.techniqueScore ?? 0 },
                        { label: "综合", score: selectedWork.latestFeedback.overallScore ?? 0 },
                      ].map((item, i) => {
                        const style = getScoreStyle(item.score);
                        return (
                          <div key={i} className={cn("rounded-lg p-2 text-center", style.bg)}>
                            <div className={cn("num text-xl font-bold", style.text)}>{item.score}</div>
                            <div className="text-[10px] text-deep-blue-500 mt-0.5">{item.label}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="card p-3 text-sm text-deep-blue-600 leading-relaxed">
                      {selectedWork.latestFeedback.comment}
                    </div>
                    <button className="btn-secondary w-full text-xs">
                      <MessageSquare size={12} />
                      查看点评历史
                    </button>
                  </div>
                ) : (
                  <div className="card-gold p-4 text-center">
                    <div className="text-warn-orange mb-2">
                      <Star size={24} />
                    </div>
                    <div className="text-deep-blue-700 font-medium mb-1">等待教师点评</div>
                    <div className="text-xs text-deep-blue-500 mb-3">该作品尚未收到教师评语</div>
                    <button className="btn-gold text-xs">
                      ✏️ 立即点评
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedWork(null)}
                  className="btn-secondary w-full text-xs"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
