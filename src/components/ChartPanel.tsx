import { useAppStore } from '@/store/appStore';
import { BoxPlotChart, TrendChart, DealCycleChart } from './Charts';

const TABS = [
  { key: 'boxplot', label: '价格分布' },
  { key: 'trend', label: '趋势线' },
  { key: 'dealcycle', label: '成交周期' }
] as const;

export default function ChartPanel() {
  const { activeChartTab, setActiveChartTab, filteredRecords } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-workbench-surface border-l border-workbench-border">
      <div className="flex border-b border-workbench-border">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveChartTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeChartTab === tab.key
                ? 'text-cyan-400'
                : 'text-workbench-text-muted hover:text-workbench-text'
            }`}
          >
            {tab.label}
            {activeChartTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeChartTab === 'boxplot' && <BoxPlotChart />}
        {activeChartTab === 'trend' && <TrendChart />}
        {activeChartTab === 'dealcycle' && <DealCycleChart />}
      </div>

      <div className="p-3 border-t border-workbench-border">
        <div className="text-xs text-workbench-text-muted space-y-1">
          <div className="flex justify-between">
            <span>当前样本量</span>
            <span className="text-workbench-text font-medium">{filteredRecords.length}</span>
          </div>
          <div className="flex justify-between">
            <span>图表说明</span>
          </div>
          <div className="text-[10px] leading-relaxed">
            {activeChartTab === 'boxplot' && (
              <>箱线图展示各区域租金分布，箱体为Q1-Q3四分位距，线为中位数，圆点为异常值</>
            )}
            {activeChartTab === 'trend' && (
              <>趋势线展示月度均价与中位数走势，帮助识别价格变化趋势</>
            )}
            {activeChartTab === 'dealcycle' && (
              <>成交周期分布展示房源从挂牌到成交的时间分布，反映市场活跃度</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
