import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { contentApi } from '../lib/api'
import type { PodcastContent } from '../lib/types'

type FilterType = 'all' | 'public' | 'member'
type SortType = 'newest' | 'oldest'

function ContentPage() {
  const [contents, setContents] = useState<PodcastContent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoggedIn] = useState(false)
  const [isMember] = useState(false)

  useEffect(() => {
    fetchContents()
  }, [filter, sort, page])

  const fetchContents = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize: 9,
      }

      if (filter === 'public') {
        params.isMemberOnly = false
      } else if (filter === 'member') {
        params.isMemberOnly = true
      }

      const data = await contentApi.list(params)
      
      let items = data.items
      if (sort === 'oldest') {
        items = [...items].sort((a, b) => 
          new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
        )
      }

      setContents(items)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const canViewContent = (content: PodcastContent) => {
    if (!content.isMemberOnly) return true
    return isLoggedIn && isMember
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              p === page
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          下一页
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">播客内容</h1>
          <p className="text-gray-500 mt-1">
            共 {total} 期节目
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'public', 'member'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? '全部' : type === 'public' ? '公开内容' : '会员内容'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">排序：</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">最新发布</option>
              <option value="oldest">最早发布</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">🎧</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">暂无内容</h3>
          <p className="text-gray-500">敬请期待更多精彩节目</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => {
            const canView = canViewContent(content)
            const CardWrapper = canView ? Link : 'div'
            const wrapperProps = canView
              ? { to: `/content/${content.id}` }
              : {}
            
            return (
              <div
                key={content.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardWrapper
                  {...wrapperProps}
                  className="block"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                    <span className="text-5xl">🎵</span>
                    {content.isMemberOnly && (
                      <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full">
                        会员专享
                      </span>
                    )}
                    {!canView && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white">
                          <span className="text-4xl">🔒</span>
                          <p className="text-sm mt-2">登录会员解锁</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {content.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {content.description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {formatDate(content.publishDate)}
                      </span>
                      {content.isMemberOnly ? (
                        <span className="text-yellow-600">💎 会员</span>
                      ) : (
                        <span className="text-green-600">免费</span>
                      )}
                    </div>
                  </div>
                </CardWrapper>
              </div>
            )
          })}
        </div>
      )}

      {renderPagination()}
    </div>
  )
}

export const Route = createLazyFileRoute('/content')({
  component: ContentPage,
})
