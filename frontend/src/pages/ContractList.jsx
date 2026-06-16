import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { contractApi } from '../api'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待提交' },
  { value: 'in_review', label: '审查中' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已退回' },
  { value: 'archived', label: '已归档' },
]

const STATUS_BADGE_MAP = {
  pending: 'badge-default',
  in_review: 'badge-info',
  completed: 'badge-success',
  rejected: 'badge-danger',
  archived: 'badge-warning',
}

const STATUS_LABEL_MAP = {
  pending: '待提交',
  in_review: '审查中',
  completed: '已完成',
  rejected: '已退回',
  archived: '已归档',
}

export default function ContractList() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchContracts()
  }, [search, status, page])

  async function fetchContracts() {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (search) params.search = search
      if (status) params.status = status
      const res = await contractApi.list(params)
      setContracts(res.data.results || [])
      setCount(res.data.count || 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchContracts()
  }

  const totalPages = Math.ceil(count / 20)

  return (
    <div>
      <div className="page-header">
        <h1>合同管理</h1>
        <p>查看和管理所有合同</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <form onSubmit={handleSearch}>
            <input
              className="search-input"
              placeholder="搜索合同编号或标题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/contracts/upload')}
        >
          上传合同
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">加载中...</div>
        ) : contracts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>暂无合同</h3>
            <p>点击"上传合同"添加新合同</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>合同编号</th>
                    <th>标题</th>
                    <th>对方单位</th>
                    <th>状态</th>
                    <th>上传人</th>
                    <th>上传时间</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id}>
                      <td>{c.contract_number}</td>
                      <td>{c.title}</td>
                      <td>{c.counterparty}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE_MAP[c.status] || 'badge-default'}`}>
                          {STATUS_LABEL_MAP[c.status] || c.status}
                        </span>
                      </td>
                      <td>{c.uploaded_by || c.uploader || '-'}</td>
                      <td>{c.created_at || c.upload_time || '-'}</td>
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
