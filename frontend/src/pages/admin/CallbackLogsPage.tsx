import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, DatePicker, Row, Col, Card, Statistic,
  Modal, Tooltip, Empty, App as AntdApp, Drawer, Descriptions, Badge, Timeline, Progress,
} from 'antd';
import {
  ReloadOutlined, SearchOutlined, SyncOutlined, StopOutlined, EyeOutlined,
  WarningOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { callbackApi } from '../../api';
import { callbackStatusMap, formatDate, formatSize } from '../../store';
import { CallbackLog, CallbackType, CallbackStatus } from '../../types';
const { Option } = Select;
const { RangePicker } = DatePicker;

const typeColorMap: Record<string, string> = {
  notification: 'blue', payment: 'orange', esign: 'purple',
  sms: 'cyan', email: 'geekblue', wechat: 'green', webhook: 'magenta',
};

export default function CallbackLogsPage() {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CallbackLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stats, setStats] = useState<any>({});
  const [filters, setFilters] = useState<{ keyword: string; callbackType?: CallbackType; status?: CallbackStatus; hasFailure?: boolean; dateRange: any[] }>({
    keyword: '', dateRange: [],
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<CallbackLog | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page, pageSize,
        keyword: filters.keyword || undefined,
        callbackType: filters.callbackType,
        status: filters.status,
        hasFailureReason: filters.hasFailure,
      };
      if (filters.dateRange?.length === 2) {
        params.dateRangeStart = filters.dateRange[0].format('YYYY-MM-DD');
        params.dateRangeEnd = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await callbackApi.query(params) as any;
      setData(res.list || []);
      setTotal(res.total || 0);
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await callbackApi.stats();
      setStats(res);
    } catch {}
  };

  useEffect(() => { fetchData(); fetchStats(); }, [page, pageSize, filters.callbackType, filters.status, filters.hasFailure]);

  const handleRetry = async (c: CallbackLog) => {
    try {
      await callbackApi.retry(c.id);
      message.success('已加入重试队列');
      setTimeout(() => fetchData(), 2000);
    } catch (e: any) { message.error(e.message); }
  };

  const handleCancel = async (c: CallbackLog) => {
    Modal.confirm({
      title: '确认取消该回调？',
      content: `请求ID：${c.requestId}`,
      okText: '确认取消', okButtonProps: { danger: true },
      onOk: async () => {
        try { await callbackApi.cancel(c.id); message.success('已取消'); fetchData(); }
        catch (e: any) { message.error(e.message); }
      },
    });
  };

  const handleViewDetail = async (c: CallbackLog) => {
    try {
      const detail = await callbackApi.getById(c.id) as unknown as CallbackLog;
      setCurrentLog(detail);
      setDetailVisible(true);
    } catch (e: any) { message.error(e.message); }
  };

  const avgDur = stats.avgDurationMs || 0;
  const iconMap: Record<string, string> = { notification: '🔔', payment: '💰', esign: '✍️', sms: '📱', email: '📧', wechat: '💬', webhook: '🔗' };

  const columns = [
    { title: '类型', dataIndex: 'callbackType', width: 120,
      render: (v) => <Tag color={typeColorMap[v] || 'default'}>{iconMap[v] || '🔗'} {v.toUpperCase()}</Tag>,
      filters: Object.keys(typeColorMap).map(k => ({ text: k.toUpperCase(), value: k })),
      onFilter: (v, r) => (r as any).callbackType === v,
    },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => { const info = callbackStatusMap[v]; return <Tag color={info.color}>{info.label}</Tag>; },
      filters: Object.entries(callbackStatusMap).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => (r as any).status === v,
    },
    { title: '请求ID', dataIndex: 'requestId', width: 200,
      render: (v) => <Tooltip title={v}><code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{v.substring(0, 18)}...</code></Tooltip>,
    },
    { title: '目标地址', dataIndex: 'targetUrl', ellipsis: true,
      render: (v) => <Tooltip title={v}><code style={{ fontSize: 12, color: '#8c8c8c' }}>{v.substring(0, 60)}</code></Tooltip>,
    },
    { title: '方法', dataIndex: 'httpMethod', width: 80, render: (v) => <Tag color={v === 'GET' ? 'green' : 'blue'}>{v}</Tag> },
    { title: '重试进度', width: 140,
      render: (_: any, r: CallbackLog) => (
        <Progress percent={Math.round((r.retryCount / Math.max(1, r.maxRetryCount)) * 100)} size="small"
          status={r.status === 'success' ? 'success' : r.status === 'failed' ? 'exception' : 'active'}
          format={() => `${r.retryCount}/${r.maxRetryCount}`} />
      ),
    },
    { title: '耗时', dataIndex: 'durationMs', width: 90,
      render: (v) => v === null || v === undefined ? '-' : <span style={{ color: v > 5000 ? '#ff4d4f' : v > 1000 ? '#fa8c16' : '#52c41a' }}>{v}ms</span>,
    },
    { title: '失败原因', dataIndex: 'failureReason', width: 200, ellipsis: true,
      render: (v) => v ? <Tooltip title={v}><span style={{ color: '#ff4d4f' }}>⚠️ {v.substring(0, 30)}</span></Tooltip> : '-',
    },
    { title: '下次重试', dataIndex: 'nextRetryAt', width: 150, render: (v) => v ? formatDate(v, 'MM-DD HH:mm:ss') : '-' },
    { title: '创建/完成', width: 170, render: (_: any, r: CallbackLog) => (
      <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6 }}>
        <div>创建: {formatDate(r.createdAt, 'MM-DD HH:mm')}</div>
        {r.completedAt && <div>完成: {formatDate(r.completedAt, 'MM-DD HH:mm')}</div>}
      </div>
    )},
    { title: '操作', width: 160, fixed: 'right' as any,
      render: (_, r: CallbackLog) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {(r.status === 'retrying' || r.status === 'failed' || r.status === 'pending') && (
            <Button size="small" type="link" icon={<SyncOutlined />} onClick={() => handleRetry(r)}>重试</Button>
          )}
          {(r.status === 'pending' || r.status === 'retrying') && (
            <Button size="small" type="link" danger icon={<StopOutlined />} onClick={() => handleCancel(r)}>取消</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">
        <Space><ThunderboltOutlined style={{ fontSize: 20, color: '#722ed1' }} /><span>回调日志 / 通知与支付重试</span></Space>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); fetchStats(); }}>刷新</Button>
      </div>

      <Row gutter={[16, 16]} className="stats-grid">
        <Col xs={12} md={4}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="总调用数" value={stats.total || 0} /></Card></Col>
        <Col xs={12} md={4}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="今日调用" value={stats.today?.count || 0} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} md={4}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="今日失败" value={stats.today?.failed || 0} valueStyle={{ color: stats.today?.failed > 0 ? '#ff4d4f' : '#52c41a' }} prefix={<WarningOutlined />} /></Card></Col>
        <Col xs={12} md={4}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="成功率" value={Math.round(stats.today?.count ? ((stats.today.count - (stats.today.failed || 0)) / stats.today.count * 100) : 100)} suffix="%" /></Card></Col>
        <Col xs={12} md={4}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="平均耗时" value={Number(avgDur).toFixed(0)} suffix="ms" /></Card></Col>
        <Col xs={12} md={4}><Card bordered={false} size="small" style={{ borderRadius: 10 }}>
          <Statistic title="待重试" value={stats.byStatus?.retrying || 0} valueStyle={{ color: '#fa8c16' }} prefix={<ClockCircleOutlined />} /></Card></Col>
      </Row>

      <div className="page-container">
        <Space style={{ marginBottom: 16, width: '100%' }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="搜索请求ID/URL/失败原因"
            style={{ width: 320 }} value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={() => fetchData()}
          />
          <Select allowClear placeholder="回调类型" style={{ width: 150 }}
            value={filters.callbackType} onChange={(v) => setFilters({ ...filters, callbackType: v })}>
            {Object.keys(typeColorMap).map(k => <Option key={k} value={k}>{iconMap[k]} {k.toUpperCase()}</Option>)}
          </Select>
          <Select allowClear placeholder="状态" style={{ width: 140 }}
            value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}>
            {Object.entries(callbackStatusMap).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
          </Select>
          <Select allowClear placeholder="是否有失败" style={{ width: 140 }}
            value={filters.hasFailure === undefined ? undefined : String(filters.hasFailure)}
            onChange={(v) => setFilters({ ...filters, hasFailure: v === undefined ? undefined : v === 'true' })}>
            <Option value="true">有失败原因</Option>
            <Option value="false">无失败原因</Option>
          </Select>
          <RangePicker value={filters.dateRange as any} onChange={(v) => setFilters({ ...filters, dateRange: v as any })} />
          <Button type="primary" onClick={fetchData}>查询</Button>
        </Space>

        <Table
          rowKey="id" loading={loading} columns={columns} dataSource={data} scroll={{ x: 1600 }}
          locale={{ emptyText: <Empty description="暂无回调日志" /> }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </div>

      <Drawer
        title="回调日志详情"
        open={detailVisible} onClose={() => setDetailVisible(false)} width={720}
        extra={<Space>
          {currentLog?.status === 'failed' && (
            <Button type="primary" icon={<SyncOutlined />} onClick={() => handleRetry(currentLog)}>手动重试</Button>
          )}
          <Button type="primary" onClick={() => setDetailVisible(false)}>关闭</Button>
        </Space>}
      >
        {currentLog && (
          <div>
            <Descriptions title="基础信息" bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="类型">
                <Tag color={typeColorMap[currentLog.callbackType] || 'default'}>
                  {iconMap[currentLog.callbackType] || ''} {currentLog.callbackType.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={callbackStatusMap[currentLog.status].color}>
                  {callbackStatusMap[currentLog.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="请求ID" span={2}><code>{currentLog.requestId}</code></Descriptions.Item>
              <Descriptions.Item label="方法">{currentLog.httpMethod}</Descriptions.Item>
              <Descriptions.Item label="耗时">{currentLog.durationMs ?? '-'} ms</Descriptions.Item>
              <Descriptions.Item label="目标URL" span={2}>
                <a href={currentLog.targetUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>{currentLog.targetUrl}</a>
              </Descriptions.Item>
              <Descriptions.Item label="重试进度">
                <Progress percent={Math.round(currentLog.retryCount / Math.max(1, currentLog.maxRetryCount) * 100)} size="small" />
                <div style={{ fontSize: 12, marginTop: 4 }}>{currentLog.retryCount} / {currentLog.maxRetryCount} 次</div>
              </Descriptions.Item>
              <Descriptions.Item label="下次重试">{currentLog.nextRetryAt ? formatDate(currentLog.nextRetryAt) : '-'}</Descriptions.Item>
              {currentLog.failureReason && (
                <Descriptions.Item label="失败原因" span={2}>
                  <div style={{ background: '#fff1f0', color: '#cf1322', padding: 10, borderRadius: 6, wordBreak: 'break-all' }}>
                    ❌ {currentLog.failureReason}
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建">{formatDate(currentLog.createdAt, 'YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="完成">{currentLog.completedAt ? formatDate(currentLog.completedAt, 'YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="首次请求">{currentLog.firstAttemptAt ? formatDate(currentLog.firstAttemptAt, 'HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="最后请求">{currentLog.lastAttemptAt ? formatDate(currentLog.lastAttemptAt, 'HH:mm:ss') : '-'}</Descriptions.Item>
            </Descriptions>

            <div className="section-title">请求详情</div>
            <Card size="small" style={{ marginBottom: 16 }} title="请求头">
              <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>
                {JSON.stringify(currentLog.requestHeaders || {}, null, 2)}
              </pre>
            </Card>
            <Card size="small" style={{ marginBottom: 16 }} title="请求体">
              <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0, maxHeight: 200, overflow: 'auto' }}>
                {currentLog.requestPayload || '(空)'}
              </pre>
            </Card>
            <Card size="small" style={{ marginBottom: 16 }}
              title={
                <Space>
                  <span>响应</span>
                  {currentLog.responseStatusCode && (
                    <Tag color={currentLog.responseStatusCode >= 200 && currentLog.responseStatusCode < 300 ? 'green' : 'red'}>
                      HTTP {currentLog.responseStatusCode}
                    </Tag>
                  )}
                </Space>
              }>
              <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0, maxHeight: 240, overflow: 'auto' }}>
                {currentLog.responseBody || '(无响应)'}
              </pre>
            </Card>

            {currentLog.retryHistory && currentLog.retryHistory.length > 0 && (
              <>
                <div className="section-title">重试历史</div>
                <Timeline
                  items={currentLog.retryHistory.slice().reverse().map((h) => ({
                    color: h.status === 'success' ? 'green' : 'red',
                    children: (
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <b>第 {h.attempt} 次尝试</b>
                          <Tag color={h.status === 'success' ? 'green' : 'red'} style={{ marginLeft: 8 }}>{h.status}</Tag>
                          <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 12 }}>{formatDate(h.time, 'HH:mm:ss')}</span>
                          <span style={{ float: 'right', color: '#595959', fontSize: 12 }}>耗时 {h.durationMs}ms</span>
                        </div>
                        <div style={{ fontSize: 12 }}>HTTP {h.statusCode || 'N/A'}</div>
                        {h.error && <div style={{ marginTop: 4, color: '#ff4d4f', fontSize: 12, background: '#fff1f0', padding: 6, borderRadius: 4 }}>{h.error}</div>}
                      </div>
                    ),
                  }))}
                />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
