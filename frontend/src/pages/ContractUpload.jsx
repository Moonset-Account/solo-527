import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { contractApi } from '../api'

export default function ContractUpload() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    contract_number: '',
    counterparty: '',
    contract_type: '',
    amount: '',
    description: '',
  })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFileChange(e) {
    setFile(e.target.files[0] || null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.contract_number || !file) {
      setError('请填写必填项：标题、合同编号、合同文件')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('contract_number', form.contract_number)
      formData.append('file', file)
      if (form.counterparty) formData.append('counterparty', form.counterparty)
      if (form.contract_type) formData.append('contract_type', form.contract_type)
      if (form.amount) formData.append('amount', form.amount)
      if (form.description) formData.append('description', form.description)

      await contractApi.create(formData)
      navigate('/contracts')
    } catch (err) {
      setError(err.message || '上传失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>上传合同</h1>
        <p>上传新合同文件并填写基本信息</p>
      </div>

      <div className="card">
        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>合同编号 *</label>
            <input
              name="contract_number"
              value={form.contract_number}
              onChange={handleChange}
              placeholder="请输入合同编号"
            />
          </div>

          <div className="form-group">
            <label>标题 *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="请输入合同标题"
            />
          </div>

          <div className="form-group">
            <label>合同文件 *</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </div>

          <div className="form-group">
            <label>对方单位</label>
            <input
              name="counterparty"
              value={form.counterparty}
              onChange={handleChange}
              placeholder="请输入对方单位名称"
            />
          </div>

          <div className="form-group">
            <label>合同类型</label>
            <select name="contract_type" value={form.contract_type} onChange={handleChange}>
              <option value="">请选择</option>
              <option value="sales">销售合同</option>
              <option value="purchase">采购合同</option>
              <option value="service">服务合同</option>
              <option value="lease">租赁合同</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div className="form-group">
            <label>金额</label>
            <input
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              placeholder="请输入合同金额"
            />
          </div>

          <div className="form-group">
            <label>描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="请输入合同描述"
              rows={4}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/contracts')}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
