'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useApi } from '@/components/useApi'
import useModal from '@/components/useModal'
import Modal from '@/components/Modal'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import type { BillSummary } from '@/types'
import { BillStatus, BillType, PaymentMethod } from '@prisma/client'

interface BillDetail {
  id: string
  billNo: string
  type: BillType
  title: string
  description: string | null
  amount: number
  paidAmount: number
  remainingAmount: number
  status: BillStatus
  formattedAmount: string
  formattedPaidAmount: string
  issueDate: string
  dueDate: string
  paidDate: string | null
  periodStart: string | null
  periodEnd: string | null
  apartment: { unitNumber: string; building: string }
  resident: { name: string | null; phone: string | null }
  payments: { id: string; amount: number; method: PaymentMethod; paidAt: string; transactionNo: string | null }[]
}

const billTypeLabels: Record<BillType, string> = {
  RENT: '租金',
  WATER: '水费',
  ELECTRICITY: '电费',
  GAS: '燃气费',
  INTERNET: '网络费',
  PROPERTY_MANAGEMENT: '物业费',
  MAINTENANCE: '维修费',
  OTHER: '其他',
}

function BillStatusBadge({ status }: { status: BillStatus }) {
  const map: Record<BillStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PARTIAL: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<BillStatus, string> = {
    PENDING: '待缴费',
    PARTIAL: '部分缴费',
    PAID: '已缴清',
    OVERDUE: '已逾期',
    CANCELLED: '已取消',
  }
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>
}

function BillTypeBadge({ type }: { type: BillType }) {
  return <span className="badge bg-gray-100 text-gray-700">{billTypeLabels[type]}</span>
}

