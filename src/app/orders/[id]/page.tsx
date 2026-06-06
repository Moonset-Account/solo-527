'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate, getStatusText } from '@/lib/utils'
import { confirmOrder, addExtraEquipment, pickupEquipment, returnEquipment, createDamageRecord } from '@/lib/order-service'
import { StatusBadge } from '@/components/StatusBadge'
import type { OrderWithDetails, Equipment, Profile } from '@/types'
import {
  Loader2, ArrowLeft, Camera, DollarSign, FileText, AlertTriangle,
  Plus, Check, X, Upload, PenLine, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [showDamageModal, setShowDamageModal] = useState(false)
  const [selectedEquipmentForDamage, setSelectedEquipmentForDamage] = useState<string>('')
  const [damageDescription, setDamageDescription] = useState('')
  const [damageSeverity, setDamageSeverity] = useState<'minor' | 'moderate' | 'severe' | 'total'>('minor')
  const [damageRepairCost, setDamageRepairCost] = useState('')
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [responsibleParty, setResponsibleParty] = useState('')
  const [uploadingContract, setUploadingContract] = useState(false)
  const { profile, user } = useAuth()
  const supabase = createClient()

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      const { data: orderData } = await supabase
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

      setOrder(orderData as unknown as OrderWithDetails)

      const { data: equipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'available')

      setAvailableEquipment(equipment as Equipment[] || [])

      if (isStaff) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
        setAllProfiles(profiles as Profile[] || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [params.id, isStaff])

  const refreshData = async () => {
    const { data: orderData } = await supabase
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

    setOrder(orderData as unknown as OrderWithDetails)
  }

  const handleConfirm = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      await confirmOrder(order!.id, user.id)
      await refreshData()
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
      await refreshData()
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
      await refreshData()
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
      await refreshData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReportDamage = async () => {
    if (!user || !selectedEquipmentForDamage || !damageDescription || !responsibleParty) {
      alert('请填写完整的损坏信息')
      return
    }

    setActionLoading(true)
    try {
      await createDamageRecord({
        orderId: order!.id,
        equipmentId: selectedEquipmentForDamage,
        description: damageDescription,
        severity: damageSeverity,
        repairCost: damageRepairCost ? parseFloat(damageRepairCost) : undefined,
        responsiblePartyId: responsibleParty,
        reportedBy: user.id,
      })
      setShowDamageModal(false)
      setDamageDescription('')
      setSelectedEquipmentForDamage('')
      setDamageRepairCost('')
      setResponsibleParty('')
      await refreshData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadContract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingContract(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orderId', order!.id)
      formData.append('uploadedBy', user.id)

      const response = await fetch('/api/contracts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('上传失败')

      await refreshData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploadingContract(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleViewContract = async (filePath: string) => {
    const response = await fetch(`/api/contracts?filePath=${encodeURIComponent(filePath)}`)
    const data = await response.json()
    if (data.url) {
      window.open(data.url, '_blank')
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

  const orderEquipmentForDamage = order.order_equipment.filter(oe => !oe.returned)

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
              <div className="flex items-center space-x-2">
                {isStaff && order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowAddEquipment(!showAddEquipment)}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加器材
                  </button>
                )}
                {isStaff && orderEquipmentForDamage.length > 0 && (
                  <button
                    onClick={() => setShowDamageModal(true)}
                    className="flex items-center text-sm text-red-600 hover:text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    登记损坏
                  </button>
                )}
              </div>
            </div>

            {showAddEquipment && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">选择可用器材</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEquipment.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">暂无可用器材</p>
                  ) : (
                    availableEquipment.map((eq) => (
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
                    ))
                  )}
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
                          disabled={actionLoading}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          登记领用
                        </button>
                      )}
                      {oe.picked_up && !oe.returned && isStaff && (
                        <button
                          onClick={() => handleReturn(oe.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">损坏记录</h2>
            </div>
            {order.damage_records.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无损坏记录</p>
            ) : (
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
                        <p className="text-xs text-gray-400 mt-1">
                          登记于 {formatDate(dr.reported_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <StatusBadge status={dr.severity} />
                        {dr.resolved ? (
                          <span className="text-xs text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" />已处理
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-600">待处理</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">合同附件</h2>
              </div>
              {isStaff && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadContract}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingContract}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    {uploadingContract ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    上传合同
                  </button>
                </div>
              )}
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
                        <p className="font-medium cursor-pointer hover:text-primary-600"
                           onClick={() => handleViewContract(contract.file_path)}>
                          {contract.file_name}
                        </p>
                        <p className="text-sm text-gray-500">上传于 {formatDate(contract.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewContract(contract.file_path)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        查看
                      </button>
                      {contract.signed ? (
                        <span className="flex items-center text-sm text-green-600">
                          <Check className="h-4 w-4 mr-1" />
                          已签署
                        </span>
                      ) : (
                        isStaff && (
                          <button className="flex items-center text-sm text-yellow-600 hover:text-yellow-700">
                            <PenLine className="h-4 w-4 mr-1" />
                            签署
                          </button>
                        )
                      )}
                    </div>
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
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {order.deposit_transactions.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无记录</p>
                  ) : (
                    order.deposit_transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">{formatDate(tx.created_at, 'MM-dd HH:mm')}</span>
                        <div className="text-right">
                          <span className={tx.type === 'charge' ? 'text-red-600' : tx.type === 'refund' ? 'text-green-600' : 'text-gray-600'}>
                            {tx.type === 'charge' ? '+' : tx.type === 'refund' ? '-' : ''}{formatCurrency(tx.amount)}
                          </span>
                          <span className="block text-xs text-gray-400">{getStatusText(tx.type)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDamageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">登记器材损坏</h3>
              <button onClick={() => setShowDamageModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择器材</label>
                <select
                  value={selectedEquipmentForDamage}
                  onChange={(e) => setSelectedEquipmentForDamage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择器材</option>
                  {orderEquipmentForDamage.map((oe) => (
                    <option key={oe.id} value={oe.equipment_id}>
                      {oe.equipment?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">损坏描述</label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请详细描述损坏情况..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select
                  value={damageSeverity}
                  onChange={(e) => setDamageSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="minor">轻微</option>
                  <option value="moderate">中等</option>
                  <option value="severe">严重</option>
                  <option value="total">报废</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预估维修费用（可选）</label>
                <input
                  type="number"
                  value={damageRepairCost}
                  onChange={(e) => setDamageRepairCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">责任人</label>
                <select
                  value={responsibleParty}
                  onChange={(e) => setResponsibleParty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择责任人</option>
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email} ({getStatusText(p.role)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowDamageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleReportDamage}
                  disabled={actionLoading || !selectedEquipmentForDamage || !damageDescription}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '提交损坏报告'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
