import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ChartCard } from '../components/charts/ChartCard';
import { AgeGroupChart } from '../components/charts/AgeGroupChart';
import { Users, BookOpen, Activity, ShieldCheck, UserCheck } from 'lucide-react';

export default function Readers() {
  const { ageGroupData, kpiData, loading, errors, filters, loadAgeGroupData } =
    useDashboardStore();

  useEffect(() => {
    loadAgeGroupData();
  }, [filters]);

  const childrenGroups = ageGroupData.filter((d) => d.isChildrenGroup);
  const childrenReaderCount = childrenGroups.reduce((sum, g) => sum + g.readerCount, 0);
  const childrenBorrowCount = childrenGroups.reduce((sum, g) => sum + g.totalBorrows, 0);

  const readerStats = [
    {
      label: '活跃读者总数',
      value: kpiData?.activeReaders || 0,
      suffix: '人',
      icon: Users,
      color: 'text-primary-600 bg-primary-50',
    },
    {
      label: '少儿读者（聚合）',
      value: childrenReaderCount,
      suffix: '人',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: '人均借阅量',
      value: (kpiData?.totalBorrows || 0) / (kpiData?.activeReaders || 1),
      suffix: '册',
      icon: BookOpen,
      color: 'text-accent-600 bg-accent-50',
    },
    {
      label: '活动参与率',
      value: 68.5,
      suffix: '%',
      icon: Activity,
      color: 'text-success-600 bg-success-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 font-display">读者分析</h2>
        <p className="text-sm text-gray-500 mt-1">
          读者年龄段分布及借阅行为分析。少儿数据已做聚合保护。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {readerStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 font-display">
                  {typeof stat.value === 'number' ? stat.value.toFixed(1) : stat.value}
                  <span className="text-sm text-gray-500 font-normal ml-1">{stat.suffix}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="读者年龄段分析"
          subtitle="各年龄段读者人数及借阅量对比"
          loading={loading.ageGroups}
          error={errors.ageGroups as string}
          sampleSize={ageGroupData.length}
        >
          <AgeGroupChart data={ageGroupData} loading={loading.ageGroups} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="读者分组构成" subtitle="不同职业/身份读者占比">
          <div className="space-y-4">
            {[
              { group: '学生', count: 185, percentage: 37, color: 'bg-primary-500' },
              { group: '企业职员', count: 120, percentage: 24, color: 'bg-accent-500' },
              { group: '教师/公务员', count: 85, percentage: 17, color: 'bg-success-500' },
              { group: '退休人员', count: 55, percentage: 11, color: 'bg-purple-500' },
              { group: '少儿读者', count: 55, percentage: 11, color: 'bg-pink-500' },
            ].map((item) => (
              <div key={item.group}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.group}</span>
                  <span className="font-medium text-gray-800">
                    {item.count}人 ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="少儿数据保护说明" subtitle="未成年人隐私保护措施">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-800">数据聚合保护</p>
                <p className="text-xs text-purple-600 mt-1">
                  12岁以下少儿读者的借阅记录仅以年龄段聚合形式展示，不提供单条记录查询，不暴露任何个人阅读记录。
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4 text-success-500" />
                <span>仅展示年龄段统计数据</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4 text-success-500" />
                <span>不支持少儿记录下钻查询</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4 text-success-500" />
                <span>原始记录脱敏处理存储</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCheck className="w-4 h-4 text-success-500" />
                <span>符合《未成年人保护法》要求</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">少儿借阅汇总：</span>
                <br />
                0-12岁少儿读者共 <span className="font-semibold text-purple-600">{childrenReaderCount}</span> 人，
                累计借阅 <span className="font-semibold text-purple-600">{childrenBorrowCount}</span> 册次。
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
