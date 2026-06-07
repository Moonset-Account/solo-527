import { MessageSquare, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import { exportToCSV } from '../utils/export';
import ReactECharts from 'echarts-for-react';
import { CHART_PALETTE, STAGE_COLORS } from '../utils/format';
import { STAGE_ORDER, STAGE_NAMES } from '../data/mockData';

export default function FeedbackPage() {
  const { filteredCandidates } = useStore();
  const candidatesWithFeedback = filteredCandidates.filter(c => c.feedback);

  const avgSatisfaction = candidatesWithFeedback.length > 0
    ? candidatesWithFeedback.reduce((sum, c) => sum + (c.feedback?.satisfaction || 0), 0) / candidatesWithFeedback.length
    : 0;

  const handleExportCSV = () => {
    exportToCSV(filteredCandidates, '候选人反馈数据');
  };

  const keywordCounts: Record<string, number> = {};
  candidatesWithFeedback.forEach(c => {
    c.feedback?.keywords.forEach(kw => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
  });
  const topKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">候选人反馈</h1>
          <p className="mt-1 text-sm text-slate-500">候选人体验和满意度分析</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">反馈总数</p>
            <MessageSquare size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{candidatesWithFeedback.length}<span className="text-sm font-normal text-slate-500 ml-1">份</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">平均满意度</p>
            <Star size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-center gap-1">
            <p className="text-2xl font-bold text-slate-800">{avgSatisfaction.toFixed(1)}</p>
            <div className="ml-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className={i < Math.round(avgSatisfaction) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">好评率</p>
            <ThumbsUp size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {candidatesWithFeedback.length > 0 ? Math.round(candidatesWithFeedback.filter(c => (c.feedback?.satisfaction || 0) >= 4).length / candidatesWithFeedback.length * 100) : 0}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">差评率</p>
            <ThumbsDown size={18} className="text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {candidatesWithFeedback.length > 0 ? Math.round(candidatesWithFeedback.filter(c => (c.feedback?.satisfaction || 0) <= 2).length / candidatesWithFeedback.length * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <ChartCard
          title="满意度分布"
          subtitle="各分数段人数分布"
          className="col-span-2"
          onExport={handleExportCSV}
        >
          <SatisfactionBarChart />
        </ChartCard>

        <ChartCard
          title="热门关键词"
          subtitle="候选人反馈高频词"
        >
          <div className="flex flex-wrap gap-2 p-4">
            {topKeywords.map(([kw, count], idx) => (
              <span
                key={kw}
                className="rounded-full px-3 py-1 text-sm"
                style={{
                  backgroundColor: `${CHART_PALETTE[idx % CHART_PALETTE.length]}15`,
                  color: CHART_PALETTE[idx % CHART_PALETTE.length],
                  fontSize: `${12 + count * 2}px`,
                }}
              >
                #{kw}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="各阶段满意度对比"
        subtitle="不同阶段的候选人满意度评分"
        onExport={handleExportCSV}
      >
        <StageSatisfactionChart />
      </ChartCard>

      <ChartCard
        title="最新反馈"
        subtitle="候选人的真实评价"
      >
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {candidatesWithFeedback.slice(0, 6).map(c => (
            <div key={c.id} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.positionName} · {STAGE_NAMES[c.feedback?.stage || 'resume']}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < (c.feedback?.satisfaction || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">"{c.feedback?.comments}"</p>
              {c.feedback?.keywords && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.feedback.keywords.map((kw, i) => (
                    <span key={i} className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 border border-slate-200">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function SatisfactionBarChart() {
  const { filteredCandidates } = useStore();

  const scores = [1, 2, 3, 4, 5];
  const counts = scores.map(s => filteredCandidates.filter(c => c.feedback?.satisfaction === s).length);

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: scores.map(s => `${s}星`), axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      data: counts.map((c, i) => ({
        value: c,
        itemStyle: { color: ['#E63946', '#F77F00', '#4CC9F0', '#00B4D8', '#2A9D8F'][i], borderRadius: [8, 8, 0, 0] },
      })),
      barWidth: '50%',
      label: { show: true, position: 'top', color: '#64748b', fontSize: 12 },
    }],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}

function StageSatisfactionChart() {
  const { filteredCandidates } = useStore();

  const data = STAGE_ORDER.map((stage: string) => {
    const stageCandidates = filteredCandidates.filter(c => c.feedback?.stage === stage);
    const avg = stageCandidates.length > 0
      ? stageCandidates.reduce((sum, c) => sum + (c.feedback?.satisfaction || 0), 0) / stageCandidates.length
      : 0;
    return { stage: STAGE_NAMES[stage], avg: Math.round(avg * 10) / 10 };
  });

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.stage), axisLabel: { color: '#64748b', rotate: 20 } },
    yAxis: { type: 'value', min: 0, max: 5, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'line',
      smooth: true,
      data: data.map(d => d.avg),
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#2A9D8F40' }, { offset: 1, color: '#2A9D8F05' }] } },
      lineStyle: { width: 2.5, color: '#2A9D8F' },
      itemStyle: { color: '#2A9D8F' },
      symbol: 'circle',
      symbolSize: 8,
    }],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
