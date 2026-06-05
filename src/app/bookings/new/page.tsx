'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Calendar, Clock, Package, User } from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from '@/components/MobileNav'

const studios = [
  { id: '1', name: 'A棚 - 专业摄影棚', hourly_rate: 200 },
  { id: '2', name: 'B棚 - 小型摄影棚', hourly_rate: 150 },
  { id: '3', name: 'C棚 - 绿幕棚', hourly_rate: 180 },
]

const mockClients = [
  { id: '1', name: '张三', phone: '138****1234' },
  { id: '2', name: '李四公司', phone: '139****5678' },
  { id: '3', name: '王五公司', phone: '137****9012' },
]

const mockEquipment = [
  { id: '1', name: 'Canon EOS R5', hourly_rate: 80 },
  { id: '2', name: 'Sony A7 IV', hourly_rate: 70 },
  { id: '3', name: 'Canon 24-70mm f/2.8', hourly_rate: 40 },
  { id: '4', name: 'Profoto B10X Plus', hourly_rate: 60 },
  { id: '5', name: 'Godox SL60W', hourly_rate: 25 },
]

export default function NewBookingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    client_id: '',
    studio_id: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '18:00',
    equipment_ids: [] as string[],
    deposit_amount: 0,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  function calculateTotal() {
    let total = 0
    
    const studio = studios.find(s => s.id === formData.studio_id)
    if (studio && formData.start_date && formData.end_date) {
      const start = new Date(`${formData.start_date}T${formData.start_time}`)
      const end = new Date(`${formData.end_date}T${formData.end_time}`)
      const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))
      total += studio.hourly_rate * hours
    }

    formData.equipment_ids.forEach(eqId => {
      const eq = mockEquipment.find(e => e.id === eqId)
      if (eq) {
        total += eq.hourly_rate * 8
      }
    })

    return total
  }

  const totalAmount = calculateTotal()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const start_time = `${formData.start_date}T${formData.start_time}:00`
      const end_time = `${formData.end_date}T${formData.end_time}:00`

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: formData.client_id,
          studio_id: formData.studio_id,
          start_time,
          end_time,
          total_amount: totalAmount,
          deposit_amount: formData.deposit_amount,
          equipment_ids: formData.equipment_ids,
          notes: formData.notes,
        }),
      })

      if (res.ok) {
        router.push('/bookings')
      } else {
        alert('创建订单失败')
      }
    } catch (error) {
      console.error('Create booking error:', error)
      alert('创建订单失败')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleEquipment(id: string) {
    setFormData(prev => ({
      ...prev,
      equipment_ids: prev.equipment_ids.includes(id)
        ? prev.equipment_ids.filter(eid => eid !== id)
        : [...prev.equipment_ids, id],
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <Link href="/bookings" className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">新建订单</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-medium text-gray-800 flex items-center gap-2">
            <User size={18} className="text-primary-600" />
            客户信息
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择客户</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">请选择客户</option>
              {mockClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-medium text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-primary-600" />
            档期信息
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择棚位</label>
            <select
              value={formData.studio_id}
              onChange={(e) => setFormData(prev => ({ ...prev, studio_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">请选择棚位</option>
              {studios.map(studio => (
                <option key={studio.id} value={studio.id}>
                  {studio.name} (¥{studio.hourly_rate}/小时)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-medium text-gray-800 flex items-center gap-2">
            <Package size={18} className="text-primary-600" />
            器材租赁
          </h2>

          <div className="space-y-2">
            {mockEquipment.map(eq => (
              <label
                key={eq.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.equipment_ids.includes(eq.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.equipment_ids.includes(eq.id)}
                    onChange={() => toggleEquipment(eq.id)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{eq.name}</div>
                    <div className="text-xs text-gray-500">¥{eq.hourly_rate}/小时</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-medium text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-primary-600" />
            费用信息
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">定金金额 (元)</label>
            <input
              type="number"
              min="0"
              value={formData.deposit_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="输入定金金额"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="输入备注信息"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-gray-800">预估总金额</span>
              <span className="text-primary-600">¥{totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-20">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? '创建中...' : '创建订单'}
          </button>
        </div>
      </form>

      <MobileNav />
    </div>
  )
}
