import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/hooks/useAppStore'
import { StickyNote, ChevronUp, ChevronDown, Info, ArrowRight } from 'lucide-react'

interface AppointmentRecord {
  id: string
  anonymousId: string
  grade: string
  counselingType: string
  channel: string
  status: 'appointed' | 'completed' | 'cancelled' | 'noShow'
  waitDays: number
  cancelReason?: string
  followUpStatus: 'pending' | 'completed' | 'overdue'
  appointmentDate: string
  buildingArea: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  appointed: { label: '已预约', color: 'text-teal-600 bg-teal-50' },
  completed: { label: '已完成', color: 'text-emerald-600 bg-emerald-50' },
  cancelled: { label: '已取消', color: 'text-red-600 bg-red-50' },
  noShow: { label: '未到', color: 'text-amber-600 bg-amber-50' },
}

const FOLLOWUP_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待回访', color: 'text-amber-600' },
  completed: { label: '已回访', color: 'text-emerald-600' },
  overdue: { label: '逾期未回访', color: 'text-red-600' },
}

export default function Detail() {
  const navigate = useNavigate()
  const { openNotesDrawer } = useAppStore()
  const [records, setRecords] = useState<AppointmentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<string>('appointmentDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const pageSize = 20

  useEffect(() => {
    const filters: Record<string, string[]> = {}
    if (filterGrade) filters.grade = [filterGrade]
    if (filterStatus) filters.status = [filterStatus]
    if (filterType) filters.counselingType = [filterType]

    fetch('/api/detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, page, pageSize, sortBy, sortOrder }),
    })
      .then((r) => r.json())
      .then((res) => {
        setRecords(res.records || [])
        setTotal(res.total || 0)
      })
      .catch(() => {})
  }, [page, sortBy, sortOrder, filterGrade, filterStatus, filterType])

  const totalPages = Math.ceil(total / pageSize)

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronUp size={12} className="text-zinc-300" />
    return sortOrder === 'asc'
      ? <ChevronUp size={12} className="text-teal-600" />
      : <ChevronDown size={12} className="text-teal-600" />
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">下钻明细</h1>
          <p className="text-sm text-zinc-500 mt-0.5">脱敏预约记录明细表，点击异常行可继续下钻</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-1">
            <Info size={12} className="text-amber-600" />
            <span className="text-[10px] text-amber-700">所有学生信息已脱敏，仅展示匿名ID和聚合字段</span>
          </div>
          <button
            onClick={() => openNotesDrawer({ targetKey: 'detail:table', label: '下钻明细表' })}
            className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
          >
            <StickyNote size={12} /> 备注
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={filterGrade}
          onChange={(e) => { setFilterGrade(e.target.value); setPage(1) }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="">全部年级</option>
          {['大一', '大二', '大三', '大四', '研一', '研二', '研三'].map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="">全部类型</option>
          {['情绪困扰', '学业压力', '人际关系', '职业规划', '家庭问题', '自我认知', '危机干预', '适应障碍'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-400 ml-auto">共 {total} 条记录</span>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                {[
                  { key: 'anonymousId', label: '匿名ID' },
                  { key: 'grade', label: '年级' },
                  { key: 'counselingType', label: '咨询类型' },
                  { key: 'channel', label: '渠道' },
                  { key: 'status', label: '状态' },
                  { key: 'waitDays', label: '等待天数' },
                  { key: 'cancelReason', label: '取消原因' },
                  { key: 'followUpStatus', label: '回访状态' },
                  { key: 'appointmentDate', label: '预约日期' },
                  { key: 'buildingArea', label: '校区' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer px-3 py-2.5 text-left text-xs font-medium text-zinc-500 hover:text-zinc-700 select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.key} />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-xs font-medium text-zinc-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const isAnomaly = r.waitDays > 14 || (r.status === 'cancelled' && r.cancelReason === '对咨询顾虑')
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors ${
                      isAnomaly ? 'bg-red-50/30' : i % 2 === 1 ? 'bg-zinc-50/20' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-xs font-mono text-zinc-600">{r.anonymousId}</td>
                    <td className="px-3 py-2 text-xs text-zinc-700">{r.grade}</td>
                    <td className="px-3 py-2 text-xs text-zinc-700">{r.counselingType}</td>
                    <td className="px-3 py-2 text-xs text-zinc-700">{r.channel}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_MAP[r.status]?.color}`}>
                        {STATUS_MAP[r.status]?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-zinc-700">{r.waitDays}</td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{r.cancelReason || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${FOLLOWUP_MAP[r.followUpStatus]?.color}`}>
                        {FOLLOWUP_MAP[r.followUpStatus]?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{r.appointmentDate}</td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{r.buildingArea}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {isAnomaly && (
                          <button
                            onClick={() => openNotesDrawer({
                              targetKey: `detail:${r.id}`,
                              label: `异常记录 ${r.anonymousId}`,
                            })}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="标记异常/备注"
                          >
                            <StickyNote size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/compare')}
                          className="text-zinc-400 hover:text-teal-600 transition-colors"
                          title="对比分析"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
          <span className="text-xs text-zinc-400">
            第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
          <div className="text-[10px] text-zinc-500 leading-relaxed space-y-1">
            <p><strong className="text-zinc-600">口径说明：</strong>等待天数 = 预约创建日至首次咨询日的自然日数。红色背景行为异常记录（等待天数{'>'}14天 或 对咨询顾虑导致取消）。</p>
            <p><strong className="text-zinc-600">匿名化说明：</strong>学生姓名、学号等个人识别信息已替换为匿名ID，仅保留年级、咨询类型等聚合维度字段。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
