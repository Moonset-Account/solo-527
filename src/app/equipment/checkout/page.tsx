'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scan, Check, Package, Search } from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from '@/components/MobileNav'

const mockBookings = [
  {
    id: '1',
    booking_no: 'BK202401150001',
    client_name: '张三',
    start_time: '2024-01-15T09:00:00',
    equipment: [
      { id: '1', name: 'Canon EOS R5', sku: 'CAM-001', status: 'available', picked: false },
      { id: '3', name: 'Canon 24-70mm f/2.8', sku: 'LEN-001', status: 'available', picked: false },
      { id: '5', name: 'Godox SL60W', sku: 'LIT-002', status: 'available', picked: false },
    ],
  },
  {
    id: '2',
    booking_no: 'BK202401150002',
    client_name: '李四公司',
    start_time: '2024-01-15T14:00:00',
    equipment: [
      { id: '2', name: 'Sony A7 IV', sku: 'CAM-002', status: 'available', picked: false },
      { id: '4', name: 'Profoto B10X Plus', sku: 'LIT-001', status: 'available', picked: false },
    ],
  },
]

export default function EquipmentCheckoutPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState(mockBookings)
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredBookings = bookings.filter(b =>
    b.booking_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentBooking = bookings.find(b => b.id === selectedBooking)
  const pickedCount = currentBooking?.equipment.filter(e => e.picked).length || 0
  const totalEquipment = currentBooking?.equipment.length || 0

  function toggleEquipment(bookingId: string, equipmentId: string) {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b
      return {
        ...b,
        equipment: b.equipment.map(e => 
          e.id === equipmentId ? { ...e, picked: !e.picked } : e
        ),
      }
    }))
  }

  async function handleCheckout() {
    if (!selectedBooking) return
    setSubmitting(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    setSubmitting(false)
    alert('器材出库成功！')
    router.push('/equipment')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <Link href="/equipment" className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">器材出库</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!selectedBooking ? (
          <>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索订单号或客户名称"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                <Scan size={18} />
                扫码找订单
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">今日待出库订单</h3>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-white rounded-xl">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p>暂无待出库订单</p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking.id)}
                    className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">{booking.booking_no}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {booking.equipment.length} 件器材
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{booking.client_name}</div>
                    <div className="text-xs text-gray-500">
                      预约时间：{new Date(booking.start_time).toLocaleString('zh-CN')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-gray-800">{currentBooking?.booking_no}</div>
                  <div className="text-sm text-gray-500">{currentBooking?.client_name}</div>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  更换订单
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full">
                  已拣 {pickedCount}/{totalEquipment}
                </div>
                {pickedCount === totalEquipment && (
                  <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    拣货完成
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-800">器材清单</h3>
                <p className="text-xs text-gray-500 mt-0.5">点击勾选已拣选的器材</p>
              </div>
              <div className="divide-y divide-gray-100">
                {currentBooking?.equipment.map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => toggleEquipment(selectedBooking, eq.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      eq.picked ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      eq.picked ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {eq.picked && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${eq.picked ? 'text-green-700' : 'text-gray-800'}`}>
                        {eq.name}
                      </div>
                      <div className="text-xs text-gray-500">{eq.sku}</div>
                    </div>
                    <Scan size={18} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="sticky bottom-20 space-y-3">
              <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                <Scan size={18} />
                扫码核对器材
              </button>
              <button
                onClick={handleCheckout}
                disabled={pickedCount !== totalEquipment || submitting}
                className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={18} />
                {submitting ? '出库中...' : '确认出库'}
              </button>
            </div>
          </>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
