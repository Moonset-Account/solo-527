import { useState, useRef } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/store";
import { useApi } from "@/hooks/useApi";
import type { FunnelStage, ChannelMetrics, InterviewerLoad } from "@/types";

const stageLabels: Record<string, string> = {
  posted: "发布",
  applied: "简历",
  screened: "初筛",
  interviewed: "面试",
  offered: "Offer",
  hired: "入职",
};

function FilterSummary({ filters }: { filters: import("@/types").FilterParams }) {
  const items: { label: string; value: string }[] = [];

  if (filters.positions.length > 0) items.push({ label: "职位", value: filters.positions.join(", ") });
  if (filters.departments.length > 0) items.push({ label: "部门", value: filters.departments.join(", ") });
  if (filters.recruiters.length > 0) items.push({ label: "招聘官", value: filters.recruiters.join(", ") });
  if (filters.channels.length > 0) items.push({ label: "渠道", value: filters.channels.join(", ") });
  if (filters.stages.length > 0) items.push({ label: "阶段", value: filters.stages.map((s) => stageLabels[s] || s).join(", ") });
  items.push({ label: "时间", value: `${filters.dateRange.start} ~ ${filters.dateRange.end}` });

  return (
    <div className="space-y-2 text-xs text-slate-400">
      {items.map(({ label, value }) => (
        <div key={label}>{label}: <span className="text-slate-300">{value}</span></div>
      ))}
    </div>
  );
}

