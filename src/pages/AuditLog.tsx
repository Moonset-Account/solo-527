import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { auditLogApi } from '@/utils/api';
import type { AuditLog } from '../../shared/types';

const entityTypes = ['', 'member', 'coach', 'package', 'appointment', 'freeze', 'group_class', 'body_test', 'schedule', 'message'];
const entityLabels: Record<string, string> = {
  '': '全部类型', member: '会员', coach: '教练', package: '套餐', appointment: '预约',
  freeze: '冻结', group_class: '团课', body_test: '体测', schedule: '排班', message: '消息',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: Record<string, any> = {};
      if (entityType) filters.entity_type = entityType;
      if (userId) filters.user_id = Number(userId);
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      const data = await auditLogApi.list(filters);
      setLogs(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { fetchLogs(); };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="input-field w-auto">
            {entityTypes.map((t) => <option key={t} value={t}>{entityLabels[t]}</option>)}
          </select>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="用户ID" type="number" className="input-field w-32" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field w-auto" />
          <span className="text-gray-400">至</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field w-auto" />
          <button onClick={handleSearch} className="btn-primary flex items-center gap-1"><Search className="w-4 h-4" />查询</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">用户ID</th>
                <th className="px-4 py-3">实体</th>
                <th className="px-4 py-3">实体ID</th>
                <th className="px-4 py-3">操作</th>
                <th className="px-4 py-3">旧值</th>
                <th className="px-4 py-3">新值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{log.created_at?.slice(0, 19).replace('T', ' ')}</td>
                  <td className="px-4 py-3 text-sm">{log.user_id || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.entity_type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.entity_id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-40 truncate" title={log.old_value || ''}>{log.old_value || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-40 truncate" title={log.new_value || ''}>{log.new_value || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">暂无日志</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
