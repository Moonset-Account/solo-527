import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, Tabs, Empty, PullToRefresh, Tag, Button } from 'antd-mobile';
import { AddOutline, FilterOutline } from 'antd-mobile-icons';
import { Contract, ContractStatus } from '../../types';
import { contractApi } from '../../api';
import { contractStatusMap, contractTypeMap, urgencyMap, formatDate } from '../../store';

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'approving', label: '审批中' },
  { key: 'approved', label: '已批准' },
  { key: 'rejected', label: '已退回' },
  { key: 'signed', label: '已签署' },
  { key: 'archived', label: '已归档' },
];

export default function MobileContractsPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [materialsFilter, setMaterialsFilter] = useState<string>('all');
  const [list, setList] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (reset = false) => {
    const curPage = reset ? 1 : page;
    setLoading(true);
    try {
      const params: any = {
        page: curPage,
        pageSize: 20,
        keyword: keyword || undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      if (activeStatus !== 'all') params.status = activeStatus;
      if (materialsFilter !== 'all') params.materialsComplete = materialsFilter === 'complete';
      if (materialsFilter === 'rejection') params.hasRejectionReason = true;

      const res = await contractApi.query(params) as any;
      setList(reset ? res.list || [] : [...list, ...(res.list || [])]);
      setTotal(res.total || 0);
      if (reset) setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    setPage(1);
  }, [activeStatus, materialsFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingBottom: 12 }}>
      <div className="mobile-search-bar">
        <SearchBar
          placeholder="搜索编号、标题、甲乙方"
          value={keyword}
          onChange={setKeyword}
          onSearch={() => loadData(true)}
          clearable
        />
      </div>

      <Tabs
        activeKey={activeStatus}
        onChange={setActiveStatus}
        style={{ position: 'sticky', top: 56, zIndex: 10, background: 'white' }}
      >
        {statusFilters.map((f) => (
          <Tabs.Tab title={f.label} key={f.key} />
        ))}
      </Tabs>

      <div className="mobile-filter-bar">
        {[
          { key: 'all', label: '全部' },
          { key: 'complete', label: '材料完整' },
          { key: 'incomplete', label: '材料不完整' },
          { key: 'rejection', label: '含退回原因' },
        ].map((f) => (
          <div
            key={f.key}
            className={`mobile-filter-chip ${materialsFilter === f.key ? 'active' : ''}`}
            onClick={() => setMaterialsFilter(f.key)}
          >
            {f.label}
          </div>
        ))}
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ padding: 12 }}>
          {list.length === 0 && !loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Empty
                description="暂无合同"
                image={null}
              />
              <Button color="primary" size="small" onClick={() => {}}>
                <AddOutline /> 新建合同
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map((c) => {
                const status = contractStatusMap[c.status];
                const urgency = urgencyMap[c.urgency];
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/m/progress/${c.id}`)}
                    className="mobile-card"
                    style={{ marginBottom: 0 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                          {c.contractNo} · {contractTypeMap[c.contractType]}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', lineHeight: 1.4 }}>
                          {c.title}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Tag round color={urgency.color} style={{ margin: 0 }}>{urgency.label}</Tag>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 10, display: 'flex', gap: 12 }}>
                      <span>甲方：{c.partyA}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 10, display: 'flex', gap: 12 }}>
                      <span>乙方：{c.partyB}</span>
                    </div>

                    {c.rejectionReason && (
                      <div style={{
                        background: '#fff1f0', border: '1px solid #ffa39e',
                        padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 12,
                        color: '#cf1322', lineHeight: 1.5,
                      }}>
                        ⚠️ 退回原因：{c.rejectionReason}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#8c8c8c' }}>
                        <span>{formatDate(c.createdAt, 'MM-DD HH:mm')}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10,
                          background: status.color + '22', color: status.color,
                        }}>
                          {status.label}
                        </span>
                        {c.materialsComplete ? (
                          <span style={{ color: '#52c41a' }}>✓ 材料完整</span>
                        ) : (
                          <span style={{ color: '#fa8c16' }}>⚠ 材料不完整</span>
                        )}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ff4d4f' }}>
                        ¥{c.amount?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c', fontSize: 13 }}>
                  加载中...
                </div>
              )}

              {!loading && list.length > 0 && list.length < total && (
                <div
                  style={{ textAlign: 'center', padding: 16, color: '#1677ff', fontSize: 13 }}
                  onClick={() => { setPage(page + 1); loadData(); }}
                >
                  加载更多 ({list.length}/{total})
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>

      <Button
        block
        color="primary"
        shape="rounded"
        style={{
          position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 50,
          height: 48, fontSize: 15, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(22,119,255,0.35)',
        }}
        onClick={() => { window.location.href = '/dashboard'; }}
      >
        <AddOutline /> 新建合同
      </Button>
    </div>
  );
}
