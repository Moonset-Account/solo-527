'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { Topic, TOPIC_STATUS_MAP } from '@/lib/types'
import { formatDate, exportToCSV, exportToExcel } from '@/lib/utils'
import { Search, Filter, ChevronDown, ChevronUp, Download, ArrowUpDown, ArrowUp, ArrowDown, Plus, Eye, CheckCircle } from 'lucide-react'

type SortField = 'title' | 'brand_line' | 'status' | 'creator_name' | 'created_at'
type SortDir = 'asc' | 'desc'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  ...Object.entries(TOPIC_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
]

const BRAND_OPTIONS = [
  { value: '', label: '全部品牌线' },
  { value: '茶研悦色', label: '茶研悦色' },
  { value: '醇香咖啡', label: '醇香咖啡' },
]

const PLATFORM_OPTIONS = ['抖音', '小红书', 'B站', '视频号']
const TAG_OPTIONS = ['夏季', '饮品', '新品', '周年庆', '幕后', '品牌', '抹茶', '测评', '咖啡', '教程', '拉花', '溯源', '有机', '纪录片', '办公室', '下午茶', '种草', '联名', '开箱', '限定', '冷萃', 'Vlog', '制作']

export default function TopicsPage() {
  const store = useAppStore()
  const { topics, profiles, updateTopicStatus, currentUserId, addTimelineEvent } = store

  useEffect(() => {
    store.hydrateTopics()
  }, [])

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [showBatch, setShowBatch] = useState(false)
  const [batchBrand, setBatchBrand] = useState('')
  const [batchPlatform, setBatchPlatform] = useState<string[]>([])
  const [batchTags, setBatchTags] = useState<string[]>([])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const creators = useMemo(() => {
    const map = new Map<string, string>()
    topics.forEach((t) => {
      if (!map.has(t.creator_id)) map.set(t.creator_id, t.creator_name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }))
  }, [topics])

  const filtered = useMemo(() => {
    let result = [...topics]

    if (statusFilter) result = result.filter((t) => t.status === statusFilter)
    if (dateFrom) result = result.filter((t) => t.created_at >= dateFrom)
    if (dateTo) result = result.filter((t) => t.created_at <= dateTo + 'T23:59:59')
    if (creatorFilter) result = result.filter((t) => t.creator_id === creatorFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }

    if (batchBrand) result = result.filter((t) => t.brand_line === batchBrand)
    if (batchPlatform.length > 0) result = result.filter((t) => batchPlatform.some((p) => t.target_platform.includes(p)))
    if (batchTags.length > 0) result = result.filter((t) => batchTags.some((tag) => t.tags.includes(tag)))

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break
        case 'brand_line': cmp = a.brand_line.localeCompare(b.brand_line); break
        case 'status': cmp = a.status.localeCompare(b.status); break
        case 'creator_name': cmp = a.creator_name.localeCompare(b.creator_name); break
        case 'created_at': cmp = a.created_at.localeCompare(b.created_at); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [topics, statusFilter, dateFrom, dateTo, creatorFilter, searchQuery, batchBrand, batchPlatform, batchTags, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-surface-400" />
    return sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent-500" /> : <ArrowDown className="w-3.5 h-3.5 text-accent-500" />
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)))
    }
  }

  const handleApprove = (topic: Topic) => {
    updateTopicStatus(topic.id, 'approved', currentUserId)
    addTimelineEvent({
      topic_id: topic.id,
      event_type: 'topic_approved',
      actor_id: currentUserId,
      actor_name: profiles.find((p) => p.id === currentUserId)?.display_name || '',
      description: `审批通过选题：${topic.title}`,
      metadata: {},
    })
  }

  const handleExport = (type: 'csv' | 'excel') => {
    const data = filtered.map((t) => ({
      标题: t.title,
      品牌线: t.brand_line,
      状态: TOPIC_STATUS_MAP[t.status].label,
      创建人: t.creator_name,
      创建日期: formatDate(t.created_at),
      目标平台: t.target_platform.join('、'),
      标签: t.tags.join('、'),
    }))
    if (type === 'csv') exportToCSV(data, '选题列表')
    else exportToExcel(data, '选题列表')
  }

  const toggleBatchPlatform = (p: string) => {
    setBatchPlatform((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  const toggleBatchTag = (tag: string) => {
    setBatchTags((prev) => prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-500">选题管理</h1>
        <Link href="/topics/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          新建选题
        </Link>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className="select-field w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="date" className="input-field w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="开始日期" />
          <span className="text-surface-400">~</span>
          <input type="date" className="input-field w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="结束日期" />
          <select className="select-field w-36" value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)}>
            <option value="">全部负责人</option>
            {creators.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input className="input-field pl-9" placeholder="搜索选题标题或描述..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="btn-ghost" onClick={() => setShowBatch(!showBatch)}>
            <Filter className="w-4 h-4" />
            批量查询
            {showBatch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showBatch && (
          <div className="mt-4 pt-4 border-t border-surface-200">
            <div className="flex flex-wrap items-start gap-6">
              <div>
                <label className="block text-xs text-surface-400 mb-1">品牌线</label>
                <select className="select-field w-36" value={batchBrand} onChange={(e) => setBatchBrand(e.target.value)}>
                  {BRAND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">平台</label>
                <div className="flex gap-2">
                  {PLATFORM_OPTIONS.map((p) => (
                    <label key={p} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input type="checkbox" checked={batchPlatform.includes(p)} onChange={() => toggleBatchPlatform(p)} className="rounded border-surface-300 text-accent-500 focus:ring-accent-300" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-surface-400 mb-1">标签</label>
                <div className="flex flex-wrap gap-1.5 max-w-md">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${batchTags.includes(tag) ? 'bg-accent-50 border-accent-300 text-accent-600' : 'border-surface-300 text-surface-400 hover:border-surface-400'}`}
                      onClick={() => toggleBatchTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <span className="text-sm text-surface-400">共 {filtered.length} 条记录</span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-xs" onClick={() => handleExport('csv')}>
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button className="btn-ghost text-xs" onClick={() => handleExport('excel')}>
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-surface-300 text-accent-500 focus:ring-accent-300"
                  />
                </th>
                {[
                  { field: 'title' as SortField, label: '标题' },
                  { field: 'brand_line' as SortField, label: '品牌线' },
                  { field: 'status' as SortField, label: '状态' },
                  { field: 'creator_name' as SortField, label: '创建人' },
                  { field: 'created_at' as SortField, label: '创建日期' },
                ].map(({ field, label }) => (
                  <th key={field} className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider cursor-pointer select-none hover:text-brand-500" onClick={() => handleSort(field)}>
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <SortIcon field={field} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {filtered.map((topic) => (
                <tr key={topic.id} className={`hover:bg-surface-50 transition-colors ${selectedIds.has(topic.id) ? 'bg-accent-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(topic.id)}
                      onChange={() => toggleSelect(topic.id)}
                      className="rounded border-surface-300 text-accent-500 focus:ring-accent-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/topics/${topic.id}`} className="text-sm font-medium text-brand-500 hover:text-accent-500 transition-colors">
                      {topic.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">{topic.brand_line}</td>
                  <td className="px-4 py-3">
                    <span className={`status-badge ${TOPIC_STATUS_MAP[topic.status].color}`}>
                      {TOPIC_STATUS_MAP[topic.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">{topic.creator_name}</td>
                  <td className="px-4 py-3 text-sm text-surface-400">{formatDate(topic.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/topics/${topic.id}`} className="btn-ghost text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        详情
                      </Link>
                      {topic.status === 'pending_review' && (
                        <button className="btn-ghost text-xs text-emerald-600 hover:text-emerald-700" onClick={() => handleApprove(topic)}>
                          <CheckCircle className="w-3.5 h-3.5" />
                          审批
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-surface-400">
                    暂无选题数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
