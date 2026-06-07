import { useState } from 'react'
import { getCleaningLogs } from '@/data/clean'
import { SOURCE_TABLE_CONFIGS } from '@/data/metricConfig'
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Database } from 'lucide-react'
import type { CleaningLog } from '@/types'

export default function DataPipelineStatus() {
  const [expanded, setExpanded] = useState(false)
  const logs: CleaningLog[] = getCleaningLogs()

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-base-200 hover:bg-base-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          数据管道状态
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-base-400" /> : <ChevronRight className="w-4 h-4 text-base-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          <div>
            <h4 className="text-xs text-base-400 mb-2 uppercase tracking-wider">源表概览</h4>
            <div className="grid grid-cols-3 gap-2">
              {SOURCE_TABLE_CONFIGS.map((table) => (
                <div key={table.name} className="bg-base-700/40 rounded p-2.5">
                  <div className="text-xs font-medium text-base-200">{table.label}</div>
                  <div className="text-xs text-base-400 mt-0.5">{table.recordCount} 条 · 主键 {table.primaryKey}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {table.joinKeys.map((key) => (
                      <span key={key} className="px-1 py-0.5 bg-accent/10 text-accent rounded text-[9px]">{key}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs text-base-400 mb-2 uppercase tracking-wider">清洗流水线日志</h4>
            <div className="space-y-1.5">
              {logs.map((log: CleaningLog, i: number) => (
                <div key={i} className="bg-base-700/40 rounded p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.droppedCount > 0 ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-alert" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span className="text-xs font-medium text-base-200">{log.source}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-base-400">
                      <span>输入: {log.inputCount}</span>
                      <span>→</span>
                      <span className="text-accent">输出: {log.outputCount}</span>
                      {log.droppedCount > 0 && <span className="text-alert">丢弃: {log.droppedCount}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {log.rules.map((rule: string) => (
                      <span key={rule} className="px-1.5 py-0.5 bg-base-600/50 text-base-300 rounded text-[9px]">{rule}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
