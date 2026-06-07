import { Users, Clock, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import InterviewerLoadChart from '../components/charts/InterviewerLoadChart';
import { exportToCSV } from '../utils/export';
import { CHART_PALETTE } from '../utils/format';

export default function InterviewerPage() {
  const { getInterviewerLoadData, filteredCandidates } = useStore();
  const loadData = getInterviewerLoadData();
  const totalInterviews = loadData.reduce((sum, d) => sum + d.interviewCount, 0);
  const totalHours = loadData.reduce((sum, d) => sum + d.totalHours, 0);
  const avgPerPerson = loadData.length > 0 ? totalInterviews / loadData.length : 0;

  const handleExportCSV = () => {
    exportToCSV(filteredCandidates, '面试官负载数据');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">面试官负载</h1>
          <p className="mt-1 text-sm text-slate-500">面试官工作量统计和面试安排分析</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">面试官总数</p>
            <Users size={18} className="text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{loadData.length}<span className="text-sm font-normal text-slate-500 ml-1">人</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">面试总次数</p>
            <Calendar size={18} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{totalInterviews}<span className="text-sm font-normal text-slate-500 ml-1">次</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">面试总时长</p>
            <Clock size={18} className="text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{totalHours.toFixed(1)}<span className="text-sm font-normal text-slate-500 ml-1">小时</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">人均面试数</p>
            <Users size={18} className="text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{avgPerPerson.toFixed(1)}<span className="text-sm font-normal text-slate-500 ml-1">次/人</span></p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <ChartCard
          title="面试官工作量排名"
          subtitle="按面试次数排序 TOP10"
          className="col-span-2"
          onExport={handleExportCSV}
        >
          <InterviewerLoadChart />
        </ChartCard>

        <ChartCard
          title="部门面试分布"
          subtitle="各部门面试次数占比"
        >
          <DepartmentInterviewPie />
        </ChartCard>
      </div>

      <ChartCard
        title="面试官详细负载"
        subtitle="各面试官工作明细"
        onExport={handleExportCSV}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="pb-3 font-medium text-slate-600">面试官</th>
                <th className="pb-3 font-medium text-slate-600">部门</th>
                <th className="pb-3 font-medium text-slate-600">面试次数</th>
                <th className="pb-3 font-medium text-slate-600">总时长(小时)</th>
                <th className="pb-3 font-medium text-slate-600">周均次数</th>
                <th className="pb-3 font-medium text-slate-600">负载状态</th>
              </tr>
            </thead>
            <tbody>
              {loadData.map((iv, idx) => (
                <tr key={iv.interviewerId} className="border-b border-slate-100 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white" style={{ backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}>
                        {iv.interviewerName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{iv.interviewerName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-700">{iv.department}</td>
                  <td className="py-3 text-slate-700">{iv.interviewCount}次</td>
                  <td className="py-3 text-slate-700">{iv.totalHours}</td>
                  <td className="py-3 text-slate-700">{iv.avgPerWeek}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      iv.avgPerWeek > 3 ? 'bg-red-100 text-red-700' :
                      iv.avgPerWeek > 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {iv.avgPerWeek > 3 ? '过载' : iv.avgPerWeek > 2 ? '适中' : '空闲'}
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

function DepartmentInterviewPie() {
  const { getInterviewerLoadData } = useStore();
  const loadData = getInterviewerLoadData();
  const ReactECharts = require('echarts-for-react').default;

  const deptStats: Record<string, number> = {};
  loadData.forEach(iv => {
    deptStats[iv.department] = (deptStats[iv.department] || 0) + iv.interviewCount;
  });

  const data = Object.entries(deptStats).map(([name, value], idx) => ({
    name,
    value,
    itemStyle: { color: CHART_PALETTE[idx % CHART_PALETTE.length] },
  }));

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: '#64748b' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data,
    }],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
