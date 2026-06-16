import { useState, useEffect } from 'react';
import { api } from '~/utils/api';

export default function Stats() {
  const [activeTab, setActiveTab] = useState('trainer');
  const [trainerStats, setTrainerStats] = useState<any[]>([]);
  const [dateStats, setDateStats] = useState<any[]>([]);
  const [missingFieldStats, setMissingFieldStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    granularity: 'day',
  });

  useEffect(() => {
    loadStats();
  }, [activeTab]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (activeTab === 'date') params.granularity = filters.granularity;

      if (activeTab === 'trainer') {
        const result: any = await api.get('/stats/adoption/trainer', { params });
        setTrainerStats(result.data || []);
      } else if (activeTab === 'date') {
        const result: any = await api.get('/stats/adoption/date', { params });
        setDateStats(result.data || []);
      } else if (activeTab === 'missing') {
        const result: any = await api.get('/stats/adoption/missing-fields', { params });
        setMissingFieldStats(result.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    loadStats();
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-item">
          <label>开始日期：</label>
          <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
        </div>
        <div className="filter-item">
          <label>结束日期：</label>
          <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
        </div>
        {activeTab === 'date' && (
          <div className="filter-item">
            <label>粒度：</label>
            <select value={filters.granularity} onChange={(e) => handleFilterChange('granularity', e.target.value)}>
              <option value="day">按天</option>
              <option value="week">按周</option>
              <option value="month">按月</option>
            </select>
          </div>
        )}
        <button className="btn btn-primary" onClick={handleSearch}>查询</button>
      </div>

      <div className="card">
        <div className="tabs" style={{ padding: '0 1.25rem', margin: 0 }}>
          <div
            className={`tab ${activeTab === 'trainer' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainer')}
          >
            按训练师统计
          </div>
          <div
            className={`tab ${activeTab === 'date' ? 'active' : ''}`}
            onClick={() => setActiveTab('date')}
          >
            按日期统计
          </div>
          <div
            className={`tab ${activeTab === 'missing' ? 'active' : ''}`}
            onClick={() => setActiveTab('missing')}
          >
            资料缺失分析
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : activeTab === 'trainer' ? (
            <TrainerStats data={trainerStats} />
          ) : activeTab === 'date' ? (
            <DateStats data={dateStats} />
          ) : (
            <MissingFieldStats data={missingFieldStats} />
          )}
        </div>
      </div>
    </div>
  );
}

function TrainerStats({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-text">暂无数据</div>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map((item, index) => (
          <div key={index} className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span className="font-medium">{item.trainerName}</span>
                <span className="text-sm text-muted ml-2">共 {item.total} 个申请</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="text-sm">
                  <span className="text-muted">通过率：</span>
                  <span className="text-success font-medium">{item.approvalRate}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted">缺失字段：</span>
                  <span className="text-warning font-medium">{item.missingFieldCount}次</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <StatBadge label="已提交" count={item.submitted + item.under_review} color="warning" />
              <StatBadge label="已通过" count={item.approved} color="success" />
              <StatBadge label="已拒绝" count={item.rejected} color="danger" />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                <div
                  style={{ width: `${((item.approved || 0) / maxTotal) * 100}%`, backgroundColor: '#10b981' }}
                  title={`通过 ${item.approved}`}
                />
                <div
                  style={{ width: `${((item.rejected || 0) / maxTotal) * 100}%`, backgroundColor: '#ef4444' }}
                  title={`拒绝 ${item.rejected}`}
                />
                <div
                  style={{ width: `${(((item.submitted || 0) + (item.under_review || 0)) / maxTotal) * 100}%`, backgroundColor: '#f59e0b' }}
                  title={`待处理 ${(item.submitted || 0) + (item.under_review || 0)}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DateStats({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📅</div>
        <div className="empty-state-text">暂无数据</div>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div>
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <LegendItem color="#4f46e5" label="总数" />
          <LegendItem color="#10b981" label="通过" />
          <LegendItem color="#f59e0b" label="待处理" />
          <LegendItem color="#ef4444" label="拒绝" />
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 100, fontSize: '0.875rem', color: '#6b7280', flexShrink: 0 }}>
              {item.date}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 24 }}>
              <div style={{ display: 'flex', height: '100%', width: '100%', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{ width: `${(item.approved / maxTotal) * 100}%`, backgroundColor: '#10b981' }}
                />
                <div
                  style={{ width: `${(item.pending / maxTotal) * 100}%`, backgroundColor: '#f59e0b' }}
                />
                <div
                  style={{ width: `${(item.rejected / maxTotal) * 100}%`, backgroundColor: '#ef4444' }}
                />
              </div>
            </div>
            <div style={{ width: 60, textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>
              {item.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissingFieldStats({ data }: { data: any }) {
  if (!data || !data.fields || data.fields.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-text">暂无数据</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.fields.map((f: any) => f.count), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }} className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{data.totalApplications}</div>
          <div className="stat-label">申请总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-warning">{data.totalWithMissing}</div>
          <div className="stat-label">资料不完整</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.missingRate}%</div>
          <div className="stat-label">缺失率</div>
        </div>
      </div>

      <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>缺失字段排行</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {data.fields.map((field: any, index: number) => (
          <div key={index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span className="font-medium text-sm">{field.label}</span>
              <span className="text-sm text-muted">
                {field.count} 次 ({field.percentage}%)
              </span>
            </div>
            <div style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(field.count / maxCount) * 100}%`,
                  height: '100%',
                  backgroundColor: index < 3 ? '#ef4444' : index < 6 ? '#f59e0b' : '#3b82f6',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    primary: 'badge-primary',
    info: 'badge-info',
  };
  
  return (
    <span className={`badge ${colorClasses[color] || ''}`} style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
      {label}：{count}
    </span>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 12, height: 12, backgroundColor: color, borderRadius: 2 }} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
