'use client'

import { useMemo } from 'react'
import { api } from '@/trpc/react'
import { Package, FileText, AlertTriangle, Wallet, Handshake, Users, AlertCircle, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: stats } = api.risk.getDashboardStats.useQuery()
  const { data: riskStats } = api.risk.supplierRiskStats.useQuery()

  const statCards = useMemo(() => [
    { label: '活跃供应商', value: stats?.supplierCount ?? 0, href: '/admin/suppliers', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '生效协议', value: stats?.activeAgreements ?? 0, href: '/procurement/agreements', icon: Handshake, color: 'from-emerald-500 to-emerald-600' },
    { label: '待对账', value: stats?.pendingReconciliations ?? 0, href: '/reconciliation', icon: FileText, color: 'from-amber-500 to-amber-600' },
    { label: '待审批付款', value: stats?.pendingPayments ?? 0, href: '/reconciliation/payments', icon: Wallet, color: 'from-violet-500 to-violet-600' },
    { label: '未解决风险', value: stats?.unresolvedRisks ?? 0, href: '/risk', icon: AlertTriangle, color: 'from-rose-500 to-rose-600' },
    { label: '交付差异', value: stats?.deliveryDiscrepancies ?? 0, href: '/reconciliation', icon: XCircle, color: 'from-red-500 to-red-600' },
    { label: '付款差异', value: stats?.paymentDiscrepancies ?? 0, href: '/reconciliation/payment-discrepancies', icon: AlertCircle, color: 'from-orange-500 to-orange-600' },
    { label: '未读提醒', value: stats?.unreadAlerts ?? 0, href: '/risk/alerts', icon: AlertOctagon, color: 'from-cyan-500 to-cyan-600' },
  ], [stats])

  const riskBadge = (level: string, count: number) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    }
    if (!count) return null
    return (
      <span className={`badge ${colors[level]} font-medium`}>{count}</span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">工作台</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">办公耗材对账与供应商风险管理概览</p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {statCards.map((card) => {
          const CardIcon = card.icon
          return (
            <Link href={card.href} key={card.label} className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white p-2 mb-3 shadow-lg shadow-black/5 flex items-center justify-center`}>
                <CardIcon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold mb-1">{card.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{card.label}</div>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              供应商风险分布
            </h2>
            <Link href="/risk/board" className="text-sm text-primary hover:underline">查看看板 &rarr;</Link>
          </div>
          <div className="space-y-3">
            {riskStats && riskStats.length > 0 ? (
              riskStats.slice(0, 6).map((s) => (
                <div key={s.supplier.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Handshake className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.supplier.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">评级 {s.supplier.rating}/5</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {riskBadge('CRITICAL', s.critical)}
                    {riskBadge('HIGH', s.high)}
                    {riskBadge('MEDIUM', s.medium)}
                    {riskBadge('LOW', s.low)}
                    {s.unresolved === 0 && (
                      <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">无风险</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p>暂无供应商风险数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              快捷操作
            </h2>
          </div>
          <div className="grid gap-3 grid-cols-2">
            <Link href="/supply" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Package className="w-6 h-6 text-primary mb-2" />
              <div className="font-medium">耗材登记</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">规格与分类维护</div>
            </Link>
            <Link href="/supply/monthly" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <FileText className="w-6 h-6 text-primary mb-2" />
              <div className="font-medium">月度用量</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">录入月度使用数据</div>
            </Link>
            <Link href="/procurement/requirements" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <FileText className="w-6 h-6 text-primary mb-2" />
              <div className="font-medium">采购需求</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">提交和跟踪需求</div>
            </Link>
            <Link href="/reconciliation" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Wallet className="w-6 h-6 text-primary mb-2" />
              <div className="font-medium">对账处理</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">差异处理与付款建议</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
