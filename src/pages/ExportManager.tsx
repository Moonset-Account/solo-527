import { useEffect, useState } from 'react'
import { Download, FileText, FileSpreadsheet, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useFilterStore } from '@/store/filterStore'

const statusConfig = {
  pending: { label: '等待中', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: '处理中', icon: Loader2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: '已完成', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: '失败', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
}

type ExportFormat = 'CSV' | 'PDF'

export default function ExportManager() {
  const { exportTasks, fetchExportTasks } = useDashboardStore()
  const { getFilterSnapshot, sampleSize, dataUpdateTime } = useFilterStore()
  const [format, setFormat] = useState<ExportFormat>('CSV')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchExportTasks()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    await new Promise((r) => setTimeout(r, 800))
    setCreating(false)
  }

  const snapshot = getFilterSnapshot()

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-medium text-slate-700 mb-4">创建导出任务</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">导出格式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('CSV')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  format === 'CSV' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>
              <button
                onClick={() => setFormat('PDF')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  format === 'PDF' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">当前筛选快照</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
              <div>样本量: <span className="text-slate-800 font-medium">{sampleSize.toLocaleString()}</span></div>
              <div>数据更新: <span className="text-slate-800">{dataUpdateTime.slice(0, 10)}</span></div>
              <div>筛选条件: {JSON.stringify(snapshot).slice(0, 80)}...</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {creating ? '创建中...' : '创建导出'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium text-slate-700">导出任务列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">任务ID</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">格式</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">状态</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">样本量</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">数据时间</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">创建时间</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">完成时间</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {exportTasks.map((task) => {
                const sc = statusConfig[task.status]
                const Icon = sc.icon
                return (
                  <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-700 font-mono text-xs">{task.id}</td>
                    <td className="px-4 py-2 text-slate-700">{task.format}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${sc.color}`}>
                        <Icon size={10} className={task.status === 'processing' ? 'animate-spin' : ''} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{task.sampleSize.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{task.dataUpdateTime.slice(0, 10)}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{task.createdAt.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{task.completedAt ? task.completedAt.slice(0, 16).replace('T', ' ') : '-'}</td>
                    <td className="px-4 py-2">
                      {task.status === 'completed' && task.downloadUrl ? (
                        <button className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                          <Download size={12} /> 下载
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
