'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Upload, AlertTriangle, Save } from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from '@/components/MobileNav'

const mockEquipment = [
  { id: '1', name: 'Canon EOS R5', sku: 'CAM-001' },
  { id: '2', name: 'Sony A7 IV', sku: 'CAM-002' },
  { id: '3', name: 'Canon 24-70mm f/2.8', sku: 'LEN-001' },
  { id: '4', name: 'Profoto B10X Plus', sku: 'LIT-001' },
  { id: '5', name: 'Godox SL60W', sku: 'LIT-002' },
  { id: '6', name: 'Manfrotto 三脚架', sku: 'TRIPOD-001' },
]

const severityOptions = [
  { value: 'minor', label: '轻微损坏', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'moderate', label: '中度损坏', color: 'bg-orange-100 text-orange-700' },
  { value: 'severe', label: '严重损坏', color: 'bg-red-100 text-red-700' },
  { value: 'total', label: '完全损坏', color: 'bg-gray-800 text-white' },
]

export default function NewDamagePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    equipment_id: '',
    booking_id: '',
    severity: 'minor',
    description: '',
    responsible_party: '',
    repair_cost: 0,
  })
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  function handleAddImage() {
    const mockImage = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=damage%20camera%20equipment%20scratch&image_size=square`
    setImages(prev => [...prev, mockImage])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/damages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
        }),
      })

      if (res.ok) {
        router.push('/equipment')
      } else {
        alert('上报失败，请重试')
      }
    } catch (error) {
      console.error('Report damage error:', error)
      alert('上报失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <Link href="/equipment" className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">上报损坏</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle size={18} />
            <span className="font-medium">损坏信息</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择器材 *</label>
            <select
              value={formData.equipment_id}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">请选择损坏的器材</option>
              {mockEquipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">损坏程度 *</label>
            <div className="grid grid-cols-2 gap-2">
              {severityOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, severity: opt.value }))}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.severity === opt.value
                      ? `${opt.color} ring-2 ring-offset-2 ring-orange-400`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">损坏描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="请详细描述损坏情况，如：镜头镜片有划痕、机身外壳凹陷等"
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-medium text-gray-800">责任归属</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">责任人/方 *</label>
            <input
              type="text"
              value={formData.responsible_party}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible_party: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="如：客户张三、拍摄助理李四等"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联订单号</label>
            <input
              type="text"
              value={formData.booking_id}
              onChange={(e) => setFormData(prev => ({ ...prev, booking_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="选填，如：BK202401150001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预估维修费用 (元)</label>
            <input
              type="number"
              min="0"
              value={formData.repair_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, repair_cost: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="选填，预估维修费用"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-medium text-gray-800">照片凭证</h2>

          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={img} alt="损坏照片" className="w-full h-full object-cover" />
              </div>
            ))}
            {images.length < 6 && (
              <button
                type="button"
                onClick={handleAddImage}
                className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                <Camera size={24} />
                <span className="text-xs mt-1">添加照片</span>
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500">最多可上传 6 张照片，建议拍摄损坏部位特写</p>
        </div>

        <div className="sticky bottom-20">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? '提交中...' : '提交损坏报告'}
          </button>
        </div>
      </form>

      <MobileNav />
    </div>
  )
}
