'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useApi } from '@/components/useApi'
import useModal from '@/components/useModal'
import Modal from '@/components/Modal'
import { formatDateTime } from '@/lib/utils'
import { WorkOrderStatus, WorkOrderPriority, WorkOrderType, VisitorStatus } from '@prisma/client'
import type { WorkOrderSummary } from '@/types'

const statusLabels: Record<WorkOrderStatus, string> = {
  PENDING: '待处理',
  ASSIGNED: '已分派',
  IN_PROGRESS: '处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  OVERDUE: '已超时',
}

const priorityLabels: Record<WorkOrderPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
}

const typeLabels: Record<WorkOrderType, string> = {
  REPAIR: '维修',
  MAINTENANCE: '保养',
  COMPLAINT: '投诉',
  CONSULTATION: '咨询',
  OTHER: '其他',
}

function StatusBadge({ status, isOverdue }: { status: WorkOrderStatus; isOverdue: boolean }) {
  if (isOverdue) return <span className="badge bg-red-100 text-red-700">超时</span>
  const map: Record<WorkOrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
    OVERDUE: 'bg-red-100 text-red-700',
  }
  return <span className={`badge ${map[status]}`}>{statusLabels[status]}</span>
}

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const map: Record<WorkOrderPriority, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  }
  return <span className={`badge ${map[priority]}`}>{priorityLabels[priority]}</span>
}

interface WorkOrderDetail {
  id: string
  orderNo: string
  type: WorkOrderType
  title: string
  description: string
  priority: WorkOrderPriority
  status: WorkOrderStatus
  isOverdue: boolean
  overdueReason: string | null
  apartment: { unitNumber: string; building: string }
  creator: { id: string; name: string | null; phone: string | null }
  assignee: { id: string; name: string | null; phone: string | null } | null
  expectedComplete: string | null
  actualComplete: string | null
  createdAt: string
  exception: {
    id: string
    impactScope: string
    affectedAreas: string
    nextStep: string
    reportedAt: string
    resolvedAt: string | null
    resolution: string | null
    handler: { id: string; name: string | null; phone: string | null }
  } | null
  assignments: {
    id: string
    assignee: { name: string | null }
    assignedAt: string
    remark: string | null
  }[]
}

