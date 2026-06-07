import { useState, useEffect, useCallback } from "react";
import { X, Plus, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store";
import type { AnomalyAnnotation } from "@/types";

export default function AnnotationPanel() {
  const { annotationPanelOpen, toggleAnnotationPanel, role, setAnnotations } = useAppStore();
  const annotations = useAppStore((s) => s.annotations);
  const [newComment, setNewComment] = useState("");
  const [newStage, setNewStage] = useState("");
  const [newMetric, setNewMetric] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAnnotations = useCallback(async () => {
    try {
      const headers: Record<string, string> = { "X-User-Role": role };
      const res = await fetch("/api/annotations", { headers });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        setAnnotations(data as AnomalyAnnotation[]);
      }
    } catch {}
  }, [role, setAnnotations]);

  useEffect(() => {
    if (annotationPanelOpen) {
      fetchAnnotations();
    }
  }, [annotationPanelOpen, fetchAnnotations]);

  if (!annotationPanelOpen) return null;

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-User-Role": role,
      };
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          stage: newStage || "整体",
          metric: newMetric || "通用",
          value: 0,
          comment: newComment.trim(),
          createdBy: "当前用户",
        }),
      });
      if (res.ok) {
        setNewComment("");
        setNewStage("");
        setNewMetric("");
        await fetchAnnotations();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-primary-dark/95 backdrop-blur-md border-l border-accent-cyan/15 shadow-2xl animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-accent-cyan/10">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-anomaly-orange" />
          <h3 className="text-sm font-semibold text-white">异常注释</h3>
        </div>
        <button
          onClick={toggleAnnotationPanel}
          className="p-1.5 rounded-lg hover:bg-secondary-bg text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {role !== "interviewer" && (
        <div className="p-4 border-b border-accent-cyan/10">
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                placeholder="阶段"
                className="flex-1 bg-secondary-bg/60 border border-accent-cyan/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-accent-cyan/40"
              />
              <input
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
                placeholder="指标"
                className="flex-1 bg-secondary-bg/60 border border-accent-cyan/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-accent-cyan/40"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="添加注释..."
                className="flex-1 bg-secondary-bg/60 border border-accent-cyan/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-accent-cyan/40"
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={loading}
                className="px-3 py-1.5 bg-accent-cyan/20 text-accent-cyan rounded-lg text-xs hover:bg-accent-cyan/30 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Plus size={12} />
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto h-[calc(100vh-10rem)] p-4 space-y-3">
        {annotations.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">暂无注释</div>
        ) : (
          annotations
            .slice()
            .reverse()
            .map((ann) => (
              <div
                key={ann.id}
                className="glass-card p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs data-font text-anomaly-orange">{ann.stage}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-secondaryAccent-blue">{ann.metric}</span>
                  </div>
                  <span className="text-[10px] data-font text-slate-500">{ann.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.comment}</p>
                <div className="text-[10px] text-slate-500">{ann.createdBy}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
