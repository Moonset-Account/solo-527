import { TrendingUp, DollarSign, Star } from 'lucide-react';
import { useStore } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import ChannelQualityChart from '../components/charts/ChannelQualityChart';
import { exportToCSV } from '../utils/export';
import ReactECharts from 'echarts-for-react';
import { CHART_PALETTE, formatPercent } from '../utils/format';
import { STAGE_ORDER, STAGE_NAMES } from '../data/mockData';

export default function ChannelPage() {
  const { getChannelQualityData, filteredCandidates } = useStore();
  const channelData = getChannelQualityData();

  const handleExportCSV = () => {
    exportToCSV(filteredCandidates, '渠道质量数据');
  };

  const topChannel = channelData[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">渠道质量分析</h1>
          <p className="mt-1 text-sm text-slate-500">各招聘渠道转化效果和成本效益分析</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">渠道总数</p>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{channelData.length}<span className="text-sm font-normal text-slate-500 ml-1">个</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">最佳渠道</p>
            <Star size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{topChannel?.channelName || '-'}</p>
          <p className="mt-1 text-xs text-emerald-600">质量评分 {topChannel?.qualityScore || 0}分</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">平均入职率</p>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {channelData.length > 0 ? formatPercent(channelData.reduce((a, b) => a + b.onboardRate, 0) / channelData.length) : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">平均招聘成本</p>
            <DollarSign size={18} className="text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            ¥{channelData.length > 0 ? Math.round(channelData.reduce((a, b) => a + b.costPerHire, 0) / channelData.length) : '-'}
          </p>
          <p className="mt-1 text-xs text-slate-400">元/人</p>
        </div>
      </div>

      <ChartCard
        title="渠道综合质量对比"
        subtitle="简历量、转化率、质量评分多维对比"
        onExport={handleExportCSV}
      >
        <ChannelQualityChart />
      </ChartCard>

      <div className="grid grid-cols-2 gap-5">
        <ChartCard
          title="渠道转化漏斗对比"
          subtitle="各渠道从简历到入职的转化"
          onExport={handleExportCSV}
        >
          <ChannelFunnelCompareChart />
        </ChartCard>
        <ChartCard
          title="成本效益分析"
          subtitle="各渠道人均招聘成本与入职率"
          onExport={handleExportCSV}
        >
          <CostEfficiencyChart />
        </ChartCard>
      </div>

      <ChartCard
        title="渠道详细数据"
        subtitle="各渠道数据明细"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-3 font-medium text-slate-600">渠道名称</th>
                <th className="pb-3 font-medium text-slate-600">简历数</th>
                <th className="pb-3 font-medium text-slate-600">面试率</th>
                <th className="pb-3 font-medium text-slate-600">Offer率</th>
                <th className="pb-3 font-medium text-slate-600">入职率</th>
                <th className="pb-3 font-medium text-slate-600">人均成本</th>
                <th className="pb-3 font-medium text-slate-600">质量评分</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((ch, idx) => (
                <tr key={ch.channelId} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }} />
                      <span className="font-medium text-slate-800">{ch.channelName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-700">{ch.resumeCount}</td>
                  <td className="py-3 text-slate-700">{formatPercent(ch.interviewRate)}</td>
                  <td className="py-3 text-slate-700">{formatPercent(ch.offerRate)}</td>
                  <td className="py-3 text-slate-700">{formatPercent(ch.onboardRate)}</td>
                  <td className="py-3 text-slate-700">¥{ch.costPerHire}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      ch.qualityScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                      ch.qualityScore >= 50 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ch.qualityScore}分
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function ChannelFunnelCompareChart() {
  const { getChannelQualityData } = useStore();
  const channelData = getChannelQualityData();

  const stages = Object.values(STAGE_NAMES).slice(0, 5);

  const series = channelData.slice(0, 4).map((ch, idx) => ({
    name: ch.channelName,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    data: [ch.resumeCount, Math.round(ch.resumeCount * ch.interviewRate / 100), Math.round(ch.resumeCount * ch.offerRate / 100), Math.round(ch.resumeCount * ch.onboardRate / 100), ch.resumeCount > 0 ? Math.round(ch.resumeCount * ch.onboardRate / 100 * 0.8) : 0],
    lineStyle: { width: 2, color: CHART_PALETTE[idx] },
    itemStyle: { color: CHART_PALETTE[idx] },
  }));

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: channelData.slice(0, 4).map(c => c.channelName), bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
    grid: { left: '3%', right: '4%', bottom: '18%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: stages, axisLabel: { color: '#64748b', fontSize: 11, rotate: 15 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series,
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}

function CostEfficiencyChart() {
  const { getChannelQualityData } = useStore();
  const channelData = getChannelQualityData();

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const d = channelData[params.dataIndex];
        return `${d.channelName}<br/>入职率: ${d.onboardRate}%<br/>人均成本: ¥${d.costPerHire}<br/>简历数: ${d.resumeCount}`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
    xAxis: { type: 'value', name: '入职率(%)', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLine: { show: false } },
    yAxis: { type: 'value', name: '人均成本(元)', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLine: { show: false } },
    series: [{
      type: 'scatter',
      symbolSize: (data: number[]) => data[2] * 2 + 10,
      data: channelData.map((d, i) => [d.onboardRate, d.costPerHire, d.resumeCount, {
        itemStyle: { color: CHART_PALETTE[i % CHART_PALETTE.length] },
      }]),
    }],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
