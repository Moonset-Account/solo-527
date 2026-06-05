'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Package, Calendar, AlertTriangle, Upload, QrCode } from 'lucide-react'
import { EquipmentStatusBadge } from '@/components/StatusBadges'

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [equipment, setEquipment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'damages'>('info')

  useEffect(() => {
    loadEquipment()
  }, [params.id])

  async function loadEquipment() {
    try {
      setLoading(true)
      const res = await fetch(`/api/equipment/${params.id}`)
      const data = await res.json()
      setEquipment(data.data || mockEquipment)
    } catch (error) {
      setEquipment(mockEquipment)
    } finally {
      setLoading(false)
    }
  }

  const mockEquipment = {
    id: '1',
    name: 'Canon EOS R5',
    sku: 'CAM-001',
    status: 'available',
    hourly_rate: 80,
    daily_rate: 500,
    purchase_price: 25999,
    purchase_date: '2023-06-15',
    serial_number: 'SN-R5-001234',
    brand: 'Canon',
    model: 'EOS R5',
    description: '专业全画幅微单相机，8K视频拍摄，4500万像素',
    notes: '购买时附带原装电池2块，充电器1个',
    qr_code: 'CAM-001-123456',
    category: { id: '1', name: '相机机身' },
    created_at: '2023-06-15T10:00:00',
    rental_history: [
      {
        id: '1',
        booking_no: 'BK20240110001',
        client_name: '张三',
        start_time: '2024-01-10T09:00:00',
        end_time: '2024-01-10T18:00:00',
        pickup_by: '李助理',
        return_by: '王助理',
      },
      {
        id: '2',
        booking_no: 'BK20240105002',
        client_name: '李四公司',
        start_time: '2024-01-05T14:00:00',
        end_time: '2024-01-06T20:00:00',
        pickup_by: '张助理',
        return_by: '张助理',
      },
    ],
    damage_reports: [
      {
        id: '1',
        severity: 'minor',
        description: '机身底部有轻微划痕',
        reporter: '李助理',
        created_at: '2024-01-08T16:30:00',
        repair_cost: 0,
        status: 'resolved',
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

  if (!equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">器材不存在</div>
      </div>
    )
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
          <h1 className="flex-1 text-center font-semibold text-gray-800">器材详情</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-gray-100">
            <Edit size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="aspect-square bg-white flex items-center justify-center">
        <Package size={80} className="text-gray-300" />
      </div>

      <div className="bg-white mx-4 -mt-4 rounded-xl shadow-sm relative z-10 p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{equipment.name}</h2>
            <p className="text-sm text-gray-500">{equipment.brand} {equipment.model}</p>
          </div>
          <EquipmentStatusBadge status={equipment.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs text-gray-500">编号</div>
            <div className="font-medium text-gray-800">{equipment.sku}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">序列号</div>
            <div className="font-medium text-gray-800 text-sm">{equipment.serial_number}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">时租</div>
            <div className="font-semibold text-primary-600">¥{equipment.hourly_rate}/h</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">日租</div>
            <div className="font-semibold text-primary-600">¥{equipment.daily_rate}/天</div>
          </div>
        </div>
      </div>

      <div className="bg-white mx-4 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex border-b border-gray-100 -mx-4 px-4 mb-4">
          {[
            { key: 'info', label: '基本信息' },
            { key: 'history', label: '租借记录' },
            { key: 'damages', label: '损坏记录' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-2 px-2 -mb-px text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">分类</div>
              <div className="text-gray-800">{equipment.category.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">描述</div>
              <div className="text-gray-800">{equipment.description}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">购入信息</div>
              <div className="text-gray-800">
                ¥{equipment.purchase_price} · {equipment.purchase_date}
              </div>
            </div>
            {equipment.notes && (
              <div>
                <div className="text-xs text-gray-500 mb-1">备注</div>
                <div className="text-gray-800">{equipment.notes}</div>
              </div>
            )}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-lg text-gray-700 text-sm">
                <QrCode size={18} />
                查看二维码
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-lg text-gray-700 text-sm">
                <Upload size={18} />
                上传图片
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {equipment.rental_history.map((record: any) => (
              <div key={record.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-800">{record.booking_no}</div>
                    <div className="text-sm text-gray-500">{record.client_name}</div>
                  </div>
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(record.start_time).toLocaleDateString('zh-CN')} - {new Date(record.end_time).toLocaleDateString('zh-CN')}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  取出: {record.pickup_by} · 归还: {record.return_by}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'damages' && (
          <div className="space-y-3">
            {equipment.damage_reports.map((damage: any) => (
              <div key={damage.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      damage.severity === 'minor' ? 'bg-yellow-100 text-yellow-700' :
                      damage.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {damage.severity === 'minor' ? '轻微' :
                       damage.severity === 'moderate' ? '中等' : '严重'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(damage.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{damage.description}</p>
                <div className="text-xs text-gray-500">
                  上报人: {damage.reporter}
                  {damage.repair_cost > 0 && ` · 维修费用: ¥${damage.repair_cost}`}
                </div>
              </div>
            ))}

            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:border-primary-500 hover:text-primary-600 transition-colors">
              + 上报损坏
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
