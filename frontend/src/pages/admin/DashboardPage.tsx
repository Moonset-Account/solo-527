import { useState, useEffect } from 'react';
import { Row, Col, Statistic, Card, Table, Tag, Progress, Button, Space, Tooltip } from 'antd';
import {
  FileTextOutlined, AuditOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, ClockCircleOutlined, ArrowRightOutlined, ReloadOutlined,
  FileSearchOutlined, SafetyCertificateOutlined, ThunderboltOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { contractApi, conflictApi, callbackApi, notificationApi } from '../../api';
import { contractStatusMap, urgencyMap, conflictStatusMap, conflictSeverityMap, callbackStatusMap, formatSize, formatDate, contractTypeMap } from '../../store';
import ReactECharts from 'echarts-for-react';
import { Contract, ConflictRecord, CallbackLog } from '../../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contractStats, setContractStats] = useState<any>({});
  const [conflictStats, setConflictStats] = useState<any>({});
  const [callbackStats, setCallbackStats] = useState<any>({});
  const [unread, setUnread] = useState(0);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [recentConflicts, setRecentConflicts] = useState<ConflictRecord[]>([]);
  const [failedCallbacks, setFailedCallbacks] = useState<CallbackLog[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cStats, cfStats, cbStats, contracts, conflicts, callbacks, unreadRes] = await Promise.all([
        contractApi.stats(),
        conflictApi.stats(),
        callbackApi.stats(),
        contractApi.query({ page: 1, pageSize: 8, sortBy: 'createdAt', sortOrder: 'DESC' }) as any,
        conflictApi.query({ page: 1, pageSize: 5, sortOrder: 'DESC' }) as any,
        callbackApi.query({ page: 1, pageSize: 5, status: 'failed' }) as any,
        notificationApi.unreadCount(),
      ]);
      setContractStats(cStats);
      setConflictStats(cfStats);
      setCallbackStats(cbStats);
      setRecentContracts(contracts.list || []);
      setRecentConflicts(conflicts.list || []);
      setFailedCallbacks(callbacks.list || []);
      setUnread((unreadRes as any).count || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statusOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, left: 'center' },
    series: [{
      type: 'pie', radius: ['45%', '70%'], avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: Object.entries(contractStats.byStatus || {})
        .filter(([, v]) => (v as number) > 0)
        .map(([k, v]) => ({
          name: (contractStatusMap as any)[k]?.label || k,
          value: v,
          itemStyle: { color: (contractStatusMap as any)[k]?.color || '#999' },
        })),
    }],
  };

  const typeOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: Object.keys(contractStats.byStatus || {}).length > 0 ? Object.values(contractTypeMap) : [] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar', data: [2, 3, 1, 0, 2, 1, 4],
      itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
      barWidth: 28,
    }],
  };

  const approvalProgress = contractStats.total
    ? Math.round(((contractStats.byStatus?.approved || 0) + (contractStats.byStatus?.signed || 0) + (contractStats.byStatus?.archived || 0)) / contractStats.total * 100)
    : 0;

  const contractColumns = [
    {
      title: '编号', dataIndex: 'contractNo', width: 140,
      render: (v: string, r: Contract) => <a onClick={() => navigate(`/contracts/${r.id}`)} style={{ color: '#1677ff' }}>{v}</a>,
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '类型', dataIndex: 'contractType', width: 100, render: (v: string) => (contractTypeMap as any)[v] || v },
    {
      title: '金额', dataIndex: 'amount', width: 130, align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: '#ff4d4f' }}>¥{v?.toLocaleString() || 0}</span>,
    },
    {
      title: '紧急度', dataIndex: 'urgency', width: 90,
      render: (v: string) => {
        const info = (urgencyMap as any)[v];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => {
        const info = (contractStatusMap as any)[v];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => formatDate(v) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>工作台</div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>
      </div>

      <Row gutter={[16, 16]} className="stats-grid" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-title">合同总数</div>
                <div className="stat-card-value" style={{ color: '#1677ff' }}>{contractStats.total || 0}</div>
                <div className="stat-card-desc">
                  累计金额 <b style={{ color: '#ff4d4f' }}>¥{(contractStats.totalAmount || 0) >= 10000 ? (contractStats.totalAmount / 10000).toFixed(1) + 'w' : (contractStats.totalAmount || 0).toLocaleString()}</b>
                </div>
              </div>
              <FileTextOutlined style={{ fontSize: 36, color: '#1677ff33' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-title">待我审批</div>
                <div className="stat-card-value" style={{ color: '#fa8c16' }}>{contractStats.pendingApproval || 0}</div>
                <div className="stat-card-desc">
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/approval-tasks')}>
                    前往处理 <ArrowRightOutlined />
                  </Button>
                </div>
              </div>
              <AuditOutlined style={{ fontSize: 36, color: '#fa8c1633' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-title">未读消息</div>
                <div className="stat-card-value" style={{ color: '#722ed1' }}>{unread}</div>
                <div className="stat-card-desc">
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/notifications')}>
                    查看 <ArrowRightOutlined />
                  </Button>
                </div>
              </div>
              <SafetyCertificateOutlined style={{ fontSize: 36, color: '#722ed133' }} />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-title">冲突处理中</div>
                <div className="stat-card-value" style={{ color: '#ff4d4f' }}>
                  {(conflictStats.byStatus?.open || 0) + (conflictStats.byStatus?.assigned || 0) + (conflictStats.byStatus?.resolving || 0)}</div>
                <div className="stat-card-desc">
                  严重 {conflictStats.bySeverity?.critical || 0} · 高危 {conflictStats.bySeverity?.high || 0}
                </div>
              </div>
              <ThunderboltOutlined style={{ fontSize: 36, color: '#ff4d4f33' }} />
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                <FileSearchOutlined style={{ marginRight: 8 }} />合同状态分布
              </div>
              <Button type="text" onClick={() => navigate('/contracts')}>查看全部 →</Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>审批完成率</div>
                <Progress percent={approvalProgress} status={approvalProgress >= 80 ? 'success' : 'active'} />
              </div>
              <Space>
                <Statistic title="已批准" value={contractStats.byStatus?.approved || 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                <Statistic title="已退回" value={contractStats.byStatus?.rejected || 0} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
                <Statistic title="审批中" value={contractStats.byStatus?.approving || 0} valueStyle={{ fontSize: 16, color: '#1677ff' }} prefix={<ClockCircleOutlined />} />
              </Space>
            </div>
            <ReactECharts option={statusOption} style={{ height: 240 }} />
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                <DatabaseOutlined style={{ marginRight: 8 }} />回调/通知统计
              </div>
              <Button type="text" onClick={() => navigate('/callbacks')}>查看日志 →</Button>
            </div>
            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
                  <Statistic title="今日调用" value={callbackStats.today?.count || 0} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" bordered={false} style={{ background: '#fff1f0', borderRadius: 8 }}>
                  <Statistic title="今日失败" value={callbackStats.today?.failed || 0} valueStyle={{ fontSize: 18, color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>失败回调 TOP</div>
            {failedCallbacks.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>暂无失败回调 🎉</div>
            ) : (
              failedCallbacks.slice(0, 5).map((c) => (
                <div key={c.id} style={{
                  padding: '10px 12px', background: '#fff2f0', borderRadius: 6,
                  marginBottom: 8, display: 'flex', alignItems: 'center',
                }}>
                  <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#1f1f1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.callbackType} · {c.targetUrl.substring(0, 40)}
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                      重试 {c.retryCount}/{c.maxRetryCount} · {formatDate(c.lastAttemptAt || c.createdAt, 'HH:mm')}
                      {c.failureReason && <span style={{ marginLeft: 8 }}>错误：{c.failureReason.substring(0, 30)}</span>}
                    </div>
                  </div>
                  <Tooltip title="手动重试">
                    <Button size="small" type="primary" danger onClick={async () => { await callbackApi.retry(c.id); fetchData(); }}>
                      <ReloadOutlined />重试
                    </Button>
                  </Tooltip>
                </div>
              ))
            )}
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 6 }}>按类型分布</div>
              <Space wrap>
                {Object.entries(callbackStats.byType || {}).map(([k, v]) => (
                  <Tag key={k} color="blue">{k}: {v as number}</Tag>
                ))}
              </Space>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                <FileTextOutlined style={{ marginRight: 8 }} />最近合同
              </div>
              <Space>
                <Button type="primary" onClick={() => navigate('/contracts/create')} icon={<FileTextOutlined />}>
                  新建合同
                </Button>
                <Button type="text" onClick={() => navigate('/contracts')}>查看全部 →</Button>
              </Space>
            </div>
            <Table
              rowKey="id"
              loading={loading}
              columns={contractColumns}
              dataSource={recentContracts}
              pagination={false}
              size="small"
            />
          </div>
        </Col>
        <Col xs={24} md={10}>
          <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                <WarningOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />资源冲突告警
              </div>
              <Button type="text" onClick={() => navigate('/conflicts')}>查看 →</Button>
            </div>
            {recentConflicts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
                暂无冲突记录 🎉
              </div>
            ) : (
              recentConflicts.slice(0, 5).map((c) => {
                const st = (conflictStatusMap as any)[c.status];
                const sv = (conflictSeverityMap as any)[c.severity];
                return (
                  <div key={c.id} onClick={() => navigate(`/conflicts/${c.id}`)}
                    style={{
                      padding: 12, border: `1px solid ${st.color}33`,
                      borderRadius: 8, marginBottom: 10, cursor: 'pointer',
                      background: st.color + '08',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, color: '#1f1f1f' }}>{c.title}</div>
                      <Space size={4}>
                        <Tag color={sv.color}>{sv.label}</Tag>
                        <Tag color={st.color}>{st.label}</Tag>
                      </Space>
                    </div>
                    <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.6, marginBottom: 6 }}>
                      影响范围：{c.impactScope || '未填写'}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', justifyContent: 'space-between' }}>
                      <span>处理人：{c.handler?.realName || '未指派'}</span>
                      <span>{formatDate(c.createdAt, 'MM-DD HH:mm')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
