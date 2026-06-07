import { useState } from "react"
import SummaryCards from "@/components/SummaryCards"
import PerspectiveSwitcher from "@/components/PerspectiveSwitcher"
import FilterBar from "@/components/FilterBar"
import TrendChart from "@/components/TrendChart"
import SlotHeatmap from "@/components/SlotHeatmap"
import ShiftRankChart from "@/components/ShiftRankChart"
import AlarmCorrelationChart from "@/components/AlarmCorrelationChart"
import MetricModal from "@/components/MetricModal"
import ExportButton from "@/components/ExportButton"
import { useFilterStore } from "@/stores/filterStore"
import { HelpCircle, Activity } from "lucide-react"

export default function Home() {
  const { perspective } = useFilterStore()
  const [metricOpen, setMetricOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0f1225]">
      <header className="sticky top-0 z-40 bg-[#0f1225]/80 backdrop-blur-xl border-b border-[#2a3050]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-red-alert flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">物流分拣错分率分析</h1>
              <p className="text-[10px] text-zinc-500">实时归因 · 多视角切换 · 报警独立标注</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMetricOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1f36] transition-colors border border-[#2a3050]"
            >
              <HelpCircle size={12} />
              指标口径
            </button>
            <ExportButton />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-5 space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <PerspectiveSwitcher />
          <FilterBar />
        </div>

        <SummaryCards />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <TrendChart />
          {perspective === "slot" || perspective === "time" ? (
            <SlotHeatmap />
          ) : perspective === "shift" ? (
            <ShiftRankChart />
          ) : perspective === "device" ? (
            <AlarmCorrelationChart />
          ) : perspective === "route" ? (
            <SlotHeatmap />
          ) : (
            <ShiftRankChart />
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {perspective === "device" ? (
            <ShiftRankChart />
          ) : perspective === "shift" ? (
            <AlarmCorrelationChart />
          ) : (
            <AlarmCorrelationChart />
          )}
          {perspective === "slot" ? (
            <ShiftRankChart />
          ) : perspective === "device" ? (
            <SlotHeatmap />
          ) : (
            <SlotHeatmap />
          )}
        </div>
      </main>

      <MetricModal open={metricOpen} onClose={() => setMetricOpen(false)} />
    </div>
  )
}
