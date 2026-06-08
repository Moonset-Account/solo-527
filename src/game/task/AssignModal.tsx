import { useState, useEffect } from 'react'
import { X, Minus, Plus, Clock, DollarSign, Heart, Users, Package } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { EVENT_TYPE_CONFIG } from '@/types/game'

interface AssignModalProps {
  taskId: string
  onClose: () => void
}

export default function AssignModal({ taskId, onClose }: AssignModalProps) {
  const { tasks, resources, assignResources } = useGameStore()
  const task = tasks.find((t) => t.id === taskId)
  const repairTeamRes = resources.find((r) => r.type === 'repair_team')
  const supplyRes = resources.find((r) => r.type === 'supply')

  const [teams, setTeams] = useState(0)
  const [supplies, setSupplies] = useState(0)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!task) return null

  const maxTeams = Math.min(repairTeamRes?.available ?? 0, task.requiredTeams - task.assignedTeams)
  const maxSupplies = Math.min(supplyRes?.available ?? 0, task.requiredSupplies - task.assignedSupplies)

  const delayPreview = task.delayImpact * (1 - (teams / Math.max(task.requiredTeams, 1)) * 0.5)
  const costPreview = task.costImpact * (1 - (teams + supplies) / Math.max(task.requiredTeams + task.requiredSupplies, 1) * 0.3)
  const satPreview = task.satisfactionImpact * (1 - (teams + supplies) / Math.max(task.requiredTeams + task.requiredSupplies, 1) * 0.4)

  const handleConfirm = () => {
    if (teams > 0) assignResources(taskId, 'repair_team', teams)
    if (supplies > 0) assignResources(taskId, 'supply', supplies)
    onClose()
  }

  const eventCfg = EVENT_TYPE_CONFIG[task.eventType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <div
        className="relative w-full max-w-md rounded-xl p-5 shadow-2xl"
        style={{ backgroundColor: '#1a2332' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-300">
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{eventCfg.icon}</span>
          <h3 className="text-base font-semibold text-gray-200">{task.name}</h3>
        </div>

        <p className="text-xs text-gray-400 mb-4">{task.description}</p>

        <div className="space-y-4 mb-5">
          <ResourceRow
            icon={<Users size={16} />}
            label="维修队"
            current={task.assignedTeams}
            required={task.requiredTeams}
            available={repairTeamRes?.available ?? 0}
            value={teams}
            max={maxTeams}
            onChange={setTeams}
          />
          <ResourceRow
            icon={<Package size={16} />}
            label="物资"
            current={task.assignedSupplies}
            required={task.requiredSupplies}
            available={supplyRes?.available ?? 0}
            value={supplies}
            max={maxSupplies}
            onChange={setSupplies}
          />
        </div>

        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#0f1923' }}>
          <p className="text-[11px] text-gray-400 mb-2">预计影响预览</p>
          <div className="flex gap-4 text-xs">
            <ImpactPreview icon={<Clock size={12} />} label="延迟" value={Math.round(delayPreview)} color="#ef4444" />
            <ImpactPreview icon={<DollarSign size={12} />} label="成本" value={Math.round(costPreview)} color="#ff6b35" />
            <ImpactPreview icon={<Heart size={12} />} label="满意度" value={-Math.round(satPreview)} color="#00c9a7" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-300 transition-colors"
            style={{ backgroundColor: '#2a3a4a' }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: '#ff6b35' }}
            disabled={teams === 0 && supplies === 0}
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  )
}

interface ResourceRowProps {
  icon: React.ReactNode
  label: string
  current: number
  required: number
  available: number
  value: number
  max: number
  onChange: (v: number) => void
}

function ResourceRow({ icon, label, current, required, available, value, max, onChange }: ResourceRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300">{label}</span>
          <span className="text-gray-500">
            已分配 {current}/{required} · 可用 {available}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-300 transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#2a3a4a' }}
          disabled={value <= 0}
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-200">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-300 transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#2a3a4a' }}
          disabled={value >= max}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

function ImpactPreview({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ color }}>{icon}</span>
      <span className="text-gray-400">{label}</span>
      <span style={{ color }}>{value > 0 ? '+' : ''}{value}</span>
    </div>
  )
}
