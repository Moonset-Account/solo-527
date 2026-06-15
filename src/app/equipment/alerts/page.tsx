'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Cpu, RotateCcw } from 'lucide-react'
import type { DeactivationAlert } from '@/types'
import AppShell from '@/components/layout/AppShell'

const MOCK_ACTIVE: DeactivationAlert[] = [
  { id: 'a1', instrument_id: 'ins5', reason: '校准维护，预计3个工作日恢复', resolved: false, deactivated_at: '2024-03-16T08:00:00Z', resolved_at: null, resolved_by: null, instrument: { id: 'ins5', name: 'DSC差示扫描量热仪', category: '热分析', status: 'disabled', teacher_id: 't3', location: 'B202', specifications: {}, created_at: '' } },
  { id: 'a2', instrument_id: 'ins7', reason: '激光源故障，等待厂家维修', resolved: false, deactivated_at: '2024-03-15T14:00:00Z', resolved_at: null, resolved_by: null, instrument: { id: 'ins7', name: 'Raman光谱仪', category: '成分分析', status: 'disabled', teacher_id: 't2', location: 'C102', specifications: {}, created_at: '' } },
  { id: 'a3', instrument_id: 'ins8', reason: '冷却系统异常，暂停使用', resolved: false, deactivated_at: '2024-03-14T10:30:00Z', resolved_at: null, resolved_by: null, instrument: { id: 'ins8', name: 'TGA热重分析仪', category: '热分析', status: 'disabled', teacher_id: 't3', location: 'B203', specifications: {}, created_at: '' } },
]

const MOCK_RESOLVED: DeactivationAlert[] = [
  { id: 'a4', instrument_id: 'ins1', reason: '例行维护保养', resolved: true, deactivated_at: '2024-03-10T09:00:00Z', resolved_at: '2024-03-11T16:00:00Z', resolved_by: 'admin1', instrument: { id: 'ins1', name: 'XRD衍射仪', category: '结构分析', status: 'available', teacher_id: 't1', location: 'A301', specifications: {}, created_at: '' } },
  { id: 'a5', instrument_id: 'ins2', reason: '电子枪更换', resolved: true, deactivated_at: '2024-03-05T08:00:00Z', resolved_at: '2024-03-07T14:00:00Z', resolved_by: 'admin1', instrument: { id: 'ins2', name: 'SEM扫描电镜', category: '形貌分析', status: 'available', teacher_id: 't2', location: 'A302', specifications: {}, created_at: '' } },
  { id: 'a6', instrument_id: 'ins3', reason: '软件升级', resolved: true, deactivated_at: '2024-03-01T10:00:00Z', resolved_at: '2024-03-01T15:00:00Z', resolved_by: 't1', instrument: { id: 'ins3', name: 'FTIR红外光谱仪', category: '成分分析', status: 'available', teacher_id: 't1', location: 'B201', specifications: {}, created_at: '' } },
  { id: 'a7', instrument_id: 'ins6', reason: '氘灯更换', resolved: true, deactivated_at: '2024-02-28T09:00:00Z', resolved_at: '2024-02-28T12:00:00Z', resolved_by: 't1', instrument: { id: 'ins6', name: 'UV-Vis紫外分光光度计', category: '光学分析', status: 'available', teacher_id: 't1', location: 'C101', specifications: {}, created_at: '' } },
  { id: 'a8', instrument_id: 'ins4', reason: '真空系统检修', resolved: true, deactivated_at: '2024-02-20T08:00:00Z', resolved_at: '2024-02-22T16:00:00Z', resolved_by: 't2', instrument: { id: 'ins4', name: 'TEM透射电镜', category: '形貌分析', status: 'available', teacher_id: 't2', location: 'A303', specifications: {}, created_at: '' } },
]

const AFFECTED_BOOKINGS: Record<string, number> = { a1: 3, a2: 7, a3: 2 }

export default function AlertsPage() {
  const [active, setActive] = useState(MOCK_ACTIVE)
  const [showResolved, setShowResolved] = useState(false)

  const handleRecover = (id: string) => {
    setActive(prev => prev.filter(a => a.id !== id))
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="page-title mb-4">停用警报</h1>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="section-title">活跃警报</h2>
          <span className="badge-danger">{active.length}</span>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="card text-center py-12 mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-500">当前没有活跃的停用警报</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {active.map(alert => (
            <div key={alert.id} className="card border-l-4 border-l-red-500">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="relative mt-0.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-pulse-ring" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{alert.instrument?.name}</span>
                      <span className="text-xs text-slate-400">{alert.instrument?.location}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{alert.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        停用时间: {new Date(alert.deactivated_at).toLocaleString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        影响预约数: {AFFECTED_BOOKINGS[alert.id] || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRecover(alert.id)}
                  className="btn-primary text-sm shrink-0 ml-4"
                >
                  <RotateCcw className="w-4 h-4" />
                  确认恢复
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          {showResolved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          已解决警报 ({MOCK_RESOLVED.length})
        </button>

        {showResolved && (
          <div className="space-y-3">
            {MOCK_RESOLVED.map(alert => (
              <div key={alert.id} className="card border-l-4 border-l-emerald-500 opacity-75">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{alert.instrument?.name}</span>
                      <span className="text-xs text-slate-400">{alert.instrument?.location}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">{alert.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>停用: {new Date(alert.deactivated_at).toLocaleDateString('zh-CN')}</span>
                      <span>恢复: {new Date(alert.resolved_at!).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
