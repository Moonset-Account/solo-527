import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useAssetStore } from '@/store/asset.store';
import StatusBadge from '@/components/StatusBadge';

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAsset, loading, fetchAsset } = useAssetStore();

  useEffect(() => {
    if (id) fetchAsset(Number(id));
  }, [id, fetchAsset]);

  if (loading || !currentAsset) {
    return <div className="text-center py-20 text-[var(--color-text-secondary)]">加载中...</div>;
  }

  const asset = currentAsset;
  const typeLabels: Record<string, string> = { server: '服务器', network: '网络', software: '软件', account: '账号' };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{asset.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={asset.status} />
              <span className="text-sm text-[var(--color-text-secondary)]">{typeLabels[asset.type] || asset.type}</span>
            </div>
          </div>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" />
            编辑
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-[var(--color-text-secondary)]">资产编码：</span>{asset.assetCode}</div>
          <div><span className="text-[var(--color-text-secondary)]">位置：</span>{asset.location || '-'}</div>
          <div><span className="text-[var(--color-text-secondary)]">创建时间：</span>{new Date(asset.createdAt).toLocaleString('zh-CN')}</div>
          <div><span className="text-[var(--color-text-secondary)]">更新时间：</span>{new Date(asset.updatedAt).toLocaleString('zh-CN')}</div>
          <div className="col-span-3"><span className="text-[var(--color-text-secondary)]">描述：</span>{asset.description || '暂无'}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>配置项</h3>
        {asset.configItems && asset.configItems.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">键</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">值</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">环境</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--color-text-secondary)]">描述</th>
              </tr>
            </thead>
            <tbody>
              {asset.configItems.map((ci) => (
                <tr key={ci.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-mono text-sm">{ci.key}</td>
                  <td className="px-4 py-3 font-mono text-sm">{ci.value}</td>
                  <td className="px-4 py-3">{ci.environment}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{ci.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] py-4">暂无配置项</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>关联工单</h3>
        {asset.tickets && asset.tickets.length > 0 ? (
          <div className="space-y-2">
            {asset.tickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/tickets/${t.id}`)}
              >
                <span className="text-sm text-[var(--color-primary)] hover:underline">#{t.id} {t.title}</span>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] py-4">暂无关联工单</p>
        )}
      </div>
    </div>
  );
}
