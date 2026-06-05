'use client';

import { useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useOfflineStore } from '@/store/offline';

export default function OfflinePage() {
  const { 
    pendingActions, 
    isOnline, 
    syncStatus, 
    syncProgress,
    error,
    init,
    syncPendingActions,
    clearSyncedActions,
    getPendingCount
  } = useOfflineStore();

  useEffect(() => {
    init();
  }, [init]);

  const pendingCount = getPendingCount();

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      SCORE_UPDATE: '比分更新',
      CHECKIN: '签到记录',
      PHOTO_UPLOAD: '照片上传',
      PLAYER_STAT: '球员数据',
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-info animate-spin" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-6 h-6 text-success" />
            ) : (
              <WifiOff className="w-6 h-6 text-danger" />
            )}
            离线数据中心
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {isOnline ? '网络已连接' : '当前处于离线模式'}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {isOnline ? '在线' : '离线'}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold font-display text-primary">{pendingCount}</div>
            <div className="text-xs text-text-secondary mt-1">待同步</div>
          </div>
          <div className="p-4 bg-success/5 rounded-lg">
            <div className="text-2xl font-bold font-display text-success">
              {pendingActions.filter(a => a.status === 'synced').length}
            </div>
            <div className="text-xs text-text-secondary mt-1">已同步</div>
          </div>
          <div className="p-4 bg-danger/5 rounded-lg">
            <div className="text-2xl font-bold font-display text-danger">
              {pendingActions.filter(a => a.status === 'failed').length}
            </div>
            <div className="text-xs text-text-secondary mt-1">失败</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={syncPendingActions}
            disabled={!isOnline || syncStatus === 'syncing' || pendingCount === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
          >
            <Upload className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            {syncStatus === 'syncing' ? '同步中...' : '立即同步'}
          </button>
          <button
            onClick={clearSyncedActions}
            className="inline-flex items-center justify-center gap-2 bg-surface-hover hover:bg-border text-text-secondary py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" />
            清除
          </button>
        </div>

        {syncStatus === 'syncing' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
              <span>同步进度</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-text-primary">待同步操作</h2>
        </div>
        
        {pendingActions.length > 0 ? (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {pendingActions.map((action) => (
              <div key={action.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  {getStatusIcon(action.status)}
                  <div>
                    <div className="font-medium text-text-primary text-sm">
                      {getActionLabel(action.type)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(action.createdAt).toLocaleString('zh-CN')}
                      {action.retryCount > 0 && ` · 重试 ${action.retryCount} 次`}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  action.status === 'pending' ? 'bg-warning/10 text-warning' :
                  action.status === 'synced' ? 'bg-success/10 text-success' :
                  'bg-danger/10 text-danger'
                }`}>
                  {action.status === 'pending' ? '待同步' :
                   action.status === 'synced' ? '已同步' :
                   action.status === 'syncing' ? '同步中' : '失败'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">暂无待同步数据</p>
            <p className="text-xs text-text-muted mt-1">所有数据已同步至服务器</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-secondary/5 rounded-xl border border-secondary/10">
        <h3 className="font-bold text-text-primary text-sm mb-2">离线使用说明</h3>
        <ul className="text-xs text-text-secondary space-y-1.5">
          <li>• 离线时录入的数据会自动保存在本地</li>
          <li>• 网络恢复后系统会自动尝试同步</li>
          <li>• 同步失败会自动重试，最多5次</li>
          <li>• 超过重试次数的数据需要手动点击同步</li>
        </ul>
      </div>
    </div>
  );
}
