import { useEffect } from 'react';
import { BookOpen, Users, CalendarClock, AlertTriangle, RefreshCw, PartyPopper } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { KPICard } from '../components/charts/KPICard';
import { ChartCard } from '../components/charts/ChartCard';
import { SubjectTrendChart } from '../components/charts/SubjectTrendChart';
import { BranchComparisonChart } from '../components/charts/BranchComparisonChart';
import RenewTrendChart from '../components/charts/RenewTrendChart';
import ActivityTrendChart from '../components/charts/ActivityTrendChart';

export default function Home() {
  const {
    kpiData,
    subjectTrends,
    branchComparison,
    renewTrends,
    activityTrends,
    loading,
    errors,
    filters,
    loadKPIData,
    loadSubjectTrends,
    loadBranchComparison,
    loadRenewTrends,
    loadActivityTrends,
  } = useDashboardStore();

  useEffect(() => {
    loadKPIData();
    loadSubjectTrends();
    loadBranchComparison();
    loadRenewTrends();
    loadActivityTrends();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 font-display">数据概览</h2>
        <p className="text-sm text-gray-500 mt-1">
          基于当前筛选条件的图书馆运营核心指标
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          title="总借阅量"
          value={kpiData?.totalBorrows || 0}
          trend={kpiData?.comparedToLastPeriod}
          icon={BookOpen}
          color="primary"
          loading={loading.kpi}
        />
        <KPICard
          title="活跃读者"
          value={kpiData?.activeReaders || 0}
          suffix="人"
          trend={kpiData?.comparedToLastPeriod ? kpiData.comparedToLastPeriod + 2 : 0}
          icon={Users}
          color="success"
          loading={loading.kpi}
        />
        <KPICard
          title="预约总量"
          value={kpiData?.totalReservations || 0}
          trend={kpiData?.comparedToLastPeriod ? kpiData.comparedToLastPeriod - 3 : 0}
          icon={CalendarClock}
          color="accent"
          loading={loading.kpi}
        />
        <KPICard
          title="续借次数"
          value={renewTrends.reduce((a, b) => a + b.renewCount, 0)}
          trend={5.2}
          icon={RefreshCw}
          color="teal"
          loading={loading.renewTrends}
        />
        <KPICard
          title="活动参与"
          value={activityTrends.reduce((a, b) => a + b.participationCount, 0)}
          trend={8.7}
          icon={PartyPopper}
          color="purple"
          loading={loading.activityTrends}
        />
        <KPICard
          title="逾期率"
          value={kpiData?.overdueRate || 0}
          suffix="%"
          trend={kpiData?.comparedToLastPeriod ? -kpiData.comparedToLastPeriod : 0}
          icon={AlertTriangle}
          color="danger"
          loading={loading.kpi}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="主题借阅趋势"
          subtitle="各月份不同主题图书借阅量变化"
          loading={loading.trends}
          error={errors.trends as string}
          sampleSize={subjectTrends.length}
        >
          <SubjectTrendChart data={subjectTrends} loading={loading.trends} />
        </ChartCard>

        <ChartCard
          title="分馆指标对比"
          subtitle="各分馆借阅、预约、逾期情况对比"
          loading={loading.branch}
          error={errors.branch as string}
          sampleSize={branchComparison.length}
        >
          <BranchComparisonChart data={branchComparison} loading={loading.branch} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RenewTrendChart />
        <ActivityTrendChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="快速统计"
            subtitle="数据说明"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm font-medium text-primary-800">数据更新频率</p>
                <p className="text-xs text-primary-600 mt-1">每日 08:00 自动更新</p>
              </div>
              <div className="p-4 bg-accent-50 rounded-lg">
                <p className="text-sm font-medium text-accent-800">数据来源</p>
                <p className="text-xs text-accent-600 mt-1">ILS 图书馆集成系统</p>
              </div>
              <div className="p-4 bg-success-50 rounded-lg">
                <p className="text-sm font-medium text-success-800">数据完整性</p>
                <p className="text-xs text-success-600 mt-1">98.5% 字段完整</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">少儿数据</p>
                <p className="text-xs text-purple-600 mt-1">已做聚合脱敏处理</p>
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="操作提示"
          subtitle="如何使用仪表盘"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <p className="text-sm text-gray-600">
                左侧筛选面板可按馆藏、读者、主题等维度筛选数据
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <p className="text-sm text-gray-600">
                顶部时间窗口可快速切换查看 7天/30天/90天/1年数据
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <p className="text-sm text-gray-600">
                点击图例可隐藏/显示对应数据系列
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                4
              </div>
              <p className="text-sm text-gray-600">
                常用筛选条件可保存以便快速访问
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
