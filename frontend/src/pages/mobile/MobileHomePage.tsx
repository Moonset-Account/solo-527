import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Tag, Empty } from 'antd-mobile';
import { useAppStore, contractStatusMap, urgencyMap, formatDate, contractTypeMap } from '../../store';
import { contractApi, approvalApi } from '../../api';
import { Contract, ApprovalTask, PageResult } from '../../types';

export default function MobileHomePage() {
  const navigate = useNavigate();
  const { user, fetchUnread } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [myContracts, setMyContracts] = useState<Contract[]>([]);
  const [myTasks, setMyTasks] = useState<ApprovalTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [st, contracts, tasks] = await Promise.all([
        contractApi.stats(),
        contractApi.query({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'DESC' }) as unknown as Promise<PageResult<Contract>>,
        approvalApi.myTasks(1, 5, 'pending') as unknown as Promise<PageResult<ApprovalTask>>,
      ]);
      setStats(st);
      setMyContracts(contracts.list || []);
      setMyTasks(tasks.list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    fetchAll();
  }, []);

  const quickActions = [
    { icon: '📋', title: '新建合同', action: () => navigate('/m/contracts') },
    { icon: '✅', title: '我的审批', badge: stats.pendingApproval, action: () => navigate('/m/approval') },
    { icon: '📁', title: '我的合同', action: () => navigate('/m/contracts') },
    { icon: '🔍', title: '查询进度', action: () => navigate('/m/contracts') },
    { icon: '⚠️', title: '冲突告警', action: () => navigate('/m/notifications') },
    { icon: '💾', title: '资源占用', action: () => {} },
    { icon: '📝', title: '材料核对', action: () => navigate('/m/contracts') },
    { icon: '🔔', title: '通知中心', action: () => navigate('/m/notifications') },
  ];

  return (
    <div className="mobile-page">
      <div className="mobile-progress-hero" style={{ borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginRight: 12 }}>
            👋
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>你好，{user?.realName}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>

        <Grid columns={3} gap={8}>
          <Grid.Item>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.total || 0}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>合同总数</div>
            </div>
          </Grid.Item>
          <Grid.Item>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.pendingApproval || 0}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>待我审批</div>
            </div>
          </Grid.Item>
          <Grid.Item>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>¥{(stats.totalAmount || 0) >= 10000 ? (stats.totalAmount / 10000).toFixed(1) + 'w' : (stats.totalAmount || 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>累计金额</div>
            </div>
          </Grid.Item>
        </Grid>
      </div>

      <div className="mobile-card">
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>快捷操作</div>
        <Grid columns={4} gap={8}>
          {quickActions.map((a, i) => (
            <Grid.Item key={i}>
              <div onClick={a.action} style={{ textAlign: 'center', padding: 12, cursor: 'pointer' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <span style={{ fontSize: 24 }}>{a.icon}</span>
                  {a.badge > 0 && (
                    <span className="badge-dot">{a.badge > 99 ? '99+' : a.badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{a.title}</div>
              </div>
            </Grid.Item>
          ))}
        </Grid>
      </div>

      {myTasks.length > 0 && (
        <div className="mobile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>待我审批</span>
            <span style={{ fontSize: 12, color: '#1677ff' }} onClick={() => navigate('/m/approval')}>
              查看全部 →
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myTasks.map((task) => {
              const urgencyInfo = urgencyMap[task.contract.urgency];
              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/m/progress/${task.contract.id}`)}
                  style={{ padding: 12, background: '#fafafa', borderRadius: 10, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f1f1f', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.nodeName}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{task.contract.contractNo}</div>
                      <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.4 }}>{task.contract.title}</div>
                    </div>
                    <Tag round color={urgencyInfo.color} style={{ marginLeft: 8, flexShrink: 0 }}>{urgencyInfo.label}</Tag>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mobile-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>最近合同</span>
          <span style={{ fontSize: 12, color: '#1677ff' }} onClick={() => navigate('/m/contracts')}>
            查看全部 →
          </span>
        </div>
        {myContracts.length === 0 ? (
          <Empty description="暂无合同" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myContracts.map((c) => {
              const statusInfo = contractStatusMap[c.status];
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/m/progress/${c.id}`)}
                  style={{ padding: 12, background: '#fafafa', borderRadius: 10, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>{c.contractNo}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: statusInfo.color + '22', color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {contractTypeMap[c.contractType]} · {formatDate(c.createdAt, 'MM-DD')}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ff4d4f' }}>
                      ¥{c.amount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
