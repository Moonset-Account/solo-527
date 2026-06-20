import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, SearchBar, Empty, PullToRefresh, Tag } from 'antd-mobile';
import { ApprovalTask, ContractStatus, ApprovalStatus } from '../../types';
import { approvalApi } from '../../api';
import { contractStatusMap, urgencyMap, formatDate, approvalStatusMap } from '../../store';

export default function MobileApprovalPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [list, setList] = useState<ApprovalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (reset = false) => {
    const curPage = reset ? 1 : page;
    setLoading(true);
    try {
      const res = await approvalApi.myTasks(curPage, 20, activeTab === 'all' ? undefined : activeTab as ApprovalStatus) as any;
      let data = res.list || [];
      if (keyword) {
        data = data.filter((t: ApprovalTask) =>
          t.contract.title.includes(keyword) || t.contract.contractNo.includes(keyword) || t.nodeName.includes(keyword),
        );
      }
      setList(reset ? data : [...list, ...data]);
      setTotal(res.total || 0);
      if (reset) setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    setPage(1);
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingBottom: 12 }}>
      <div className="mobile-search-bar">
        <SearchBar
          placeholder="搜索合同编号、标题或审批节点"
          value={keyword}
          onChange={setKeyword}
          onSearch={() => loadData(true)}
          clearable
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ position: 'sticky', top: 56, zIndex: 10, background: 'white' }}
      >
        <Tabs.Tab title="待处理" key="pending" />
        <Tabs.Tab title="已通过" key="approved" />
        <Tabs.Tab title="已退回" key="rejected" />
        <Tabs.Tab title="全部" key="all" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ padding: 12 }}>
          {list.length === 0 && !loading ? (
            <Empty description="暂无审批记录" style={{ padding: '60px 0' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map((task) => {
                const status = approvalStatusMap[task.status];
                const urgency = urgencyMap[task.contract.urgency];
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/m/progress/${task.contract.id}`)}
                    className="mobile-card"
                    style={{ marginBottom: 0 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>
                          {task.contract.contractNo}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', lineHeight: 1.4 }}>
                          {task.nodeName}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Tag round color={urgency.color} style={{ margin: 0 }}>{urgency.label}</Tag>
                        <span style={{
                          fontSize: 11, padding: '1px 8px', borderRadius: 10,
                          background: status.color + '22', color: status.color,
                        }}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, color: '#595959', marginBottom: 10, lineHeight: 1.5 }}>
                      📄 {task.contract.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#8c8c8c' }}>
                      <span>
                        {task.approvedAt
                          ? `处理：${formatDate(task.approvedAt, 'MM-DD HH:mm')}`
                          : `分配：${formatDate(task.createdAt, 'MM-DD HH:mm')}`}
                      </span>
                      <span style={{ color: '#1677ff' }}>查看详情 →</span>
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
                  加载更多
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
