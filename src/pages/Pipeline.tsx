import DataPipelineStatus from '@/components/DataPipelineStatus'
import LastUpdated from '@/components/LastUpdated'
import ExportButton from '@/components/ExportButton'
import { SOURCE_TABLE_CONFIGS } from '@/data/metricConfig'
import { getETLInfo } from '@/api/cache'
import { Database, ArrowRight, CheckCircle2, Layers } from 'lucide-react'

export default function Pipeline() {
  const etlInfo = getETLInfo()

  return (
    <div className="min-h-screen">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <LastUpdated />
          <ExportButton />
        </div>

        <div className="bg-base-800 rounded-lg border border-accent/20 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-base-100">数据清洗管道</h2>
              <p className="text-xs text-base-400 mt-0.5">
                六源表 → ETL 清洗 → 统一停机事实表 · 输出 {etlInfo.recordCount} 条有效记录
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {SOURCE_TABLE_CONFIGS.map((table, i) => (
              <div key={table.name} className="flex items-center shrink-0">
                <div className="bg-base-700/60 rounded-lg px-3 py-2 border border-base-600/30 min-w-[120px]">
                  <div className="text-[10px] text-base-400 uppercase tracking-wider">源表 {i + 1}</div>
                  <div className="text-xs font-medium text-base-200 mt-0.5">{table.label}</div>
                  <div className="text-[10px] text-base-400 mt-0.5">{table.recordCount} 条</div>
                </div>
                <ArrowRight className="w-4 h-4 text-base-500 shrink-0 mx-1" />
              </div>
            ))}
            <div className="bg-accent/10 rounded-lg px-3 py-2 border border-accent/30 shrink-0">
              <div className="text-[10px] text-accent uppercase tracking-wider">事实表</div>
              <div className="text-xs font-medium text-accent mt-0.5">downtime_fact</div>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-accent">{etlInfo.recordCount} 条</span>
              </div>
            </div>
          </div>
        </div>

        <DataPipelineStatus />

        <div className="bg-base-800 rounded-lg border border-base-600/30 p-5">
          <h3 className="text-sm font-medium text-base-200 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-accent" />
            Grafana 仪表盘配置
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-base-700/40 rounded-lg p-4">
              <h4 className="text-xs font-medium text-accent mb-2">Grafana + React 双看板方案</h4>
              <p className="text-xs text-base-300 leading-relaxed">
                React 前端提供交互式筛选、下钻、注释和导出功能；Grafana 提供 SQL 驱动的实时监控仪表盘、告警规则和团队共享视图。
                两者共用同一套 PostgreSQL 数据源，确保口径一致。
              </p>
            </div>
            <div className="bg-base-700/40 rounded-lg p-4">
              <h4 className="text-xs font-medium text-accent mb-2">部署说明</h4>
              <div className="text-xs text-base-300 leading-relaxed space-y-1">
                <p>1. 执行 <code className="text-accent bg-base-600/50 px-1 rounded">docker-compose up -d</code> 启动 PostgreSQL + Grafana</p>
                <p>2. Grafana 访问 <code className="text-accent bg-base-600/50 px-1 rounded">http://localhost:3000</code>（admin/admin）</p>
                <p>3. 仪表盘 JSON 已预配置在 <code className="text-accent bg-base-600/50 px-1 rounded">grafana/dashboards/</code></p>
                <p>4. 数据源自动通过 provisioning 接入 PostgreSQL</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-base-800 rounded-lg border border-base-600/30 p-5">
          <h3 className="text-sm font-medium text-base-200 mb-3">源表结构详情</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-base-600/30">
                  <th className="text-left py-2 px-2 text-base-400 font-medium">源表</th>
                  <th className="text-left py-2 px-2 text-base-400 font-medium">记录数</th>
                  <th className="text-left py-2 px-2 text-base-400 font-medium">主键</th>
                  <th className="text-left py-2 px-2 text-base-400 font-medium">关联键</th>
                  <th className="text-left py-2 px-2 text-base-400 font-medium">清洗规则</th>
                </tr>
              </thead>
              <tbody>
                {SOURCE_TABLE_CONFIGS.map((table) => (
                  <tr key={table.name} className="border-b border-base-600/20 hover:bg-base-700/30">
                    <td className="py-2 px-2 font-medium text-base-200">{table.label}</td>
                    <td className="py-2 px-2 font-mono text-accent">{table.recordCount}</td>
                    <td className="py-2 px-2 font-mono text-base-300">{table.primaryKey}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {table.joinKeys.map(key => (
                          <span key={key} className="px-1 py-0.5 bg-accent/10 text-accent rounded text-[9px]">{key}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {table.cleaningRules.map(rule => (
                          <span key={rule} className="px-1 py-0.5 bg-base-600/50 text-base-300 rounded text-[9px]">{rule}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
