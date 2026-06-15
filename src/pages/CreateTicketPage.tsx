import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '@/store/ticket.store';
import { useAssetStore } from '@/store/asset.store';

export default function CreateTicketPage() {
  const [type, setType] = useState('request');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { createTicket } = useTicketStore();
  const { assets, fetchAssets } = useAssetStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssets({ limit: 50, keyword: assetSearch || undefined });
  }, [assetSearch, fetchAssets]);

  const toggleAsset = (id: number) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('请输入工单标题');
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createTicket({
        type,
        title,
        priority,
        description,
        assetIds: selectedAssetIds,
      });
      navigate(`/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>新建工单</h2>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">工单类型</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setType('request')}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                type === 'request'
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
              }`}
            >
              申请
            </button>
            <button
              type="button"
              onClick={() => setType('incident')}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                type === 'incident'
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
              }`}
            >
              故障
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="请输入工单标题"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">优先级</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select-field">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">紧急</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field min-h-[120px] resize-y"
            placeholder="请详细描述工单内容..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">关联资产</label>
          <div className="space-y-2">
            {selectedAssetIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {assets
                  .filter((a) => selectedAssetIds.includes(a.id))
                  .map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-sm text-[var(--color-primary)]"
                    >
                      {a.name}
                      <button type="button" onClick={() => toggleAsset(a.id)} className="hover:text-[var(--color-danger)]">
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowAssetPicker(!showAssetPicker)}
              className="btn-secondary text-sm"
            >
              {showAssetPicker ? '关闭资产选择' : '选择资产'}
            </button>
            {showAssetPicker && (
              <div className="border border-[var(--color-border)] rounded-lg p-3 max-h-48 overflow-y-auto">
                <input
                  className="input-field mb-2"
                  placeholder="搜索资产..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
                {assets.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(a.id)}
                      onChange={() => toggleAsset(a.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{a.name}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">({a.assetCode})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? '提交中...' : '提交工单'}
          </button>
          <button type="button" onClick={() => navigate('/tickets')} className="btn-secondary">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
