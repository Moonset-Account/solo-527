'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { createOrder } from '@/lib/order-service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, ArrowLeft, Calendar, Camera, Package } from 'lucide-react'
import Link from 'next/link'
import { Database } from '@/types/database'
import { addHours } from 'date-fns'

type Studio = Database['public']['Tables']['studios']['Row']
type Package = Database['public']['Tables']['packages']['Row']
type Equipment = Database['public']['Tables']['equipment']['Row']

export default function NewOrderPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [studios, setStudios] = useState<Studio[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedStudio, setSelectedStudio] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const supabase = createClient()
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: studiosData }, { data: packagesData }, { data: equipmentData }] = await Promise.all([
        supabase.from('studios').select('*').eq('is_active', true),
        supabase.from('packages').select('*').eq('is_active', true),
        supabase.from('equipment').select('*').eq('status', 'available'),
      ])

      setStudios(studiosData || [])
      setPackages(packagesData || [])
      setEquipment(equipmentData || [])
      setLoading(false)

      const defaultStart = new Date()
      defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0)
      const defaultEnd = addHours(defaultStart, 4)
      setStartTime(defaultStart.toISOString().slice(0, 16))
      setEndTime(defaultEnd.toISOString().slice(0, 16))
    }

    fetchData()
  }, [])

  const calculateTotal = () => {
    let total = 0
    const studio = studios.find(s => s.id === selectedStudio)
    const pkg = packages.find(p => p.id === selectedPackage)

    if (pkg) {
      total += pkg.base_price
    } else if (studio && startTime && endTime) {
      const hours = Math.max(1, (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60))
      total += studio.hourly_rate * Math.ceil(hours)
    }

    selectedEquipment.forEach(eqId => {
      const eq = equipment.find(e => e.id === eqId)
      if (eq) total += eq.rental_price
    })

    return total
  }

  const calculateDeposit = () => {
    let deposit = 0
    selectedEquipment.forEach(eqId => {
      const eq = equipment.find(e => e.id === eqId)
      if (eq) deposit += eq.deposit_amount
    })
    return deposit
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const order = await createOrder({
        customerId: user.id,
        studioId: selectedStudio,
        packageId: selectedPackage || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        equipmentIds: selectedEquipment,
        notes,
      })
      router.push(`/orders/${order.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">新建预约</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择棚位</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studios.map((studio) => (
              <div
                key={studio.id}
                onClick={() => setSelectedStudio(studio.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedStudio === studio.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{studio.name}</h3>
                <p className="text-sm text-gray-500">{studio.hourly_rate} 元/小时</p>
                {studio.description && (
                  <p className="text-sm text-gray-600 mt-1">{studio.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择套餐（可选）</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedPackage('')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPackage === ''
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">自定义</h3>
              <p className="text-sm text-gray-500">按小时计费</p>
            </div>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedPackage === pkg.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                <p className="text-sm text-gray-500">{formatCurrency(pkg.base_price)} · {pkg.studio_hours}小时</p>
                {pkg.description && (
                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择时间</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择器材（可选）</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                onClick={() => {
                  setSelectedEquipment(prev =>
                    prev.includes(eq.id)
                      ? prev.filter(id => id !== eq.id)
                      : [...prev, eq.id]
                  )
                }}
                className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                  selectedEquipment.includes(eq.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Camera className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{eq.name}</p>
                    <p className="text-sm text-gray-500">租金：{formatCurrency(eq.rental_price)} · 押金：{formatCurrency(eq.deposit_amount)}</p>
                  </div>
                </div>
                {selectedEquipment.includes(eq.id) && (
                  <div className="h-5 w-5 bg-primary-600 rounded flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">备注</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="有什么特殊需求吗？"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">费用明细</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">总金额</span>
              <span className="font-bold text-xl">{formatCurrency(calculateTotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">押金总额</span>
              <span className="font-medium">{formatCurrency(calculateDeposit())}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href="/orders"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting || !selectedStudio}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            提交预约
          </button>
        </div>
      </form>
    </div>
  )
}
