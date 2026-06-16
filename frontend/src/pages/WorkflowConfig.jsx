import { useState, useEffect } from 'react'
import { workflowApi } from '../api'

const EMPTY_STEP = { order: 1, name: '', reviewer_role: '', is_required: true }
const EMPTY_FORM = {
  name: '',
  description: '',
  contract_type: '',
  is_active: true,
  steps: [{ ...EMPTY_STEP }],
}

export default function WorkflowConfig() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  async function fetchWorkflows() {
    setLoading(true)
    try {
      const res = await workflowApi.list()
      setWorkflows(res.data.results || res.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  function openCreateForm() {
    setForm({ ...EMPTY_FORM, steps: [{ ...EMPTY_STEP }] })
    setEditingId(null)
    setShowForm(true)
  }

  function openEditForm(wf) {
    setForm({
      name: wf.name || '',
      description: wf.description || '',
      contract_type: wf.contract_type || '',
      is_active: wf.is_active !== false,
      steps: (wf.steps || []).map((s) => ({ ...s })),
    })
    setEditingId(wf.id)
    setShowForm(true)
  }

  function handleFormChange(field, value) {
    setForm({ ...form, [field]: value })
  }

  function handleStepChange(index, field, value) {
    const steps = [...form.steps]
    steps[index] = { ...steps[index], [field]: value }
    setForm({ ...form, steps })
  }

  function addStep() {
    setForm({
      ...form,
      steps: [...form.steps, { ...EMPTY_STEP, order: form.steps.length + 1 }],
    })
  }

  function removeStep(index) {
    const steps = form.steps.filter((_, i) => i !== index)
    steps.forEach((s, i) => { s.order = i + 1 })
    setForm({ ...form, steps })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) {
      alert('请填写工作流名称')
      return
    }
    setSubmitting(true)
    try {
      if (editingId) {
        await workflowApi.update(editingId, form)
      } else {
        await workflowApi.create(form)
      }
      setShowForm(false)
      fetchWorkflows()
    } catch (err) {
      alert(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此工作流？')) return
    try {
      await workflowApi.delete(id)
      fetchWorkflows()
    } catch (err) {
      alert(err.message || '删除失败')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>工作流配置</h1>
        <p>管理合同审查工作流及步骤</p>
      </div>

      <div className="toolbar">
        <div />
        <button className="btn btn-primary" onClick={openCreateForm}>
          新建工作流
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">{editingId ? '编辑工作流' : '新建工作流'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>名称 *</label>
              <input
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="请输入工作流名称"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="请输入描述"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>合同类型</label>
              <select
                value={form.contract_type}
                onChange={(e) => handleFormChange('contract_type', e.target.value)}
              >
                <option value="">请选择</option>
                <option value="sales">销售合同</option>
                <option value="purchase">采购合同</option>
                <option value="service">服务合同</option>
                <option value="lease">租赁合同</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => handleFormChange('is_active', e.target.checked)}
                />
                启用
              </label>
            </div>

            <div className="card-title" style={{ marginTop: 12 }}>审查步骤</div>
            {form.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 80px 40px',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  type="number"
                  value={step.order}
                  onChange={(e) => handleStepChange(idx, 'order', parseInt(e.target.value) || 1)}
                  placeholder="序号"
                />
                <input
                  value={step.name}
                  onChange={(e) => handleStepChange(idx, 'name', e.target.value)}
                  placeholder="步骤名称"
                />
                <input
                  value={step.reviewer_role}
                  onChange={(e) => handleStepChange(idx, 'reviewer_role', e.target.value)}
                  placeholder="审查角色"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={step.is_required}
                    onChange={(e) => handleStepChange(idx, 'is_required', e.target.checked)}
                  />
                  必需
                </label>
                {form.steps.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    onClick={() => removeStep(idx)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn" onClick={addStep} style={{ marginBottom: 20 }}>
              + 添加步骤
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading-spinner">加载中...</div>
        ) : workflows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚙️</div>
            <h3>暂无工作流</h3>
            <p>点击"新建工作流"创建第一个工作流</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>合同类型</th>
                  <th>状态</th>
                  <th>步骤数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => (
                  <tr key={wf.id}>
                    <td>{wf.name}</td>
                    <td>{wf.contract_type || '-'}</td>
                    <td>
                      <span className={`badge ${wf.is_active ? 'badge-success' : 'badge-default'}`}>
                        {wf.is_active ? '启用' : '停用'}
                      </span>
                    </td>
                    <td>{(wf.steps || []).length}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => openEditForm(wf)}
                        >
                          编辑
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => handleDelete(wf.id)}
                        >
                          删除
                        </button>
                      </div>
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
