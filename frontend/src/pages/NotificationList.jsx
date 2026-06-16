import { useState, useEffect } from 'react'
import { notificationApi } from '../api'

export default function NotificationList() {
  const [notifications, setNotifications] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchNotifications()
  }, [page])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await notificationApi.list({ page, page_size: 20 })
      setNotifications(res.data.results || [])
      setCount(res.data.count || 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(id) {
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      alert(err.message || '操作失败')
    }
  }

  const totalPages = Math.ceil(count / 20)

  return (
    <div>
      <div className="page-header">
        <h1>退回通知</h1>
        <p>查看合同退回通知记录</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">加载中...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>暂无通知</h3>
            <p>没有退回通知</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>合同编号</th>
                    <th>退回人</th>
                    <th>合规经理</th>
                    <th>退回原因</th>
                    <th>是否已读</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id} style={{ fontWeight: n.is_read ? 'normal' : '600' }}>
                      <td>
                        {!n.is_read && <span className="notification-dot" style={{ marginRight: 6 }} />}
                        {n.contract_number || '-'}
                      </td>
                      <td>{n.rejected_by || '-'}</td>
                      <td>{n.compliance_manager || '-'}</td>
                      <td>{n.rejection_reason || n.reason || '-'}</td>
                      <td>
                        <span className={`badge ${n.is_read ? 'badge-default' : 'badge-danger'}`}>
                          {n.is_read ? '已读' : '未读'}
                        </span>
                      </td>
                      <td>{n.created_at || '-'}</td>
                      <td>
                        {!n.is_read && (
                          <button
                            className="btn"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={() => handleMarkRead(n.id)}
                          >
                            标记已读
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button
                  className="btn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </button>
                <span style={{ padding: '8px 12px', fontSize: 14 }}>
                  第 {page} / {totalPages} 页
                </span>
                <button
                  className="btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
