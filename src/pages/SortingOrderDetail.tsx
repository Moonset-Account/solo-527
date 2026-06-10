import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Plus, Trash2, CheckCircle, ShieldCheck, ShieldX } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils'

interface GradeEntry {
  id: string
  grade: string
  quantity: number
  unit: string
}

interface SortingOrder {
  id: string
  orderNo: string
  harvestId: string
  harvestBatch: string
  variety: string
  harvestQuantity: string
  sorter: string
  status: 'pending' | 'sorting' | 'completed' | 'inspected'
  grades: GradeEntry[]
  packaging: { material: string; weight: number; unit: string }
  inspectResult: 'pass' | 'fail' | 'pending'
  inspector: string
}

const gradeOptions = ['特级', '一级', '二级', '三级', '等外']
const unitOptions = ['kg', '箱', '筐']
const materialOptions = ['纸箱', '塑料筐', '泡沫箱', '木箱']

const inspectResultLabel: Record<string, string> = {
  pass: '合格',
  fail: '不合格',
  pending: '待质检',
}

const inspectResultColor: Record<string, string> = {
  pass: 'border-l-green-500 bg-green-50',
  fail: 'border-l-red-500 bg-red-50',
  pending: 'border-l-amber-500 bg-amber-50',
}

export default function SortingOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { execute: fetchOrder } = useApi<SortingOrder>()
  const { execute: startSorting, loading: starting } = useApi()
  const { execute: completeSorting, loading: completing } = useApi()
  const { execute: inspectOrder, loading: inspecting } = useApi()

  const [order, setOrder] = useState<SortingOrder | null>(null)
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [packaging, setPackaging] = useState({ material: '纸箱', weight: 0, unit: 'kg' })
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (id) {
      fetchOrder(`/api/sorting-orders/${id}`).then((data) => {
        if (data) {
          setOrder(data)
          if (data.grades && data.grades.length > 0) {
            setGrades(data.grades.map((g, i) => ({ ...g, id: g.id || `g-${i}` })))
          }
          if (data.packaging) {
            setPackaging({
              material: data.packaging.material || '纸箱',
              weight: data.packaging.weight || 0,
              unit: data.packaging.unit || 'kg',
            })
          }
        }
      }).catch(() => {})
    }
  }, [id])

  const handleStart = async () => {
    if (!id) return
    const result = await startSorting(`/api/sorting-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'sorting' }),
    })
    if (result && order) {
      setOrder({ ...order, status: 'sorting' })
    }
  }

  const addGradeRow = () => {
    setGrades([...grades, {
      id: Date.now().toString(),
      grade: gradeOptions[0], quantity: 0, unit: 'kg',
    }])
  }

  const removeGradeRow = (rowId: string) => {
    setGrades(grades.filter((g) => g.id !== rowId))
  }

  const updateGrade = (rowId: string, field: keyof GradeEntry, value: string | number) => {
    setGrades(grades.map((g) => g.id === rowId ? { ...g, [field]: value } : g))
  }

  const handleComplete = async () => {
    if (!id) return
    const submitGrades = grades.map(({ id, ...rest }) => rest)
    const result = await completeSorting(`/api/sorting-orders/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ grades: submitGrades, packaging }),
    })
    if (result && order) {
      setOrder({ ...order, status: 'completed', grades, inspectResult: 'pending' })
    }
    setConfirmOpen(false)
  }

  const handleInspect = async (result: 'pass' | 'fail') => {
    if (!id) return
    const res = await inspectOrder(`/api/sorting-orders/${id}/inspect`, {
      method: 'POST',
      body: JSON.stringify({ inspectResult: result }),
    })
    if (res && order) {
      setOrder({ ...order, inspectResult: result, status: 'inspected' })
    }
  }

  if (!order) {
    return (
      <div className="space-y-4 p-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  const infoItems = [
    { label: '订单号', value: order.orderNo },
    { label: '来源批次', value: order.harvestBatch },
    { label: '品种', value: order.variety },
    { label: '采收量', value: order.harvestQuantity },
    { label: '分拣员', value: order.sorter },
    { label: '状态', value: <StatusBadge status={order.status} type="sorting" /> },
  ]

  return (
    <div>
      <PageHeader
        title="分拣订单详情"
        action={
          <button onClick={() => navigate('/sorting-orders')} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">订单信息</h3>
          <div className="space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {order.status === 'pending' && (
            <div className="card p-6 text-center">
              <Play className="h-12 w-12 text-primary-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">准备开始分拣</h3>
              <p className="text-gray-500 mb-6">确认后进入分拣执行阶段</p>
              <button onClick={handleStart} disabled={starting} className="btn-primary">
                {starting ? '处理中...' : '开始分拣'}
              </button>
            </div>
          )}

          {order.status === 'sorting' && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">分拣录入</h3>
                <button onClick={addGradeRow} className="btn-outline text-sm flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  添加等级
                </button>
              </div>

              <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-3">包装信息</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">包装材料</label>
                    <select value={packaging.material} onChange={(e) => setPackaging({ ...packaging, material: e.target.value })} className="input-field text-sm">
                      {materialOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">包装重量</label>
                    <input type="number" value={packaging.weight || ''} onChange={(e) => setPackaging({ ...packaging, weight: Number(e.target.value) })} className="input-field text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">包装单位</label>
                    <select value={packaging.unit} onChange={(e) => setPackaging({ ...packaging, unit: e.target.value })} className="input-field text-sm">
                      {unitOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {grades.length === 0 ? (
                <div className="text-center py-8 text-gray-400">点击"添加等级"开始录入分拣结果</div>
              ) : (
                <div className="space-y-3">
                  {grades.map((g, idx) => (
                    <div key={g.id} className="p-4 rounded-lg border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">等级 #{idx + 1}</span>
                        <button onClick={() => removeGradeRow(g.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">等级名称</label>
                          <select value={g.grade} onChange={(e) => updateGrade(g.id, 'grade', e.target.value)} className="input-field text-sm">
                            {gradeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">数量</label>
                          <input type="number" value={g.quantity || ''} onChange={(e) => updateGrade(g.id, 'quantity', Number(e.target.value))} className="input-field text-sm" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">单位</label>
                          <select value={g.unit} onChange={(e) => updateGrade(g.id, 'unit', e.target.value)} className="input-field text-sm">
                            {unitOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3">
                    <button onClick={() => setConfirmOpen(true)} disabled={completing || starting} className="btn-primary flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {completing ? '提交中...' : '完成分拣'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(order.status === 'completed' || order.status === 'inspected') && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="font-semibold text-gray-800 mb-4">分拣结果</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-3 py-2 font-medium text-gray-600">等级</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">数量</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">包装材料</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">包装重量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.grades.map((g, idx) => (
                        <tr key={g.id || idx} className="border-b border-gray-50">
                          <td className="px-3 py-2">{g.grade}</td>
                          <td className="px-3 py-2">{g.quantity} {g.unit}</td>
                          <td className="px-3 py-2">{packaging.material}</td>
                          <td className="px-3 py-2">{packaging.weight} {packaging.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {order.inspectResult && order.inspectResult !== 'pending' && (
                <div className={cn('card p-5 border-l-4', inspectResultColor[order.inspectResult])}>
                  <div className="flex items-center gap-2">
                    {order.inspectResult === 'pass' ? (
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldX className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold">质检结果：{inspectResultLabel[order.inspectResult]}</span>
                  </div>
                </div>
              )}

              {order.status === 'completed' && order.inspectResult === 'pending' && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">质检操作</h3>
                  <div className="flex gap-3">
                    <button onClick={() => handleInspect('pass')} disabled={inspecting} className="btn-primary flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      {inspecting ? '提交中...' : '质检通过'}
                    </button>
                    <button onClick={() => handleInspect('fail')} disabled={inspecting} className="btn-danger flex items-center gap-2">
                      <ShieldX className="h-4 w-4" />
                      不合格
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleComplete}
        title="确认完成分拣"
        message="确认已完成分拣？提交后将不可修改等级数据。"
        confirmText="确认完成"
      />
    </div>
  )
}
