import { Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import StageDurationChart from '../components/charts/StageDurationChart';
import { exportToCSV } from '../utils/export';
import { formatDate, CHART_PALETTE } from '../utils/format';

export default function EfficiencyPage() {
  const { getStageDurationData, filteredCandidates } = useStore();
  const durationData = getStageDurationData();

  const bottleneckStages = durationData.filter(d => d.avgDays > 7 || d.p90Days > 14);

  const handleExportCSV = () => {
    exportToCSV(filteredCandidates, '流程效率数据');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">流程效率分析</h1>
          <p className="mt-1 text-sm text-slate-500">分析各阶段耗时，识别招聘流程瓶颈</p>
        </div>
      </div>

      {bottleneckStages.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-orange-500" size={20} />
            <div>
              <h3 className="font-semibold text-orange-800">流程瓶颈预警</h3>
              <p className="mt-1 text-sm text-orange-700">
                以下阶段耗时超过标准值，建议重点关注：
                <span className="ml-2 font-medium">
                  {bottleneckStages.map(s => s.stage).join('、')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-5">
        {durationData.slice(0, 4).map((stage, idx) => (
          <div key={stage.stage} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stage.stage}</p>
              <Clock size={18} className={`${idx === 0 ? 'text-blue-500' : idx === 1 ? 'text-cyan-500' : idx === 2 ? 'text-emerald-500' : 'text-purple-500'}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-800">{stage.avgDays}<span className="text-sm font-normal text-slate-500 ml-1">天</span></p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">P90: <span className="font-medium text-slate-700">{stage.p90Days}天</span></span>
              <span className="text-slate-500">最快: <span className="font-medium text-emerald-600">{stage.minDays}天</span></span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <ChartCard
          title="各阶段耗时分析"
          subtitle="平均值、P75、P90分位对比"
          className="col-span-2"
          onExport={handleExportCSV}
        >
          <StageDurationChart />
        </ChartCard>

        <ChartCard
          title="异常流程列表"
          subtitle="超过标准耗时的流程"
        >
          <AnomalyList />
        </ChartCard>
      </div>

      <ChartCard
        title="阶段耗时分布"
        subtitle="箱线图展示各阶段耗时分布"
        onExport={handleExportCSV}
      >
        <DurationBoxplotChart />
      </ChartCard>
    </div>
  );
}

function AnomalyList() {
  const { filteredCandidates, setSelectedCandidate } = useStore();

  const anomalies = filteredCandidates
    .filter(c => c.stages.some(s => s.isAnomaly))
    .slice(0, 8);

  return (
    <div className="space-y-2 max-h-[340px] overflow-y-auto">
      {anomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <TrendingDown size={40} />
          <p className="mt-2 text-sm">暂无异常流程</p>
        </div>
      ) : (
        anomalies.map(c => {
          const anomalyStage = c.stages.find(s => s.isAnomaly);
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCandidate(c)}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">{c.positionName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-orange-600">{anomalyStage?.stageName}</p>
                <p className="text-xs text-slate-400">{formatDate(c.applyDate)}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DurationBoxplotChart() {
  const { getStageDurationData } = useStore();
  const ReactECharts = require('echarts-for-react').default;

  const data = getStageDurationData();

  const boxData = data.map(d => [d.minDays, Math.floor(d.avgDays * 0.7), d.medianDays, d.p75Days, d.maxDays]);
  const outliers = data.flatMap(d => {
    const iqr = d.p75Days - Math.floor(d.avgDays * 0.7);
    const upper = d.p75Days + 1.5 * iqr;
    if (d.maxDays > upper) {
      return [[data.indexOf(d), d.maxDays]];
    }
    return [];
  });

  const option = {
    tooltip: {
      trigger: 'item',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.stage),
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '天数',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '箱线图',
        type: 'boxplot',
        data: boxData,
        itemStyle: {
          color: CHART_PALETTE[0],
          borderColor: CHART_PALETTE[0],
        },
      },
      {
        name: '异常值',
        type: 'scatter',
        data: outliers,
        itemStyle: {
          color: '#F77F00',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '360px' }} />;
}
