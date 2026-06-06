import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { apiFetch, apiFormData } from '~/utils/api';
import { useAuth } from '~/utils/auth';
import { saveOfflineIssue, isOnlineStatus } from '~/utils/offline';

const categories = [
  { value: 'shelf', label: '货架' },
  { value: 'price_tag', label: '价签' },
  { value: 'fire_exit', label: '消防通道' },
  { value: 'freezer_temp', label: '冷柜温度' },
  { value: 'cleanliness', label: '卫生' },
  { value: 'other', label: '其他' }
];

export default function NewIssue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    store_id: '',
    category: '',
    title: '',
    description: '',
    location: '',
    freezer_temperature: '',
    due_date: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    try {
      const data = await apiFetch('/api/stores');
      setStores(data);
    } catch (error) {
      console.error('Load stores error:', error);
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    
    if (!formData.store_id) newErrors.store_id = '请选择门店';
    if (!formData.category) newErrors.category = '请选择问题类型';
    if (!formData.title.trim()) newErrors.title = '请输入问题标题';
    if (formData.category === 'freezer_temp' && !formData.freezer_temperature) {
      newErrors.freezer_temperature = '请输入冷柜温度';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const issueData = {
        store_id: formData.store_id,
        category: formData.category,
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location || undefined,
        freezer_temperature: formData.freezer_temperature ? parseFloat(formData.freezer_temperature) : undefined,
        due_date: formData.due_date || undefined
      };

      if (!isOnlineStatus()) {
        await saveOfflineIssue(issueData);
        alert('当前处于离线状态，问题已保存，将在恢复网络后自动提交');
        navigate('/offline');
        return;
      }

      const result = await apiFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify(issueData)
      });

      if (selectedFiles && selectedFiles.length > 0) {
        const formDataPhotos = new FormData();
        formDataPhotos.append('photo_type', 'original');
        Array.from(selectedFiles).forEach(file => {
          formDataPhotos.append('photos', file);
        });
        
        await apiFormData(`/api/photos/${result.issue.id}`, formDataPhotos);
      }

      navigate('/issues');
    } catch (error) {
      if (!isOnlineStatus()) {
        const issueData = {
          store_id: formData.store_id,
          category: formData.category,
          title: formData.title,
          description: formData.description || undefined,
          location: formData.location || undefined,
          freezer_temperature: formData.freezer_temperature ? parseFloat(formData.freezer_temperature) : undefined,
          due_date: formData.due_date || undefined
        };
        await saveOfflineIssue(issueData);
        alert('网络异常，问题已保存到离线队列');
        navigate('/offline');
      } else {
        alert((error as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button 
          className="btn btn-default btn-sm" 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '12px' }}
        >
          ← 返回
        </button>
        <h2>提交巡检问题</h2>
        {!isOnlineStatus() && (
          <p className="text-muted" style={{ marginTop: '8px' }}>
            ⚠️ 当前处于离线状态，提交后将保存到本地，网络恢复后自动同步
          </p>
        )}
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">门店 <span className="overdue">*</span></label>
              <select 
                className="form-select"
                value={formData.store_id}
                onChange={e => setFormData({ ...formData, store_id: e.target.value })}
              >
                <option value="">请选择门店</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              {errors.store_id && <div className="error">{errors.store_id}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">问题类型 <span className="overdue">*</span></label>
              <select 
                className="form-select"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">请选择类型</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <div className="error">{errors.category}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">问题标题 <span className="overdue">*</span></label>
            <input 
              type="text"
              className="form-input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="简要描述问题"
            />
            {errors.title && <div className="error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">问题描述</label>
            <textarea 
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述问题情况（可选）"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">位置</label>
              <input 
                type="text"
                className="form-input"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="例如：食品区、收银台附近"
              />
            </div>

            {formData.category === 'freezer_temp' && (
              <div className="form-group">
                <label className="form-label">冷柜温度 (°C) <span className="overdue">*</span></label>
                <input 
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.freezer_temperature}
                  onChange={e => setFormData({ ...formData, freezer_temperature: e.target.value })}
                  placeholder="例如：-15.5"
                />
                {errors.freezer_temperature && <div className="error">{errors.freezer_temperature}</div>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">整改期限</label>
            <input 
              type="datetime-local"
              className="form-input"
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">现场照片</label>
            <input 
              type="file"
              multiple
              accept="image/*"
              className="form-input"
              onChange={e => setSelectedFiles(e.target.files)}
            />
            <p className="text-sm text-muted" style={{ marginTop: '4px' }}>
              支持多选，单张不超过 10MB（离线模式下暂不支持上传照片）
            </p>
          </div>

          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
            <button 
              type="button"
              className="btn btn-default"
              onClick={() => navigate(-1)}
            >
              取消
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? '提交中...' : '提交问题'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
