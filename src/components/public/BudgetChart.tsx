'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getBudgetWithExpenses, getSettingByKey } from '@/lib/services/data';
import { formatCurrency } from '@/lib/utils/format';
import type { BudgetCategory } from '@/lib/types';

const COLORS = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

export function BudgetChart() {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [totalBudget, setTotalBudget] = useState(750000);

  useEffect(() => {
    Promise.all([
      getBudgetWithExpenses(),
      getSettingByKey('project_budget'),
    ]).then(([budgetsData, budgetValue]) => {
      setBudgets(budgetsData);
      if (budgetValue) setTotalBudget(Number(budgetValue));
    });
  }, []);
  const totalExpenses = budgets.reduce((sum, b) => sum + (b.expenses?.reduce((s, e) => s + e.amount, 0) || 0), 0);
  const remaining = totalBudget - totalExpenses;
  const executeRate = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  const pieData = budgets.map((b, i) => ({
    name: b.name,
    value: b.expenses?.reduce((s, e) => s + e.amount, 0) || 0,
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  const barData = budgets.map((b, i) => ({
    name: b.name,
    预算: b.allocated_amount,
    已支出: b.expenses?.reduce((s, e) => s + e.amount, 0) || 0,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 font-serif">资金使用</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            每一分钱都公开透明，让爱心落到实处
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
            <p className="text-white/80 text-sm mb-2">项目总预算</p>
            <p className="text-3xl font-bold font-serif">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-6 text-white">
            <p className="text-white/80 text-sm mb-2">已支出</p>
            <p className="text-3xl font-bold font-serif">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <p className="text-white/80 text-sm mb-2">剩余预算</p>
            <p className="text-3xl font-bold font-serif">{formatCurrency(remaining)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
            <p className="text-white/80 text-sm mb-2">执行率</p>
            <p className="text-3xl font-bold font-serif">{executeRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-warm-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 font-serif text-center">支出分类占比</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-warm-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 font-serif text-center">预算与执行对比</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={8}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="预算" fill="#E5E7EB" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="已支出" fill="#F97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
