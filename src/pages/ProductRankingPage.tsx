import { useEffect, useState } from 'react'
import { Shield, MessageSquare, Plus, Eye } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import ProductRanking from '@/components/ProductRanking'

interface Annotation {
  productId: string
  productName: string
  content: string
  createdAt: string
}

const riskColors = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
}

const riskLabels = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

export default function ProductRankingPage() {
  const { productRanking, repeatUsers, fetchProductRanking, fetchRepeatUsers } = useDashboardStore()
  const [annotations, setAnnotations] = useState<Annotation[]>([
    { productId: 'P001', productName: '智能手表Pro', content: '该商品退货率持续偏高，建议下架排查', createdAt: '2026-06-07 10:30' },
  ])
  const [showAnnotationModal, setShowAnnotationModal] = useState(false)
  const [annotationTarget, setAnnotationTarget] = useState('')
  const [annotationContent, setAnnotationContent] = useState('')
  const [showAnnotationList, setShowAnnotationList] = useState(false)

  useEffect(() => {
    fetchProductRanking()
    fetchRepeatUsers()
  }, [])

  const handleBarClick = (productId: string) => {
    setAnnotationTarget(productId)
  }

  const addAnnotation = () => {
    if (!annotationContent.trim() || !annotationTarget) return
    const product = productRanking.find((p) => p.id === annotationTarget)
    if (!product) return
    setAnnotations([
      ...annotations,
      {
        productId: annotationTarget,
        productName: product.name,
        content: annotationContent,
        createdAt: new Date().toLocaleString('zh-CN'),
      },
    ])
    setAnnotationContent('')
    setShowAnnotationModal(false)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <ProductRanking
          height={420}
          onBarClick={handleBarClick}
        />
        {annotationTarget && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">已选中: {productRanking.find((p) => p.id === annotationTarget)?.name}</span>
            <button
              onClick={() => setShowAnnotationModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500 text-white text-xs hover:bg-emerald-600 transition-colors"
            >
              <Plus size={12} /> 添加批注
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Shield size={14} className="text-slate-500" />
          重复退货用户
        </h3>
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <MessageSquare size={10} />
          共享报表中已脱敏处理用户信息
        </p>
        <div className="grid grid-cols-4 gap-3">
          {repeatUsers.map((user) => (
            <div key={user.hashedUserId} className="rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-slate-700">{user.hashedUserId}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs border ${riskColors[user.riskLevel]}`}>
                  {riskLabels[user.riskLevel]}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                退货次数: <span className="text-slate-800 font-medium">{user.returnCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <MessageSquare size={14} className="text-slate-500" />
            商品批注
          </h3>
          <button
            onClick={() => setShowAnnotationList(!showAnnotationList)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Eye size={12} /> {showAnnotationList ? '收起' : '查看全部'} ({annotations.length})
          </button>
        </div>
        {showAnnotationList && annotations.length > 0 && (
          <div className="space-y-2">
            {annotations.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-0.5">
                    {a.productName} <span className="text-slate-400">({a.productId})</span>
                  </div>
                  <div className="text-sm text-slate-700">{a.content}</div>
                  <div className="text-xs text-slate-400 mt-1">{a.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {annotations.length === 0 && showAnnotationList && (
          <div className="text-center text-sm text-slate-400 py-4">暂无批注</div>
        )}
      </div>

      {showAnnotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl p-5 w-[400px]">
            <h4 className="text-sm font-medium text-slate-700 mb-3">添加批注 — {productRanking.find((p) => p.id === annotationTarget)?.name}</h4>
            <textarea
              value={annotationContent}
              onChange={(e) => setAnnotationContent(e.target.value)}
              placeholder="输入批注内容..."
              className="w-full h-24 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowAnnotationModal(false)}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-500 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={addAnnotation}
                className="px-3 py-1.5 rounded-md bg-emerald-500 text-white text-sm hover:bg-emerald-600"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
