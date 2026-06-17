'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/trpc/react'
import { Card, CardBody, CardHeader, CardTitle, Button, EmptyState, Input, Textarea, Select, Modal } from '@/components/ui'
import { FacilityStatusBadge, DamageStatusBadge } from '@/components/Badges'
import { formatDate, formatDateShort, cn } from '@/lib/utils'

const damageStatusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'ASSIGNED', label: '已分配' },
  { value: 'IN_PROGRESS', label: '处理中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'REVIEWED', label: '已复查' },
]

export default function FacilityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const facilityId = params.id as string
  const { data, isLoading } = trpc.facility.get.useQuery({ id: facilityId })
  const utils = trpc.useUtils()

  const [showReportModal, setShowReportModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const [reportTitle, setReportTitle] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportPhoto, setReportPhoto] = useState('')
  const [reportPriority, setReportPriority] = useState(1)

  const [reviewResult, setReviewResult] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState('')
  const [reviewPassed, setReviewPassed] = useState(true)

  const [photoUrl, setPhotoUrl] = useState('')
  const [photoCaption, setPhotoCaption] = useState('')

  const [updateStatus, setUpdateStatus] = useState<string>('')
  const [updateAssigned, setUpdateAssigned] = useState('')
  const [updateNote, setUpdateNote] = useState('')
  const [updateResultPhoto, setUpdateResultPhoto] = useState('')

  const reportMutation = trpc.facility.reportDamage.useMutation({
    onSuccess: () => {
      setShowReportModal(false)
      setReportTitle(''); setReportDesc(''); setReportPhoto(''); setReportPriority(1)
      utils.facility.get.invalidate({ id: facilityId })
    },
  })
  const photoMutation = trpc.facility.addPhoto.useMutation({
    onSuccess: () => {
      setShowPhotoModal(false)
      setPhotoUrl(''); setPhotoCaption('')
      utils.facility.get.invalidate({ id: facilityId })
    },
  })
  const statusMutation = trpc.facility.updateStatus.useMutation({
    onSuccess: () => utils.facility.get.invalidate({ id: facilityId }),
  })
  const updateReportMutation = trpc.facility.updateDamageReport.useMutation({
    onSuccess: () => {
      setShowUpdateModal(false)
      setSelectedReport(null)
      utils.facility.get.invalidate({ id: facilityId })
    },
  })
  const reviewMutation = trpc.facility.createReview.useMutation({
    onSuccess: () => {
      setShowReviewModal(false)
      setSelectedReport(null)
      setReviewResult(''); setReviewPhoto(''); setReviewPassed(true)
      utils.facility.get.invalidate({ id: facilityId })
    },
  })

  const openUpdateModal = (reportId: string, currentStatus: string) => {
    setSelectedReport(reportId)
    setUpdateStatus(currentStatus)
    setShowUpdateModal(true)
  }

  const openReviewModal = (reportId: string) => {
    setSelectedReport(reportId)
    setShowReviewModal(true)
  }

  if (isLoading) {
    return <div className="mx-auto max-w-5xl"><Card><CardBody><div className="h-64 animate-pulse rounded bg-slate-100" /></CardBody></Card></div>
  }
  if (!data) return <EmptyState icon="🏢" title="设施不存在" />

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700">
        ← 返回设施列表
      </button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl sm:text-2xl">🏢 {data.name}</CardTitle>
                <FacilityStatusBadge status={data.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>📍 {data.location}</span>
                <span>🏷️ {data.type}</span>
                {data.lastCheckedAt && <span>✅ 上次检查: {formatDateShort(data.lastCheckedAt)}</span>}
              </div>
              {data.description && <p className="mt-3 text-sm text-slate-600">{data.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowPhotoModal(true)}>
                + 添加照片
              </Button>
              <Button size="sm" onClick={() => setShowReportModal(true)}>
                📋 上报损坏
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>🖼️ 设施照片</CardTitle>
          </CardHeader>
          <CardBody>
            {data.photos.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">暂无照片</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.photos.map(p => (
                  <div key={p.id} className="group relative aspect-square rounded-lg bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden">
                    <div className="flex h-full w-full flex-col items-center justify-center text-center p-2">
                      <div className="text-3xl">📷</div>
                      {p.caption && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{p.caption}</p>}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{formatDateShort(p.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>✅ 整改复查记录</CardTitle>
          </CardHeader>
          <CardBody>
            {data.reviews.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">暂无复查记录</p>
            ) : (
              <div className="space-y-3">
                {data.reviews.map(r => (
                  <div key={r.id} className={cn(
                    'rounded-lg border p-3',
                    r.isPassed ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn('text-sm font-medium', r.isPassed ? 'text-emerald-700' : 'text-rose-700')}>
                        {r.isPassed ? '✅ 复查通过' : '❌ 复查未通过'}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateShort(r.reviewedAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{r.result}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📋 损坏报修记录</CardTitle>
        </CardHeader>
        <CardBody>
          {data.damageReports.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">暂无报修记录</p>
          ) : (
            <div className="space-y-3">
              {data.damageReports.map(r => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900">{r.title}</h4>
                        <DamageStatusBadge status={r.status} />
                        {r.priority >= 4 && <span className="text-xs rounded bg-rose-100 text-rose-700 px-2 py-0.5">高优先级</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>👤 {r.reporter?.name || '匿名'}</span>
                        <span>📅 {formatDate(r.createdAt)}</span>
                        {r.resolvedAt && <span>✅ {formatDate(r.resolvedAt)}</span>}
                      </div>
                      {r.resultNote && (
                        <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-sm text-emerald-800">
                          <strong>处理结果：</strong>{r.resultNote}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openUpdateModal(r.id, r.status)}>
                        更新状态
                      </Button>
                      {r.status === 'COMPLETED' && (
                        <Button size="sm" onClick={() => openReviewModal(r.id)}>
                          复查
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="📋 上报设施损坏"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>取消</Button>
            <Button onClick={() => reportMutation.mutate({
              facilityId,
              title: reportTitle,
              description: reportDesc,
              photoUrl: reportPhoto || undefined,
              priority: reportPriority,
            })} disabled={!reportTitle.trim() || !reportDesc.trim() || reportMutation.isPending}>
              {reportMutation.isPending ? '提交中...' : '提交报修'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="问题标题" placeholder="例如：电梯异响故障" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
          <Textarea label="详细描述" placeholder="请描述损坏情况、发现时间、位置细节等..." value={reportDesc} onChange={e => setReportDesc(e.target.value)} />
          <Input label="照片 URL（可选）" placeholder="https://..." value={reportPhoto} onChange={e => setReportPhoto(e.target.value)} />
          <Select
            label="优先级"
            value={String(reportPriority)}
            onChange={e => setReportPriority(parseInt(e.target.value))}
            options={[
              { value: '1', label: '低 - 不影响使用' },
              { value: '2', label: '较低' },
              { value: '3', label: '中 - 一般问题' },
              { value: '4', label: '较高' },
              { value: '5', label: '高 - 紧急处理' },
            ]}
          />
        </div>
      </Modal>

      <Modal
        open={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="🖼️ 添加设施照片"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>取消</Button>
            <Button onClick={() => photoMutation.mutate({
              facilityId,
              url: photoUrl,
              caption: photoCaption || undefined,
            })} disabled={!photoUrl.trim() || photoMutation.isPending}>
              {photoMutation.isPending ? '添加中...' : '添加照片'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="照片 URL" placeholder="https://..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
          <Input label="照片说明（可选）" placeholder="例如：2024年夏季正面照" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={showUpdateModal && !!selectedReport}
        onClose={() => { setShowUpdateModal(false); setSelectedReport(null); setUpdateNote(''); setUpdateResultPhoto('') }}
        title="更新报修状态"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowUpdateModal(false); setSelectedReport(null) }}>取消</Button>
            <Button onClick={() => updateReportMutation.mutate({
              id: selectedReport!,
              status: updateStatus as any,
              assignedTo: updateAssigned || undefined,
              resultNote: updateNote || undefined,
              resultPhotoUrl: updateResultPhoto || undefined,
            })} disabled={updateReportMutation.isPending}>
              {updateReportMutation.isPending ? '更新中...' : '确认更新'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="状态" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} options={damageStatusOptions} />
          <Input label="负责人 ID（可选）" placeholder="分配给哪位志愿者" value={updateAssigned} onChange={e => setUpdateAssigned(e.target.value)} />
          {(updateStatus === 'COMPLETED' || updateStatus === 'REVIEWED') && (
            <>
              <Textarea label="处理结果说明" placeholder="详细说明维修过程和结果..." value={updateNote} onChange={e => setUpdateNote(e.target.value)} />
              <Input label="处理后照片 URL（可选）" placeholder="https://..." value={updateResultPhoto} onChange={e => setUpdateResultPhoto(e.target.value)} />
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={showReviewModal && !!selectedReport}
        onClose={() => { setShowReviewModal(false); setSelectedReport(null); setReviewResult(''); setReviewPhoto(''); setReviewPassed(true) }}
        title="✅ 整改复查"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowReviewModal(false); setSelectedReport(null) }}>取消</Button>
            <Button onClick={() => reviewMutation.mutate({
              damageReportId: selectedReport!,
              facilityId: facilityId,
              result: reviewResult,
              photoUrl: reviewPhoto || undefined,
              isPassed: reviewPassed,
            })} disabled={!reviewResult.trim() || reviewMutation.isPending}>
              {reviewMutation.isPending ? '提交中...' : '提交复查'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={reviewPassed} onChange={() => setReviewPassed(true)} className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">✅ 整改合格</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!reviewPassed} onChange={() => setReviewPassed(false)} className="h-4 w-4 text-rose-600" />
              <span className="text-sm text-rose-700 font-medium">❌ 需重新整改</span>
            </label>
          </div>
          <Textarea label="复查意见" placeholder="详细说明复查情况、是否合格、需要注意的事项..." value={reviewResult} onChange={e => setReviewResult(e.target.value)} />
          <Input label="复查照片 URL（可选）" placeholder="https://..." value={reviewPhoto} onChange={e => setReviewPhoto(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
