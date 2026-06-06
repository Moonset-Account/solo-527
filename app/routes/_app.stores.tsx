import { useEffect, useState } from 'react';
import { apiFetch } from '~/utils/api';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    try {
      const data = await apiFetch('/api/stores');
      setStores(data);
    } catch (error) {
      console.error('Load stores error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2>门店列表</h2>
        <p className="text-muted">查看所有门店及其问题统计</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : stores.length === 0 ? (
          <div className="text-muted text-center" style={{ padding: '40px' }}>
            暂无门店数据
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>门店编码</th>
                <th>门店名称</th>
                <th>所属区域</th>
                <th>地址</th>
                <th>问题总数</th>
                <th>待整改</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr key={store.id}>
                  <td>{store.store_code}</td>
                  <td>{store.name}</td>
                  <td>{store.region_name}</td>
                  <td>{store.address}</td>
                  <td>{store.issue_count || 0}</td>
                  <td>
                    <span className={store.pending_issue_count > 0 ? 'overdue' : ''}>
                      {store.pending_issue_count || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
