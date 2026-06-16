import { useState, useEffect } from 'react';
import { api } from '~/utils/api';
import { reminderCategoryLabels, reminderLevelLabels, formatDateTime } from '~/utils/formatters';

export default function SafetyReminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    level: '',
  });

  useEffect(() => {
    loadReminders();
  }, [filters]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const params: any = { isActive: 'true' };
      if (filters.category) params.category = filters.category;
      if (filters.level) params.level = filters.level;
      
      const result: any = await api.get('/safety', { params, requireAuth: false });
      setReminders(result.data || []);
    } catch (error) {
      console.error('Load safety reminders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const levelColors: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    danger: 'danger',
  };

  const levelIcons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '🚨',
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item">
          <label>分类：</label>
          <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <option value="">全部</option>
            <option value="health">健康</option>
            <option value="safety">安全</option>
            <option value="feeding">喂养</option>
            <option value="behavior">行为</option>
            <option value="legal">法规</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className="filter-item">
          <label>级别：</label>
          <select value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
            <option value="">全部</option>
            <option value="info">提示</option>
            <option value="warning">警告</option>
            <option value="danger">危险</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card card-body">加载中...</div>
      ) : reminders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-text">暂无安全提醒</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reminders.map((reminder) => (
            <div key={reminder._id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{levelIcons[reminder.level]}</span>
                  <div>
                    <h4 style={{ fontSize: '1rem', margin: 0 }}>{reminder.title}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className={`badge badge-${levelColors[reminder.level]}`}>
                        {reminderLevelLabels[reminder.level]}
                      </span>
                      <span className="badge">{reminderCategoryLabels[reminder.category]}</span>
                      {reminder.isPinned && <span className="badge badge-warning">置顶</span>}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted">
                  {formatDateTime(reminder.createdAt)}
                </div>
              </div>
              <div className="card-body">
                <p className="text-sm" style={{ lineHeight: 1.7 }}>
                  {reminder.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
