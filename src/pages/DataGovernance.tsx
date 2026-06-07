import { useState } from 'react'
import { ChevronDown, ChevronRight, Database, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react'

const dataSources = [
  { label: 'SCADA设备运行', flow: '→MQTT→时序DB' },
  { label: '报警系统', flow: '→Kafka→报警表' },
  { label: '维修工单CMMS', flow: '→每日同步' },
  { label: '班组排班系统', flow: '→每周导入' },
  { label: '产量MES', flow: '→每小时聚合→每日同步' },
  { label: '备件消耗WMS', flow: '→出库即同步' },
]

const etlSteps = ['ETL抽取', '数据清洗', '维度建模']

const aggregationRows = [
  ['停机时长', 'end_time - start_time，排除跨班重叠', '事件级', '设备→产线→全厂'],
  ['计划检修标识', 'CMMS工单类型为"计划检修"则is_planned=true', '事件级', '工单→设备'],
  ['班次归属', 'start_time落入排班时间段确定班次', '事件级', '班次→产线'],
  ['同比环比', '同比取去年同期周数据，环比取上周数据', '周级', '全厂→产线'],
  ['异常检测', 'Z-score>2为warning，>3为critical', '事件级', '设备→故障类型'],
  ['设备可用率', '1 - 总停机时长/(日历时长×设备数)', '日级/周级', '设备→产线→全厂'],
]

const dirtyDataCards = [
  { level: 'critical' as const, name: '停机时长为0', rule: 'duration≤0', strategy: '排除，标记数据异常' },
  { level: 'critical' as const, name: '时间逻辑错误', rule: 'end<start', strategy: '取反修正，标记疑似录入错误' },
  { level: 'warning' as const, name: '缺失维修工单', rule: '停机事件无关联工单', strategy: '归入"未记录维修"，不影响计划/突发统计' },
  { level: 'warning' as const, name: '备件无工单关联', rule: 'order_id为空', strategy: '单独统计，不纳入停机关联分析' },
  { level: 'warning' as const, name: '重复停机事件', rule: '同设备同时间窗口', strategy: '去重保留最早记录' },
  { level: 'warning' as const, name: '产量数据缺失', rule: '某小时无产量记录', strategy: '前一小时数据插值，标记估算' },
  { level: 'warning' as const, name: '报警无对应停机', rule: '报警未触发停机', strategy: '保留在报警分析，不纳入停机统计' },
]

const sections = [
  { id: 'ingestion', title: '原始数据入库流程' },
  { id: 'aggregation', title: '数据聚合规则' },
  { id: 'dirty', title: '脏数据处理策略' },
]

function FlowBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded bg-[#162236] border border-[#1E3A5F] p-3 text-sm text-white text-center whitespace-nowrap">
      {children}
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-[#4B6A8F] px-1">
      <ArrowRight size={16} />
    </div>
  )
}

export default function DataGovernance() {
  const [openSection, setOpenSection] = useState<string | null>('ingestion')

  const toggle = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id))
  }

  return (
    <div className="bg-[#0A1628] min-h-screen p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database size={28} className="text-[#FF6B35]" />
        <h1 className="text-2xl font-bold text-white">数据治理</h1>
      </div>

      <div className="flex flex-col gap-3">
        {sections.map(section => {
          const isOpen = openSection === section.id
          return (
            <div key={section.id}>
              <div
                onClick={() => toggle(section.id)}
                className={`bg-[#0F1B2D] rounded-xl border border-[#1E3A5F] p-4 cursor-pointer flex items-center justify-between transition-colors hover:border-[#2A4A6F] ${
                  isOpen ? 'border-l-4 border-l-[#FF6B35] rounded-l-none' : ''
                }`}
              >
                <span className="text-white font-medium">{section.title}</span>
                {isOpen ? <ChevronDown size={20} className="text-[#FF6B35]" /> : <ChevronRight size={20} className="text-[#4B6A8F]" />}
              </div>

              {isOpen && (
                <div className="bg-[#0F1B2D] rounded-b-xl border border-t-0 border-[#1E3A5F] p-6">
                  {section.id === 'ingestion' && <IngestionSection />}
                  {section.id === 'aggregation' && <AggregationSection />}
                  {section.id === 'dirty' && <DirtyDataSection />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IngestionSection() {
  return (
    <div className="flex items-start gap-6 overflow-x-auto pb-2">
      <div className="flex flex-col gap-3 shrink-0">
        <div className="text-xs text-[#94A3B8] mb-1 font-medium">数据源</div>
        {dataSources.map((src) => (
          <div key={src.label} className="flex items-center gap-1">
            <FlowBox>{src.label}</FlowBox>
            <span className="text-[#4B6A8F] text-xs whitespace-nowrap">{src.flow}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center shrink-0 pt-8">
        <FlowArrow />
      </div>

      <div className="flex flex-col gap-3 shrink-0">
        <div className="text-xs text-[#94A3B8] mb-1 font-medium">ETL流程</div>
        <div className="flex items-center gap-1">
          {etlSteps.map((step, i) => (
            <span key={step} className="flex items-center gap-1">
              <FlowBox>{step}</FlowBox>
              {i < etlSteps.length - 1 && <FlowArrow />}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center shrink-0 pt-8">
        <FlowArrow />
      </div>

      <div className="flex flex-col gap-3 shrink-0">
        <div className="text-xs text-[#94A3B8] mb-1 font-medium">存储</div>
        <FlowBox>数据仓库</FlowBox>
      </div>
    </div>
  )
}

function AggregationSection() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-[#162236] border-collapse rounded overflow-hidden">
        <thead>
          <tr className="border-b border-[#1E3A5F]">
            {['指标名称', '计算口径', '时间粒度', '维度层级'].map(h => (
              <th key={h} className="text-left text-sm text-[#94A3B8] font-medium p-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {aggregationRows.map((row, i) => (
            <tr key={i} className="border-b border-[#1E3A5F] last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="text-sm text-white p-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DirtyDataSection() {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {dirtyDataCards.map(card => (
          <div key={card.name} className="bg-[#162236] border border-[#1E3A5F] rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {card.level === 'critical' ? (
                <AlertTriangle size={18} className="text-red-400" />
              ) : (
                <AlertCircle size={18} className="text-yellow-400" />
              )}
              <span className="text-white font-medium text-sm">{card.name}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs">
                <span className="text-[#94A3B8]">识别：</span>
                <span className="text-white">{card.rule}</span>
              </div>
              <div className="text-xs">
                <span className="text-[#94A3B8]">处理：</span>
                <span className="text-white">{card.strategy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-[#162236] border border-[#1E3A5F] rounded-lg p-5">
        <h3 className="text-white font-medium text-sm mb-3">导出时筛选条件保留</h3>
        <ul className="flex flex-col gap-2">
          <li className="text-sm text-[#CBD5E1] flex items-start gap-2">
            <span className="text-[#FF6B35] mt-0.5">•</span>
            导出PDF/图片时，在页面底部嵌入当前筛选条件文本摘要
          </li>
          <li className="text-sm text-[#CBD5E1] flex items-start gap-2">
            <span className="text-[#FF6B35] mt-0.5">•</span>
            筛选条件编码为URL参数格式，支持通过URL还原筛选状态
          </li>
          <li className="text-sm text-[#CBD5E1] flex items-start gap-2">
            <span className="text-[#FF6B35] mt-0.5">•</span>
            周报中"筛选口径"板块完整记录生成时的FilterState JSON快照
          </li>
        </ul>
      </div>
    </>
  )
}
