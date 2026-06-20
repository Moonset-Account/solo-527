import { useState, useEffect } from 'react';
import { Tabs, Empty, PullToRefresh, SwipeAction, Toast, Button, Avatar } from 'antd-mobile';
import { Notification } from '../../types';
import { notificationApi } from '../../api';
import { useAppStore, formatDate } from '../../store';

const typeMap: Record<string, { label: string; icon: string; color: string }> = {
  approval_request: { label: '审批请求', icon: '📝', color: '#1677ff' },
  approval_result: { label: '审批结果', icon: '✅', color: '#52c41a' },
  material_incomplete: { label: '材料不完整', icon: '⚠️', color: '#fa8c16' },
  material_complete: { label: '材料完整', icon: '📋', color: '#52c41a' },
  contract_rejected: { label: '合同退回', icon: '❌', color: '#ff4d4f' },
  contract_approved: { label: '合同批准', icon: '🎉', color: '#52c41a' },
  conflict_created: { label: '冲突上报', icon: '⚠️', color: '#ff4d4f' },
  conflict_resolved: { label: '冲突解决', icon: '✅', color: '#52c41a' },
  archive_reminder: { label: '归档提醒', icon: '📁', color: '#722ed1' },
  callback_failure: { label: '回调失败', icon: '🔔', color: '#ff4d4f' },
  system: { label: '系统通知', icon: '🔔', color: '#1677ff' },
  custom: { label: '自定义通知', icon: '📢', color: '#8c8c8c' },
};

export default function MobileNotificationPage() {
  const { fetchUnread } = useAppStore();
  const [activeTab, setActiveTab] = useState('all');
  const [list, setList] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (reset = false) => {
    const curPage = reset ? 1 : page;
    setLoading(true);
    try {
      const status = activeTab === 'read' ? 'read' : activeTab === 'unread' ? 'pending' : undefined;
      const res = await notificationApi.my(curPage, 30, status, undefined) as any;
      setList(reset ? res.list || [] : [...list, ...(res.list || [])]);
      setTotal(res.total || 0);
      setUnread(res.unread || 0);
      fetchUnread();
      if (reset) setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [activeTab]);

  const handleRead = async (n: Notification) => {
    try {
      await notificationApi.read(n.id);
      setList(list.map((x) => x.id === n.id ? { ...x, status: 'read' as any } : x));
      setUnread(Math.max(0, unread - 1));
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message });
    }
  };

  const handleReadAll = async () => {
    try {
      await notificationApi.readAll();
      setList(list.map((x) => ({ ...x, status: 'read' as any })));
      setUnread(0);
      Toast.show({ icon: 'success', content: '已全部标为已读' });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', paddingBottom: 12 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'white',
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>消息中心</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            {unread > 0 ? `${unread} 条未读消息` : '暂无未读消息'}
          </div>
        </div>
        {unread > 0 && (
          <Button size="small" color="primary" fill="outline" onClick={handleReadAll}>
            全部已读
          </Button>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ position: 'sticky', top: 60, zIndex: 10, background: 'white' }}
      >
        <Tabs.Tab title={`全部 (${total})`} key="all" />
        <Tabs.Tab title={`未读 (${unread})`} key="unread" />
        <Tabs.Tab title="已读" key="read" />
      </Tabs>

      <PullToRefresh onRefresh={handleRefresh}>
        <div style={{ padding: 12 }}>
          {list.length === 0 && !loading ? (
            <Empty
              description={activeTab === 'unread' ? '暂无未读消息' : '暂无消息'}
              style={{ padding: '80px 0' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map((n) => {
                const t = typeMap[n.type] || typeMap.system;
                const isUnread = n.status !== 'read';
                return (
                  <SwipeAction
                    key={n.id}
                    rightActions={isUnread ? [{
                      key: 'read', text: '标为已读', color: '#1677ff',
                      onClick: () => handleRead(n),
                    }] : []}
                  >
                    <div
                      onClick={() => handleRead(n)}
                      className="mobile-card"
                      style={{
                        marginBottom: 0,
                        borderLeft: isUnread ? `3px solid ${t.color}` : '3px solid transparent',
                        opacity: isUnread ? 1 : 0.7,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20,
                        }}>
                          {t.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</span>
                              {isUnread && <span style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f',
                              }} />}
                            </div>
                            <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                              {formatDate(n.createdAt, 'MM-DD HH:mm')}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 12, color: t.color, marginBottom: 6,
                          }}>
                            <span style={{ padding: '1px 6px', borderRadius: 6, background: t.color + '18' }}>
                              {t.label}
                            </span>
                            <span style={{ marginLeft: 8, color: '#8c8c8c' }}>
                              {n.channel === 'in_app' ? '站内' : n.channel === 'email' ? '邮件' : n.channel === 'sms' ? '短信' : n.channel}
                            </span>
                          </div>
                          {n.content && (
                            <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {n.content.length > 120 ? n.content.substring(0, 120) + '...' : n.content}
                            </div>
                          )}
                          {n.failureReason && (
                            <div style={{
                              marginTop: 8, padding: 8, background: '#fff1f0',
                              borderRadius: 6, fontSize: 12, color: '#cf1322',
                            }}>
                              ❌ 失败原因：{n.failureReason}
                              <div style={{ marginTop: 4, color: '#8c8c8c' }}>
                                已重试 {n.retryCount || 0} 次
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SwipeAction>
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
    </div>
  );
}
