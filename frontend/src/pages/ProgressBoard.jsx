import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { progressApi } from '../api'

const COLUMNS = [
  { key: 'in_progress', title: '进行中', badgeClass: 'badge-info' },
  { key: 'completed', title: '已完成', badgeClass: 'badge-success' },
  { key: 'rejected', title: '已退回', badgeClass: 'badge-danger' },
  { key: 'archived', title: '已归档', badgeClass: 'badge-warning' },
]

export default function ProgressBoard() {
  const navigate = useNavigate()
  const [boardData, setBoardData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBoard()
  }, [])

  async function fetchBoard() {
    setLoading(true)
    try {
      const res = await progressApi.board()
      setBoardData(res.data || {})
    } catch {
    } finally {
      setLoading(false)
    }
  }

  function getCards(columnKey) {
    return boardData[columnKey] || []
  }

  if (loading) {
    return <div className="loading-spinner">加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>进度看板</h1>
        <p>按状态查看合同审查进度</p>
      </div>

      <div className="board-grid">
        {COLUMNS.map((col) => {
          const cards = getCards(col.key)
          return (
            <div className="board-column" key={col.key}>
              <div className="board-column-title">
                {col.title}
                <span className="count">{cards.length}</span>
              </div>
              {cards.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24, fontSize: 13 }}>
                  暂无数据
                </div>
              ) : (
                cards.map((card) => (
                  <div
                    className="board-card"
                    key={card.id}
                    onClick={() => {
                      if (card.review_id) {
                        navigate(`/reviews/${card.review_id}`)
                      }
                    }}
                  >
                    <div className="board-card-title">
                      {card.contract_number || '-'}
                    </div>
                    <div className="board-card-meta" style={{ marginBottom: 4 }}>
                      {card.title || '-'}
                    </div>
                    <div className="board-card-meta">
                      当前步骤：{card.current_step || '-'}
                    </div>
                    <div className="board-card-meta">
                      最新处理人：{card.latest_handler || card.handler || '-'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {card.stamp_status !== undefined && (
                        <span className={`badge ${card.stamp_status ? 'badge-success' : 'badge-warning'}`}>
                          用印{card.stamp_status ? '完成' : '未完成'}
                        </span>
                      )}
                      {card.evidence_status !== undefined && (
                        <span className={`badge ${card.evidence_status ? 'badge-success' : 'badge-warning'}`}>
                          证据{card.evidence_status ? '完成' : '未完成'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
