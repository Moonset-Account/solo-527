import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Tag, Table, Button, Space, Select,
  Input, DatePicker, Tabs, Empty, Descriptions, Drawer, Divider,
  List, Progress, Tooltip, Radio, Segmented, Badge, Timeline
} from 'antd';
import {
  UserOutlined, TeamOutlined, CrownOutlined, SwapOutlined,
  TrendingUpOutlined, SearchOutlined, FilterOutlined,
  LinkOutlined, EyeOutlined, HistoryOutlined, MessageOutlined,
  ArrowUpOutlined, ArrowDownOutlined, ExportOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { conversionApi } from '../../services/api';
import dayjs from 'dayjs';
import { funnelStageLabel, funnelStageColor, channelTypeLabel } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

export default function ConversionStats() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState<any>({
    dateRange: [dayjs().subtract(30, 'day'), dayjs()],
    sourceId: undefined, channel: undefined, stage: undefined, keyword: ''
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [logDetail, setLogDetail] = useState<any>(null);
  const [sourceLogs, setSourceLogs] = useState<any[]>([]);
  const [sourceLogsLoading, setSourceLogsLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadLogs(); }, [pagination.current, pagination.pageSize, filters]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const start = filters.dateRange[0].startOf('day').toDate();
      const end = filters.dateRange[1].endOf('day').toDate();
      const [src, st, fn] = await Promise.all([
        conversionApi.sources(),
        conversionApi.stats({ start, end }),
        conversionApi.funnel({ start, end })
      ]);
      setSources(src);
      setStats(st);
      setFunnel(fn);
    } finally { setLoading(false); }
  };

  const loadLogs = async () => {
    try {
      const res = await conversionApi.logs({
        page: pagination.current, pageSize: pagination.pageSize,
        sourceId: filters.sourceId, channel: filters.channel,
        stage: filters.stage, keyword: filters.keyword,
        start: filters.dateRange[0]?.toDate(), end: filters.dateRange[1]?.toDate()
      });
      setLogs(res.list);
      setLogsTotal(res.total);
    } catch {}
  };

  const openLogDetail = (log: any) => {
    setLogDetail(log);
    setDetailOpen(true);
  };

  const loadSourceLogs = async (source: any) => {
    try {
      setSourceLogsLoading(true);
      const start = filters.dateRange[0].toDate();
      const end = filters.dateRange[1].toDate();
      const res = await conversionApi.logs({ sourceId: source.id, start, end, pageSize: 50 });
      setSourceLogs(res.list);
      setDetailOpen(true);
    } finally { setSourceLogsLoading(false); }
  };

  const maxFunnel = Math.max(...funnel.map(f => f.count || 0), 1);

  const logColumns: ColumnsType<any> = [
    {
      title: '漏斗阶段',
      dataIndex: 'stage',
      width: 100,
      render: s => <Tag color={funnelStageColor[s as keyof typeof funnelStageColor]} style={{ width: 70, textAlign: 'center' }}>
        {funnelStageLabel[s as keyof typeof funnelStageLabel]}
      </Tag>,
      sorter: true
    },
    {
      title: '会员',
      dataIndex: 'member',
      width: 180,
      render: m => m ? (
        <Space>
          <span style={{ fontWeight: 500 }}>{m.name}</span>
          <Tag color="default">{m.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Tag>
        </Space>
      ) : <Tag color="default">未注册</Tag>
    },
    {
      title: '转化来源',
      dataIndex: 'conversionSource',
      width: 160,
      render: s => s ? (
        <Space>
          <Tag color={s.channel === 'WECHAT_GROUP' ? 'green' : s.channel === 'REFERRAL' ? 'purple' : s.channel === 'OFFLINE' ? 'blue' : 'orange'}>
            {channelTypeLabel[s.channel as keyof typeof channelTypeLabel]}
          </Tag>
          <span style={{ fontSize: 12 }}>{s.name}</span>
        </Space>
      ) : null
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 100,
      render: c => c && <Tag>{channelTypeLabel[c as keyof typeof channelTypeLabel]}</Tag>
    },
    {
      title: '关键词/链接',
      dataIndex: 'keyword',
      render: (k, r) => (
        <Space wrap size={4}>
          {k && <Tag color="blue">关键词:{k}</Tag>}
          {r.refUrl && <Tooltip title={r.refUrl}><Tag color="cyan" icon={<LinkOutlined />}>来源链接</Tag></Tooltip>}
          {r.utmSource && <Tag>utm:{r.utmSource}</Tag>}
        </Space>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: r => r || '—'
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 100,
      render: o => o ? (
        <Space>
          <span style={{ fontSize: 11, color: '#999' }}>👤</span>
          <span style={{ fontSize: 12 }}>{o.name}</span>
        </Space>
      ) : <Tag color="default" style={{ fontSize: 11 }}>系统</Tag>
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 150,
      render: t => (
        <div>
          <div>{dayjs(t).format('MM-DD HH:mm')}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{dayjs(t).fromNow()}</div>
        </div>
      ),
      defaultSortOrder: 'descend',
      sorter: true
    },
    {
      title: '操作',
      key: 'op',
      width: 80,
      render: (_, r) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openLogDetail(r)}>详情</Button>
      )
    }
  ];

  const StatBox = ({ icon, label, value, color, bg, sub, trend }: any) => (
    <Card size="small" bordered={false} style={{ background: bg }} styles={{ body: { padding: 14 } }}>
      <Row align="middle" gutter={12}>
        <Col span={6}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>{icon}</div></Col>
        <Col span={18}>
          <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {value}
            {trend !== undefined && (
              <span style={{ fontSize: 12, fontWeight: 400, color: trend >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {sub && <div style={{ fontSize: 11, color: '#999' }}>{sub}</div>}
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>转化来源统计</h2>
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            全渠道转化漏斗、来源多维筛选、操作历史可追溯
          </div>
        </div>
        <Space wrap>
          <RangePicker
            allowClear={false}
            value={filters.dateRange}
            onChange={(v: any) => { setFilters({ ...filters, dateRange: v || [dayjs().subtract(30, 'day'), dayjs()] }); setTimeout(loadAll, 0); }}
            showTime
            style={{ width: 360 }}
          />
          <Button icon={<ExportOutlined />}>导出报表</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<UserOutlined />} label="线索总数" value={stats?.totalLeads || 0} suffix="条" color="#1677ff"
            bg="linear-gradient(135deg, #e6f4ff, #bae0ff)" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<MessageOutlined />} label="已接触" value={stats?.totalContacted || 0} suffix="条" color="#722ed1"
            bg="linear-gradient(135deg, #f9f0ff, #efdbff)" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<EyeOutlined />} label="试听体验" value={stats?.totalTrial || 0} suffix="人" color="#fa8c16"
            bg="linear-gradient(135deg, #fff7e6, #ffd591)" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<CrownOutlined />} label="转化付费" value={stats?.totalConverted || 0} suffix="人" color="#52c41a"
            bg="linear-gradient(135deg, #f6ffed, #b7eb8f)" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<TrendingUpOutlined />} label="总体转化率" value={`${stats?.conversionRate || 0}%`} color="#eb2f96"
            bg="linear-gradient(135deg, #fff0f6, #ffadd2)" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<ShoppingCartOutlined />} label="新增会员" value={stats?.newMembers || 0} suffix="人" color="#08979c"
            bg="linear-gradient(135deg, #e6fffb, #87e8de)" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card title={<span><SwapOutlined /> 转化漏斗 <Tag color="blue" style={{ marginLeft: 8 }}>{dayjs(filters.dateRange[0]).format('MM-DD')} ~ {dayjs(filters.dateRange[1]).format('MM-DD')}</Tag></span>}
            bordered={false}>
            <div style={{ padding: '20px 12px' }}>
              {funnel.map((stage, i) => {
                const prev = i > 0 ? funnel[i - 1].count : stage.count;
                const convRate = i === 0 ? 100 : Math.round(stage.count / prev * 100);
                const width = Math.max((stage.count / maxFunnel) * 100, 8);
                const colors = ['#1677ff', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96'];
                return (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Space>
                        <Tag color={funnelStageColor[stage.stage as keyof typeof funnelStageColor]} style={{ margin: 0 }}>
                          {funnelStageLabel[stage.stage as keyof typeof funnelStageLabel]}
                        </Tag>
                        {i > 0 && (
                          <Badge count={`转化率 ${convRate}%`} showZero
                            style={{ backgroundColor: convRate < 50 ? '#ff4d4f' : convRate < 75 ? '#faad14' : '#52c41a', padding: '0 8px', boxShadow: 'none' }} />
                        )}
                      </Space>
                      <Space>
                        <span style={{ fontWeight: 600, fontSize: 16, color: colors[i % 5] }}>{stage.count}</span>
                        <span style={{ color: '#999', fontSize: 11 }}>人</span>
                      </Space>
                    </div>
                    <div style={{
                      height: 40,
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${colors[i % 5]}, ${colors[i % 5]}bb)`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 14px',
                      color: '#fff',
                      fontWeight: 600,
                      boxShadow: `0 2px 8px ${colors[i % 5]}33`
                    }}>
                      {stage.stage}
                    </div>
                    {i < funnel.length - 1 && (
                      <div style={{ marginLeft: '50%', transform: 'translateX(-50%)', color: '#999', fontSize: 20, lineHeight: 1, margin: '4px 0' }}>
                        ↓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title={<span><TeamOutlined /> 转化来源明细（按来源统计）</span>} bordered={false}>
            {loading ? <Empty description="加载中..." /> : (
              <div style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 8 }}>
                <Table
                  rowKey="id"
                  size="small"
                  showHeader
                  columns={[
                    {
                      title: '来源名称',
                      dataIndex: 'name',
                      render: (n, r: any) => (
                        <a onClick={() => loadSourceLogs(r)} style={{ fontWeight: 500 }}>
                          {n}
                          <Tag color={r.channel === 'WECHAT_GROUP' ? 'green' : r.channel === 'REFERRAL' ? 'purple' : r.channel === 'OFFLINE' ? 'blue' : 'orange'} style={{ marginLeft: 8 }}>
                            {channelTypeLabel[r.channel as keyof typeof channelTypeLabel]}
                          </Tag>
                        </a>
                      )
                    },
                    {
                      title: '线索', dataIndex: 'totalLeads', width: 80,
                      render: (n, r: any) => <span style={{ fontWeight: 600 }}>{r.totalLeads || r.total}</span>,
                      align: 'right'
                    },
                    {
                      title: '已转化', dataIndex: 'convertedCount', width: 80,
                      render: n => <span style={{ fontWeight: 600, color: '#52c41a' }}>{n || 0}</span>, align: 'right'
                    },
                    {
                      title: '转化率', dataIndex: 'conversionRate', width: 120,
                      render: (n, r: any) => {
                        const rate = n || (r.totalLeads && r.convertedCount ? Math.round(r.convertedCount / r.totalLeads * 100) : 0);
                        return (
                          <Space>
                            <Progress percent={rate} size="small" style={{ width: 80 }} status={rate >= 30 ? 'success' : rate >= 15 ? 'normal' : 'exception'} />
                            <span style={{ fontWeight: 600 }}>{rate}%</span>
                          </Space>
                        );
                      }
                    },
                    {
                      title: '状态', dataIndex: 'isActive', width: 70,
                      render: a => <Tag color={a ? 'success' : 'default'}>{a ? '启用' : '停用'}</Tag>, align: 'center'
                    },
                    {
                      title: '操作', width: 90,
                      render: (_, r: any) => (
                        <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => loadSourceLogs(r)}>操作历史</Button>
                      )
                    }
                  ]}
                  dataSource={sources}
                  pagination={false}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16 }}
        bordered={false}
        title={<span><FilterOutlined /> 转化操作历史（可筛选）</span>}
        extra={
          <Space>
            <Select allowClear placeholder="来源" style={{ width: 160 }}
              value={filters.sourceId}
              onChange={v => setFilters({ ...filters, sourceId: v })}
              options={sources.map(s => ({ label: s.name, value: s.id }))} />
            <Select allowClear placeholder="阶段" style={{ width: 120 }}
              value={filters.stage}
              onChange={v => setFilters({ ...filters, stage: v })}
              options={Object.entries(funnelStageLabel).map(([v, l]) => ({ label: l, value: v }))} />
            <Select allowClear placeholder="渠道" style={{ width: 120 }}
              value={filters.channel}
              onChange={v => setFilters({ ...filters, channel: v })}
              options={Object.entries(channelTypeLabel).map(([v, l]) => ({ label: l, value: v }))} />
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索姓名/电话/关键词" style={{ width: 220 }}
              value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="small"
          columns={logColumns}
          dataSource={logs}
          pagination={{
            ...pagination, total: logsTotal, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 条转化记录`,
            onChange: (p, ps) => setPagination({ current: p, pageSize: ps })
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer title={logDetail ? '转化记录详情' : `来源明细 · ${logDetail?.conversionSource?.name || ''}`}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setLogDetail(null); setSourceLogs([]); }}
        width={640}>
        {logDetail ? (
          <div>
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color={funnelStageColor[logDetail.stage as keyof typeof funnelStageColor]} style={{ fontSize: 12, padding: '4px 12px' }}>
                {funnelStageLabel[logDetail.stage as keyof typeof funnelStageLabel]}
              </Tag>
              {logDetail.channel && (
                <Tag color={logDetail.channel === 'WECHAT_GROUP' ? 'green' : logDetail.channel === 'REFERRAL' ? 'purple' : 'orange'}>
                  {channelTypeLabel[logDetail.channel as keyof typeof channelTypeLabel]}
                </Tag>
              )}
              {logDetail.conversionSource && (
                <Tag>来源：{logDetail.conversionSource.name}</Tag>
              )}
            </Space>

            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              {logDetail.member ? (
                <>
                  <Descriptions.Item label="关联会员" span={2}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{logDetail.member.name}</span>
                      <Tag color="blue">{logDetail.member.level}</Tag>
                      <span style={{ color: '#999' }}><PhoneOutlined /> {logDetail.member.phone}</span>
                    </div>
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label="潜在客户" span={2}>
                  尚未注册，仅留线索
                </Descriptions.Item>
              )}
              {logDetail.contactName && <Descriptions.Item label="联系人">{logDetail.contactName}</Descriptions.Item>}
              {logDetail.contactPhone && <Descriptions.Item label="联系电话">{logDetail.contactPhone}</Descriptions.Item>}
              {logDetail.keyword && <Descriptions.Item label="关键词">{logDetail.keyword}</Descriptions.Item>}
              {logDetail.utmSource && <Descriptions.Item label="UTM来源">{logDetail.utmSource}</Descriptions.Item>}
              {logDetail.utmCampaign && <Descriptions.Item label="UTM活动">{logDetail.utmCampaign}</Descriptions.Item>}
              {logDetail.refUrl && (
                <Descriptions.Item label="来源链接" span={2}>
                  <a href={logDetail.refUrl} target="_blank" rel="noreferrer"><LinkOutlined /> {logDetail.refUrl}</a>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="操作人" span={2}>
                {logDetail.operator?.name || '系统自动'}
                {logDetail.operator?.role && <Tag style={{ marginLeft: 8 }}>{logDetail.operator.role}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(logDetail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                <span style={{ marginLeft: 8, color: '#999' }}>（{dayjs(logDetail.createdAt).fromNow()}）</span>
              </Descriptions.Item>
              {logDetail.remark && (
                <Descriptions.Item label="备注" span={2}>{logDetail.remark}</Descriptions.Item>
              )}
            </Descriptions>

            {logDetail.metadata && Object.keys(logDetail.metadata).length > 0 && (
              <>
                <Divider orientation="left" plain style={{ margin: '8px 0 12px' }}>附加信息（Metadata）</Divider>
                <Card size="small" style={{ background: '#fafafa', marginBottom: 16 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {JSON.stringify(logDetail.metadata, null, 2)}
                  </pre>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div>
            <Alert type="info" showIcon message={`共 ${sourceLogs.length} 条相关操作记录`} style={{ marginBottom: 16 }} />
            <Timeline
              size="small"
              items={sourceLogs.map((log: any) => ({
                color: log.stage === 'CONVERTED' ? 'green' : log.stage === 'TRIAL' ? 'blue' : log.stage === 'CONTACTED' ? 'orange' : 'gray',
                label: <span style={{ fontSize: 11, color: '#999' }}>{dayjs(log.createdAt).format('MM-DD HH:mm')}</span>,
                children: (
                  <Card size="small" bordered={false} style={{ background: '#fafafa', padding: 10 }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space wrap size={6}>
                        <Tag color={funnelStageColor[log.stage as keyof typeof funnelStageColor]} style={{ margin: 0, fontSize: 11 }}>
                          {funnelStageLabel[log.stage as keyof typeof funnelStageLabel]}
                        </Tag>
                        {log.member && <span style={{ fontWeight: 500 }}>{log.member.name}</span>}
                        {log.operator && <Tag color="default" style={{ fontSize: 11, margin: 0 }}>👤 {log.operator.name}</Tag>}
                      </Space>
                      {log.keyword && <div style={{ fontSize: 11, color: '#999' }}>关键词: {log.keyword}</div>}
                      {log.remark && <div style={{ fontSize: 12, color: '#666' }}>{log.remark}</div>}
                    </Space>
                  </Card>
                )
              }))}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
