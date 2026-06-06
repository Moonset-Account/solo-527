'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { confirmOrder, addExtraEquipment, pickupEquipment, returnEquipment } from '@/lib/order-service'
import { StatusBadge } from '@/components/StatusBadge'
import { Loader2, ArrowLeft, Package, Camera, DollarSign, FileText, AlertTriangle, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row'] & {
  studio: { name: string; hourly_rate: number } | null
  customer: { full_name: string | null; email: string; phone: string | null } | null
  package: { name: string; base_price: number } | null
  order_equipment: (Database['public']['Tables']['order_equipment']['Row'] & {
    equipment: Database['public']['Tables']['equipment']['Row'] | null
  })[]
  deposit_transactions: Database['public']['Tables']['deposit_transactions']['Row'][]
  damage_records: (Database['public']['Tables']['damage_records']['Row'] & {
    equipment: { name: string } | null
    responsible_party: { full_name: string | null } | null
  })[]
  contracts: Database['public']['Tables']['contracts']['Row'][]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [availableEquipment, setAvailableEquipment] = useState<Database['public']['Tables']['equipment']['Row'][]>([])
  const { profile, user } = useAuth()
  const supabase = createClient()

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          studio:studios(*),
          customer:profiles(*),
          package:packages(*),
          order_equipment(*, equipment:equipment(*)),
          deposit_transactions(*),
          damage_records(*, equipment:equipment(name), responsible_party:profiles(full_name)),
          contracts(*)
        `)
        .eq('id', params.id)
        .single()

      setOrder(data as Order)

      const { data: equipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'available')

      setAvailableEquipment(equipment || [])
      setLoading(false)
    }

    fetchOrder()
  }, [params.id])

  const handleConfirm = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      await confirmOrder(order!.id, user.id)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddEquipment = async (equipmentId: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await addExtraEquipment(order!.id, equipmentId, user.id)
      setShowAddEquipment(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePickup = async (orderEquipmentId: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await pickupEquipment(orderEquipmentId, user.id)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturn = async (orderEquipmentId: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await returnEquipment(orderEquipmentId, user.id)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-12">订单不存在</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
          <p className="text-gray-500">订单号：{order.order_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">订单信息</h2>
                <p className="text-sm text-gray-500">创建于 {formatDate(order.created_at)}</p>
              </div>
              <StatusBadge status={order.status} className="text-base px-3 py-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">棚位</p>
                <p className="font-medium">{order.studio?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">套餐</p>
                <p className="font-medium">{order.package?.name || '自定义'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开始时间</p>
                <p className="font-medium">{formatDate(order.start_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">结束时间</p>
                <p className="font-medium">{formatDate(order.end_time)}</p>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">备注</p>
                <p className="text-gray-900">{order.notes}</p>
              </div>
            )}

            {isStaff && order.status === 'pending' && (
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="mt-4 w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '确认订单'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">器材清单</h2>
              {isStaff && order.status !== 'completed' && order.status !== 'cancelled' && (
                <button
                  onClick={() => setShowAddEquipment(!showAddEquipment)}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加器材
                </button>
              )}
            </div>

            {showAddEquipment && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">选择可用器材</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex items-center justify-between p-2 bg-white rounded border hover:border-primary-500 cursor-pointer"
                      onClick={() => handleAddEquipment(eq.id)}
                    >
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        <p className="text-sm text-gray-500">
                          租金：{formatCurrency(eq.rental_price)} · 押金：{formatCurrency(eq.deposit_amount)}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {order.order_equipment.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无器材</p>
              ) : (
                order.order_equipment.map((oe) => (
                  <div key={oe.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Camera className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{oe.equipment?.name}</p>
                        <p className="text-sm text-gray-500">
                          租金：{formatCurrency(oe.rental_price)} · 押金：{formatCurrency(oe.deposit_amount)}
                          {oe.is_extra && <span className="ml-2 text-yellow-600">（临时添加）</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!oe.picked_up && isStaff && (
                        <button
                          onClick={() => handlePickup(oe.id)}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          登记领用
                        </button>
                      )}
                      {oe.picked_up && !oe.returned && isStaff && (
                        <button
                          onClick={() => handleReturn(oe.id)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          登记归还
                        </button>
                      )}
                      {oe.picked_up && <span className="text-sm text-green-600">已领用</span>}
                      {oe.returned && <span className="text-sm text-gray-500">已归还</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {order.damage_records.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900">损坏记录</h2>
              </div>
              <div className="space-y-3">
                {order.damage_records.map((dr) => (
                  <div key={dr.id} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{dr.equipment?.name}</p>
                        <p className="text-sm text-gray-600">{dr.description}</p>
                        <p className="text-sm text-gray-500">
                          责任人：{dr.responsible_party?.full_name || '未知'}
                          {dr.repair_cost && ` · 维修费用：${formatCurrency(dr.repair_cost)}`}
                        </p>
                      </div>
                      <StatusBadge status={dr.severity} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">合同附件</h2>
            </div>
            {order.contracts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无合同</p>
            ) : (
              <div className="space-y-2">
                {order.contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary-500" />
                      <div>
                        <p className="font-medium">{contract.file_name}</p>
                        <p className="text-sm text-gray-500">上传于 {formatDate(contract.created_at)}</p>
                      </div>
                    </div>
                    {contract.signed ? (
                      <span className="flex items-center text-sm text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        已签署
                      </span>
                    ) : (
                      <span className="text-sm text-yellow-600">待签署</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">客户信息</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium">{order.customer?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium">{order.customer?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">电话</p>
                <p className="font-medium">{order.customer?.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">费用明细</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">总金额</span>
                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">押金总额</span>
                <span className="font-medium">{formatCurrency(order.deposit_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">付款状态</span>
                <StatusBadge status={order.payment_status} />
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium text-gray-900 mb-2">押金流水</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {order.deposit_transactions.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无记录</p>
                  ) : (
                    order.deposit_transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">{formatDate(tx.created_at, 'MM-dd HH:mm')}</span>
                        <span className={tx.type === 'charge' ? 'text-red-600' : tx.type === 'refund' ? 'text-green-600' : 'text-gray-600'}>
                          {tx.type === 'charge' ? '+' : tx.type === 'refund' ? '-' : ''}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
