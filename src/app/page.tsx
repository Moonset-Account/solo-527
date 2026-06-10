import UserLayout from '@/components/user/UserLayout';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  CreditCard,
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  FileText,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function HomePage() {
  const currentPlan = {
    name: '专业版',
    status: 'ACTIVE',
    price: 299,
    interval: '月付',
    seatsUsed: 3,
    seatsTotal: 20,
    nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const usageProgress = 65;
  const nextBillAmount = 299;

  const recentInvoices = [
    { id: 'inv_001', invoiceNumber: 'INV-2024-000002', amount: 299, status: 'PAID', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'inv_002', invoiceNumber: 'INV-2024-000001', amount: 299, status: 'PAID', date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'inv_003', invoiceNumber: 'INV-2024-000003', amount: 299, status: 'DRAFT', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const notifications = [
    { id: 1, type: 'usage', title: '用量已达 65%', message: '本周期 API 调用量已达 65,000/100,000', time: '2小时前' },
    { id: 2, type: 'billing', title: '下期账单生成', message: '2024年8月账单 ¥299.00 已生成', time: '1天前' },
    { id: 3, type: 'trial', title: '席位邀请待处理', message: 'chen@example.com 尚未接受席位邀请', time: '3天前' },
  ];

  return (
    <UserLayout>
      <div className="page-container">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-slate-900">
            欢迎回来，张三 👋
          </h1>
          <p className="mt-2 text-slate-500">
            以下是您的订阅概览，点击各模块可查看详细信息。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="当前套餐"
            value={currentPlan.name}
            icon={<CreditCard className="w-6 h-6" />}
            subtitle={`${formatCurrency(currentPlan.price)}/${currentPlan.interval}`}
            className="animate-slide-up"
          />
          <StatCard
            title="下期账单"
            value={formatCurrency(nextBillAmount)}
            icon={<Calendar className="w-6 h-6" />}
            subtitle={`到期日: ${formatDate(currentPlan.nextBillingDate)}`}
            className="animate-slide-up"
            style={{ animationDelay: '50ms' } as React.CSSProperties}
          />
          <StatCard
            title="席位使用"
            value={`${currentPlan.seatsUsed}/${currentPlan.seatsTotal}`}
            icon={<Users className="w-6 h-6" />}
            subtitle="活跃席位"
            trend={{ value: '新增 1 个', positive: true }}
            className="animate-slide-up"
            style={{ animationDelay: '100ms' } as React.CSSProperties}
          />
          <StatCard
            title="用量进度"
            value={`${usageProgress}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            subtitle="本周期使用量"
            className="animate-slide-up"
            style={{ animationDelay: '150ms' } as React.CSSProperties}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-slate-900">订阅详情</h2>
                <Link href="/pricing" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  升级套餐
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex items-start justify-between p-5 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-slate-900">{currentPlan.name}</h3>
                      <StatusBadge status={currentPlan.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDate(currentPlan.currentPeriodStart)} - {formatDate(currentPlan.nextBillingDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-slate-900">{formatCurrency(currentPlan.price)}</p>
                  <p className="text-sm text-slate-500">每月</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    计费周期
                  </div>
                  <p className="font-semibold text-slate-900">月度订阅</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                    <Users className="w-4 h-4" />
                    席位数量
                  </div>
                  <p className="font-semibold text-slate-900">{currentPlan.seatsTotal} 席</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">本周期用量</span>
                  <span className="font-medium text-slate-700">{usageProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${usageProgress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-slate-400">65,000 / 100,000 API 调用</p>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-slate-900">最近账单</h2>
                <Link href="/billing" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  查看全部
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentInvoices.map((invoice, index) => (
                  <Link
                    key={invoice.id}
                    href={`/billing/${invoice.id}`}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-slate-500">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</p>
                      <StatusBadge status={invoice.status} />
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-slate-900">快捷操作</h2>
              </div>
              <div className="space-y-3">
                <Link href="/pricing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-50 transition-colors group">
                  <div className="p-2 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">升级套餐</p>
                    <p className="text-xs text-slate-500">解锁更多高级功能</p>
                  </div>
                </Link>
                <Link href="/seats" className="flex items-center gap-3 p-3 rounded-lg hover:bg-success-50 transition-colors group">
                  <div className="p-2 rounded-lg bg-success-100 text-success-600 group-hover:bg-success-200 transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">邀请成员</p>
                    <p className="text-xs text-slate-500">添加团队席位</p>
                  </div>
                </Link>
                <Link href="/billing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-warning-50 transition-colors group">
                  <div className="p-2 rounded-lg bg-warning-100 text-warning-600 group-hover:bg-warning-200 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">导出账单</p>
                    <p className="text-xs text-slate-500">下载发票记录</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-slate-900">通知提醒</h2>
                <span className="badge-danger badge">3 条</span>
              </div>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-full h-fit ${
                      notif.type === 'usage' ? 'bg-warning-100 text-warning-600' :
                      notif.type === 'billing' ? 'bg-primary-100 text-primary-600' :
                      'bg-accent-100 text-accent-600'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
