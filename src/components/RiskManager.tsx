'use client'

import { useActionState } from 'react'
import { resolveRisk } from '@/app/actions'
import StatusBadge from '@/components/StatusBadge'
import { AlertTriangle, User, Clock, BookOpen, CheckCircle } from 'lucide-react'

interface RiskKnowledgeItem {
  id: string
  isSource: boolean
  knowledge: { id: string; title: string }
}

interface RiskItem {
  id: string
  description: string
  riskLevel: string
  isResolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  createdAt: string
  conversation: {
    customerQuestion: string
    user: { id: string; name: string }
  }
  knowledgeItems: RiskKnowledgeItem[]
}

export default function RiskManager({ risks }: { risks: RiskItem[] }) {
  const [state, formAction] = useActionState(resolveRisk, {
    success: false,
    error: '',
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">总风险样本</p>
          <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">未解决</p>
          <p className="text-2xl font-bold text-red-600">
            {risks.filter(r => !r.isResolved).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">已解决</p>
          <p className="text-2xl font-bold text-green-600">
            {risks.filter(r => r.isResolved).length}
          </p>
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无风险样本</h3>
          <p className="text-gray-500">系统运行正常，没有检测到风险</p>
        </div>
      ) : (
        <div className="space-y-4">
          {risks.map((risk) => (
            <div
              key={risk.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                risk.isResolved ? 'border-gray-200' : 'border-red-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={risk.riskLevel} type="risk" />
                    {risk.isResolved ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        已解决
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        待处理
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(risk.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">客户问题：</p>
                  <p className="text-gray-900">{risk.conversation.customerQuestion}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">风险描述：</p>
                  <p className="text-gray-600">{risk.description}</p>
                </div>

                {risk.knowledgeItems.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      关联知识：
                    </p>
                    <div className="space-y-2">
                      {risk.knowledgeItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <span className={item.isSource ? 'text-red-600 font-medium' : ''}>
                            {item.isSource ? '[异常来源]' : ''}
                          </span>
                          <span className="text-gray-900">{item.knowledge.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {risk.isResolved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      处理说明（由 {risk.resolvedBy} 于 {risk.resolvedAt ? new Date(risk.resolvedAt).toLocaleString('zh-CN') : ''} 处理）
                    </p>
                    <p className="text-gray-600">{risk.resolutionNote}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    提交人: {risk.conversation.user.name}
                  </span>
                </div>
              </div>

              {!risk.isResolved && (
                <form action={formAction} className="border-t border-gray-200 p-4 bg-gray-50">
                  <input type="hidden" name="id" value={risk.id} />
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        处理说明
                      </label>
                      <input
                        type="text"
                        name="resolutionNote"
                        required
                        placeholder="请输入处理说明..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      标记为已解决
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