export default function BillsPage() {
  const { data: session } = useSession()
  const { request, loading } = useApi()
  const [bills, setBills] = useState<BillSummary[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(10)
  const [status, setStatus] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const detailModal = useModal()
  const payModal = useModal()
  const [billDetail, setBillDetail] = useState<BillDetail | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('ALIPAY')
  const [paying, setPaying] = useState(false)

  const isAdminOrCS = session?.user.role === 'ADMIN' || session?.user.role === 'CUSTOMER_SERVICE'

  const loadBills = useCallback(async () => {
    let url = `/api/bills?page=${page}&pageSize=${pageSize}`
    if (status) url += `&status=${status}`
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`
    const data = await request<{ data: BillSummary[]; total: number }>(url)
    if (data) {
      setBills(data.data)
      setTotal(data.total)
    }
  }, [request, page, pageSize, status, keyword])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  const openDetail = async (id: string) => {
    const data = await request<BillDetail>(`/api/bills/${id}`)
    if (data) {
      setBillDetail(data)
      detailModal.open()
    }
  }

  const openPay = (bill: BillDetail) => {
    setBillDetail(bill)
    setPayAmount(bill.remainingAmount.toString())
    payModal.open()
  }

  const doPay = async () => {
    if (!billDetail) return
    setPaying(true)
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效金额')
      setPaying(false)
      return
    }
    const result = await request(`/api/bills/${billDetail.id}`, {
      method: 'POST',
      body: JSON.stringify({ amount, method: payMethod }),
    })
    setPaying(false)
    if (result) {
      alert('支付成功！')
      payModal.close()
      detailModal.close()
      loadBills()
    }
  }

  const totalPages = Math.ceil(total / pageSize)
  const pendingAmount = bills
    .filter(b => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((s, b) => s + (b.amount - b.paidAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">费用账单</h1>
          <p className="text-gray-500 mt-1">共 {total} 条记录</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="搜索账单号/房间号..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="input w-56"
          />
          <select value={status} onChange={e => setStatus(e.target.value)} className="input w-40">
            <option value="">全部状态</option>
            <option value="PENDING">待缴费</option>
            <option value="PARTIAL">部分缴费</option>
            <option value="PAID">已缴清</option>
            <option value="OVERDUE">已逾期</option>
          </select>
          {pendingAmount > 0 && (
            <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-sm text-orange-700">
                待缴合计：<span className="font-bold">{formatCurrency(pendingAmount)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">账单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">房间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">截止日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && bills.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">加载中...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">暂无数据</td></tr>
            ) : bills.map(bill => (
              <tr key={bill.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(bill.id)}>
                <td className="px-6 py-4 text-sm font-mono text-gray-700">{bill.billNo}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{bill.apartment.building} {bill.apartment.unitNumber}</td>
                <td className="px-6 py-4"><BillTypeBadge type={bill.type} /></td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{bill.title}</td>
                <td className="px-6 py-4 text-right text-sm">
                  <div className="font-semibold text-gray-900">{formatCurrency(bill.amount)}</div>
                  {bill.paidAmount > 0 && (
                    <div className="text-xs text-gray-500">已缴 {formatCurrency(bill.paidAmount)}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(bill.dueDate)}</td>
                <td className="px-6 py-4"><BillStatusBadge status={bill.status} /></td>
                <td className="px-6 py-4 text-center">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => { e.stopPropagation(); openDetail(bill.id) }}
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn-secondary disabled:opacity-50"
              >
                上一页
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-secondary disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.close} title="账单详情" size="lg">
        {billDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">账单号</div>
                <div className="font-mono text-sm mt-1">{billDetail.billNo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div className="mt-1"><BillStatusBadge status={billDetail.status} /></div>
              </div>
              <div>
                <div className="text-sm text-gray-500">房间</div>
                <div className="text-sm mt-1">{billDetail.apartment.building} {billDetail.apartment.unitNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">住户</div>
                <div className="text-sm mt-1">{billDetail.resident.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">出账日期</div>
                <div className="text-sm mt-1">{formatDate(billDetail.issueDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">截止日期</div>
                <div className="text-sm mt-1">{formatDate(billDetail.dueDate)}</div>
              </div>
              {billDetail.periodStart && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">计费周期</div>
                  <div className="text-sm mt-1">{formatDate(billDetail.periodStart)} ~ {formatDate(billDetail.periodEnd!)}</div>
                </div>
              )}
              {billDetail.description && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">说明</div>
                  <div className="text-sm mt-1">{billDetail.description}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">应缴金额</div>
                <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(billDetail.amount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">已缴金额</div>
                <div className="text-xl font-bold text-green-600 mt-1">{formatCurrency(billDetail.paidAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">待缴金额</div>
                <div className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(billDetail.remainingAmount)}</div>
              </div>
            </div>

            {billDetail.payments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">缴费记录</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">时间</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">方式</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">流水号</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">金额</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {billDetail.payments.map(p => (
                        <tr key={p.id}>
                          <td className="px-4 py-2">{formatDateTime(p.paidAt)}</td>
                          <td className="px-4 py-2">{p.method}</td>
                          <td className="px-4 py-2 font-mono text-xs">{p.transactionNo || '-'}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {billDetail.status !== 'PAID' && billDetail.status !== 'CANCELLED' && (
              <div className="flex justify-end gap-3 pt-2">
                <button className="btn btn-secondary" onClick={detailModal.close}>关闭</button>
                <button className="btn btn-primary" onClick={() => openPay(billDetail)}>
                  立即缴费
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={payModal.isOpen} onClose={payModal.close} title="在线缴费">
        {billDetail && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="text-sm text-blue-700">{billDetail.title}</div>
              <div className="text-2xl font-bold text-blue-700 mt-2">
                待缴：{formatCurrency(billDetail.remainingAmount)}
              </div>
            </div>
            <div>
              <label className="label">缴费金额</label>
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="input"
                step="0.01"
                min="0.01"
                max={billDetail.remainingAmount}
              />
            </div>
            <div>
              <label className="label">支付方式</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)} className="input">
                <option value="ALIPAY">支付宝</option>
                <option value="WECHAT">微信支付</option>
                <option value="BANK_TRANSFER">银行转账</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn btn-secondary" onClick={payModal.close}>取消</button>
              <button className="btn btn-primary" onClick={doPay} disabled={paying}>
                {paying ? '处理中...' : '确认支付'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
