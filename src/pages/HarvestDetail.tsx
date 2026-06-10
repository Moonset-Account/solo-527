import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Scissors, MapPin, Sprout, Calendar, User, Scale,
  Droplets, Bug, ShowerHead, Leaf, Wrench, Package, Truck, QrCode,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { cn } from '@/lib/utils'

const gradeConfig: Record<string, { label: string; color: string }> = {
  premium: { label: '特级', color: 'bg-accent-100 text-accent-700' },
  first: { label: '一级', color: 'bg-primary-100 text-primary-700' },
  second: { label: '二级', color: 'bg-moss-light text-moss-dark' },
  third: { label: '三级', color: 'bg-earth-light/30 text-earth-dark' },
}

const farmTypeIcons: Record<string, React.ElementType> = {
  fertilization: Droplets,
  pesticide: Bug,
  irrigation: ShowerHead,
  pruning: Scissors,
  weeding: Leaf,
  other: Wrench,
}

const farmTypeLabels: Record<string, string> = {
  fertilization: '施肥', pesticide: '打药', irrigation: '灌溉',
  pruning: '修剪', weeding: '除草', other: '其他',
}

interface TraceData {
  harvest: {
    id: string
    batchNo: string
    plotName: string
    varietyName: string
    quantity: number
    unit: string
    qualityGrade: string
    harvestDate: string
    harvester: string
    remark?: string
  }
  plot: { id: string; name: string; area: number; location: string }
  variety: { id: string; name: string; category: string }
  farmRecords: { id: string; type: string; content: string; operateDate: string; operator: string; dosage?: string; unit?: string }[]
  sortingOrders: { id: string; batchNo: string; sortedDate: string; sortedBy: string; grades: { grade: string; quantity: number }[] }[]
  shipments: { id: string; shipmentNo: string; shippedDate: string; destination: string; carrier: string }[]
}

