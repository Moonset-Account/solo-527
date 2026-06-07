import {
  Briefcase,
  FileText,
  Users,
  Award,
  UserCheck,
  Clock,
  Percent,
  ThumbsUp,
  Download,
  FileDown,
  Image,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import KPICard from '../components/cards/KPICard';
import ChartCard from '../components/charts/ChartCard';
import FunnelChart from '../components/charts/FunnelChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import { exportToCSV, exportToPDF, exportScreenshot } from '../utils/export';
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { formatPercent, formatDays, CHART_PALETTE } from '../utils/format';

export default function Dashboard() {
  const { getKPIData, filteredCandidates } = useStore();
  const kpi = getKPIData();
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(filteredCandidates, '招聘数据');
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF('dashboard-content', '招聘仪表盘');
    } finally {
      setExporting(false);
    }
  };

  const handleScreenshot = async () => {
    setExporting(true);
    try {
      await exportScreenshot('dashboard-content', '招聘仪表盘截图');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="dashboard-content" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">仪表盘概览</h1>
          <p className="mt-1 text-sm text-slate-500">招聘流程效率实时分析</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FileDown size={16} />
            导出CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={16} />
            导出PDF
          </button>
          <button
            onClick={handleScreenshot}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
          >
            <Image size={16} />
            截图导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <KPICard
          title="职位发布数"
          value={kpi.positionCount}
          unit="个"
          icon={Briefcase}
          color="blue"
          trend={12.5}
          trendLabel="较上月"
        />
        <KPICard
          title="简历总数"
          value={kpi.resumeCount}
          unit="份"
          icon={FileText}
          color="green"
          trend={8.3}
          trendLabel="较上月"
        />
        <KPICard
          title="面试次数"
          value={kpi.interviewCount}
          unit="次"
          icon={Users}
          color="orange"
          trend={-2.1}
          trendLabel="较上月"
        />
        <KPICard
          title="发放Offer"
          value={kpi.offerCount}
          unit="个"
          icon={Award}
          color="purple"
          trend={15.7}
          trendLabel="较上月"
        />
        <KPICard
          title="成功入职"
          value={kpi.onboardCount}
          unit="人"
          icon={UserCheck}
          color="green"
          trend={18.2}
          trendLabel="较上月"
        />
        <KPICard
          title="平均招聘周期"
          value={formatDays(kpi.avgCycleDays)}
          icon={Clock}
          color="red"
          trend={-5.4}
          trendLabel="较上月"
        />
        <KPICard
          title="简历入职转化率"
          value={formatPercent(kpi.conversionRate)}
          icon={Percent}
          color="blue"
          trend={3.2}
          trendLabel="较上月"
        />
        <KPICard
          title="Offer接受率"
          value={formatPercent(kpi.offerAcceptRate)}
          icon={ThumbsUp}
          color="purple"
          trend={-1.8}
          trendLabel="较上月"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <ChartCard
          title="招聘趋势分析"
          subtitle="按月展示各阶段数据变化"
          className="col-span-2"
          onExport={handleExportCSV}
        >
          <TrendLineChart />
        </ChartCard>
        <ChartCard
          title="招聘转化漏斗"
          subtitle="从简历到入职的转化流程"
          onExport={handleExportCSV}
        >
          <FunnelChart />
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <ChartCard
          title="部门招聘效率对比"
          subtitle="各部门招聘数据统计"
          onExport={handleExportCSV}
        >
          <DepartmentBarChart />
        </ChartCard>
        <ChartCard
          title="招聘官效率排名"
          subtitle="按入职人数排序"
          onExport={handleExportCSV}
        >
          <RecruiterRankingChart />
        </ChartCard>
      </div>
    </div>
  );
}

function DepartmentBarChart() {
  const { filteredCandidates, departments } = useStore();

  const deptData = departments.map(dept => {
    const deptCandidates = filteredCandidates.filter(c => c.departmentId === dept.id);
    return {
      name: dept.name,
      resume: deptCandidates.length,
      interview: deptCandidates.filter(c =>
        ['interview_1', 'interview_2', 'interview_3', 'offer', 'onboard'].includes(c.currentStage)
      ).length,
      offer: deptCandidates.filter(c =>
        ['offer', 'onboard'].includes(c.currentStage)
      ).length,
      hired: deptCandidates.filter(c => c.status === 'hired').length,
    };
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['简历数', '面试数', 'Offer数', '入职数'],
      bottom: 0,
      textStyle: { fontSize: 11, color: '#64748b' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '18%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: deptData.map(d => d.name),
      axisLabel: { color: '#64748b', fontSize: 11, rotate: 15 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    series: [
      { name: '简历数', type: 'bar', data: deptData.map(d => d.resume), itemStyle: { color: CHART_PALETTE[0], borderRadius: [4, 4, 0, 0] } },
      { name: '面试数', type: 'bar', data: deptData.map(d => d.interview), itemStyle: { color: CHART_PALETTE[1], borderRadius: [4, 4, 0, 0] } },
      { name: 'Offer数', type: 'bar', data: deptData.map(d => d.offer), itemStyle: { color: CHART_PALETTE[3], borderRadius: [4, 4, 0, 0] } },
      { name: '入职数', type: 'bar', data: deptData.map(d => d.hired), itemStyle: { color: CHART_PALETTE[2], borderRadius: [4, 4, 0, 0] } },
    ],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}

function RecruiterRankingChart() {
  const { filteredCandidates, recruiters } = useStore();

  const recData = recruiters.map(rec => {
    const recCandidates = filteredCandidates.filter(c => c.recruiterId === rec.id);
    return {
      name: rec.name,
      hired: recCandidates.filter(c => c.status === 'hired').length,
      total: recCandidates.length,
    };
  }).sort((a, b) => b.hired - a.hired);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const d = recData[params[0].dataIndex];
        return `${d.name}<br/>入职: ${d.hired}人<br/>总简历: ${d.total}份`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: recData.map(d => d.name),
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barWidth: '55%',
        data: recData.map((d, i) => ({
          value: d.hired,
          itemStyle: { color: CHART_PALETTE[i % CHART_PALETTE.length], borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#64748b',
          fontSize: 11,
          formatter: '{c}人',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
