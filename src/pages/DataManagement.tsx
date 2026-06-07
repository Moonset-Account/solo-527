import { useEffect, useState, useRef } from 'react'
import { Upload, FileUp, Pencil, Check, X } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'

type TabKey = 'dict' | 'caliber' | 'import' | 'missing'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dict', label: '数据字典' },
  { key: 'caliber', label: '口径配置' },
  { key: 'import', label: '批量导入' },
  { key: 'missing', label: '缺失值处理' },
]

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>('dict')
  const { dataDict, metricConfigs, missingValueRules, fetchDataDict, fetchMetricConfigs, fetchMissingValueRules } = useDashboardStore()
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDataDict()
    fetchMetricConfigs()
    fetchMissingValueRules()
  }, [])

  const handleImport = () => {
    setImportResult({ success: 1245, failed: 23 })
  }

  const startEdit = (id: string, currentVal: string) => {
    setEditingConfig(id)
    setEditValue(currentVal)
  }

  const saveEdit = () => {
    setEditingConfig(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingConfig(null)
    setEditValue('')
  }

  return (
    <div className="space-y-0">
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-emerald-500 text-emerald-700 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-lg border border-slate-100 border-t-0 shadow-sm">
        {activeTab === 'dict' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">字段名</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">类型</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">描述</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">口径</th>
                </tr>
              </thead>
              <tbody>
                {dataDict.map((entry) => (
                  <tr key={entry.fieldName} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700 font-mono text-xs">{entry.fieldName}</td>
                    <td className="px-4 py-2.5 text-slate-700">{entry.fieldType}</td>
                    <td className="px-4 py-2.5 text-slate-700">{entry.description}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{entry.caliber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'caliber' && (
          <div className="p-4 space-y-3">
            {metricConfigs.map((config) => (
              <div key={config.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{config.name}</span>
                  {config.editable && (
                    <button
                      onClick={() => editingConfig === config.id ? cancelEdit() : startEdit(config.id, config.caliber)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                    >
                      <Pencil size={10} />
                      {editingConfig === config.id ? '取消' : '编辑'}
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 mb-1">口径: {editingConfig === config.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="inline-block w-80 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                ) : config.caliber}</div>
                <div className="text-xs text-slate-400">公式: <code className="bg-slate-50 px-1 rounded">{config.formula}</code></div>
                {editingConfig === config.id && (
                  <div className="mt-2 flex justify-end">
                    <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-500 text-white text-xs hover:bg-emerald-600">
                      <Check size={12} /> 保存
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="p-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
            >
              <FileUp size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">点击上传或拖拽文件到此处</p>
              <p className="text-xs text-slate-400 mt-1">支持 CSV / Excel 格式，最大 50MB</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">请确认数据格式与数据字典一致</span>
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition-colors"
              >
                <Upload size={14} />
                开始导入
              </button>
            </div>
            {importResult && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-medium text-slate-700 mb-2">导入结果</h4>
                <div className="flex gap-6 text-sm">
                  <span className="text-emerald-600">成功: {importResult.success} 条</span>
                  <span className="text-red-500">失败: {importResult.failed} 条</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'missing' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">字段名</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">处理规则</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">默认值</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">缺失数</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">缺失率</th>
                </tr>
              </thead>
              <tbody>
                {missingValueRules.map((rule) => (
                  <tr key={rule.fieldName} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700 font-mono text-xs">{rule.fieldName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        rule.rule === '剔除' ? 'bg-red-50 text-red-600 border-red-200' :
                        rule.rule === '填充默认值' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {rule.rule}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{rule.defaultValue || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-700">{rule.missingCount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-slate-700">{rule.missingRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