export default function HarvestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { execute, loading } = useApi<TraceData>()
  const { execute: qrExecute, loading: qrLoading } = useApi<{ qrCode: string }>()
  const [trace, setTrace] = useState<TraceData | null>(null)
  const [qrModal, setQrModal] = useState(false)
  const [qrImage, setQrImage] = useState<string>('')

  useEffect(() => {
    if (id) {
      execute(`/api/harvests/${id}/trace`).then((d) => {
        if (d) setTrace(d)
      })
    }
  }, [id])

  const generateQr = async () => {
    if (!trace) return
    const result = await qrExecute('/api/traceability/generate', {
      method: 'POST',
      body: JSON.stringify({ batchNo: trace.harvest.batchNo, harvestId: trace.harvest.id }),
    })
    if (result) {
      setQrImage((result as { qrCode: string }).qrCode)
      setQrModal(true)
    }
  }

  if (loading && !trace) {
    return (
      <div className="space-y-4 p-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (!trace) {
    return <div className="text-center py-16 text-gray-400">记录不存在或已被删除</div>
  }

  const { harvest, plot, variety, farmRecords, sortingOrders, shipments } = trace
  const grade = gradeConfig[harvest.qualityGrade] || gradeConfig.third

  return (
    <div>
      <PageHeader
        title="采收详情"
        action={
          <button onClick={generateQr} disabled={qrLoading} className="btn-accent flex items-center gap-1.5">
            <QrCode className="h-4 w-4" />
            生成溯源码
          </button>
        }
      />

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-sm text-gray-500">{harvest.batchNo}</span>
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium', grade.color)}>{grade.label}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <DetailItem icon={MapPin} label="地块" value={harvest.plotName} />
          <DetailItem icon={Sprout} label="品种" value={harvest.varietyName} />
          <DetailItem icon={Scale} label="采收量" value={`${harvest.quantity} ${harvest.unit}`} />
          <DetailItem icon={Calendar} label="采收日期" value={harvest.harvestDate?.slice(0, 10)} />
          <DetailItem icon={User} label="采收人" value={harvest.harvester} />
          {harvest.remark && (
            <div className="col-span-2">
              <span className="text-gray-400">备注：</span>
              <span className="text-gray-700">{harvest.remark}</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="font-serif text-lg font-bold text-gray-800 mb-4 border-l-4 border-primary-700 pl-3">溯源链</h2>

      <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        <TimelineNode icon={MapPin} title="种植阶段" color="bg-primary-100 text-primary-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">地块：</span>{plot.name}</div>
            <div><span className="text-gray-400">面积：</span>{plot.area} 亩</div>
            <div><span className="text-gray-400">位置：</span>{plot.location}</div>
            <div><span className="text-gray-400">品种：</span>{variety.name}</div>
          </div>
        </TimelineNode>

        <TimelineNode icon={Droplets} title="农事记录" color="bg-blue-100 text-blue-700" count={farmRecords.length}>
          {farmRecords.length === 0 ? (
            <p className="text-sm text-gray-400">无相关农事记录</p>
          ) : (
            <div className="space-y-3">
              {farmRecords.map((fr) => {
                const Icon = farmTypeIcons[fr.type] || Wrench
                return (
                  <div key={fr.id} className="flex items-start gap-3 text-sm">
                    <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-500">{fr.operateDate?.slice(0, 10)}</span>
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span className="text-gray-400">{farmTypeLabels[fr.type] || fr.type}</span>
                      <p className="text-gray-700 mt-0.5">{fr.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TimelineNode>

        <TimelineNode icon={Scissors} title="采收" color="bg-accent-100 text-accent-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">采收量：</span>{harvest.quantity} {harvest.unit}</div>
            <div><span className="text-gray-400">等级：</span>{grade.label}</div>
            <div><span className="text-gray-400">日期：</span>{harvest.harvestDate?.slice(0, 10)}</div>
            <div><span className="text-gray-400">采收人：</span>{harvest.harvester}</div>
          </div>
        </TimelineNode>

        <TimelineNode icon={Package} title="分拣" color="bg-purple-100 text-purple-700" count={sortingOrders.length}>
          {sortingOrders.length === 0 ? (
            <p className="text-sm text-gray-400">暂无分拣记录</p>
          ) : (
            <div className="space-y-3">
              {sortingOrders.map((so) => (
                <div key={so.id} className="text-sm">
                  <div className="text-gray-500">{so.sortedDate?.slice(0, 10)} · {so.sortedBy}</div>
                  <div className="flex gap-2 mt-1">
                    {so.grades.map((g, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                        {gradeConfig[g.grade]?.label || g.grade} {g.quantity}{harvest.unit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TimelineNode>

        <TimelineNode icon={Truck} title="发货" color="bg-emerald-100 text-emerald-700" count={shipments.length}>
          {shipments.length === 0 ? (
            <p className="text-sm text-gray-400">暂无发货记录</p>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => (
                <div key={s.id} className="text-sm">
                  <span className="text-gray-500">{s.shippedDate?.slice(0, 10)}</span>
                  <span className="mx-1.5 text-gray-300">·</span>
                  <span className="text-gray-700">{s.destination}</span>
                  <span className="mx-1.5 text-gray-300">·</span>
                  <span className="text-gray-400">{s.carrier}</span>
                </div>
              ))}
            </div>
          )}
        </TimelineNode>
      </div>

      <Modal isOpen={qrModal} onClose={() => setQrModal(false)} title="溯源二维码" size="sm">
        <div className="text-center">
          {qrImage ? (
            <img src={qrImage} alt="QR Code" className="mx-auto mb-3" />
          ) : (
            <div className="w-48 h-48 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-12 w-12 text-gray-300" />
            </div>
          )}
          <p className="text-sm text-gray-500">批次号：{harvest.batchNo}</p>
          <p className="text-xs text-gray-400 mt-1">扫描二维码查看溯源信息</p>
        </div>
      </Modal>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-400" />
      <div>
        <span className="text-gray-400 text-xs">{label}</span>
        <p className="text-gray-800 font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}

function TimelineNode({ icon: Icon, title, color, count, children }: {
  icon: React.ElementType
  title: string
  color: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className={cn('absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center', color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          {count !== undefined && (
            <span className="text-xs text-gray-400">{count} 条</span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
