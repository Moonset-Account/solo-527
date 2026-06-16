import { useState, useEffect } from 'react'
import { statsApi } from '../api'

export default function EfficiencyStats() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const res = await statsApi.efficiency(params)
      setData(res.data.results || res.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  function handleFilter(e) {
    e.preventDefault()
    fetchStats()
  }

  return (
    <div>
      <div className="page-header">
        <h1>审查效率统计</h1>
        <p>查看各审查人的工作效率数据</p>
      </div>

      <div className="card">
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">筛选</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">加载中...</div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>暂无统计数据</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>审查人</th>
                  <th>总审查数</th>
                  <th>通过数</th>
                  <th>退回数</th>
                  <th>平均审查时长(h)</th>
                  <th>完成率</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={row.reviewer_id || idx}>
                    <td>{row.reviewer || row.reviewer_name || '-'}</td>
                    <td>{row.total_reviews ?? '-'}</td>
                    <td>{row.passed_count ?? '-'}</td>
                    <td>{row.rejected_count ?? '-'}</td>
                    <td>{row.avg_duration != null ? Number(row.avg_duration).toFixed(1) : '-'}</td>
                    <td>
                      {row.completion_rate != null
                        ? (Number(row.completion_rate) * 100).toFixed(1) + '%'
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
