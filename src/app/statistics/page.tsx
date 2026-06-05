'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Users,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface ProjectIncome {
  project: string;
  amount: number;
  percentage: number;
  color: string;
}

const mockMonthlyData: MonthlyData[] = [
  { month: '2023-09', income: 35000, expenses: 5000 },
  { month: '2023-10', income: 42000, expenses: 6000 },
  { month: '2023-11', income: 38000, expenses: 4500 },
  { month: '2023-12', income: 55000, expenses: 7000 },
  { month: '2024-01', income: 48000, expenses: 5500 },
  { month: '2024-02', income: 52000, expenses: 6000 },
];

const mockProjectIncome: ProjectIncome[] = [
  { project: '官网设计项目', amount: 25000, percentage: 35, color: 'bg-primary' },
  { project: '品牌VI设计', amount: 15000, percentage: 21, color: 'bg-blue-500' },
  { project: '移动App设计', amount: 20000, percentage: 29, color: 'bg-green-500' },
  { project: '其他项目', amount: 10000, percentage: 15, color: 'bg-purple-500' },
];

export default function StatisticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const totalIncome = mockMonthlyData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = mockMonthlyData.reduce((sum, d) => sum + d.expenses, 0);
  const netIncome = totalIncome - totalExpenses;
  const avgMonthly = totalIncome / mockMonthlyData.length;

  const maxIncome = Math.max(...mockMonthlyData.map((d) => d.income));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">收入统计</h1>
          <p className="text-slate-500 mt-1">可视化分析收入趋势、项目贡献和客户价值</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['month', 'quarter', 'year'] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setPeriod(p)}
                className={`h-8 ${period === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                {p === 'month' ? '月度' : p === 'quarter' ? '季度' : '年度'}
              </Button>
            ))}
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-green-600">总收入</p>
              <div className="p-2 rounded-lg bg-green-200/50">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              较上月 +12.5%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-red-600">总支出</p>
              <div className="p-2 rounded-lg bg-red-200/50">
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4" />
              较上月 -3.2%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-blue-600">净收入</p>
              <div className="p-2 rounded-lg bg-blue-200/50">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(netIncome)}</p>
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              较上月 +15.8%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-purple-600">月均收入</p>
              <div className="p-2 rounded-lg bg-purple-200/50">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-700">{formatCurrency(avgMonthly)}</p>
            <p className="text-sm text-purple-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              较去年 +22.1%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">收入趋势</h3>
                <p className="text-sm text-slate-500">近6个月收入变化</p>
              </div>
              <Button variant="ghost" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                图表
              </Button>
            </div>

            {isLoading ? (
              <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <div className="relative h-64">
                <div className="absolute inset-0 flex items-end gap-3">
                  {mockMonthlyData.map((data, i) => {
                    const height = (data.income / maxIncome) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '200px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all duration-500"
                            style={{ height: `${height}%` }}
                          />
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-red-400 to-red-300 rounded-t-lg opacity-50"
                            style={{ height: `${(data.expenses / maxIncome) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {data.month.split('-')[1]}月
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute top-0 right-0 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-slate-600">收入</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400 opacity-50" />
                    <span className="text-slate-600">支出</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">项目收入占比</h3>
                <p className="text-sm text-slate-500">按项目分类统计</p>
              </div>
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {mockProjectIncome.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium">{item.project}</span>
                      <span className="text-slate-900 font-semibold">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-right">{item.percentage}%</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">活跃项目</h3>
                <p className="text-sm text-slate-500">正在进行中的项目</p>
              </div>
              <Briefcase className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {[
                { name: '官网设计项目', progress: 75, amount: 50000 },
                { name: '品牌VI设计', progress: 40, amount: 30000 },
                { name: '移动App设计', progress: 60, amount: 80000 },
              ].map((project, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{project.name}</span>
                    <span className="text-sm text-slate-600">{formatCurrency(project.amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">{project.progress}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900">高价值客户</h3>
                <p className="text-sm text-slate-500">按累计收入排序</p>
              </div>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              {[
                { name: '阿里巴巴', total: 80000, projects: 3 },
                { name: '腾讯科技', total: 55000, projects: 2 },
                { name: '字节跳动', total: 45000, projects: 2 },
              ].map((client, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold">
                    {client.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{client.name}</p>
                    <p className="text-sm text-slate-500">{client.projects} 个项目</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(client.total)}</p>
                    <p className="text-xs text-green-600">累计收入</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
