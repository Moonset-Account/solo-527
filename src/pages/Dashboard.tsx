import FilterBar from '@/components/FilterBar'
import KPICards from '@/components/KPICards'
import ParetoChart from '@/components/ParetoChart'
import ProductionLineComparison from '@/components/ProductionLineComparison'
import TrendChart from '@/components/TrendChart'
import DrillDownPanel from '@/components/DrillDownPanel'
import AnnotationModal from '@/components/AnnotationModal'
import LastUpdated from '@/components/LastUpdated'
import ExportButton from '@/components/ExportButton'
import { useState } from 'react'
import { useAnnotationStore } from '@/store/annotationStore'
import { MessageSquarePlus } from 'lucide-react'

export default function Dashboard() {
  const [annotationDate, setAnnotationDate] = useState<string | null>(null)
  const annotations = useAnnotationStore(s => s.annotations)

  return (
    <div className="min-h-screen">
      <FilterBar />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <LastUpdated />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnnotationDate(new Date().toISOString().split('T')[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-alert/10 text-alert border border-alert/30 rounded text-xs hover:bg-alert/20 transition-all duration-200"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              添加注释
            </button>
            <ExportButton />
          </div>
        </div>

        <KPICards />

        <div className="grid grid-cols-2 gap-4">
          <ParetoChart />
          <ProductionLineComparison />
        </div>

        <TrendChart onPointClick={(date) => setAnnotationDate(date)} />

        <DrillDownPanel />

        {annotations.length > 0 && (
          <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
            <h3 className="text-sm font-medium text-base-200 mb-3">注释列表</h3>
            <div className="space-y-2">
              {annotations.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-2 bg-base-700/30 rounded">
                  <div className="w-2 h-2 rounded-full bg-alert mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-accent font-mono">{a.date}</span>
                      <span className="text-base-400">|</span>
                      <span className="text-base-300">{a.author}</span>
                    </div>
                    <p className="text-sm text-base-200 mt-0.5">{a.content}</p>
                    {a.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {a.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-base-600/50 text-base-300 rounded text-[10px]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {annotationDate && <AnnotationModal date={annotationDate} onClose={() => setAnnotationDate(null)} />}
    </div>
  )
}
