import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Droplets, Bug, ShowerHead, Scissors, Leaf, Wrench,
  CheckCircle, XCircle, Pencil, Calendar, MapPin, Sprout, User, Loader2,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useAuthStore } from '@/stores/authStore'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import { cn } from '@/lib/utils'

const typeMap: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  fertilization: { label: '施肥', icon: Droplets, color: 'text-green-600 bg-green-50' },
  pesticide: { label: '打药', icon: Bug, color: 'text-red-600 bg-red-50' },
  irrigation: { label: '灌溉', icon: ShowerHead, color: 'text-blue-600 bg-blue-50' },
  pruning: { label: '修剪', icon: Scissors, color: 'text-amber-600 bg-amber-50' },
  weeding: { label: '除草', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  other: { label: '其他', icon: Wrench, color: 'text-gray-600 bg-gray-50' },
}

interface FarmRecord {
  id: string
  type: string
  plotId: string
  plotName: string
  varietyId: string
  varietyName: string
  content: string
  dosage: string
  unit: string
  operateDate: string
  operator: string
  status: string
  photos: string[]
  reviewer?: string
  reviewDate?: string
  reviewRemark?: string
}

export default function FarmRecordDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { execute, loading } = useApi<FarmRecord>()
  const { execute: reviewExecute, loading: reviewLoading } = useApi()
  const [record, setRecord] = useState<FarmRecord | null>(null)
  const [remark, setRemark] = useState('')
  const [photoModal, setPhotoModal] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      execute(`/api/farm-records/${id}`).then((d) => {
        if (d) setRecord(d)
      })
    }
  }, [id])

  const handleReview = async (action: 'approved' | 'rejected') => {
    if (!id) return
    const result = await reviewExecute(`/api/farm-records/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, remark }),
    })
    if (result) {
      execute(`/api/farm-records/${id}`).then((d) => {
        if (d) setRecord(d)
      })
      setRemark('')
    }
  }

  if (loading && !record) {
    return (
      <div className="space-y-4 p-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>记录不存在或已被删除</p>
      </div>
    )
  }

  const typeInfo = typeMap[record.type] || typeMap.other
  const TypeIcon = typeInfo.icon
  const canEdit = record.status === 'pending' || record.status === 'rejected'
  const canReview = record.status === 'pending' && (user?.role === 'admin' || user?.role === 'reviewer')

  return (
    <div>
      <PageHeader title="农事记录详情" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium', typeInfo.color)}>
                <TypeIcon className="h-4 w-4" />
                {typeInfo.label}
              </span>
              <StatusBadge status={record.status} type="farm-record" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Calendar} label="操作日期" value={record.operateDate?.slice(0, 10)} />
              <InfoRow icon={MapPin} label="地块" value={record.plotName} />
              <InfoRow icon={Sprout} label="品种" value={record.varietyName} />
              <InfoRow icon={User} label="操作人" value={record.operator} />
              {(record.dosage || record.unit) && (
                <InfoRow icon={Wrench} label="用量" value={record.dosage ? `${record.dosage} ${record.unit}` : '-'} />
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">操作内容</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{record.content}</p>
            </div>

            {record.photos?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">照片记录</h3>
                <div className="flex flex-wrap gap-3">
                  {record.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt=""
                      onClick={() => setPhotoModal(photo)}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            )}

            {canEdit && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/farm-records/${id}/edit`)}
                  className="btn-outline flex items-center gap-1.5"
                >
                  <Pencil className="h-4 w-4" />
                  编辑记录
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {canReview && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">审核操作</h3>
              <div className="space-y-3">
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="审核备注（可选）"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview('approved')}
                    disabled={reviewLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    通过
                  </button>
                  <button
                    onClick={() => handleReview('rejected')}
                    disabled={reviewLoading}
                    className="btn-danger flex-1 flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    驳回
                  </button>
                </div>
              </div>
            </div>
          )}

          {record.status !== 'pending' && (record.reviewer || record.reviewDate) && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">审核信息</h3>
              <div className="space-y-3 text-sm">
                {record.reviewer && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">审核人</span>
                    <span className="text-gray-800">{record.reviewer}</span>
                  </div>
                )}
                {record.reviewDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">审核时间</span>
                    <span className="text-gray-800">{record.reviewDate?.slice(0, 10)}</span>
                  </div>
                )}
                {record.reviewRemark && (
                  <div>
                    <span className="text-gray-500">备注</span>
                    <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg">{record.reviewRemark}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!photoModal} onClose={() => setPhotoModal(null)} title="照片查看" size="lg">
        {photoModal && (
          <img src={photoModal} alt="" className="w-full rounded-lg" />
        )}
      </Modal>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <div>
        <span className="text-xs text-gray-400">{label}</span>
        <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
      </div>
    </div>
  )
}
