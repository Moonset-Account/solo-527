'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, User, Clock, Lock, Unlock, Eye, Edit, Download, Share2, Image, Video, Music, FileText, ImageIcon, Folder } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppLayout from '@/components/AppLayout'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import { materialsApi, usersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { MaterialType, MaterialAccessLevel, UserRole } from '@prisma/client'

const materialSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  type: z.enum(['VIDEO', 'IMAGE', 'AUDIO', 'DOCUMENT', 'COVER']),
  url: z.string().url('请输入有效的URL'),
  thumbnailUrl: z.string().optional(),
  tags: z.string().transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  permission: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED']).default('INTERNAL'),
  topicId: z.string().optional(),
  scriptId: z.string().optional(),
})

const permissionSchema = z.object({
  userId: z.string(),
  canView: z.boolean().default(true),
  canEdit: z.boolean().default(false),
  canDownload: z.boolean().default(false),
  canShare: z.boolean().default(false),
})

type MaterialForm = z.infer<typeof materialSchema>
type PermissionForm = z.infer<typeof permissionSchema>

interface Material {
  id: string
  name: string
  type: MaterialType
  url: string
  thumbnailUrl: string | null
  tags: string[]
  permission: MaterialAccessLevel
  uploader: { id: string; name: string; avatarUrl: string | null }
  topic: { id: string; title: string } | null
  script: { id: string; version: string } | null
  permissions: any[]
  createdAt: string
}

const typeIcons: Record<MaterialType, React.ReactNode> = {
  VIDEO: <Video size={20} />,
  IMAGE: <Image size={20} />,
  AUDIO: <Music size={20} />,
  DOCUMENT: <FileText size={20} />,
  COVER: <ImageIcon size={20} />,
}

const typeColors: Record<MaterialType, string> = {
  VIDEO: 'bg-blue-100 text-blue-700',
  IMAGE: 'bg-green-100 text-green-700',
  AUDIO: 'bg-purple-100 text-purple-700',
  DOCUMENT: 'bg-orange-100 text-orange-700',
  COVER: 'bg-pink-100 text-pink-700',
}

