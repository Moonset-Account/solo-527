import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Download,
  BarChart3,
  PieChart,
  Target,
  FileJson,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Hash,
} from 'lucide-react';
import { mockEvaluationReport } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import type { EvaluationReport } from '#shared/types';

type PerFieldMetric = { precision: number; recall: number; f1: number; accuracy: number };

const fieldDisplayNames: Record<string, string> = {
  content: '内容',
  assignee: '负责人',
  dueDate: '截止日期',
  topic: '议题',
  priority: '优先级',
};

export default function Evaluation() {
  const report = mockEvaluationReport;

  const exportJsonl = () => {
    const samples = Array.from({ length: report.totalSamples }, (_, i) => ({
      id: `sample_${i + 1}`,
      meetingId: `m${(i % 5) + 1}`,
      prediction: {
        content: '示例行动项内容',
        assignee: '4',
        dueDate: '2026-07-15',
        topic: '技术方案',
        priority: i % 4 === 0 ? 'P0' : i % 4 === 1 ? 'P1' : i % 4 === 2 ? 'P2' : 'P3',
      },
      groundTruth: {
        content: '示例行动项内容',
        assignee: '4',
        dueDate: '2026-07-15',
        topic: '技术方案',
        priority: 'P1',
      },
      isCorrect: Math.random() > 0.12,
    }));
    const jsonl = samples.map((s) => JSON.stringify(s)).join('\n');
    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-samples-${report.modelVersion}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ringOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['58%', '82%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' },
      },
      labelLine: { show: false },
      data: [
        { value: Math.round(report.overall.f1 * 1000), name: 'F1', itemStyle: { color: '#1e3a8a' } },
        { value: 1000 - Math.round(report.overall.f1 * 1000), name: '剩余', itemStyle: { color: '#e2e8f0' } },
      ],
    }],
  }), [report]);

  const barOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['精确率', '召回率', 'F1', '准确率'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 40, right: 10, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Object.keys(report.perField).map((k) => fieldDisplayNames[k] || k),
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLabel: { formatter: (v: number) => (v * 100).toFixed(0) + '%', fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
    },
    series: [
      { name: '精确率', type: 'bar', barWidth: 14, data: Object.values(report.perField as Record<string, PerFieldMetric>).map((v) => v.precision), itemStyle: { color: '#1e3a8a', borderRadius: [4, 4, 0, 0] } },
      { name: '召回率', type: 'bar', barWidth: 14, data: Object.values(report.perField as Record<string, PerFieldMetric>).map((v) => v.recall), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } },
      { name: 'F1', type: 'bar', barWidth: 14, data: Object.values(report.perField as Record<string, PerFieldMetric>).map((v) => v.f1), itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] } },
      { name: '准确率', type: 'bar', barWidth: 14, data: Object.values(report.perField as Record<string, PerFieldMetric>).map((v) => v.accuracy), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
    ],
  }), [report]);

  const pieOption = useMemo(() => {
    const data = [
      { value: report.errorDistribution.lowConfidence, name: '低置信度', color: '#f97316' },
      { value: report.errorDistribution.missing, name: '字段缺失', color: '#ef4444' },
      { value: report.errorDistribution.wrongAssignee, name: '负责人错误', color: '#8b5cf6' },
      { value: report.errorDistribution.wrongDate, name: '日期错误', color: '#3b82f6' },
      { value: report.errorDistribution.other, name: '其他', color: '#64748b' },
    ];
    const total = data.reduce((s, d) => s + d.value, 0);
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 12 } },
      series: [{
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        labelLine: { length: 10, length2: 10 },
        data: data.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: { color: d.color },
        })),
      }],
      graphic: {
        type: 'text',
        left: '30%',
        top: '45%',
        style: {
          text: `总计\n${total}`,
          textAlign: 'center',
          fill: '#1e293b',
          fontSize: 16,
          fontWeight: 'bold',
          lineHeight: 22,
        },
      },
    };
  }, [report]);

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">质量评估</h1>
          <p className="text-sm text-slate-500 mt-1">
            模型 <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[12px]">{report.modelVersion}</code>
            {' · '}生成于 {new Date(report.generatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
        <button
          onClick={exportJsonl}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all"
        >
          <Download className="h-4.5 w-4.5" />
          导出 JSONL
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {[
          { label: '评估样本总数', value: report.totalSamples.toLocaleString(), unit: '条', icon: FileJson, gradient: 'from-blue-500 via-primary-500 to-primary-700', delta: 'Gold Standard' },
          { label: 'Overall 精确率', value: pct(report.overall.precision), icon: Target, gradient: 'from-emerald-400 to-emerald-600', delta: 'Precision' },
          { label: 'Overall 召回率', value: pct(report.overall.recall), icon: TrendingUp, gradient: 'from-violet-500 to-purple-600', delta: 'Recall' },
          { label: 'Overall F1', value: pct(report.overall.f1), icon: CheckCircle2, gradient: 'from-accent-500 to-orange-600', delta: 'F1-Score' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/60 border border-slate-100 hover:shadow-md transition-all">
              <div className={cn('absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-10 bg-gradient-to-br', s.gradient)} />
              <div className="relative flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">{s.value}<span className="text-base font-normal text-slate-400 ml-1">{s.unit || ''}</span></p>
                </div>
                <div className={cn(
                  'h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform',
                  s.gradient
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {s.delta}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Target className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Overall F1</h2>
              <p className="text-xs text-slate-500">综合表现</p>
            </div>
          </div>
          <div className="relative h-52 flex items-center justify-center">
            <ReactECharts option={ringOption} style={{ width: '100%', height: '100%' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-4xl font-bold text-primary-800">{pct(report.overall.f1)}</div>
              <div className="text-xs text-slate-500 mt-0.5">F1-Score</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-slate-100">
            <div className="text-center">
              <div className="text-sm font-bold text-primary-700">{pct(report.overall.precision)}</div>
              <div className="text-[11px] text-slate-500">精确率</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-violet-600">{pct(report.overall.recall)}</div>
              <div className="text-[11px] text-slate-500">召回率</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-emerald-600">{report.totalSamples}</div>
              <div className="text-[11px] text-slate-500">样本数</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">各字段指标对比</h2>
              <p className="text-xs text-slate-500">按字段维度拆解表现</p>
            </div>
          </div>
          <ReactECharts option={barOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <PieChart className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">错误类型分布</h2>
              <p className="text-xs text-slate-500">错误归因分析</p>
            </div>
          </div>
          <ReactECharts option={pieOption} style={{ height: 300 }} />
        </div>

        <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">改进建议</h2>
              <p className="text-xs text-slate-500">基于错误分布的优化方向</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { level: 'high', title: '低置信度样本数量较多 (256)', desc: '建议增加 Prompt 中关于置信度校准的说明，或针对负责人/议题字段微调模型。', icon: AlertCircle, color: 'bg-rose-50 border-rose-200 text-rose-700' },
              { level: 'medium', title: '字段缺失仍有改善空间 (124)', desc: '建议增加 few-shot 示例，覆盖边界场景，降低空值返回概率。', icon: AlertTriangle, color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { level: 'low', title: '负责人识别准确率最低 (81.2%)', desc: '可引入企业通讯录作为上下文，或增加后处理规则匹配发言人姓名。', icon: TrendingUp, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { level: 'info', title: '内容字段表现优秀 (94.1%)', desc: '内容提取的准确率和召回率均超过 92%，可作为基线持续保持。', icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ].map((it, i) => {
              const Icon = it.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    'group p-4 rounded-xl border cursor-default transition-all hover:shadow-md hover:-translate-y-0.5',
                    it.color
                  )}
                  style={{ backgroundColor: undefined }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/70 shadow-sm',
                      it.color.includes('rose') && 'text-rose-600',
                      it.color.includes('orange') && 'text-orange-600',
                      it.color.includes('amber') && 'text-amber-600',
                      it.color.includes('emerald') && 'text-emerald-600'
                    )}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{it.title}</div>
                      <div className="text-xs mt-1 opacity-85 leading-relaxed">{it.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
