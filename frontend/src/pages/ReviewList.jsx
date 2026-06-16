import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewApi } from '../api'

const STATUS_BADGE_MAP = {
  in_progress: 'badge-info',
  completed: 'badge-success',
  rejected: 'badge-danger',
  cancelled: 'badge-default',
}

const STATUS_LABEL_MAP = {
  in_progress: '进行中',
  completed: '已完成',
  rejected: '已退回',
  cancelled: '已取消',
}

export default function ReviewList() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchReviews()
  }, [status, page])

  async function fetchReviews() {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (status) params.status = status
      const res = await reviewApi.list(params)
      setReviews(res.data.results || [])
      setCount(res.data.count || 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(count / 20)

  return (
    <div>
      <div className="page-header">
        <h1>审查列表</h1>
        <p>查看所有合同审查记录</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">全部状态</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="rejected">已退回</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">加载中...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>暂无审查记录</h3>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>合同编号</th>
                    <th>合同标题</th>
                    <th>审查流程</th>
                    <th>当前步骤</th>
                    <th>状态</th>
                    <th>开始时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td>{r.contract_number || '-'}</td>
                      <td>{r.contract_title || '-'}</td>
                      <td>{r.workflow_name || '-'}</td>
                      <td>{r.current_step_name || '-'}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE_MAP[r.status] || 'badge-default'}`}>
                          {STATUS_LABEL_MAP[r.status] || r.status}
                        </span>
                      </td>
                      <td>{r.started_at || r.created_at || '-'}</td>
                      <td>
                        <button
                          className="btn"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => navigate(`/reviews/${r.id}`)}
                        >
                          查看详情
                        </button>
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
