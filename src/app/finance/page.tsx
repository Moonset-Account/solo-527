import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { BudgetChart } from '@/components/public/BudgetChart';
import { Wallet, TrendingUp, TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';
import { getBudgetWithExpenses, mockExpenses, mockDonations, mockSiteSettings } from '@/lib/mock/data';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';

export const metadata = {
  title: '资金使用 - 阳光助学计划',
  description: '阳光助学计划资金使用明细，公开透明，每一分钱都有迹可循',
};

export default function FinancePage() {
  const budgets = getBudgetWithExpenses();
  const totalBudget = mockSiteSettings.find(s => s.key === 'project_budget')?.value || 750000;
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDonations = mockDonations.reduce((sum, d) => sum + d.amount, 0);
  const remaining = totalBudget - totalExpenses;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24">
        <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-4 font-serif">资金使用</h1>
            <p className="text-xl text-white/80 max-w-2xl">
              公开透明是公益的基石。在这里，您可以看到每一分钱的来源和去向。
            </p>
          </div>
        </section>

        <section className="py-16 bg-warm-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-green-600 text-sm font-medium">+{(totalDonations / 10000).toFixed(0)}万</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">累计筹款</p>
                <p className="text-3xl font-bold text-gray-900 font-serif">{formatCurrency(totalDonations)}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-blue-600 text-sm font-medium">预算</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">年度预算</p>
                <p className="text-3xl font-bold text-gray-900 font-serif">{formatCurrency(totalBudget)}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-orange-600 text-sm font-medium">{Math.round((totalExpenses / totalBudget) * 100)}%</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">已支出</p>
                <p className="text-3xl font-bold text-gray-900 font-serif">{formatCurrency(totalExpenses)}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-purple-600 text-sm font-medium">剩余</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">可用预算</p>
                <p className="text-3xl font-bold text-gray-900 font-serif">{formatCurrency(remaining)}</p>
              </div>
            </div>
          </div>
        </section>

        <BudgetChart />

        <section className="py-20 bg-warm-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8 font-serif">支出明细</h2>
                <div className="space-y-4">
                  {budgets.map((budget) => {
                    const spent = budget.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
                    const percentage = budget.allocated_amount > 0 ? Math.round((spent / budget.allocated_amount) * 100) : 0;
                    return (
                      <div key={budget.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(spent)} / {formatCurrency(budget.allocated_amount)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          {budget.expenses?.slice(0, 3).map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{formatDate(expense.expense_date)}</span>
                                <span className="text-gray-900">{expense.description}</span>
                              </div>
                              <span className="font-medium text-gray-900">-{formatCurrency(expense.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8 font-serif">捐赠记录</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {mockDonations.slice(0, 10).map((donation, index) => (
                      <div key={donation.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {donation.is_anonymous ? '匿' : donation.donor_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {donation.is_anonymous ? '匿名爱心人士' : donation.donor_name}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(donation.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 flex items-center gap-1">
                              <ArrowUpRight className="w-4 h-4" />
                              +{formatCurrency(donation.amount)}
                            </p>
                          </div>
                        </div>
                        {donation.message && (
                          <p className="mt-3 text-sm text-gray-600 italic pl-14 border-l-2 border-primary-200 ml-2">
                            "{donation.message}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">
                  共 {formatNumber(mockDonations.length)} 笔捐赠，感谢每一位爱心人士
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4 font-serif">财务透明承诺</h3>
            <p className="text-lg text-gray-600 mb-8">
              我们承诺每一笔捐赠都将用于助学项目，定期公开财务报告，接受社会监督。
              所有支出均有完整的审批流程和票据记录，随时接受审计。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-warm-50 rounded-2xl">
                <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
                <p className="text-gray-600">专款专用</p>
              </div>
              <div className="p-6 bg-warm-50 rounded-2xl">
                <div className="text-4xl font-bold text-primary-600 mb-2">季度</div>
                <p className="text-gray-600">财务公示</p>
              </div>
              <div className="p-6 bg-warm-50 rounded-2xl">
                <div className="text-4xl font-bold text-primary-600 mb-2">年度</div>
                <p className="text-gray-600">独立审计</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
