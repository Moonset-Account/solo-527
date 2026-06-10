import { useState } from 'react'
import { Download, FileSpreadsheet, CheckCircle, Loader2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

const dataTypes = [
  { key: 'plots', label: '地块' },
  { key: 'varieties', label: '品种' },
  { key: 'farm-records', label: '农事记录' },
  { key: 'harvests', label: '采收记录' },
  { key: 'sorting', label: '分拣订单' },
  { key: 'orders', label: '订单' },
  { key: 'declarations', label: '申报材料' },
  { key: 'logs', label: '操作日志' },
]

interface ExportHistory {
  id: string
  type: string
  format: string
  createdAt: string
  status: string
}

export default function Export() {
  const { execute } = useApi()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format] = useState('xlsx')
  const [exporting, setExporting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<ExportHistory[]>([])

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    )
  }

  const toggleAll = () => {
    if (selectedTypes.length === dataTypes.length) {
      setSelectedTypes([])
    } else {
      setSelectedTypes(dataTypes.map((t) => t.key))
    }
  }

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      setError('请至少选择一种数据类型')
      return
    }
    setError('')
    setSuccess(false)
    setExporting(true)

    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const body: any = { type: selectedTypes, module: selectedTypes, format }
      if (startDate) body.startDate = startDate
      if (endDate) body.endDate = endDate

      const res = await fetch('/api/admin/export', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error('导出失败')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `果园数据导出_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setSuccess(true)
      setHistory((prev) => [
        {
          id: String(Date.now()),
          type: selectedTypes.map((k) => dataTypes.find((t) => t.key === k)?.label || k).join('、'),
          format: 'Excel',
          createdAt: new Date().toLocaleString('zh-CN'),
          status: 'success',
        },
        ...prev,
      ])
    } catch {
      setError('导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader title="数据导出" subtitle="选择数据类型和时间范围后导出" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">选择导出数据</h3>
              <button onClick={toggleAll} className="text-sm text-primary-600 hover:underline">
                {selectedTypes.length === dataTypes.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dataTypes.map((dt) => {
                const checked = selectedTypes.includes(dt.key)
                return (
                  <label
                    key={dt.key}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                      checked
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleType(dt.key)}
                      className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium">{dt.label}</span>
                  </label>
                )
              })}
            </div>
            {selectedTypes.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                已选择 {selectedTypes.length} 种数据类型
              </p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">时间范围</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="开始日期">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                />
              </FormField>
              <FormField label="结束日期">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                />
              </FormField>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">导出格式</h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary-500 bg-primary-50 text-primary-700 cursor-pointer">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-sm font-medium">Excel (.xlsx)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              导出成功，文件已开始下载
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={exporting || selectedTypes.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                导出数据
              </>
            )}
          </button>
        </div>

        <div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">导出历史</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无导出记录</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{item.type}</span>
                      <span className="status-badge bg-green-100 text-green-700">成功</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{item.format}</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
