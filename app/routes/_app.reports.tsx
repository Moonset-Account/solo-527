import { useEffect, useState } from 'react';
import { apiFetch } from '~/utils/api';
import { useAuth } from '~/utils/auth';

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  pending_rectify: '待整改',
  reviewed: '已复查',
  closed: '已关闭',
  false_positive: '误报'
};

const categoryLabels: Record<string, string> = {
  shelf: '货架',
  price_tag: '价签',
  fire_exit: '消防通道',
  freezer_temp: '冷柜温度',
  cleanliness: '卫生',
  other: '其他'
};

export default function Reports() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    store_id: '',
    category: '',
    status: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadReport();
  }, [filters]);

  async function loadStores() {
    try {
      const data = await apiFetch('/api/stores');
      setStores(data);
    } catch (error) {
      console.error('Load stores error:', error);
    }
  }

  async function loadReport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      
      const data = await apiFetch(`/api/reports/overview?${params.toString()}`);
      setReportData(data);
    } catch (error) {
      console.error('Load report error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams(filters as any);
      params.set('format', 'csv');
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `巡检报表_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h2>区域报表</h2>
          <p className="text-muted">查看区域内门店巡检数据统计</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? '导出中...' : '📥 导出报表'}
        </button>
      </div>

      <div className="card mb-6">
        <div className="filter-bar" style={{ padding: 0, marginBottom: 0 }}>
          <div className="filter-item">
            <label className="form-label text-sm">开始日期</label>
            <input 
              type="date"
              className="form-input"
              value={filters.start_date}
              onChange={e => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label className="form-label text-sm">结束日期</label>
            <input 
              type="date"
              className="form-input"
              value={filters.end_date}
              onChange={e => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label className="form-label text-sm">门店</label>
            <select 
              className="form-select"
              value={filters.store_id}
              onChange={e => setFilters({ ...filters, store_id: e.target.value })}
            >
              <option value="">全部门店</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="form-label text-sm">问题类型</label>
            <select 
              className="form-select"
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">全部类型</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          总体概览
        </div>
        <div 
          className={`tab ${activeTab === 'byStore' ? 'active' : ''}`}
          onClick={() => setActiveTab('byStore')}
        >
          门店排名
        </div>
        <div 
          className={`tab ${activeTab === 'byCategory' ? 'active' : ''}`}
          onClick={() => setActiveTab('byCategory')}
        >
          类型分析
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : !reportData ? (
        <div className="text-muted text-center" style={{ padding: '40px' }}>
          暂无数据
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{reportData.summary?.total_issues || 0}</div>
                  <div className="stat-label">问题总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#ff4d4f' }}>
                    {reportData.summary?.total_overdue || 0}
                  </div>
                  <div className="stat-label">逾期总数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: '#fa8c16' }}>
                    {reportData.summary?.overall_overdue_rate || 0}%
                  </div>
                  <div className="stat-label">整体逾期率</div>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4">按状态分布</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {reportData.by_status?.map((item: any) => (
                    <div key={item.status} style={{
                      padding: '16px',
                      background: '#fafafa',
                      borderRadius: '8px',
                      minWidth: '120px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                        {item.count}
                      </div>
                      <div className="text-sm text-muted">
                        {statusLabels[item.status] || item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'byStore' && (
            <div className="card">
              <h3 className="mb-4">门店逾期率排名</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>门店</th>
                    <th>问题总数</th>
                    <th>待整改</th>
                    <th>逾期数</th>
                    <th>逾期率</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.by_store?.map((item: any, index: number) => (
                    <tr key={item.id}>
                      <td>
                        {index + 1 <= 3 ? (
                          <span style={{ 
                            color: index === 0 ? '#faad14' : index === 1 ? '#8c8c8c' : '#d46b08',
                            fontWeight: 'bold'
                          }}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {index + 1}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.total_issues}</td>
                      <td>{item.pending_count}</td>
                      <td className={item.overdue_count > 0 ? 'overdue' : ''}>
                        {item.overdue_count}
                      </td>
                      <td>
                        <span style={{ 
                          color: parseFloat(item.overdue_rate) > 50 ? '#ff4d4f' : 
                                 parseFloat(item.overdue_rate) > 20 ? '#fa8c16' : '#52c41a',
                          fontWeight: '500'
                        }}>
                          {item.overdue_rate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'byCategory' && (
            <div className="card">
              <h3 className="mb-4">问题类型分析</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>问题类型</th>
                    <th>问题数</th>
                    <th>逾期数</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.by_category?.map((item: any) => (
                    <tr key={item.category}>
                      <td>{categoryLabels[item.category] || item.category}</td>
                      <td>{item.count}</td>
                      <td className={item.overdue_count > 0 ? 'overdue' : ''}>
                        {item.overdue_count}
                      </td>
                      <td>
                        {reportData.summary?.total_issues > 0 
                          ? ((item.count / reportData.summary.total_issues) * 100).toFixed(1) 
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
