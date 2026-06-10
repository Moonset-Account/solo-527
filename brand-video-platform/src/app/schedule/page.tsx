'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { SCHEDULE_STATUS_MAP, ScheduleStatus } from '@/lib/types'
import { formatDate, generateId } from '@/lib/utils'
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Filter,
  Trash2,
} from 'lucide-react'

const PLATFORM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  '抖音': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  '小红书': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
  'B站': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  '视频号': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
}

const PLATFORMS = ['抖音', '小红书', 'B站', '视频号']
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

type ViewMode = 'calendar' | 'list'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function SchedulePage() {
  const { schedules, topics, profiles, addSchedule, updateScheduleStatus, currentUserId } = useAppStore()

  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(6)

  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [showNewForm, setShowNewForm] = useState(false)
  const [newTopicId, setNewTopicId] = useState('')
  const [newPlatform, setNewPlatform] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth)
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [currentYear, currentMonth])

  const getSchedulesForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return schedules.filter((s) => s.publish_date === dateStr)
  }

  const filteredSchedules = useMemo(() => {
    let result = [...schedules]
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter)
    }
    if (dateFrom) {
      result = result.filter((s) => s.publish_date >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((s) => s.publish_date <= dateTo)
    }
    return result.sort((a, b) => a.publish_date.localeCompare(b.publish_date) || (a.publish_time || '').localeCompare(b.publish_time || ''))
  }, [schedules, statusFilter, dateFrom, dateTo])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBatchCancel = () => {
    selectedIds.forEach((id) => {
      updateScheduleStatus(id, 'cancelled')
    })
    setSelectedIds(new Set())
  }

  const handleCancel = (id: string) => {
    updateScheduleStatus(id, 'cancelled')
  }

  const handleCreate = () => {
    if (!newTopicId || !newPlatform || !newDate) return
    const topic = topics.find((t) => t.id === newTopicId)
    if (!topic) return
    const operator = profiles.find((p) => p.id === currentUserId)
    addSchedule({
      id: generateId(),
      topic_id: topic.id,
      topic_title: topic.title,
      platform: newPlatform,
      publish_date: newDate,
      publish_time: newTime || null,
      status: 'scheduled',
      operator_id: currentUserId,
      operator_name: operator?.display_name || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setNewTopicId('')
    setNewPlatform('')
    setNewDate('')
    setNewTime('')
    setShowNewForm(false)
  }

  const monthLabel = `${currentYear}年${currentMonth + 1}月`

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-500">发布排期</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-surface-300 overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar' ? 'bg-accent-500 text-white' : 'bg-white text-brand-500 hover:bg-surface-100'
              }`}
            >
              <Calendar size={15} />
              日历
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-accent-500 text-white' : 'bg-white text-brand-500 hover:bg-surface-100'
              }`}
            >
              <List size={15} />
              列表
            </button>
          </div>
          <button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">
            <Plus size={16} />
            新建排期
          </button>
        </div>
      </div>

      {showNewForm && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">新建排期</h3>
            <button onClick={() => setShowNewForm(false)} className="btn-ghost">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-surface-400 mb-1">选题</label>
              <select value={newTopicId} onChange={(e) => setNewTopicId(e.target.value)} className="select-field">
                <option value="">选择选题</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">平台</label>
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="select-field">
                <option value="">选择平台</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">发布日期</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">发布时间</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleCreate} className="btn-primary text-sm">确认创建</button>
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="btn-ghost">
              <ChevronLeft size={18} />
            </button>
            <span className="text-lg font-semibold text-brand-500">{monthLabel}</span>
            <button onClick={handleNextMonth} className="btn-ghost">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-surface-200">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-surface-400">
                  周{d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-surface-200 bg-surface-50" />
                }
                const daySchedules = getSchedulesForDate(day)
                return (
                  <div key={day} className="min-h-[100px] border-b border-r border-surface-200 p-1.5">
                    <span className="text-xs text-surface-400 font-medium">{day}</span>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {daySchedules.map((s) => {
                        const pc = PLATFORM_COLORS[s.platform] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
                        return (
                          <div
                            key={s.id}
                            className={`${pc.bg} ${pc.text} text-xs px-1.5 py-0.5 rounded truncate`}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${pc.dot} mr-1`} />
                            {s.topic_title}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-surface-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ScheduleStatus | '')}
                  className="select-field w-32"
                >
                  <option value="">全部状态</option>
                  {Object.entries(SCHEDULE_STATUS_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-36" />
                <span className="text-xs text-surface-400">至</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-36" />
              </div>
              {selectedIds.size > 0 && (
                <button onClick={handleBatchCancel} className="btn-ghost text-red-500 hover:text-red-600 text-sm">
                  <Trash2 size={14} />
                  取消排期 ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="py-3 px-4 text-left font-medium text-surface-400 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredSchedules.length && filteredSchedules.length > 0}
                      onChange={() => {
                        if (selectedIds.size === filteredSchedules.length) {
                          setSelectedIds(new Set())
                        } else {
                          setSelectedIds(new Set(filteredSchedules.map((s) => s.id)))
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-surface-400">选题标题</th>
                  <th className="py-3 px-4 text-left font-medium text-surface-400">平台</th>
                  <th className="py-3 px-4 text-left font-medium text-surface-400">发布日期</th>
                  <th className="py-3 px-4 text-left font-medium text-surface-400">发布时间</th>
                  <th className="py-3 px-4 text-left font-medium text-surface-400">状态</th>
                  <th className="py-3 px-4 text-left font-medium text-surface-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s) => {
                  const pc = PLATFORM_COLORS[s.platform] || { bg: 'bg-gray-100', text: 'text-gray-700' }
                  return (
                    <tr key={s.id} className="border-b border-surface-200 hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 text-brand-500">{s.topic_title}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge text-xs ${pc.bg} ${pc.text}`}>
                          {s.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-surface-400">{formatDate(s.publish_date)}</td>
                      <td className="py-3 px-4 text-surface-400">{s.publish_time || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge text-xs ${SCHEDULE_STATUS_MAP[s.status].color}`}>
                          {SCHEDULE_STATUS_MAP[s.status].label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {s.status !== 'cancelled' && s.status !== 'published' && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="btn-ghost text-xs text-red-500 hover:text-red-600"
                          >
                            取消排期
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredSchedules.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-surface-400">
                      暂无排期数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
