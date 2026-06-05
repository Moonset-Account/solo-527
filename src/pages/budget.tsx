import { useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Filter,
} from 'lucide-react';
import {
  formatCurrency,
  getBudgetCategoryLabel,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils';

const statusFilters = [
  { value: '', label: '全部项目' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
];

export default function BudgetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: projectsData, isLoading } = useSWR(
    `/api/projects${statusFilter ? `?status=${statusFilter}` : ''}`
  );

  const projectList = projectsData?.data?.items || [];

  const totalBudget = projectList.reduce(
    (sum: number, p: any) => sum + (Number(p.totalBudget) || 0),
    0
  );
  const totalSpent = projectList.reduce((sum: number, p: any) => {
    const budgetItems = p.budgetItems || [];
    return sum + budgetItems.reduce((s: number, b: any) => s + (Number(b.actual) || 0), 0);
  }, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spendPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const categoryStats = projectList.reduce((acc: any, p: any) => {
    const budgetItems = p.budgetItems || [];
    budgetItems.forEach((item: any) => {
      if (!acc[item.category]) {
        acc[item.category] = { estimated: 0, actual: 0 };
      }
      acc[item.category].estimated += Number(item.estimated) || 0;
      acc[item.category].actual += Number(item.actual) || 0;
    });
    return acc;
  }, {});

  const categoryList = Object.entries(categoryStats).map(([category, data]: [string, any]) => ({
    category,
    estimated: data.estimated,
    actual: data.actual,
    percentage: data.estimated > 0 ? Math.round((data.actual / data.estimated) * 100) : 0,
  }));

  const canViewInternal = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预算跟踪</h1>
          <p className="text-gray-500 mt-1">全面把控婚礼预算支出</p>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总预算</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalBudget)}
                </p>
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
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(totalSpent)}
                </p>
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
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totalRemaining)}
                </p>
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
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {spendPercentage}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <PieChart className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {categoryList.length > 0 && (
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">分类预算统计</h2>
            </div>
            <div className="p-4 space-y-4">
              {categoryList.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getBudgetCategoryLabel(item.category)}
                    </span>
                    <div className="text-sm text-gray-500">
                      <span>{formatCurrency(item.actual)}</span>
                      <span className="mx-1">/</span>
                      <span>{formatCurrency(item.estimated)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.percentage > 80 ? 'bg-red-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">项目预算概览</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    项目名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    总预算
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    已支出
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    剩余
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    进度
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-4">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
                      </td>
                    </tr>
                  ))
                ) : projectList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      暂无项目数据
                    </td>
                  </tr>
                ) : (
                  projectList.map((project: any) => {
                    const budgetItems = project.budgetItems || [];
                    const spent = budgetItems.reduce(
                      (s: number, b: any) => s + (Number(b.actual) || 0),
                      0
                    );
                    const total = Number(project.totalBudget) || 0;
                    const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;
                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}?tab=budget`)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {project.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(project.totalBudget)}
                        </td>
                        <td className="px-4 py-3 text-sm text-orange-600 text-right">
                          {formatCurrency(spent)}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 text-right">
                          {formatCurrency(total - spent)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  percentage > 80 ? 'bg-red-500' : 'bg-primary-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!canViewInternal && (
          <div className="card p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-700">
              💡 提示：部分内部费用项已对您隐藏，以上统计仅包含对外报价部分。
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
