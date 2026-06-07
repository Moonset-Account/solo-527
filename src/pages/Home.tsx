import FilterPanel from '@/components/FilterPanel';
import SatisfactionMatrix from '@/components/SatisfactionMatrix';
import ReturnReasonChart from '@/components/ReturnReasonChart';
import CostProfitChart from '@/components/CostProfitChart';
import ScoreTrendChart from '@/components/ScoreTrendChart';
import AbnormalDishTable from '@/components/AbnormalDishTable';
import EventPanel from '@/components/EventPanel';
import { BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50/80">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-800 leading-tight">园区食堂菜品满意度分析</h1>
              <p className="text-[11px] text-zinc-400">销量 · 评价 · 退餐 · 成本 一页统览</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              数据已同步
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-5">
        <FilterPanel />

        <div className="grid grid-cols-1 gap-6 mb-6">
          <SatisfactionMatrix />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ReturnReasonChart />
          <CostProfitChart />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <ScoreTrendChart />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <AbnormalDishTable />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <EventPanel />
        </div>
      </main>

      <footer className="border-t border-zinc-100 bg-white py-4">
        <p className="text-center text-xs text-zinc-400">
          园区食堂菜品满意度分析平台 · 样本不足菜品不参与低分排行 · 供应商更换日评价单独标记不与历史混算
        </p>
      </footer>
    </div>
  );
}