export default function Report() {
  const { filters } = useAppStore();
  const previewRef = useRef<HTMLDivElement>(null);

  const [reportPeriod, setReportPeriod] = useState("week");
  const [modules, setModules] = useState({
    funnel: true,
    duration: true,
    channel: true,
    workload: false,
  });
  const [desensitized, setDesensitized] = useState(true);

  const { data: funnelData } = useApi<FunnelStage[]>("/funnel", filters);
  const { data: channelData } = useApi<ChannelMetrics[]>("/channels", filters);
  const { data: workloadData } = useApi<InterviewerLoad[]>("/workload", filters);

  const toggleModule = (key: keyof typeof modules) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: "#0A1628",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`招聘报告_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleExportPNG = async () => {
    if (!previewRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: "#0A1628",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `招聘报告_${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in">
      <div className="xl:col-span-1 space-y-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">报告配置</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">报告周期</label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full bg-secondary-bg/60 border border-accent-cyan/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-accent-cyan/40"
              >
                <option value="week">周报</option>
                <option value="month">月报</option>
                <option value="quarter">季报</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">包含模块</label>
              <div className="space-y-2">
                {[
                  { key: "funnel" as const, label: "招聘漏斗" },
                  { key: "duration" as const, label: "阶段耗时" },
                  { key: "channel" as const, label: "渠道分析" },
                  { key: "workload" as const, label: "面试官负载" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        modules[key]
                          ? "bg-accent-cyan border-accent-cyan"
                          : "border-slate-500 group-hover:border-slate-400"
                      }`}
                      onClick={() => toggleModule(key)}
                    >
                      {modules[key] && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#0A1628" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">数据脱敏</label>
              <button
                onClick={() => setDesensitized(!desensitized)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-accent-cyan transition-colors"
              >
                {desensitized ? <EyeOff size={16} /> : <Eye size={16} />}
                {desensitized ? "已脱敏" : "未脱敏"}
              </button>
            </div>

            <div className="pt-3 border-t border-accent-cyan/10 space-y-2">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-cyan/20 text-accent-cyan rounded-lg text-sm hover:bg-accent-cyan/30 transition-colors"
              >
                <Download size={16} />
                导出 PDF
              </button>
              <button
                onClick={handleExportPNG}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary-bg/60 border border-accent-cyan/15 text-slate-300 rounded-lg text-sm hover:bg-secondary-bg transition-colors"
              >
                <Download size={16} />
                导出 PNG
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">筛选概要</h3>
          <FilterSummary filters={filters} />
        </div>
      </div>

      <div className="xl:col-span-3">
        <div
          ref={previewRef}
          className="bg-primary-dark border border-accent-cyan/10 rounded-lg p-8 min-h-[600px]"
          style={{ maxWidth: "210mm" }}
        >
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white mb-2">招聘流程效率报告</h1>
            <p className="text-sm text-slate-400 data-font">
              {filters.dateRange.start} ~ {filters.dateRange.end}
              {desensitized && (
                <span className="ml-2 text-xs text-warning-yellow">（数据已脱敏）</span>
              )}
            </p>
          </div>

          <div className="mb-6 px-4 py-3 bg-secondary-bg/40 border border-accent-cyan/10 rounded-lg">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">筛选口径</h4>
            <FilterSummary filters={filters} />
          </div>

          {modules.funnel && funnelData && (
            <div className="mb-8">
              <h2 className="text-base font-semibold text-accent-cyan mb-3">招聘漏斗</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-accent-cyan/10">
                    <th className="text-left py-2 text-slate-400 font-normal">阶段</th>
                    <th className="text-right py-2 text-slate-400 font-normal">数量</th>
                    <th className="text-right py-2 text-slate-400 font-normal">转化率</th>
                    <th className="text-right py-2 text-slate-400 font-normal">平均耗时</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelData.map((s) => (
                    <tr key={s.stage} className="border-b border-accent-cyan/5">
                      <td className="py-2 text-slate-300">{stageLabels[s.stage] || s.stage}</td>
                      <td className="py-2 text-right data-font text-white">{s.count.toLocaleString()}</td>
                      <td className="py-2 text-right data-font text-accent-cyan">{s.conversionRate.toFixed(1)}%</td>
                      <td className="py-2 text-right data-font text-slate-300">{s.avgDaysInStage.toFixed(1)}天</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {modules.channel && channelData && (
            <div className="mb-8">
              <h2 className="text-base font-semibold text-accent-cyan mb-3">渠道分析</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-accent-cyan/10">
                    <th className="text-left py-2 text-slate-400 font-normal">渠道</th>
                    <th className="text-right py-2 text-slate-400 font-normal">简历数</th>
                    <th className="text-right py-2 text-slate-400 font-normal">转化率</th>
                    <th className="text-right py-2 text-slate-400 font-normal">平均周期</th>
                    <th className="text-right py-2 text-slate-400 font-normal">单聘成本</th>
                  </tr>
                </thead>
                <tbody>
                  {channelData.map((ch) => (
                    <tr key={ch.channel} className="border-b border-accent-cyan/5">
                      <td className="py-2 text-slate-300">{ch.channel}</td>
                      <td className="py-2 text-right data-font text-white">{ch.totalApplied.toLocaleString()}</td>
                      <td className="py-2 text-right data-font text-accent-cyan">{ch.conversionRate.toFixed(1)}%</td>
                      <td className="py-2 text-right data-font text-slate-300">{ch.avgTimeToHire.toFixed(1)}天</td>
                      <td className="py-2 text-right data-font text-slate-300">¥{ch.costPerHire.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {modules.workload && workloadData && (
            <div className="mb-8">
              <h2 className="text-base font-semibold text-accent-cyan mb-3">面试官负载</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-accent-cyan/10">
                    <th className="text-left py-2 text-slate-400 font-normal">面试官</th>
                    <th className="text-right py-2 text-slate-400 font-normal">总场次</th>
                    <th className="text-right py-2 text-slate-400 font-normal">已完成</th>
                    <th className="text-right py-2 text-slate-400 font-normal">待反馈</th>
                    <th className="text-right py-2 text-slate-400 font-normal">完成率</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadData.map((w) => {
                    const name = desensitized
                      ? w.interviewerName.charAt(0) + "**"
                      : w.interviewerName;
                    const completed = Math.round(w.totalSessions * w.feedbackCompletionRate / 100);
                    const pending = w.totalSessions - completed;
                    return (
                      <tr key={w.interviewerId} className="border-b border-accent-cyan/5">
                        <td className="py-2 text-slate-300">{name}</td>
                        <td className="py-2 text-right data-font text-white">{w.totalSessions}</td>
                        <td className="py-2 text-right data-font text-success-green">{completed}</td>
                        <td className="py-2 text-right data-font text-warning-yellow">{pending}</td>
                        <td className="py-2 text-right data-font text-accent-cyan">{w.feedbackCompletionRate.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-center text-xs text-slate-500 mt-8 pt-4 border-t border-accent-cyan/5">
            报告生成时间: {new Date().toLocaleString("zh-CN")} · RecruitFlow
          </div>
        </div>
      </div>
    </div>
  );
}
