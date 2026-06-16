import { useState, useEffect } from 'react'
import { contractApi, reviewApi, notificationApi } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalContracts: 0,
    pendingReviews: 0,
    completedToday: 0,
    rejectionRate: '0%',
  })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const [contractsRes, reviewsRes, notificationsRes] = await Promise.all([
        contractApi.list({ page: 1, page_size: 1 }),
        reviewApi.list({ page: 1, page_size: 1, status: 'pending' }),
        notificationApi.list({ page: 1, page_size: 10 }),
      ])

      const totalContracts = contractsRes.data.count || 0
      const pendingReviews = reviewsRes.data.count || 0

      const today = new Date().toISOString().slice(0, 10)
      const completedRes = await reviewApi.list({
        page: 1,
        page_size: 1,
        status: 'completed',
        completed_after: today,
      })
      const completedToday = completedRes.data.count || 0

      const allReviewsRes = await reviewApi.list({ page: 1, page_size: 1 })
      const rejectedRes = await reviewApi.list({ page: 1, page_size: 1, status: 'rejected' })
      const totalReviews = allReviewsRes.data.count || 0
      const rejectedCount = rejectedRes.data.count || 0
      const rejectionRate = totalReviews > 0
        ? ((rejectedCount / totalReviews) * 100).toFixed(1) + '%'
        : '0%'

      setStats({ totalContracts, pendingReviews, completedToday, rejectionRate })

      const notifications = notificationsRes.data.results || []
      setActivities(notifications.slice(0, 8))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading-spinner">加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>工作台概览</h1>
        <p>合同审查工作数据一览</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">合同总数</div>
          <div className="stat-value">{stats.totalContracts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">待审查</div>
          <div className="stat-value">{stats.pendingReviews}</div>
          <div className="stat-trend up">待处理</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">今日完成</div>
          <div className="stat-value">{stats.completedToday}</div>
          <div className="stat-trend up">今日</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">退回率</div>
          <div className="stat-value">{stats.rejectionRate}</div>
          <div className="stat-trend down">退回</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">最近动态</div>
        {activities.length === 0 ? (
          <div className="empty-state">
            <h3>暂无动态</h3>
          </div>
        ) : (
          <div className="timeline">
            {activities.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-time">
                  {item.created_at || item.timestamp || ''}
                </div>
                <div className="timeline-content">
                  合同 {item.contract_number || item.contract || ''} 被退回
                </div>
                <div className="timeline-handler">
                  {item.rejected_by || item.sender || ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
