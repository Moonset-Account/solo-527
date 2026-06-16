'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useApi } from '@/components/useApi'
import useModal from '@/components/useModal'
import Modal from '@/components/Modal'
import { formatDate, formatDateTime } from '@/lib/utils'
import { VisitorStatus } from '@prisma/client'
import type { VisitorSummary } from '@/types'

function VisitorStatusBadge({ status }: { status: VisitorStatus }) {
  const map: Record<VisitorStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CHECKED_IN: 'bg-blue-100 text-blue-700',
    CHECKED_OUT: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  }
  const labels: Record<VisitorStatus, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    CHECKED_IN: '已到访',
    CHECKED_OUT: '已离开',
    CANCELLED: '已取消',
  }
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>
}

export default function VisitorsPage() {
  const { data: session } = useSession()
  const { request, loading } = useApi()
  const [visitors, setVisitors] = useState<VisitorSummary[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [status, setStatus] = useState<string>('')
  const createModal = useModal()
  const detailModal = useModal()
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorIdCard: '',
    visitDate: '',
    visitStartTime: '',
    visitEndTime: '',
    purpose: '',
    visitorCount: 1,
  })
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isResident = session?.user.role === 'RESIDENT'

  const loadVisitors = useCallback(async () => {
    let url = `/api/visitors?page=${page}&pageSize=${pageSize}`
    if (status) url += `&status=${status}`
    const data = await request<{ data: VisitorSummary[]; total: number }>(url)
    if (data) {
      setVisitors(data.data)
      setTotal(data.total)
    }
  }, [request, page, status])

  useEffect(() => {
    loadVisitors()
  }, [loadVisitors])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.visitorName || !formData.visitorPhone || !formData.visitDate) {
      alert('请填写必要信息')
      return
    }
    setSubmitting(true)
    const result = await request('/api/visitors', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        visitDate: new Date(formData.visitDate).toISOString(),
        visitStartTime: new Date(`${formData.visitDate}T${formData.visitStartTime}`).toISOString(),
        visitEndTime: new Date(`${formData.visitDate}T${formData.visitEndTime}`).toISOString(),
      }),
    })
    setSubmitting(false)
    if (result) {
      alert('预约成功！')
      createModal.close()
      setFormData({ visitorName: '', visitorPhone: '', visitorIdCard: '', visitDate: '', visitStartTime: '', visitEndTime: '', purpose: '', visitorCount: 1 })
      loadVisitors()
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">访客预约</h1>
          <p className="text-gray-500 mt-1">共 {total} 条记录</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={status} onChange={e => setStatus(e.target.value)} className="input w-40">
            <option value="">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="CHECKED_IN">已到访</option>
            <option value="CHECKED_OUT">已离开</option>
          </select>
          <button className="btn btn-primary" onClick={() => createModal.open()}>
            + 新增预约
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">访客姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系电话</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">到访时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">事由</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && visitors.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">加载中...</td></tr>
            ) : visitors.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无数据</td></tr>
            ) : visitors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.visitorName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{v.visitorPhone}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{v.apartment.unitNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(v.visitStartTime)} - {formatDateTime(v.visitEndTime).split(' ')[1]}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{v.purpose}</td>
                <td className="px-6 py-4"><VisitorStatusBadge status={v.status} /></td>
                <td className="px-6 py-4 text-center">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedVisitor(v); detailModal.open() }}>查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary disabled:opacity-50">上一页</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary disabled:opacity-50">下一页</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="新增访客预约">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">访客姓名 *</label>
              <input type="text" value={formData.visitorName} onChange={e => setFormData(f => ({ ...f, visitorName: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">联系电话 *</label>
              <input type="tel" value={formData.visitorPhone} onChange={e => setFormData(f => ({ ...f, visitorPhone: e.target.value }))} className="input" required />
            </div>
            <div className="col-span-2">
              <label className="label">身份证号</label>
              <input type="text" value={formData.visitorIdCard} onChange={e => setFormData(f => ({ ...f, visitorIdCard: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">到访日期 *</label>
              <input type="date" value={formData.visitDate} onChange={e => setFormData(f => ({ ...f, visitDate: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">来访人数</label>
              <input type="number" min={1} value={formData.visitorCount} onChange={e => setFormData(f => ({ ...f, visitorCount: parseInt(e.target.value) || 1 })} className="input" />
            </div>
            <div>
              <label className="label">开始时间 *</label>
              <input type="time" value={formData.visitStartTime} onChange={e => setFormData(f => ({ ...f, visitStartTime: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">结束时间 *</label>
              <input type="time" value={formData.visitEndTime} onChange={e => setFormData(f => ({ ...f, visitEndTime: e.target.value })} className="input" required />
            </div>
            <div className="col-span-2">
              <label className="label">来访事由</label>
              <input type="text" value={formData.purpose} onChange={e => setFormData(f => ({ ...f, purpose: e.target.value })} className="input" placeholder="如：快递、维修、亲友等" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={createModal.close}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '提交中...' : '提交预约'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.close} title="访客详情">
        {selectedVisitor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">访客姓名</div>
                <div className="text-sm mt-1 font-medium">{selectedVisitor.visitorName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">联系电话</div>
                <div className="text-sm mt-1">{selectedVisitor.visitorPhone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">房间</div>
                <div className="text-sm mt-1">{selectedVisitor.apartment.unitNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div className="mt-1"><VisitorStatusBadge status={selectedVisitor.status} /></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">到访日期</div>
                <div className="text-sm mt-1">{formatDate(selectedVisitor.visitDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">来访时间</div>
                <div className="text-sm mt-1">{formatDateTime(selectedVisitor.visitStartTime)} ~ {formatDateTime(selectedVisitor.visitEndTime)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">来访事由</div>
                <div className="text-sm mt-1">{selectedVisitor.purpose || '-'}</div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button className="btn btn-secondary" onClick={detailModal.close}>关闭</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
