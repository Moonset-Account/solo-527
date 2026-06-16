import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { contentApi, authApi } from '../../lib/api'
import type { PodcastContent, AuthMeResponse } from '../../lib/types'

function ContentDetailPage() {
  const { id } = Route.useParams()
  const [content, setContent] = useState<PodcastContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [authData, setAuthData] = useState<AuthMeResponse | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    fetchContent()
    fetchCurrentUser()
  }, [id])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const data = await contentApi.get(parseInt(id, 10))
      setContent(data.content)
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    setAuthLoading(true)
    try {
      const data = await authApi.getCurrentUser()
      setAuthData(data)
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      setAuthData(null)
    } finally {
      setAuthLoading(false)
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

  const canViewContent = () => {
    if (!content) return false
    if (!content.isMemberOnly) return true
    if (!authData) return false
    return authData.membershipStatus === 'active' && !!authData.activeSubscription
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
        <div className="text-5xl mb-4">❓</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">内容不存在</h3>
        <p className="text-gray-500 mb-4">该节目可能已被删除或不存在</p>
        <Link
          to="/content"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          返回列表
        </Link>
      </div>
    )
  }

  const canView = canViewContent()
  const isLoggedIn = !!authData
  const isMember = authData?.membershipStatus === 'active'

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/content"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <span>←</span>
        <span>返回列表</span>
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
          <span className="text-7xl">🎵</span>
          {content.isMemberOnly && (
            <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full">
              💎 会员专享
            </span>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            {content.isMemberOnly ? (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
                会员内容
              </span>
            ) : (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                免费内容
              </span>
            )}
            <span className="text-sm text-gray-400">
              {formatDate(content.publishDate)}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {content.title}
          </h1>

          <div className="prose prose-gray max-w-none mb-8">
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {content.description || '暂无节目描述'}
            </p>
          </div>

          {content.isMemberOnly && isMember && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="text-green-700 font-medium">会员已解锁，尽情收听吧！</span>
              </div>
            </div>
          )}

          {canView ? (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">播放节目</h3>
              {content.audioUrl ? (
                <div className="space-y-4">
                  <audio
                    controls
                    src={content.audioUrl}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <span className="text-2xl">
                      {isPlaying ? '⏸' : '▶'}
                    </span>
                  </button>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-blue-600 transition-all ${
                          isPlaying ? 'w-1/3' : 'w-0'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{isPlaying ? '01:23' : '00:00'}</span>
                      <span>45:30</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 text-center">
              {!isLoggedIn ? (
                <>
                  <div className="text-5xl mb-4">�</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    请先登录
                  </h3>
                  <p className="text-gray-600 mb-6">
                    登录后即可查看您的会员状态并解锁内容
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    登录账号
                  </button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    会员专享内容
                  </h3>
                  <p className="text-gray-600 mb-6">
                    升级为会员，解锁全部精彩内容
                  </p>
                  <Link
                    to="/membership"
                    className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-colors"
                  >
                    立即升级会员
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/content/$id')({
  component: ContentDetailPage,
})
