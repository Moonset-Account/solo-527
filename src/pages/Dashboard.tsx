import { AlertTriangle } from "lucide-react";
import KPICards from "@/components/KPICards";
import FunnelChart from "@/components/FunnelChart";
import StageDurationChart from "@/components/StageDurationChart";
import AnnotationPanel from "@/components/AnnotationPanel";
import { useAppStore } from "@/store";

export default function Dashboard() {
  const { toggleAnnotationPanel } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <KPICards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FunnelChart />
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={toggleAnnotationPanel}
            className="glass-card glass-card-hover p-4 flex items-center gap-3 text-sm text-slate-300 hover:text-accent-cyan transition-colors"
          >
            <AlertTriangle size={18} className="text-anomaly-orange" />
            <span>查看/添加异常注释</span>
          </button>
          <div className="glass-card p-4 flex-1 flex flex-col justify-center items-center text-slate-500 text-sm">
            <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center mb-2">
              <AlertTriangle size={20} className="text-accent-cyan/60" />
            </div>
            点击上方按钮查看异常注释
          </div>
        </div>
      </div>

      <StageDurationChart />

      <AnnotationPanel />
    </div>
  );
}
