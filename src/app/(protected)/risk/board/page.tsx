'use client'

import { useState } from 'react'
import { api, useApiUtils } from '@/trpc/react'
import { AlertTriangle, ShieldCheck, AlertOctagon, Flame, Gauge, CheckCircle2, Users } from 'lucide-react'
import { formatDate, riskLevelConfig } from '@/lib/config'
import type { RiskLevel } from '@prisma/client'

export default function RiskBoardPage() {
  const [levelFilter, setLevelFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const utils = useApiUtils()

  const { data: entries = [] } = api.risk.listBoardEntries.useQuery({
    level: levelFilter || undefined,
    supplierId: supplierFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: riskStats = [] } = api.risk.supplierRiskStats.useQuery()
  const { data: suppliers = [] } = api.procurement.listSuppliers.useQuery({})

  const approve = api.risk.approveBoardEntry.useMutation({
    onSuccess: async () => {
      await utils.risk.listBoardEntries.invalidate()
      await utils.risk.listRisks.invalidate()
    },
  })

  const levels: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const statsByLevel = Object.fromEntries(levels.map(l => [l, entries.filter(e => e.level === l && e.status !== 'RESOLVED').length]))
  const totalActive = entries.filter(e => e.status !== 'RESOLVED').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">供应商风险看板</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          所有已批准的风险事件聚合展示，支持按等级、供应商、状态筛选
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="card p-5 border-2 border-primary/30">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Gauge className="w-4 h-4 text-primary" /> 活跃风险
          </div>
          <div className="text-3xl font-bold text-primary">{totalActive}</div>
        </div>
        {levels.map(l => (
          <div key={l} className={`card p-5 ${l === 'CRITICAL' ? 'border-2 border-red-300 dark:border-red-800' : ''}`}>
            <div className="flex items-center gap-2 text-sm mb-1">
              {l === 'CRITICAL' ? <Flame className="w-4 h-4 text-red-600" /> :
               l === 'HIGH' ? <AlertOctagon className="w-4 h-4 text-orange-500" /> :
               l === 'MEDIUM' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
               <ShieldCheck className="w-4 h-4 text-green-500" />}
              <span className={`badge ${riskLevelConfig[l].className}`}>{riskLevelConfig[l].label}</span>
            </div>
            <div className={`text-3xl font-bold ${riskLevelConfig[l].className.replace('bg-', 'text-').split(' ')[0]}`}>
              {statsByLevel[l]}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card p-4 h-fit">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> 供应商风险分布
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {riskStats && riskStats.filter(s => s.total > 0).length > 0 ? (
              riskStats.filter(s => s.total > 0).map(s => (
                <button
                  key={s.supplier.id}
                  onClick={() => setSupplierFilter(supplierFilter === s.supplier.id ? '' : s.supplier.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    supplierFilter === s.supplier.id
                      ? 'bg-primary text-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium truncate ${supplierFilter === s.supplier.id ? '' : ''}`}>
                      {s.supplier.name}
                    </span>
                    <span className={`text-xs font-medium shrink-0 ml-2 ${supplierFilter === s.supplier.id ? 'text-white/80' : 'text-slate-500'}`}>
                      {s.unresolved}/{s.total}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {s.critical > 0 && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">{s.critical}</span>}
                    {s.high > 0 && <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">{s.high}</span>}
                    {s.medium > 0 && <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">{s.medium}</span>}
                    {s.low > 0 && <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">{s.low}</span>}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                暂无风险
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="input w-full sm:w-40">
                  <option value="">全部等级</option>
                  {levels.map(l => <option key={l} value={l}>{riskLevelConfig[l].label}</option>)}
                </select>
                <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="input w-full sm:w-48">
                  <option value="">全部供应商</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
                  <option value="">全部状态</option>
                  <option value="PUBLISHED">已发布</option>
                  <option value="APPROVED">已批准</option>
                  <option value="RESOLVED">已解决</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {entries.map(e => (
              <div key={e.id} className={`card p-4 border-l-4 ${
                e.level === 'CRITICAL' ? 'border-l-red-500' :
                e.level === 'HIGH' ? 'border-l-orange-500' :
                e.level === 'MEDIUM' ? 'border-l-amber-500' :
                'border-l-green-500'
              }`}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge ${riskLevelConfig[e.level].className}`}>{riskLevelConfig[e.level].label}</span>
                      <span className="badge bg-slate-100 dark:bg-slate-800">{e.sourceType}</span>
                      {e.status === 'APPROVED' && <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3" />已批准</span>}
                      {e.status === 'RESOLVED' && <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">已解决</span>}
                    </div>
                    <h3 className="font-semibold truncate">{e.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.supplier.name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">{e.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{formatDate(e.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {e.approver ? <span>审批：{e.approver.name}</span> : e.status === 'PUBLISHED' && (
                      <button
                        onClick={() => approve.mutate({ id: e.id })}
                        disabled={approve.isPending}
                        className="btn-success py-1 px-2.5 text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" /> 批准
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="card p-12 text-center text-slate-500 dark:text-slate-400 lg:col-span-2">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                暂无风险看板条目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
