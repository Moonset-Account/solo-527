import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  reviewApi,
  stampNodeApi,
  evidenceChecklistApi,
  evidenceMaterialApi,
  progressApi,
} from '../api'

export default function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [opinions, setOpinions] = useState([])
  const [stampNodes, setStampNodes] = useState([])
  const [checklists, setChecklists] = useState([])
  const [progressRecords, setProgressRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [opinionForm, setOpinionForm] = useState({
    step: '',
    opinion: '',
    result: 'pass',
  })

  useEffect(() => {
    fetchAllData()
  }, [id])

  async function fetchAllData() {
    setLoading(true)
    try {
      const [reviewRes, opinionsRes, stampRes, checklistRes, progressRes] =
        await Promise.all([
          reviewApi.retrieve(id),
          reviewApi.getOpinions(id),
          stampNodeApi.list({ review: id }),
          evidenceChecklistApi.list({ review: id }),
          progressApi.list({ review: id }),
        ])

      setReview(reviewRes.data)
      setOpinions(opinionsRes.data.results || opinionsRes.data || [])
      setStampNodes(stampRes.data.results || stampRes.data || [])
      setChecklists(checklistRes.data.results || checklistRes.data || [])
      setProgressRecords(progressRes.data.results || progressRes.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteStamp(stampId) {
    try {
      await stampNodeApi.complete(stampId)
      const stampRes = await stampNodeApi.list({ review: id })
      setStampNodes(stampRes.data.results || stampRes.data || [])
    } catch (err) {
      alert(err.message || '操作失败')
    }
  }

  async function handleCollectChecklist(checklistId) {
    try {
      await evidenceChecklistApi.collect(checklistId)
      const checklistRes = await evidenceChecklistApi.list({ review: id })
      setChecklists(checklistRes.data.results || checklistRes.data || [])
    } catch (err) {
      alert(err.message || '操作失败')
    }
  }

  async function handleUploadMaterial(checklistId, file) {
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('checklist', checklistId)
      await evidenceMaterialApi.create(formData)
      alert('上传成功')
    } catch (err) {
      alert(err.message || '上传失败')
    }
  }

  async function handleSubmitOpinion(e) {
    e.preventDefault()
    if (!opinionForm.opinion) {
      alert('请填写审查意见')
      return
    }
    setSubmitting(true)
    try {
      await reviewApi.submitOpinion(id, opinionForm)
      setOpinionForm({ step: '', opinion: '', result: 'pass' })
      const [opinionsRes, reviewRes] = await Promise.all([
        reviewApi.getOpinions(id),
        reviewApi.retrieve(id),
      ])
      setOpinions(opinionsRes.data.results || opinionsRes.data || [])
      setReview(reviewRes.data)
    } catch (err) {
      alert(err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading-spinner">加载中...</div>
  }

  if (!review) {
    return <div className="empty-state"><h3>未找到审查记录</h3></div>
  }

  const contract = review.contract || {}

  return (
    <div>
      <div className="page-header">
        <h1>审查详情</h1>
        <p>合同编号：{contract.contract_number || '-'}</p>
      </div>

      <div className="card">
        <div className="card-title">合同信息</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><strong>标题：</strong>{contract.title || '-'}</div>
          <div><strong>对方单位：</strong>{contract.counterparty || '-'}</div>
          <div><strong>合同类型：</strong>{contract.contract_type || '-'}</div>
          <div><strong>金额：</strong>{contract.amount || '-'}</div>
          <div><strong>状态：</strong>{review.status || '-'}</div>
          <div><strong>当前步骤：</strong>{review.current_step || '-'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">审查意见</div>
        {opinions.length === 0 ? (
          <div className="empty-state"><h3>暂无审查意见</h3></div>
        ) : (
          opinions.map((op) => (
            <div
              key={op.id}
              className={`review-opinion-card ${op.result === 'reject' ? 'rejected' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>
                  <strong>{op.reviewer || op.reviewer_name || '-'}</strong>
                  {' · '}
                  步骤 {op.step || '-'}
                </span>
                <span className={`badge ${op.result === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                  {op.result === 'pass' ? '通过' : '退回'}
                </span>
              </div>
              <div style={{ fontSize: 14, margin: '4px 0' }}>{op.opinion || op.content || '-'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{op.created_at || '-'}</div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-title">用印节点</div>
        {stampNodes.length === 0 ? (
          <div className="empty-state"><h3>暂无用印节点</h3></div>
        ) : (
          stampNodes.map((node) => (
            <div className="evidence-row" key={node.id}>
              <span style={{ flex: 1 }}>{node.name || node.stamp_type || '-'}</span>
              <span className={`badge ${node.is_completed ? 'badge-success' : 'badge-warning'}`}>
                {node.is_completed ? '已完成' : '待完成'}
              </span>
              {!node.is_completed && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => handleCompleteStamp(node.id)}
                >
                  完成
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-title">证据清单</div>
        {checklists.length === 0 ? (
          <div className="empty-state"><h3>暂无证据清单</h3></div>
        ) : (
          checklists.map((item) => (
            <div className="evidence-row" key={item.id}>
              <span style={{ flex: 1 }}>{item.name || item.item_name || '-'}</span>
              <span className={`badge ${item.is_collected ? 'badge-success' : 'badge-warning'}`}>
                {item.is_collected ? '已收集' : '待收集'}
              </span>
              {!item.is_collected && (
                <>
                  <button
                    className="btn"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => handleCollectChecklist(item.id)}
                  >
                    收集
                  </button>
                  <label className="btn" style={{ padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
                    上传
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => handleUploadMaterial(item.id, e.target.files[0])}
                    />
                  </label>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-title">进度记录</div>
        {progressRecords.length === 0 ? (
          <div className="empty-state"><h3>暂无进度记录</h3></div>
        ) : (
          <div className="timeline">
            {progressRecords.map((record) => (
              <div className="timeline-item" key={record.id}>
                <div className="timeline-time">{record.created_at || record.timestamp || '-'}</div>
                <div className="timeline-content">{record.action || record.description || '-'}</div>
                <div className="timeline-handler">{record.handler || record.operator || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">提交审查意见</div>
        <form onSubmit={handleSubmitOpinion}>
          <div className="form-group">
            <label>审查步骤</label>
            <input
              value={opinionForm.step}
              onChange={(e) => setOpinionForm({ ...opinionForm, step: e.target.value })}
              placeholder="请输入步骤编号"
            />
          </div>
          <div className="form-group">
            <label>审查意见</label>
            <textarea
              value={opinionForm.opinion}
              onChange={(e) => setOpinionForm({ ...opinionForm, opinion: e.target.value })}
              placeholder="请输入审查意见"
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>审查结果</label>
            <select
              value={opinionForm.result}
              onChange={(e) => setOpinionForm({ ...opinionForm, result: e.target.value })}
            >
              <option value="pass">通过</option>
              <option value="reject">退回</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '提交中...' : '提交意见'}
          </button>
        </form>
      </div>
    </div>
  )
}