export default function WorkOrdersPage() {
  const { data: session } = useSession()
  const { request, loading } = useApi()
  const [orders, setOrders] = useState<WorkOrderSummary[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [statusFilter, setStatusFilter] = useState('')
  const [isOverdue, setIsOverdue] = useState('')
  const detailModal = useModal()
  const assignModal = useModal()
  const exceptionModal = useModal()
  const createModal = useModal()
  const [orderDetail, setOrderDetail] = useState<WorkOrderDetail | null>(null)
  const [engineers, setEngineers] = useState<{ id: string; name: string | null }[]>([])
  const [assignEngineerId, setAssignEngineerId] = useState('')
  const [assignRemark, setAssignRemark] = useState('')
  const [exceptionForm, setExceptionForm] = useState({
    impactScope: '',
    affectedAreas: '',
    handlerId: '',
    nextStep: '',
  })
  const [formData, setFormData] = useState({
    type: 'REPAIR' as WorkOrderType,
    title: '',
    description: '',
    priority: 'MEDIUM' as WorkOrderPriority,
  })
  const [submitting, setSubmitting] = useState(false)

  const isResident = session?.user.role === 'RESIDENT'
  const isAdminOrCS = session?.user.role === 'ADMIN' || session?.user.role === 'CUSTOMER_SERVICE'
  const isEngineer = session?.user.role === 'ENGINEER'

  const loadOrders = useCallback(async () => {
    let url = `/api/work-orders?page=${page}&pageSize=${pageSize}`
    if (statusFilter) url += `&status=${statusFilter}`
    if (isOverdue) url += `&isOverdue=${isOverdue}`
    const data = await request<{ data: WorkOrderSummary[]; total: number }>(url)
    if (data) {
      setOrders(data.data)
      setTotal(data.total)
    }
  }, [request, page, statusFilter, isOverdue])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const openDetail = async (id: string) => {
    const data = await request<WorkOrderDetail>(`/api/work-orders/${id}`)
    if (data) {
      setOrderDetail(data)
      detailModal.open()
    }
  }

  const openAssign = async (order: WorkOrderDetail) => {
    setOrderDetail(order)
    if (engineers.length === 0) {
      const data = await request<{ id: string; name: string | null }[]>('/api/users?role=ENGINEER')
      if (data) setEngineers(data)
    }
    assignModal.open()
  }

  const openException = (order: WorkOrderDetail) => {
    setOrderDetail(order)
    if (order.exception) {
      setExceptionForm({
        impactScope: order.exception.impactScope,
        affectedAreas: order.exception.affectedAreas,
        handlerId: order.exception.handler.id,
        nextStep: order.exception.nextStep,
      })
    }
    exceptionModal.open()
  }

  const doAssign = async () => {
    if (!orderDetail || !assignEngineerId) return
    setSubmitting(true)
    const result = await request(`/api/work-orders/${orderDetail.id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId: assignEngineerId, remark: assignRemark }),
    })
    setSubmitting(false)
    if (result) {
      alert('分派成功！')
      assignModal.close()
      setAssignEngineerId('')
      setAssignRemark('')
      openDetail(orderDetail.id)
      loadOrders()
    }
  }

  const doException = async () => {
    if (!orderDetail) return
    setSubmitting(true)
    const result = await request(`/api/work-orders/${orderDetail.id}/exception`, {
      method: 'POST',
      body: JSON.stringify(exceptionForm),
    })
    setSubmitting(false)
    if (result) {
      alert('异常记录成功！')
      exceptionModal.close()
      openDetail(orderDetail.id)
      loadOrders()
    }
  }

  const doCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      alert('请填写标题和描述')
      return
    }
    setSubmitting(true)
    const result = await request('/api/work-orders', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    setSubmitting(false)
    if (result) {
      alert('工单创建成功！')
      createModal.close()
      setFormData({ type: 'REPAIR', title: '', description: '', priority: 'MEDIUM' })
      loadOrders()
    }
  }

  const updateStatus = async (newStatus: WorkOrderStatus) => {
    if (!orderDetail) return
    const result = await request(`/api/work-orders/${orderDetail.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus, actualComplete: newStatus === 'COMPLETED' ? new Date() : null }),
    })
    if (result) {
      alert('状态更新成功！')
      openDetail(orderDetail.id)
      loadOrders()
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工单中心</h1>
          <p className="text-gray-500 mt-1">共 {total} 条记录</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-36">
            <option value="">全部状态</option>
            <option value="PENDING">待处理</option>
            <option value="ASSIGNED">已分派</option>
            <option value="IN_PROGRESS">处理中</option>
            <option value="COMPLETED">已完成</option>
            <option value="OVERDUE">已超时</option>
          </select>
          <select value={isOverdue} onChange={e => setIsOverdue(e.target.value)} className="input w-36">
            <option value="">是否超时</option>
            <option value="true">已超时</option>
            <option value="false">正常</option>
          </select>
          {(isResident || isAdminOrCS) && (
            <button className="btn btn-primary" onClick={() => createModal.open()}>
              + 新建工单
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && orders.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">暂无数据</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-700">{o.orderNo}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{o.apartment.unitNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {o.isOverdue && <span className="mr-1">⚠️</span>}
                  {o.title}
                </td>
                <td className="px-6 py-4"><PriorityBadge priority={o.priority} /></td>
                <td className="px-6 py-4 text-sm text-gray-600">{o.assignee?.name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(o.createdAt)}</td>
                <td className="px-6 py-4"><StatusBadge status={o.status} isOverdue={o.isOverdue} /></td>
                <td className="px-6 py-4 text-center">
                  <button className="btn btn-secondary btn-sm" onClick={() => openDetail(o.id)}>查看</button>
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

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.close} title="工单详情" size="xl">
        {orderDetail && (
          <div className="space-y-6">
            {orderDetail.isOverdue && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-semibold text-red-700">
                  ⚠️ 工单已超时
                </div>
                {orderDetail.overdueReason && (
                  <div className="text-sm text-red-600">原因：{orderDetail.overdueReason}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">工单编号</div>
                <div className="font-mono text-sm mt-1">{orderDetail.orderNo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div className="mt-1"><StatusBadge status={orderDetail.status} isOverdue={orderDetail.isOverdue} /></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">优先级</div>
                <div className="mt-1"><PriorityBadge priority={orderDetail.priority} /></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">类型</div>
                <div className="text-sm mt-1">{typeLabels[orderDetail.type]}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">房间</div>
                <div className="text-sm mt-1">{orderDetail.apartment.building} {orderDetail.apartment.unitNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">创建人</div>
                <div className="text-sm mt-1">{orderDetail.creator.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">处理人</div>
                <div className="text-sm mt-1">{orderDetail.assignee?.name || '未分派'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">创建时间</div>
                <div className="text-sm mt-1">{formatDateTime(orderDetail.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">预计完成</div>
                <div className="text-sm mt-1">{orderDetail.expectedComplete ? formatDateTime(orderDetail.expectedComplete) : '-'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">工单描述</div>
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{orderDetail.description}</div>
            </div>

            {orderDetail.exception && (
              <div className="border border-orange-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-orange-50 border-b border-orange-200 font-semibold text-orange-800 flex items-center gap-2">
                  🚨 异常详情
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">影响范围</div>
                      <div className="text-sm mt-1 text-gray-900 font-medium">{orderDetail.exception.impactScope}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">受影响区域</div>
                      <div className="text-sm mt-1 text-gray-900 font-medium">{orderDetail.exception.affectedAreas}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">处理人</div>
                      <div className="text-sm mt-1 text-gray-900 font-medium">{orderDetail.exception.handler.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">上报时间</div>
                      <div className="text-sm mt-1">{formatDateTime(orderDetail.exception.reportedAt)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">下一步计划</div>
                    <div className="mt-1 p-3 bg-orange-50 rounded border border-orange-100 text-sm text-gray-800 whitespace-pre-wrap">
                      {orderDetail.exception.nextStep}
                    </div>
                  </div>
                  {orderDetail.exception.resolution && (
                    <div>
                      <div className="text-xs text-gray-500">解决方案</div>
                      <div className="mt-1 p-3 bg-green-50 rounded border border-green-100 text-sm text-gray-800 whitespace-pre-wrap">
                        {orderDetail.exception.resolution}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {orderDetail.assignments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">分派记录</h3>
                <div className="space-y-2">
                  {orderDetail.assignments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-sm text-gray-900">{a.assignee.name || '工程师'}</span>
                        <span className="text-xs text-gray-500 ml-3">{formatDateTime(a.assignedAt)}</span>
                      </div>
                      {a.remark && <div className="text-sm text-gray-600">{a.remark}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {isAdminOrCS && orderDetail.status !== 'COMPLETED' && orderDetail.status !== 'CANCELLED' && (
                <button className="btn btn-primary" onClick={() => openAssign(orderDetail)}>
                  分派工单
                </button>
              )}
              {isAdminOrCS && (orderDetail.isOverdue || orderDetail.status === 'OVERDUE') && (
                <button className="btn btn-danger" onClick={() => openException(orderDetail)}>
                  记录异常
                </button>
              )}
              {isEngineer && orderDetail.assignee?.id === session?.user.id && orderDetail.status === 'ASSIGNED' && (
                <button className="btn btn-primary" onClick={() => updateStatus('IN_PROGRESS')}>
                  开始处理
                </button>
              )}
              {isEngineer && orderDetail.assignee?.id === session?.user.id && orderDetail.status === 'IN_PROGRESS' && (
                <button className="btn btn-success" onClick={() => updateStatus('COMPLETED')}>
                  完成工单
                </button>
              )}
              <button className="btn btn-secondary ml-auto" onClick={detailModal.close}>关闭</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={assignModal.isOpen} onClose={assignModal.close} title="分派工单">
        <div className="space-y-4">
          <div>
            <label className="label">选择工程师 *</label>
            <select value={assignEngineerId} onChange={e => setAssignEngineerId(e.target.value)} className="input">
              <option value="">请选择工程师</option>
              {engineers.map(e => (
                <option key={e.id} value={e.id}>{e.name || '工程师'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">备注</label>
            <textarea value={assignRemark} onChange={e => setAssignRemark(e.target.value)} className="input" rows={3} placeholder="分派说明..." />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn btn-secondary" onClick={assignModal.close}>取消</button>
            <button className="btn btn-primary" onClick={doAssign} disabled={submitting || !assignEngineerId}>
              {submitting ? '提交中...' : '确认分派'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={exceptionModal.isOpen} onClose={exceptionModal.close} title="超时异常记录" size="lg">
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            请详细记录超时工单的影响范围、受影响区域、处理人和下一步处理计划。
          </div>
          <div>
            <label className="label">影响范围 *</label>
            <input type="text" value={exceptionForm.impactScope} onChange={e => setExceptionForm(f => ({ ...f, impactScope: e.target.value }))} className="input" placeholder="如：整栋楼供水、电梯、公共区域等" />
          </div>
          <div>
            <label className="label">受影响区域 *</label>
            <input type="text" value={exceptionForm.affectedAreas} onChange={e => setExceptionForm(f => ({ ...f, affectedAreas: e.target.value }))} className="input" placeholder="具体受影响的房间或区域" />
          </div>
          <div>
            <label className="label">处理人 *</label>
            <select value={exceptionForm.handlerId} onChange={e => setExceptionForm(f => ({ ...f, handlerId: e.target.value }))} className="input">
              <option value="">请选择处理人</option>
              {engineers.map(e => (
                <option key={e.id} value={e.id}>{e.name || '工程师'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">下一步计划 *</label>
            <textarea value={exceptionForm.nextStep} onChange={e => setExceptionForm(f => ({ ...f, nextStep: e.target.value }))} className="input" rows={4} placeholder="请详细描述后续处理计划和时间节点..." />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn btn-secondary" onClick={exceptionModal.close}>取消</button>
            <button className="btn btn-primary" onClick={doException} disabled={submitting}>
              {submitting ? '提交中...' : '确认记录'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="新建工单">
        <form onSubmit={doCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">工单类型</label>
              <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value as WorkOrderType }))} className="input">
                <option value="REPAIR">维修</option>
                <option value="MAINTENANCE">保养</option>
                <option value="COMPLAINT">投诉</option>
                <option value="CONSULTATION">咨询</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <div>
              <label className="label">优先级</label>
              <select value={formData.priority} onChange={e => setFormData(f => ({ ...f, priority: e.target.value as WorkOrderPriority }))} className="input">
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">标题 *</label>
            <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} className="input" placeholder="请简要描述问题" required />
          </div>
          <div>
            <label className="label">详细描述 *</label>
            <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} className="input" rows={5} placeholder="请详细描述问题，包括位置、现象、发生时间等..." required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={createModal.close}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '提交中...' : '创建工单'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
