'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { EXCEPTION_STATUS_MAP, ExceptionStatus } from '@/lib/types'
import { formatDateTime, exportToCSV, exportToExcel } from '@/lib/utils'
import { Search, ChevronDown, ChevronRight, Download, ArrowUpDown } from 'lucide-react'

export default function ExceptionsPage() {
  const exceptions = useAppStore((s) => s.exceptions)
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = [...exceptions]

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((e) => e.topic_title?.toLowerCase().includes(q))
    }
    if (startDate) {
      result = result.filter((e) => e.created_at >= startDate)
    }
    if (endDate) {
      result = result.filter((e) => e.created_at <= endDate + 'T23:59:59Z')
    }

    result.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortAsc ? diff : -diff
    })

    return result
  }, [exceptions, statusFilter, searchQuery, sortAsc, startDate, endDate])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const e of filtered) {
      const key = e.sensitive_word
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return Array.from(map.entries()).map(([word, records]) => ({
      word,
      records,
      hitCount: records.length,
      pendingCount: records.filter((r) => r.status === 'pending').length,
    }))
  }, [filtered])

  const toggleGroup = (word: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  const highlightSnippet = (snippet: string, word: string) => {
    const parts = snippet.split(new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === word.toLowerCase() ? (
        <span key={i} className="text-red-600 font-bold">{part}</span>
      ) : (
        part
      )
    )
  }

  const handleExport = (format: 'csv' | 'excel') => {
    const data = filtered.map((e) => ({
      选题标题: e.topic_title ?? '',
      敏感词: e.sensitive_word,
      内容片段: e.content_snippet,
      状态: EXCEPTION_STATUS_MAP[e.status].label,
      创建时间: formatDateTime(e.created_at),
    }))
    if (format === 'csv') {
      exportToCSV(data, '异常记录')
    } else {
      exportToExcel(data, '异常记录')
    }
  }

  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">异常记录</h1>
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
            <button
              onClick={() => handleExport(exportFormat)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="按选题标题搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExceptionStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={() => setSortAsc((v) => !v)}
              className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortAsc ? '时间升序' : '时间降序'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {grouped.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无异常记录</div>
          )}
          {grouped.map((group) => {
            const isExpanded = expandedGroups.has(group.word)
            return (
              <div key={group.word} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.word)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold text-gray-900">{group.word}</span>
                    <span className="text-sm text-gray-500">命中 {group.hitCount} 次</span>
                    {group.pendingCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {group.pendingCount} 待处理
                      </span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {group.records.map((record) => (
                      <Link
                        key={record.id}
                        href={`/exceptions/${record.id}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {record.topic_title ?? '未关联选题'}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {highlightSnippet(record.content_snippet, record.sensitive_word)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4 shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EXCEPTION_STATUS_MAP[record.status].color}`}>
                            {EXCEPTION_STATUS_MAP[record.status].label}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDateTime(record.created_at)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
