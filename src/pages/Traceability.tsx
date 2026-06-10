import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  TreePine, MapPin, Sprout, Calendar, Scale, QrCode,
  Droplets, Bug, ShowerHead, Scissors, Leaf, Wrench, Package, Truck, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const gradeConfig: Record<string, { label: string; color: string }> = {
  premium: { label: '特级', color: 'bg-accent-500 text-white' },
  first: { label: '一级', color: 'bg-primary-600 text-white' },
  second: { label: '二级', color: 'bg-moss-dark text-white' },
  third: { label: '三级', color: 'bg-earth text-white' },
}

const farmTypeIcons: Record<string, React.ElementType> = {
  fertilization: Droplets, pesticide: Bug, irrigation: ShowerHead,
  pruning: Scissors, weeding: Leaf, other: Wrench,
}

const farmTypeLabels: Record<string, string> = {
  fertilization: '施肥', pesticide: '打药', irrigation: '灌溉',
  pruning: '修剪', weeding: '除草', other: '其他',
}

interface TraceData {
  batchNo: string
  qrCodeUrl: string
  plot: { name: string; area: number; location: string }
  variety: { name: string; category: string }
  harvest: { harvestDate: string; quantity: number; unit: string; qualityGrade: string; harvester: string }
  farmRecords: { type: string; content: string; operateDate: string; operator: string }[]
  sortingOrders: { sortedDate: string; sortedBy: string; grades: { grade: string; quantity: number; unit: string }[] }[]
  shipments: { shippedDate: string; destination: string; carrier: string }[]
}

export default function Traceability() {
  const { batchNo } = useParams<{ batchNo: string }>()
  const [trace, setTrace] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (batchNo) {
      fetch(`/api/traceability/${batchNo}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setTrace(d))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [batchNo])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light flex items-center justify-center">
        <div className="skeleton h-8 w-32" />
      </div>
    )
  }

  if (!trace) {
    return (
      <div className="min-h-screen bg-cream-light flex items-center justify-center">
        <div className="text-center">
          <TreePine className="h-16 w-16 text-primary-300 mx-auto mb-4" />
          <h1 className="text-xl font-serif text-gray-600">未找到溯源信息</h1>
          <p className="text-sm text-gray-400 mt-2">该批次号不存在或溯源信息未生成</p>
        </div>
      </div>
    )
  }

  const grade = gradeConfig[trace.harvest.qualityGrade] || gradeConfig.third

  return (
    <div className="min-h-screen bg-cream-light">
      <header className="bg-gradient-to-r from-primary-700 to-primary-800 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TreePine className="h-7 w-7" />
            <span className="font-serif text-xl font-bold">果园溯源</span>
          </div>
          <h1 className="text-2xl font-serif font-bold mb-1">产品溯源信息</h1>
          <p className="text-primary-200 text-sm font-mono">批次号：{trace.batchNo}</p>
          {trace.qrCodeUrl && (
            <img src={trace.qrCodeUrl} alt="QR" className="w-28 h-28 mx-auto mt-4 bg-white p-2 rounded-lg" />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary-600" />
            <h2 className="font-serif font-bold text-gray-800">种植信息</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">地块：</span><span className="text-gray-800">{trace.plot.name}</span></div>
            <div><span className="text-gray-400">面积：</span><span className="text-gray-800">{trace.plot.area} 亩</span></div>
            <div><span className="text-gray-400">位置：</span><span className="text-gray-800">{trace.plot.location}</span></div>
            <div><span className="text-gray-400">品种：</span><span className="text-gray-800">{trace.variety.name}</span></div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="h-5 w-5 text-accent-600" />
            <h2 className="font-serif font-bold text-gray-800">采收信息</h2>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', grade.color)}>
              {grade.label}
            </span>
            <span className="text-sm text-gray-600">{trace.harvest.quantity} {trace.harvest.unit}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">采收日期：</span><span className="text-gray-800">{trace.harvest.harvestDate?.slice(0, 10)}</span></div>
            <div><span className="text-gray-400">采收人：</span><span className="text-gray-800">{trace.harvest.harvester}</span></div>
          </div>
        </section>

        {trace.farmRecords.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="h-5 w-5 text-blue-600" />
              <h2 className="font-serif font-bold text-gray-800">农事记录</h2>
            </div>
            <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-gray-200">
              {trace.farmRecords.map((fr, i) => {
                const Icon = farmTypeIcons[fr.type] || Wrench
                return (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className="h-2.5 w-2.5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5">
                        <span>{fr.operateDate?.slice(0, 10)}</span>
                        <span>{farmTypeLabels[fr.type] || fr.type}</span>
                      </div>
                      <p className="text-sm text-gray-700">{fr.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {trace.sortingOrders.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-purple-600" />
              <h2 className="font-serif font-bold text-gray-800">分拣信息</h2>
            </div>
            {trace.sortingOrders.map((so, i) => (
              <div key={i} className="text-sm mb-3 last:mb-0">
                <div className="text-gray-400 mb-1">{so.sortedDate?.slice(0, 10)} · {so.sortedBy}</div>
                <div className="flex flex-wrap gap-2">
                  {so.grades.map((g, j) => (
                    <span key={j} className="px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-600">
                      {gradeConfig[g.grade]?.label || g.grade} {g.quantity}{g.unit}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {trace.shipments.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-emerald-600" />
              <h2 className="font-serif font-bold text-gray-800">物流信息</h2>
            </div>
            {trace.shipments.map((s, i) => (
              <div key={i} className="text-sm mb-2 last:mb-0">
                <span className="text-gray-400">{s.shippedDate?.slice(0, 10)}</span>
                <span className="mx-1.5 text-gray-300">→</span>
                <span className="text-gray-700">{s.destination}</span>
                <span className="text-gray-400 ml-2">({s.carrier})</span>
              </div>
            ))}
          </section>
        )}

        <div className="text-center py-6 text-xs text-gray-400">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="h-3 w-3" />
            <span>本溯源信息由系统自动记录，不可篡改</span>
          </div>
          <p>© 2026 果园采摘生产记录台 · 绿色数字果园</p>
        </div>
      </main>
    </div>
  )
}
