import { useEffect, useState } from 'react';
import { apiFetch } from '~/utils/api';
import { 
  getOfflineSubmissions, 
  syncPendingSubmissions, 
  deleteOfflineSubmission,
  isOnlineStatus 
} from '~/utils/offline';

const categoryLabels: Record<string, string> = {
  shelf: '货架',
  price_tag: '价签',
  fire_exit: '消防通道',
  freezer_temp: '冷柜温度',
  cleanliness: '卫生',
  other: '其他'
};

const statusLabels: Record<string, string> = {
  pending: '待同步',
  syncing: '同步中',
  failed: '同步失败'
};

export default function OfflinePage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [serverSubmissions, setServerSubmissions] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(isOnlineStatus());

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setOnline(isOnlineStatus());
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function loadData() {
    const local = getOfflineSubmissions();
    setSubmissions(local);
    loadServerSubmissions();
  }

  async function loadServerSubmissions() {
    if (!isOnlineStatus()) return;
    try {
      const data = await apiFetch('/api/offline/pending');
      setServerSubmissions(data);
    } catch (error) {
      console.error('Load server submissions error:', error);
    }
  }

  async function handleSync() {
    if (!online) {
      alert('当前处于离线状态，无法同步');
      return;
    }
    
    setSyncing(true);
    try {
      const count = await syncPendingSubmissions();
      alert(`成功同步 ${count} 条数据`);
      loadData();
    } catch (error) {
      alert('同步失败：' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  function handleDelete(id: string) {
    if (confirm('确定要删除这条离线记录吗？')) {
      deleteOfflineSubmission(id);
      loadData();
    }
  }

  async function handleRetryServer(id: string) {
    try {
      await apiFetch(`/api/offline/${id}/retry`, { method: 'POST' });
      alert('重试成功');
      loadData();
    } catch (error) {
      alert('重试失败：' + (error as Error).message);
    }
  }

  async function handleDeleteServer(id: string) {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await apiFetch(`/api/offline/${id}`, { method: 'DELETE' });
        loadData();
      } catch (error) {
        alert('删除失败：' + (error as Error).message);
      }
    }
  }

  const allSubmissions = [
    ...submissions.map(s => ({ ...s, source: 'local' })),
    ...serverSubmissions.map(s => ({ ...s, source: 'server' }))
  ].sort((a, b) => b.created_at - a.created_at);

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h2>离线任务</h2>
          <p className="text-muted">
            {online ? '🟢 当前在线' : '🔴 当前离线'} · 
            本地待同步 {submissions.filter(s => s.status === 'pending' || s.status === 'failed').length} 条
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-default"
            onClick={loadData}
          >
            刷新
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncing || !online || submissions.length === 0}
          >
            {syncing ? '同步中...' : '立即同步'}
          </button>
        </div>
      </div>

      {submissions.length === 0 && serverSubmissions.length === 0 ? (
        <div className="card">
          <div className="text-center" style={{ padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ marginBottom: '8px' }}>暂无离线任务</h3>
            <p className="text-muted">在离线状态下提交的问题会显示在这里</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>类型</th>
                <th>数据</th>
                <th>状态</th>
                <th>重试次数</th>
                <th>创建时间</th>
                <th>来源</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {allSubmissions.map(submission => (
                <tr key={submission.id}>
                  <td>
                    {submission.type === 'issue' ? '问题提交' : submission.type}
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: '500' }}>
                      {submission.data?.title || submission.payload?.data?.title}
                    </div>
                    <div className="text-sm text-muted">
                      {submission.data?.category 
                        ? categoryLabels[submission.data.category] 
                        : submission.payload?.data?.category
                          ? categoryLabels[submission.payload.data.category]
                          : ''}
                    </div>
                    {submission.error && (
                      <div className="text-sm overdue" style={{ marginTop: '4px' }}>
                        错误：{submission.error}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      submission.status === 'pending' ? 'status-pending_confirm' :
                      submission.status === 'syncing' ? 'status-pending_rectify' :
                      'status-false_positive'
                    }`}>
                      {statusLabels[submission.status] || submission.status}
                    </span>
                  </td>
                  <td>{submission.retry_count || 0}</td>
                  <td className="text-sm text-muted">
                    {new Date(submission.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <span className="text-sm">
                      {submission.source === 'local' ? '本地存储' : '服务器队列'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {submission.source === 'local' ? (
                        <>
                          <button 
                            className="btn btn-default btn-sm"
                            onClick={handleSync}
                            disabled={!online}
                          >
                            同步
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(submission.id)}
                          >
                            删除
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn btn-default btn-sm"
                            onClick={() => handleRetryServer(submission.id)}
                          >
                            重试
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteServer(submission.id)}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
