import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Tag, Table, Button, Space, Select, Input,
  DatePicker, Drawer, Descriptions, Empty, Divider, Tabs, Timeline,
  Alert, Segmented, Tooltip, Avatar, Badge
} from 'antd';
import {
  HistoryOutlined, SearchOutlined, FilterOutlined, EyeOutlined,
  UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  FileTextOutlined, CheckCircleOutlined, DownloadOutlined,
  InfoCircleOutlined, LinkOutlined, ArrowLeftOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { logApi, memberApi } from '../../services/api';
import dayjs from 'dayjs';
import { operationActionLabel } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

export default function OperationLogs() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 30 });
  const [filters, setFilters] = useState<any>({
    dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    action: undefined, targetType: undefined, operatorId: undefined,
    memberId: undefined, targetId: undefined, keyword: ''
  });
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [operators, setOperators] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [actionStats, setActionStats] = useState<any[]>([]);

  useEffect(() => { loadOperators(); loadMembers(); }, []);
  useEffect(() => { loadData(); }, [pagination.current, pagination.pageSize, filters]);

  const loadOperators = async () => {
    try {
      const res = await memberApi.summary();
      // 这里可能需要用用户列表，先简单模拟
      setOperators([
        { id: 1, name: 'admin' }, { id: 2, name: 'teacher1' },
        { id: 3, name: 'teacher2' }, { id: 4, name: 'operator1' }
      ]);
    } catch {}
  };

  const loadMembers = async () => {
    try {
      const res = await memberApi.list({ pageSize: 50 });
      setMembers(res.list || []);
    } catch {}
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const start = filters.dateRange?.[0]?.startOf('day').toDate();
      const end = filters.dateRange?.[1]?.endOf('day').toDate();
      const res = await logApi.list({
        page: pagination.current, pageSize: pagination.pageSize,
        start, end, action: filters.action, targetType: filters.targetType,
        operatorId: filters.operatorId, memberId: filters.memberId,
        targetId: filters.targetId, keyword: filters.keyword
      });
      setData(res.list || []);
      setTotal(res.total);

      const counts: Record<string, number> = {};
      (res.list || []).forEach((l: any) => {
        counts[l.action] = (counts[l.action] || 0) + 1;
      });
      setActionStats(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([a, c]) => ({ action: a, count: c })));
    } finally { setLoading(false); }
  };

  const openDetail = (log: any) => {
    setDetail(log);
    setDetailOpen(true);
  };

  const getActionIcon = (action: string) => {
    if (action?.includes('CREATE')) return <PlusOutlined />;
    if (action?.includes('UPDATE') || action?.includes('EDIT')) return <EditOutlined />;
    if (action?.includes('DELETE')) return <DeleteOutlined />;
    if (action?.includes('CHECK')) return <CheckCircleOutlined />;
    if (action?.includes('FOLLOW') || action?.includes('ASSIGN')) return <EyeOutlined />;
    return <FileTextOutlined />;
  };

  const getActionColor = (action: string) => {
    if (action?.includes('CREATE')) return '#52c41a';
    if (action?.includes('UPDATE') || action?.includes('EDIT')) return '#1677ff';
    if (action?.includes('DELETE')) return '#ff4d4f';
    if (action?.includes('CHECK')) return '#13c2c2';
    if (action?.includes('FOLLOW')) return '#722ed1';
    if (action?.includes('ASSIGN')) return '#eb2f96';
    if (action?.includes('RESOLVE')) return '#52c41a';
    if (action?.includes('EXPIRE')) return '#faad14';
    return '#8c8c8c';
  };

  const columns: ColumnsType<any> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 170,
      fixed: 'left',
      render: t => (
        <div>
          <div style={{ fontWeight: 500 }}>{dayjs(t).format('MM-DD HH:mm:ss')}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{dayjs(t).fromNow()}</div>
        </div>
      ),
      defaultSortOrder: 'descend'
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      render: a => {
        const color = getActionColor(a);
        return (
          <Tag color={color} style={{ fontSize: 11, padding: '2px 8px' }} icon={getActionIcon(a)}>
            {operationActionLabel[a as keyof typeof operationActionLabel] || a}
          </Tag>
        );
      },
      filters: [
        { text: '创建', value: 'CREATE' },
        { text: '更新', value: 'UPDATE' },
        { text: '删除', value: 'DELETE' },
        { text: '打卡', value: 'CHECK_IN' },
        { text: '跟进', value: 'FOLLOW_UP' },
        { text: '指派', value: 'ASSIGN' }
      ]
    },
    {
      title: '对象',
      dataIndex: 'targetType',
      width: 110,
      render: (t, r) => (
        <Space>
          <Tag color="geekblue" style={{ fontSize: 11, margin: 0 }}>{t}</Tag>
          {r.targetId && <span style={{ fontSize: 11, color: '#999' }}>#{r.targetId}</span>}
        </Space>
      ),
      filters: [
        { text: '会员', value: 'MEMBER' },
        { text: '营期', value: 'CAMP' },
        { text: '课程', value: 'COURSE' },
        { text: '打卡', value: 'CHECK_IN' },
        { text: '待办', value: 'TODO' },
        { text: '掉队', value: 'LAGGING' }
      ]
    },
    {
      title: '对象名称',
      dataIndex: 'targetName',
      width: 200,
      render: (n, r) => (
        <a onClick={() => openDetail(r)} style={{ fontWeight: 500 }}>
          {n || `#${r.targetId}`}
        </a>
      )
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 140,
      render: o => o ? (
        <Space>
          <Avatar size={24} style={{ width: 24, height: 24, fontSize: 11, backgroundColor: '#1677ff' }}>
            {o.name?.charAt(0)}
          </Avatar>
          <span style={{ fontSize: 12 }}>{o.name}</span>
          <Tag color="default" style={{ margin: 0, fontSize: 10 }}>{o.role}</Tag>
        </Space>
      ) : <Tag color="default" style={{ fontSize: 11 }}>系统</Tag>
    },
    {
      title: '关联会员',
      dataIndex: 'member',
      width: 140,
      render: m => m ? (
        <Space>
          <Avatar size={22} style={{ width: 22, height: 22, fontSize: 10, backgroundColor: '#52c41a' }}>
            {m.name?.charAt(0)}
          </Avatar>
          <span style={{ fontSize: 12 }}>{m.name}</span>
        </Space>
      ) : <Tag color="default" style={{ fontSize: 10 }}>无</Tag>
    },
    {
      title: '摘要',
      dataIndex: 'detail',
      ellipsis: true,
      render: d => <span style={{ color: '#666' }}>{d || '—'}</span>
    },
    {
      title: '操作',
      key: 'op',
      width: 80,
      fixed: 'right',
      render: (_, r) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ color: '#1677ff' }} />
            操作日志
            <Badge status="processing" text={total + '条记录'} />
          </h2>
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            系统自动记录所有关键操作，支持多维度筛选与追溯，用于审计与排查问题
          </div>
        </div>
        <Space>
          <Alert type="info" showIcon message={
            <Space>
              <span>近7天共 <b style={{ color: '#1677ff' }}>{total}</b> 条操作</span>
              <Divider type="vertical" style={{ margin: 0 }} />
              <span>{actionStats.length} 种操作类型</span>
            </Space>
          } style={{ margin: 0 }} />
          <Button icon={<DownloadOutlined />}>导出日志</Button>
        </Space>
      </div>

      {actionStats.length > 0 && (
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card size="small" bordered={false} styles={{ body: { padding: 12 } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap' }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} />操作分布：
                </div>
                {actionStats.slice(0, 8).map((s, i) => {
                  const max = Math.max(...actionStats.map(x => x.count), 1);
                  const width = Math.max((s.count / max) * 200, 40);
                  return (
                    <Tooltip key={i} title={`${operationActionLabel[s.action as keyof typeof operationActionLabel] || s.action}：${s.count} 次（占${(s.count / Math.max(data.length, 1) * 100).toFixed(1)}%）`}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                        background: '#f5f5f5', borderRadius: 6, cursor: 'pointer'
                      }}
                        onClick={() => setFilters({ ...filters, action: s.action })}
                      >
                        <div style={{ width: 4, height: 14, borderRadius: 2, background: getActionColor(s.action) }} />
                        <span style={{ fontSize: 11, color: '#666' }}>
                          {operationActionLabel[s.action as keyof typeof operationActionLabel] || s.action}
                        </span>
                        <div style={{ width, height: 4, background: getActionColor(s.action), borderRadius: 2, opacity: 0.3 }} />
                        <span style={{ fontWeight: 600, fontSize: 12, color: getActionColor(s.action) }}>{s.count}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap size="middle">
            <RangePicker
              allowClear
              showTime
              value={filters.dateRange}
              onChange={v => setFilters({ ...filters, dateRange: v || [dayjs().subtract(7, 'day'), dayjs()] })}
              style={{ width: 360 }}
            />
            <Select allowClear placeholder="操作类型" style={{ width: 150 }} value={filters.action}
              onChange={v => setFilters({ ...filters, action: v })}
              options={Object.entries(operationActionLabel).map(([v, l]) => ({ label: l, value: v }))} />
            <Select allowClear placeholder="对象类型" style={{ width: 130 }} value={filters.targetType}
              onChange={v => setFilters({ ...filters, targetType: v })}
              options={['MEMBER', 'CAMP', 'COURSE', 'CHECK_IN', 'TODO', 'LAGGING', 'CONVERSION', 'CAMP_MEMBER', 'BENEFIT', 'USER'].map(v => ({ label: v, value: v }))} />
          </Space>
          <Space wrap size="middle">
            <Select allowClear showSearch placeholder="操作人" style={{ width: 140 }}
              value={filters.operatorId}
              onChange={v => setFilters({ ...filters, operatorId: v })}
              options={operators.map(u => ({ label: u.name, value: u.id }))} />
            <Select allowClear showSearch placeholder="关联会员" style={{ width: 170 }}
              value={filters.memberId}
              onChange={v => setFilters({ ...filters, memberId: v })}
              filterOption={(i, o: any) => o?.label?.includes(i)}
              options={members.map(m => ({ label: `${m.name}（${m.phone}）`, value: m.id }))} />
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索关键词/ID/名称" style={{ width: 200 }}
              value={filters.keyword}
              onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
            <Tooltip title="清除所有筛选">
              <Button icon={<FilterOutlined />} onClick={() => setFilters({
                dateRange: [dayjs().subtract(7, 'day'), dayjs()],
                action: undefined, targetType: undefined, operatorId: undefined,
                memberId: undefined, targetId: undefined, keyword: ''
              })}>重置</Button>
            </Tooltip>
            <Segmented
              value={viewMode}
              onChange={v => setViewMode(v as any)}
              options={[
                { label: '📋 表格视图', value: 'table' },
                { label: '⏱ 时间线', value: 'timeline' }
              ]}
            />
          </Space>
        </div>

        {viewMode === 'table' ? (
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={{
              ...pagination, total, showSizeChanger: true, showQuickJumper: true,
              showTotal: (t, r) => `共 ${t} 条记录 · 本页 ${r[0]}-${r[1]} 条`,
              onChange: (p, ps) => setPagination({ current: p, pageSize: ps })
            }}
            scroll={{ x: 1400 }}
            size="small"
          />
        ) : (
          <div style={{ maxHeight: 650, overflowY: 'auto', padding: '12px 0' }}>
            {!data.length ? <Empty description="暂无操作日志" /> : (
              <Timeline
                mode="left"
                items={data.map((log: any) => {
                  const color = getActionColor(log.action);
                  return {
                    color,
                    dot: <span style={{ fontSize: 14 }}>{getActionIcon(log.action)}</span>,
                    label: (
                      <div style={{ padding: '6px 0' }}>
                        <div style={{ fontWeight: 500, color }}>{dayjs(log.createdAt).format('HH:mm:ss')}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{dayjs(log.createdAt).format('MM-DD')}</div>
                      </div>
                    ),
                    children: (
                      <Card size="small" bordered={false} hoverable
                        style={{ background: '#fafafa', margin: '2px 0 6px', padding: 6 }}
                        onClick={() => openDetail(log)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Space wrap size={6}>
                            <Tag color={color} style={{ margin: 0, fontSize: 11, padding: '0 6px' }} icon={getActionIcon(log.action)}>
                              {operationActionLabel[log.action as keyof typeof operationActionLabel] || log.action}
                            </Tag>
                            <Tag color="geekblue" style={{ margin: 0, fontSize: 10 }}>{log.targetType}#{log.targetId}</Tag>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{log.targetName}</span>
                          </Space>
                          <Space>
                            {log.operator && (
                              <Tag color="default" style={{ fontSize: 10, margin: 0 }}>👤 {log.operator.name}</Tag>
                            )}
                            <span style={{ fontSize: 10, color: '#999' }}>
                              {log.traceId && <><LinkOutlined /> {log.traceId.slice(-6)}</>}
                            </span>
                          </Space>
                        </div>
                        {log.detail && <div style={{ fontSize: 12, color: '#666', padding: '4px 0' }}>{log.detail}</div>}
                        <Space wrap size={4} style={{ marginTop: 4 }}>
                          {log.oldValue && (
                            <Tooltip title={typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue, null, 2) : String(log.oldValue)}>
                              <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>变更前</Tag>
                            </Tooltip>
                          )}
                          {log.newValue && (
                            <Tooltip title={typeof log.newValue === 'object' ? JSON.stringify(log.newValue, null, 2) : String(log.newValue)}>
                              <Tag color="green" style={{ margin: 0, fontSize: 10 }}>变更后</Tag>
                            </Tooltip>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>
                              Meta: {Object.keys(log.metadata).length}项
                            </Tag>
                          )}
                        </Space>
                      </Card>
                    )
                  };
                })}
              />
            )}
          </div>
        )}
      </Card>

      <Drawer
        title={detail && (
          <Space>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: getActionColor(detail.action) + '22',
              color: getActionColor(detail.action),
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
            }}>
              {getActionIcon(detail.action)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {operationActionLabel[detail.action as keyof typeof operationActionLabel] || detail.action}
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                <span style={{ marginLeft: 8 }}>Trace: {detail.traceId || '—'}</span>
              </div>
            </div>
          </Space>
        )}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetail(null); }}
        width={620}>
        {detail && (
          <div>
            <Alert
              type="info"
              showIcon
              message={
                <Space>
                  <ClockCircleOutlined style={{ fontSize: 13 }} />
                  <span>操作时间：{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                  <Divider type="vertical" style={{ margin: 0 }} />
                  <span>{dayjs(detail.createdAt).fromNow()}</span>
                  {detail.traceId && (
                    <>
                      <Divider type="vertical" style={{ margin: 0 }} />
                      <span>Trace ID：<code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{detail.traceId}</code></span>
                    </>
                  )}
                </Space>
              }
              style={{ marginBottom: 16 }}
            />

            <Tabs
              size="small"
              items={[
                {
                  key: 'basic',
                  label: '基础信息',
                  children: (
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="操作类型">
                        <Tag color={getActionColor(detail.action)}>
                          {operationActionLabel[detail.action as keyof typeof operationActionLabel] || detail.action}
                        </Tag>
                        <span style={{ color: '#999', marginLeft: 8, fontSize: 11 }}>原始值: {detail.action}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="操作对象">
                        <Tag color="geekblue" style={{ fontSize: 11 }}>{detail.targetType}</Tag>
                        <span style={{ margin: '0 8px' }}>ID: <b>#{detail.targetId}</b></span>
                        {detail.targetName && <span>名称: <b>{detail.targetName}</b></span>}
                      </Descriptions.Item>
                      <Descriptions.Item label="操作人">
                        {detail.operator ? (
                          <Space>
                            <Avatar size={28} style={{ backgroundColor: '#1677ff' }}>{detail.operator.name.charAt(0)}</Avatar>
                            <div>
                              <div style={{ fontWeight: 500 }}>{detail.operator.name}</div>
                              <div style={{ fontSize: 11, color: '#999' }}>
                                角色：{detail.operator.role} · @{detail.operator.username || ''}
                              </div>
                            </div>
                          </Space>
                        ) : <Tag color="default">系统自动触发</Tag>}
                      </Descriptions.Item>
                      {detail.member && (
                        <Descriptions.Item label="关联会员">
                          <Space>
                            <Avatar size={24} style={{ backgroundColor: '#52c41a', fontSize: 11 }}>{detail.member.name.charAt(0)}</Avatar>
                            <div>
                              <div style={{ fontWeight: 500 }}>{detail.member.name}</div>
                              <div style={{ fontSize: 11, color: '#999' }}>{detail.member.phone} · {detail.member.level}</div>
                            </div>
                          </Space>
                        </Descriptions.Item>
                      )}
                      {detail.ip && <Descriptions.Item label="来源IP">{detail.ip}</Descriptions.Item>}
                      {detail.userAgent && (
                        <Descriptions.Item label="客户端信息">
                          <span style={{ fontSize: 11, color: '#666' }}>{detail.userAgent}</span>
                        </Descriptions.Item>
                      )}
                      {detail.detail && (
                        <Descriptions.Item label="操作描述/摘要">
                          <div style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.6 }}>{detail.detail}</div>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  )
                },
                {
                  key: 'change',
                  label: <span>变更详情 <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>{(detail.oldValue || detail.newValue) ? '有变更' : '无'}</Tag></span>,
                  children: !detail.oldValue && !detail.newValue ? (
                    <Empty description="该操作没有记录字段变更" />
                  ) : (
                    <Row gutter={[12, 12]}>
                      {detail.oldValue && (
                        <Col span={12}>
                          <Divider orientation="left" plain style={{ margin: '4px 0' }}>
                            <Tag color="orange">变更前（oldValue）</Tag>
                          </Divider>
                          <Card size="small" bordered={false} style={{ background: '#fff7e6' }}>
                            <pre style={{
                              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                              fontSize: 12, lineHeight: 1.6, color: '#666'
                            }}>
                              {typeof detail.oldValue === 'object'
                                ? JSON.stringify(detail.oldValue, null, 2)
                                : String(detail.oldValue)}
                            </pre>
                          </Card>
                        </Col>
                      )}
                      {detail.newValue && (
                        <Col span={12}>
                          <Divider orientation="left" plain style={{ margin: '4px 0' }}>
                            <Tag color="green">变更后（newValue）</Tag>
                          </Divider>
                          <Card size="small" bordered={false} style={{ background: '#f6ffed' }}>
                            <pre style={{
                              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                              fontSize: 12, lineHeight: 1.6, color: '#333'
                            }}>
                              {typeof detail.newValue === 'object'
                                ? JSON.stringify(detail.newValue, null, 2)
                                : String(detail.newValue)}
                            </pre>
                          </Card>
                        </Col>
                      )}
                    </Row>
                  )
                },
                {
                  key: 'meta',
                  label: <span>扩展信息 <Tag color="purple" style={{ marginLeft: 4, fontSize: 10 }}>Metadata</Tag></span>,
                  children: !detail.metadata || Object.keys(detail.metadata).length === 0 ? (
                    <Empty description="该操作没有附加信息" />
                  ) : (
                    <Card size="small" bordered={false} style={{ background: '#fafafa' }}>
                      <pre style={{
                        margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        fontSize: 12, lineHeight: 1.7
                      }}>
                        {JSON.stringify(detail.metadata, null, 2)}
                      </pre>
                    </Card>
                  )
                }
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