export default function MaterialsPage() {
  const { user } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [permissionFilter, setPermissionFilter] = useState('')

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  const {
    register: registerMaterial,
    handleSubmit: handleSubmitMaterial,
    formState: { errors: materialErrors },
    reset: resetMaterial,
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: { permission: 'INTERNAL' },
  })

  const {
    register: registerPermission,
    handleSubmit: handleSubmitPermission,
    formState: { errors: permissionErrors },
    setValue,
    watch,
  } = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      canView: true,
      canEdit: false,
      canDownload: false,
      canShare: false,
    },
  })

  const canManagePermissions = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR_SUPERVISOR

  useEffect(() => {
    loadData()
    loadUsers()
  }, [page, keyword, typeFilter, permissionFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize: 12 }
      if (keyword) params.keyword = keyword
      if (typeFilter) params.type = typeFilter
      if (permissionFilter) params.permission = permissionFilter

      const res = await materialsApi.list(params)
      if (res.success) {
        setMaterials(res.data.items)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
      }
    } catch (error) {
      console.error('加载素材失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await usersApi.list()
      if (res.success) {
        setUsers(res.data)
      }
    } catch (error) {
      console.error('加载用户失败:', error)
    }
  }

  const onUpload = async (data: MaterialForm) => {
    try {
      await materialsApi.create(data)
      setUploadModalOpen(false)
      resetMaterial()
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const onUpdatePermission = async (data: PermissionForm) => {
    if (!selectedMaterial) return
    try {
      await materialsApi.updatePermission(selectedMaterial.id, data)
      loadData()
      alert('权限更新成功')
    } catch (error: any) {
      alert(error.message)
    }
  }

  const openPermissionModal = (material: Material) => {
    setSelectedMaterial(material)
    setPermissionModalOpen(true)
  }

  const getPermissionIcon = (permission: MaterialAccessLevel) => {
    if (permission === 'PUBLIC') return <Unlock size={16} className="text-green-600" />
    if (permission === 'INTERNAL') return <Eye size={16} className="text-blue-600" />
    return <Lock size={16} className="text-red-600" />
  }

  const getPermissionLabel = (permission: MaterialAccessLevel) => {
    if (permission === 'PUBLIC') return '公开'
    if (permission === 'INTERNAL') return '内部'
    return '受限'
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">素材库管理</h1>
            <p className="text-gray-500 mt-1">管理品牌素材，控制访问权限</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            <span>上传素材</span>
          </button>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
              placeholder="搜索素材名称或标签..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="">全部类型</option>
              <option value="VIDEO">视频</option>
              <option value="IMAGE">图片</option>
              <option value="AUDIO">音频</option>
              <option value="DOCUMENT">文档</option>
              <option value="COVER">封面</option>
            </select>
          </div>

          <select
            value={permissionFilter}
            onChange={(e) => { setPermissionFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none appearance-none bg-white"
          >
            <option value="">全部权限</option>
            <option value="PUBLIC">公开</option>
            <option value="INTERNAL">内部</option>
            <option value="RESTRICTED">受限</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="relative aspect-video bg-gray-100">
                    {material.thumbnailUrl || material.type === 'IMAGE' || material.type === 'COVER' ? (
                      <img
                        src={material.thumbnailUrl || material.url}
                        alt={material.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`p-4 rounded-full ${typeColors[material.type]}`}>
                          {typeIcons[material.type]}
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canManagePermissions && (
                        <button
                          onClick={() => openPermissionModal(material)}
                          className="p-2 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                          title="管理权限"
                        >
                          <Lock size={16} />
                        </button>
                      )}
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 bg-white/90`}>
                        {getPermissionIcon(material.permission)}
                        <span>{getPermissionLabel(material.permission)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate">{material.name}</h3>
                      <div className={`p-1.5 rounded-lg ${typeColors[material.type]}`}>
                        {typeIcons[material.type]}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {material.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {material.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          +{material.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{material.uploader.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(material.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>

                    {material.permissions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">已授权 ({material.permissions.length})</p>
                        <div className="flex -space-x-2">
                          {material.permissions.slice(0, 3).map((p, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-700 border-2 border-white"
                              title={p.user?.name}
                            >
                              {p.user?.name?.charAt(0)}
                            </div>
                          ))}
                          {material.permissions.length > 3 && (
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                              +{material.permissions.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && materials.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无素材数据</p>
            </div>
          )}

          {total > 0 && (
            <Pagination
              page={page}
              pageSize={12}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="上传素材"
        size="lg"
      >
        <form onSubmit={handleSubmitMaterial(onUpload)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                素材名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...registerMaterial('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="输入素材名称"
              />
              {materialErrors.name && (
                <p className="mt-1 text-sm text-red-600">{materialErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                素材类型 <span className="text-red-500">*</span>
              </label>
              <select
                {...registerMaterial('type')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="VIDEO">视频</option>
                <option value="IMAGE">图片</option>
                <option value="AUDIO">音频</option>
                <option value="DOCUMENT">文档</option>
                <option value="COVER">封面</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                素材地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                {...registerMaterial('url')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="https://..."
              />
              {materialErrors.url && (
                <p className="mt-1 text-sm text-red-600">{materialErrors.url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                缩略图地址
              </label>
              <input
                type="url"
                {...registerMaterial('thumbnailUrl')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <input
                type="text"
                {...registerMaterial('tags')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="多个标签用逗号分隔"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                权限设置
              </label>
              <select
                {...registerMaterial('permission')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="PUBLIC">公开 - 所有人可见</option>
                <option value="INTERNAL">内部 - 内部成员可见</option>
                <option value="RESTRICTED">受限 - 仅授权人可见</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              上传
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        title="管理素材权限"
        size="md"
      >
        {selectedMaterial && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedMaterial.name}</p>
              <p className="text-sm text-gray-500">当前权限: {getPermissionLabel(selectedMaterial.permission)}</p>
            </div>

            <form onSubmit={handleSubmitPermission(onUpdatePermission)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择用户 <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerPermission('userId')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">请选择用户</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.role === 'ADMIN' ? '管理员' : u.role === 'EDITOR_SUPERVISOR' ? '编辑主管' : u.role === 'EDITOR' ? '编辑' : '创作者'}
                    </option>
                  ))}
                </select>
                {permissionErrors.userId && (
                  <p className="mt-1 text-sm text-red-600">{permissionErrors.userId.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...registerPermission('canView')}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <Eye size={16} className="inline mr-1" />
                    <span className="text-sm">查看</span>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...registerPermission('canEdit')}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <Edit size={16} className="inline mr-1" />
                    <span className="text-sm">编辑</span>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...registerPermission('canDownload')}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <Download size={16} className="inline mr-1" />
                    <span className="text-sm">下载</span>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...registerPermission('canShare')}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <Share2 size={16} className="inline mr-1" />
                    <span className="text-sm">分享</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPermissionModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  保存权限
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
