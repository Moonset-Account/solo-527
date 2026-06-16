import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import StatusBadge from '@/components/StatusBadge'
import { createKnowledge, updateKnowledge } from '../actions'
import { useActionState } from 'react'
import { BookOpen, Plus, User, Calendar, AlertTriangle, Tag } from 'lucide-react'

async function KnowledgeList() {
  const [users, knowledge] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: ['TRAINER', 'ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.knowledgeBase.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            retrievalRecords: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
  ])

  const [createState, createAction] = useActionState(createKnowledge, {
    success: false,
    error: null,
  })

  const [updateState, updateAction] = useActionState(updateKnowledge, {
    success: false,
    error: null,
  })

  const categories = ['常见问题', '政策文档', '培训材料', '产品说明', '其他']
  const expireReasons = [
    { value: 'OUTDATED', label: '内容过时' },
    { value: 'POLICY_CHANGED', label: '政策变更' },
    { value: 'PRODUCT_UPDATED', label: '产品更新' },
    { value: 'REGULATION_CHANGED', label: '法规变更' },
    { value: 'DUPLICATE', label: '重复内容' },
    { value: 'OTHER', label: '其他原因' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          添加新知识
        </h3>
        <form action={createAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="例如：产品退换货政策"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                内容
              </label>
              <textarea
                name="content"
                rows={4}
                required
                placeholder="详细的知识内容..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                name="category"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负责人
              </label>
              <select
                name="ownerId"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签（用逗号分隔）
              </label>
              <input
                type="text"
                name="tags"
                placeholder="退换货, 售后, 7天无理由"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                过期日期
              </label>
              <input
                type="date"
                name="expireDate"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加知识
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">总知识数</p>
          <p className="text-2xl font-bold text-gray-900">{knowledge.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">生效中</p>
          <p className="text-2xl font-bold text-green-600">
            {knowledge.filter(k => k.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">已过期</p>
          <p className="text-2xl font-bold text-red-600">
            {knowledge.filter(k => k.status === 'EXPIRED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">审核中</p>
          <p className="text-2xl font-bold text-yellow-600">
            {knowledge.filter(k => k.status === 'UNDER_REVIEW').length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {knowledge.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={item.status} type="knowledge" />
                  <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {item.category}
                  </span>
                  {item._count.retrievalRecords > 0 && (
                    <span className="text-sm text-gray-500">
                      被引用 {item._count.retrievalRecords} 次
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">{item.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    创建者: {item.createdBy.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    负责人: {item.owner.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    创建于: {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  {item.expireDate && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      过期: {new Date(item.expireDate).toLocaleDateString('zh-CN')}
                      {item.expireReason && ` (${expireReasons.find(r => r.value === item.expireReason)?.label})`}
                    </span>
                  )}
                </div>
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <Tag className="w-4 h-4 text-gray-400" />
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form action={updateAction} className="border-t border-gray-200 pt-4 mt-4">
              <input type="hidden" name="id" value={item.id} />
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    状态
                  </label>
                  <select
                    name="status"
                    defaultValue={item.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="ACTIVE">生效中</option>
                    <option value="UNDER_REVIEW">审核中</option>
                    <option value="EXPIRED">已过期</option>
                    <option value="ARCHIVED">已归档</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    负责人
                  </label>
                  <select
                    name="ownerId"
                    defaultValue={item.ownerId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    过期日期
                  </label>
                  <input
                    type="date"
                    name="expireDate"
                    defaultValue={item.expireDate ? item.expireDate.toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    过期原因
                  </label>
                  <select
                    name="expireReason"
                    defaultValue={item.expireReason || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">未过期</option>
                    {expireReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  更新
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KnowledgePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">知识库管理</h1>
        <p className="text-gray-600">管理客服知识库，按培训负责人、日期和过期原因分类追踪</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
        <KnowledgeList />
      </Suspense>
    </div>
  )
}
