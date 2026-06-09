import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contractAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal, statusLabel, statusVariant, EmptyState, Pagination } from '../components/UI';

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');

  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '', contract_number: '', contract_type: '',
    party_a: '', party_b: '', effective_date: '', expiry_date: '', description: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    loadContracts();
  }, [offset, status, search]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await contractAPI.list({
        status: status || undefined,
        search: search || undefined,
        limit, offset,
      });
      setContracts(res.contracts);
      setTotal(res.total);
    } catch (err) {
      showToast('加载合同列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      showToast('请选择文件', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      Object.entries(uploadForm).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });

      await contractAPI.upload(formData);
      showToast('合同上传成功，AI正在处理中...', 'success');
      setShowUpload(false);
      setUploadFile(null);
      setUploadForm({ title: '', contract_number: '', contract_type: '', party_a: '', party_b: '', effective_date: '', expiry_date: '', description: '' });
      loadContracts();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || '上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setUploadFile(f);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📁 合同列表</div>
          {hasRole('admin', 'assistant') && (
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              + 上传合同
            </button>
          )}
        </div>

        <div className="filter-bar">
          <div className="form-group" style={{ minWidth: 200 }}>
            <input
              type="text"
              placeholder="搜索标题/编号/甲乙方..."
              value={search}
              onChange={e => { setSearch(e.target.value); setOffset(0); }}
            />
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <select value={status} onChange={e => { setStatus(e.target.value); setOffset(0); }}>
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="processing">处理中</option>
              <option value="reviewing">待复核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">加载中...</div>
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState
            icon="📄"
            text="暂无合同"
            hint={hasRole('admin', 'assistant') ? '点击"上传合同"按钮开始使用' : ''}
          />
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>合同标题</th>
                  <th>编号</th>
                  <th>类型</th>
                  <th>甲 / 乙方</th>
                  <th>状态</th>
                  <th>版本</th>
                  <th>上传者</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/contract/${c.id}`)}>
                    <td className="font-medium">{c.title}</td>
                    <td className="text-sm">{c.contract_number || '-'}</td>
                    <td className="text-sm">{c.contract_type || '-'}</td>
                    <td className="text-sm text-secondary">
                      <div>{c.party_a || '-'}</div>
                      <div className="text-muted">/ {c.party_b || '-'}</div>
                    </td>
                    <td>
                      <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                    </td>
                    <td>v{c.current_version}</td>
                    <td className="text-sm">{c.uploader?.full_name || '-'}</td>
                    <td className="text-sm text-muted">
                      {new Date(c.updated_at).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </div>

      <Modal
        open={showUpload}
        onClose={() => !uploading && setShowUpload(false)}
        title="上传新合同"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" disabled={uploading} onClick={() => setShowUpload(false)}>取消</button>
            <button className="btn btn-primary" disabled={uploading || !uploadFile} onClick={handleUpload}>
              {uploading ? '上传中...' : '确认上传'}
            </button>
          </>
        }
      >
        <div
          className="upload-zone mb-4"
          onClick={() => document.getElementById('fileInput')?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setUploadFile(f); }}
        >
          <input id="fileInput" type="file" style={{ display: 'none' }} accept=".txt,.md,.pdf,.docx" onChange={handleFileChange} />
          <span className="upload-icon">{uploadFile ? '📄' : '⬆️'}</span>
          {uploadFile ? (
            <div>
              <div className="font-medium">{uploadFile.name}</div>
              <div className="text-sm text-muted">
                {(uploadFile.size / 1024 / 1024).toFixed(2)} MB · 点击更换文件
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium mb-1">点击或拖拽文件到此处上传</div>
              <div className="text-sm text-muted">支持 .txt, .md, .pdf, .docx 格式，最大 10MB</div>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">合同标题 *</label>
            <input
              value={uploadForm.title}
              onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
              placeholder="例如：软件开发服务合同"
            />
          </div>
          <div className="form-group">
            <label className="form-label">合同编号</label>
            <input
              value={uploadForm.contract_number}
              onChange={e => setUploadForm(p => ({ ...p, contract_number: e.target.value }))}
              placeholder="自动生成或手动填写"
            />
          </div>
          <div className="form-group">
            <label className="form-label">合同类型</label>
            <select value={uploadForm.contract_type} onChange={e => setUploadForm(p => ({ ...p, contract_type: e.target.value }))}>
              <option value="">请选择</option>
              <option value="采购合同">采购合同</option>
              <option value="销售合同">销售合同</option>
              <option value="服务合同">服务合同</option>
              <option value="劳动合同">劳动合同</option>
              <option value="租赁合同">租赁合同</option>
              <option value="保密协议">保密协议</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">甲方</label>
            <input value={uploadForm.party_a} onChange={e => setUploadForm(p => ({ ...p, party_a: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">乙方</label>
            <input value={uploadForm.party_b} onChange={e => setUploadForm(p => ({ ...p, party_b: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">生效日期</label>
            <input type="date" value={uploadForm.effective_date} onChange={e => setUploadForm(p => ({ ...p, effective_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">到期日期</label>
            <input type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm(p => ({ ...p, expiry_date: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }} className="form-group">
            <label className="form-label">备注说明</label>
            <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractsPage;
