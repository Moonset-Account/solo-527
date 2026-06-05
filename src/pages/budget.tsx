import useSWR from 'swr';
import Layout from '@/components/Layout';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, getBudgetCategoryLabel } from '@/lib/utils';

export default function BudgetPage() {
  const { data: projects } = useSWR('/api/projects');

  const projectList = projects?.data?.items || [];

  const categoryStats = [
    { category: '场地', estimated: 35000, actual: 35000, percentage: 100 },
    { category: '花艺', estimated: 25000, actual: 5000, percentage: 20 },
    { category: '摄影', estimated: 15000, actual: 0, percentage: 0 },
    { category: '餐饮', estimated: 60000, actual: 0, percentage: 0 },
    { category: '其他', estimated: 10000, actual: 0, percentage: 0 },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预算跟踪</h1>
          <p className="text-gray-500 mt-1">全面把控婚礼预算支出</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总预算</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(150000)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已支出</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(45000)}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">剩余预算</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(105000)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 text-green-600">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">支出占比</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">30%</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">分类预算统计</h2>
          </div>
          <div className="p-4 space-y-4">
            {categoryStats.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                  <div className="text-sm text-gray-500">
                    <span>{formatCurrency(item.actual)}</span>
                    <span className="mx-1">/</span>
                    <span>{formatCurrency(item.estimated)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">项目预算概览</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">总预算</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">已支出</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">剩余</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">进度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projectList.map((project: any) => {
                  const spent = Number(project.totalSpent);
                  const total = Number(project.totalBudget);
                  const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(project.totalBudget)}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-600 text-right">
                        {formatCurrency(project.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 text-right">
                        {formatCurrency(total - spent)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${percentage > 80 ? 'bg-red-500' : 'bg-primary-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
