import { useState, useEffect } from 'react';
import { getConfigChangelog } from '@/api/configs';
import type { ConfigChangelog } from '@/types';

export default function ConfigChangelog() {
  const [logs, setLogs] = useState<ConfigChangelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {};
        if (filterType) params.config_type = filterType;
        const res = await getConfigChangelog(params);
        setLogs(res.data.results);
      } finally {
        setLoading(false);
      }
    })();
  }, [filterType]);

  const configTypes = [...new Set(logs.map((l) => l.config_type))];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">变更日志</h1>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">全部类型</option>
          {configTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无变更记录</div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-0">
            {logs
              .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
              .map((log) => (
                <div key={log.id} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#1e293b' }}>
                    {log.changed_by_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.changed_by_name}</span>
                      {' 修改了 '}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{log.config_type}</span>
                      {' 的 '}
                      <span className="font-medium">{log.field_name}</span>
                      {': '}
                      <span className="text-red-500 line-through">{log.old_value}</span>
                      {' → '}
                      <span className="text-emerald-600 font-medium">{log.new_value}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(log.changed_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
