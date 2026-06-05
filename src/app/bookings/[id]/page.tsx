'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Phone, Calendar, MapPin, DollarSign, User, Clock, Package, AlertCircle } from 'lucide-react'
import { BookingStatusBadge, PaymentStatusBadge, ContractStatusBadge } from '@/components/StatusBadges'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    loadBooking()
  }, [params.id])

  async function loadBooking() {
    try {
      setLoading(true)
      const res = await fetch(`/api/bookings/${params.id}`)
      const data = await res.json()
      setBooking(data.data || mockBooking)
    } catch (error) {
      setBooking(mockBooking)
    } finally {
      setLoading(false)
    }
  }

  const mockBooking = {
    id: '1',
    booking_no: 'BK202401150001',
    status: 'confirmed',
    contract_status: 'signed',
    payment_status: 'deposit_paid',
    start_time: '2024-01-15T09:00:00',
    end_time: '2024-01-15T12:00:00',
    total_amount: 1500,
    deposit_amount: 500,
    paid_amount: 500,
    notes: '客户需要白色背景，准备3套服装',
    created_at: '2024-01-10T14:30:00',
    clients: {
      id: '1',
      name: '张三',
      phone: '138****1234',
      email: 'zhangsan@example.com',
      company: '某某科技有限公司',
    },
    studios: {
      id: '1',
      name: 'A棚 - 无影墙',
      hourly_rate: 300,
    },
    packages: {
      id: '1',
      name: '基础电商套餐',
    },
    photographer: {
      id: '2',
      full_name: '李摄影师',
    },
    creator: {
      id: '1',
      full_name: '王经理',
    },
    booking_equipment: [
      {
        id: '1',
        quantity: 1,
        unit_price: 80,
        equipment: { id: '1', name: 'Canon EOS R5', sku: 'CAM-001' },
      },
      {
        id: '2',
        quantity: 2,
        unit_price: 25,
        equipment: { id: '5', name: 'Godox SL60W', sku: 'LIT-002' },
      },
    ],
    booking_assistants: [
      {
        id: '1',
        hours: 4,
        unit_price: 100,
        assistants: { id: '1', name: '张助理', phone: '138****0001' },
      },
    ],
    payments: [
      {
        id: '1',
        amount: 500,
        payment_method: '微信',
        is_deposit: true,
        transaction_no: 'WX20240110123456',
        created_at: '2024-01-10T14:35:00',
        creator: { full_name: '王经理' },
      },
    ],
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">订单不存在</div>
      </div>
    )
  }

  const remainingAmount = booking.total_amount - booking.paid_amount

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/bookings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      loadBooking()
    } catch (error) {
      console.error('Failed to update status', error)
    }
    setShowActions(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10 safe-area-top">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-800">订单详情</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-gray-100">
            <Edit size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-4 py-4">
        <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-lg font-bold text-gray-800">{booking.booking_no}</div>
              <div className="text-sm text-gray-500">创建于 {new Date(booking.created_at).toLocaleString('zh-CN')}</div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                变更状态
              </button>
              {showActions && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-20">
                  {['pending', 'confirmed', 'in_progress', 'completed', 'rescheduled', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status === 'pending' && '设为待确认'}
                      {status === 'confirmed' && '设为已确认'}
                      {status === 'in_progress' && '设为进行中'}
                      {status === 'completed' && '设为已完成'}
                      {status === 'rescheduled' && '标记改期'}
                      {status === 'cancelled' && '取消订单'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.payment_status} />
            <ContractStatusBadge status={booking.contract_status} />
          </div>
        </div>

        <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">客户信息</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <div>
                <div className="font-medium text-gray-800">{booking.clients.name}</div>
                {booking.clients.company && (
                  <div className="text-sm text-gray-500">{booking.clients.company}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <a href={`tel:${booking.clients.phone}`} className="text-primary-600">
                {booking.clients.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">档期信息</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <div className="text-gray-800">
                  {new Date(booking.start_time).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {booking.start_time.slice(11, 16)} - {booking.end_time.slice(11, 16)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-gray-400" />
              <div className="text-gray-800">{booking.studios?.name}</div>
            </div>
            {booking.packages && (
              <div className="flex items-center gap-3">
                <Package size={18} className="text-gray-400" />
                <div className="text-gray-800">{booking.packages.name}</div>
              </div>
            )}
            {booking.photographer && (
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-400" />
                <div className="text-gray-800">摄影师：{booking.photographer.full_name}</div>
              </div>
            )}
          </div>
        </div>

        {booking.booking_equipment && booking.booking_equipment.length > 0 && (
          <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">租赁器材</h3>
            <div className="space-y-2">
              {booking.booking_equipment.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-gray-800">{item.equipment.name}</div>
                    <div className="text-xs text-gray-500">x{item.quantity}</div>
                  </div>
                  <div className="text-gray-800">¥{item.unit_price * item.quantity}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.booking_assistants && booking.booking_assistants.length > 0 && (
          <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">拍摄助理</h3>
            <div className="space-y-2">
              {booking.booking_assistants.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-gray-800">{item.assistants.name}</div>
                    <div className="text-xs text-gray-500">{item.hours}小时</div>
                  </div>
                  <div className="text-gray-800">¥{item.unit_price * item.hours}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">费用明细</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">总金额</span>
              <span className="text-gray-800">¥{booking.total_amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">定金</span>
              <span className="text-gray-800">¥{booking.deposit_amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">已付</span>
              <span className="text-green-600">¥{booking.paid_amount}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800">待收</span>
                <span className="font-bold text-orange-600">¥{remainingAmount}</span>
              </div>
            </div>
          </div>

          {remainingAmount > 0 && (
            <button className="w-full mt-4 bg-primary-600 text-white py-2.5 rounded-lg font-medium">
              登记收款
            </button>
          )}
        </div>

        {booking.payments && booking.payments.length > 0 && (
          <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">收款记录</h3>
            <div className="space-y-3">
              {booking.payments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-gray-800">
                      {payment.is_deposit ? '定金' : '尾款'} - {payment.payment_method}
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.creator?.full_name} · {new Date(payment.created_at).toLocaleString('zh-CN')}
                    </div>
                    {payment.transaction_no && (
                      <div className="text-xs text-gray-400">单号: {payment.transaction_no}</div>
                    )}
                  </div>
                  <div className="font-semibold text-green-600">+¥{payment.amount}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.notes && (
          <div className="bg-white mx-4 rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-2">备注</h3>
            <p className="text-gray-600 text-sm">{booking.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
