import { useEffect, useMemo, useState } from 'react';
import {
  Card, Row, Col, Statistic, Tag, Table, Button, Space, Select,
  DatePicker, Segmented, Progress, Empty, Divider, Alert,
  Tabs, Typography, Badge, Tooltip, List, Descriptions
} from 'antd';
import {
  CrownOutlined, CalendarOutlined, TeamOutlined, ArrowUpOutlined,
  ClockCircleOutlined, WarningOutlined, ShoppingCartOutlined,
  FundProjectionScreenOutlined, LineChartOutlined, FileTextOutlined,
  ExportOutlined, InfoCircleOutlined, PlayCircleOutlined, UserOutlined,
  RocketOutlined, CheckCircleOutlined, DownOutlined, UpOutlined
} from '@ant-design/icons';
import { reportApi, campApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  campStatusColor, campStatusLabel, memberLevelColor, memberLevelLabel,
  memberStatusColor, memberStatusLabel
} from '../../types';
import type { ColumnsType } from 'antd/es/table';

export default function RetentionReport() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [overview, setOverview] = useState<any>(null);
  const [retention, setRetention] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<number | undefined>();
  const [expiringData, setExpiringData] = useState<any[]>([]);
  const [checkInTrend, setCheckInTrend] = useState<any[]>([]);
  const [dailyRetention, setDailyRetention] = useState<any[]>([]);

  const days = Number(period);

  useEffect(() => { loadAll(); }, [period, selectedCampId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const start = dayjs().subtract(days, 'day').startOf('day').toDate();
      const end = dayjs().endOf('day').toDate();

      const [overviewRes, retentionRes, campRes, trendRes] = await Promise.all([
        reportApi.dashboard(),
        reportApi.retention({ periodDays: days, campId: selectedCampId }),
        campApi.active(),
        reportApi.checkIn({ start, end })
      ]);
      setOverview(overviewRes);
      setRetention(retentionRes.data || []);
      setCamps(campRes);
      setCheckInTrend(trendRes.data || trendRes.daily || []);
      setDailyRetention(retentionRes.daily || []);
      setExpiringData(retentionRes.expiringForecast || []);
    } finally { setLoading(false); }
  };

  const latestRetention = retention[0] || {};
  const d1 = latestRetention.day1 ? (latestRetention.day1.retentionRate * 100).toFixed(1) : '0';
  const d3 = latestRetention.day3 ? (latestRetention.day3.retentionRate * 100).toFixed(1) : '0';
  const d7 = latestRetention.day7 ? (latestRetention.day7.retentionRate * 100).toFixed(1) : '0';
  const d14 = latestRetention.day14 ? (latestRetention.day14.retentionRate * 100).toFixed(1) : '0';
  const d30 = latestRetention.day30 ? (latestRetention.day30.retentionRate * 100).toFixed(1) : '0';

  // 打卡趋势可视化
  const maxCheckIn = Math.max(...checkInTrend.map(t => t.total || 0), 1);

  const StatBox = ({ icon, label, value, color, bg, suffix, sub, note }: any) => (
    <Card size="small" bordered={false} style={{ background: bg }} styles={{ body: { padding: 14 } }}>
      <Row align="middle" gutter={12}>
        <Col span={6}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
            {icon}
          </div>
        </Col>
        <Col span={18}>
          <div style={{ color: '#666', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {label}
            {note && <Tooltip title={note}><InfoCircleOutlined style={{ color: '#ccc' }} /></Tooltip>}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2 }}>
            {value}<span style={{ fontSize: 13, fontWeight: 400, color: '#999', marginLeft: 4 }}>{suffix}</span>
          </div>
          {sub && <div style={{ fontSize: 11, color: '#999' }}>{sub}</div>}
        </Col>
      </Row>
    </Card>
  );

  const cohortColumns: ColumnsType<any> = [
    {
      title: '注册期',
      dataIndex: 'startDate',
      width: 110,
      fixed: 'left',
      render: (t, r: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dayjs(t).format('MM-DD')}</div>
          <div style={{ fontSize: 11, color: '#999' }}>新增 {r.newCount} 人</div>
        </div>
      )
    },
    {
      title: 'D0 新用户',
      dataIndex: 'day0',
      width: 90,
      align: 'center',
      render: d => <span style={{ fontWeight: 600 }}>{d?.active || '-'}</span>
    },
    ...([1, 3, 7, 14, 30] as const).map(d => ({
      title: <div style={{ textAlign: 'center' }}>
        <div>D{d}</div>
        <div style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>
          {latestRetention[`day${d}`] ? `${(latestRetention[`day${d}`].retentionRate * 100).toFixed(1)}%` : '-'}
        </div>
      </div>,
      dataIndex: `day${d}`,
      width: 90,
      align: 'center' as const,
      render: (v: any) => {
        if (!v || v.active === null || v.active === undefined) return <span style={{ color: '#e0e0e0' }}>—</span>;
        const rate = v.retentionRate;
        const color = rate >= 0.6 ? '#52c41a' : rate >= 0.4 ? '#52c41a' : rate >= 0.25 ? '#faad14' : '#ff4d4f';
        const bg = rate >= 0.6 ? '#f6ffed' : rate >= 0.4 ? '#f6ffed' : rate >= 0.25 ? '#fffbe6' : '#fff2f0';
        return (
          <Tooltip title={`留存${v.active}人 · 流失${v.lost || 0}人${v.expiredToTodo ? ` · 过期待办${v.expiredToTodo}` : ''}`}>
            <div style={{
              padding: '4px 0', background: bg, borderRadius: 4,
              border: `1px solid ${color}33`
            }}>
              <div style={{ fontWeight: 600, color }}>{(rate * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 10, color: '#999' }}>{v.active}人</div>
            </div>
          </Tooltip>
        );
      }
    }))
  ];

  const retentionCardColumns: ColumnsType<any> = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 100,
      render: d => <span style={{ fontWeight: 500 }}>{dayjs(d).format('MM-DD')}</span>
    },
    {
      title: '累计订阅',
      dataIndex: 'totalSubscriptions',
      width: 100,
      render: n => <span style={{ fontWeight: 600 }}>{n}</span>, align: 'right'
    },
    {
      title: '活跃',
      dataIndex: 'activeCount',
      width: 90,
      render: n => <Tag color="green" style={{ margin: 0, width: '100%', textAlign: 'center' }}>{n}</Tag>, align: 'center'
    },
    {
      title: '新增付费',
      dataIndex: 'newPaid',
      width: 90,
      render: n => <span style={{ color: '#52c41a', fontWeight: 600 }}>+{n}</span>, align: 'right'
    },
    {
      title: '到期',
      dataIndex: 'expired',
      width: 90,
      render: n => <span style={{ color: '#faad14' }}>{n}</span>, align: 'right'
    },
    {
      title: '续费率',
      dataIndex: 'renewalRate',
      width: 110,
      render: (n, r: any) => (
        <Space>
          <Progress percent={Math.round((r.renewed / Math.max(r.expired, 1)) * 100)} size="small" style={{ width: 60 }} />
          <span style={{ fontWeight: 600 }}>{Math.round((r.renewed / Math.max(r.expired, 1)) * 100)}%</span>
        </Space>
      )
    },
    {
      title: '流失',
      dataIndex: 'lost',
      width: 90,
      render: n => <span style={{ color: '#ff4d4f' }}>{n}</span>, align: 'right'
    },
    {
      title: '过期→待办',
      dataIndex: 'expiredToTodo',
      width: 100,
      render: n => (
        <Space>
          <Tag color="red" style={{ margin: 0 }}>{n}</Tag>
          <FileTextOutlined style={{ color: '#fa8c16' }} />
        </Space>
      ),
      align: 'center'
    },
    {
      title: '续费率',
      key: 'rate',
      width: 110,
      render: (_, r: any) => {
        const rate = r.totalSubscriptions > 0 ? ((r.totalSubscriptions - r.lost) / r.totalSubscriptions * 100).toFixed(1) : '0';
        const color = Number(rate) >= 85 ? '#52c41a' : Number(rate) >= 70 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{rate}%</span>;
      },
      align: 'right'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FundProjectionScreenOutlined style={{ color: '#1677ff' }} />
            订阅留存报表
            <Badge status="processing" text={selectedCampId ? camps.find(c => c.id === selectedCampId)?.name : '全量数据'} />
          </h2>
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            订阅留存、打卡趋势、到期预警、流失分析 — 课程过期自动进入待办，影响留存数据
          </div>
        </div>
        <Space>
          <Segmented
            value={period}
            onChange={v => setPeriod(v as any)}
            options={[
              { label: '近7天', value: '7' },
              { label: '近30天', value: '30' },
              { label: '近90天', value: '90' }
            ]}
          />
          <Select allowClear placeholder="按营期筛选" style={{ width: 200 }}
            value={selectedCampId}
            onChange={v => setSelectedCampId(v)}
            options={camps.map(c => ({
              label: `${c.name}（${campStatusLabel[c.status as keyof typeof campStatusLabel]} · ${c.memberCount || 0}人）`,
              value: c.id
            }))} />
          <Button icon={<ExportOutlined />}>导出</Button>
        </Space>
      </div>

      <Alert
        type="warning"
        showIcon
        message={<span>
          <b>数据联动说明：</b>课程过期时，系统会自动在「待办中心」创建 <Tag color="orange" style={{ margin: 0 }}>课程过期</Tag> 类型待办，并在报表中记录为 <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>expiredToTodo</code>。完成跟进并续费的学员会计入续费率。
        </span>}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<CrownOutlined />} label="累计订阅数" value={overview?.totalMembers || 0} suffix="人" color="#1677ff"
            bg="linear-gradient(135deg, #e6f4ff, #bae0ff)" note="历史累计付费会员数" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<RocketOutlined />} label={`期间新增`} value={overview?.newMembers || 0} suffix="人" color="#52c41a"
            bg="linear-gradient(135deg, #f6ffed, #b7eb8f)" sub={`${dayjs().subtract(days, 'day').format('MM-DD')}至今`} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<CheckCircleOutlined />} label="活跃会员" value={overview?.activeMembers || 0} suffix="人" color="#722ed1"
            bg="linear-gradient(135deg, #f9f0ff, #efdbff)" note="期间内有打卡/登录行为" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<ClockCircleOutlined />} label="即将到期" value={overview?.expiringMembers || 0} suffix="人" color="#faad14"
            bg="linear-gradient(135deg, #fffbe6, #fff1b8)" note="30天内到期" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<WarningOutlined />} label="已过期未续" value={overview?.expiredMembers || 0} suffix="人" color="#ff4d4f"
            bg="linear-gradient(135deg, #fff2f0, #ffccc7)" note="需及时跟进续费" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<LineChartOutlined />} label="总体续费率"
            value={overview?.totalMembers ? `${(((overview.totalMembers || 0) - (overview.expiredMembers || 0)) / overview.totalMembers * 100).toFixed(1)}%` : '0%'}
            color="#08979c" bg="linear-gradient(135deg, #e6fffb, #87e8de)"
            sub={`流失率 ${overview?.totalMembers ? ((overview.expiredMembers || 0) / overview.totalMembers * 100).toFixed(1) : 0}%`} />
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={5}>
          <Card title="📊 留存率看板（Cohort）" bordered={false} size="small">
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Statistic title="次日留存 (D1)" value={d1} suffix="%" valueStyle={{ fontSize: 28, color: Number(d1) >= 60 ? '#52c41a' : '#faad14' }} />
                <Progress percent={Number(d1)} size="small" status={Number(d1) >= 60 ? 'success' : 'active'} style={{ margin: '4px 0 8px' }} />
              </Col>
              <Col span={12}>
                <Statistic title="3日 (D3)" value={d3} suffix="%" valueStyle={{ fontSize: 18, color: Number(d3) >= 40 ? '#52c41a' : '#faad14' }} />
                <Progress percent={Number(d3)} size="small" />
              </Col>
              <Col span={12}>
                <Statistic title="7日 (D7)" value={d7} suffix="%" valueStyle={{ fontSize: 18, color: Number(d7) >= 30 ? '#52c41a' : '#faad14' }} />
                <Progress percent={Number(d7)} size="small" />
              </Col>
              <Col span={12}>
                <Statistic title="14日 (D14)" value={d14} suffix="%" valueStyle={{ fontSize: 18, color: Number(d14) >= 25 ? '#52c41a' : '#ff4d4f' }} />
                <Progress percent={Number(d14)} size="small" status={Number(d14) < 25 ? 'exception' : undefined} />
              </Col>
              <Col span={12}>
                <Statistic title="30日 (D30)" value={d30} suffix="%" valueStyle={{ fontSize: 18, color: Number(d30) >= 20 ? '#52c41a' : '#ff4d4f' }} />
                <Progress percent={Number(d30)} size="small" status={Number(d30) < 20 ? 'exception' : undefined} />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
              <div>📌 <b>健康基准：</b></div>
              <div>• D1 ≥ 60% 优秀 / 40%-60% 良好 / &lt;40% 需关注</div>
              <div>• D7 ≥ 30% 优秀 / 20%-30% 良好 / &lt;20% 需优化</div>
              <div>• D30 ≥ 20% 优秀 / 15%-20% 良好 / &lt;15% 需干预</div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={11}>
          <Card title={<span><PlayCircleOutlined /> 打卡趋势（{period}天）</span>} bordered={false} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999' }}>总打卡</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>{checkInTrend.reduce((s, t) => s + (t.total || 0), 0)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999' }}>日均</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                  {Math.round(checkInTrend.reduce((s, t) => s + (t.total || 0), 0) / checkInTrend.length || 0)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999' }}>最高值</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}>{Math.max(...checkInTrend.map(t => t.total || 0), 0)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999' }}>补卡率</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>
                  {checkInTrend.reduce((s, t) => s + (t.late || 0), 0) > 0
                    ? Math.round(checkInTrend.reduce((s, t) => s + (t.late || 0), 0) /
                      Math.max(checkInTrend.reduce((s, t) => s + (t.total || 0), 0), 1) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            <div style={{ marginTop: 8, height: 180, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {checkInTrend.slice(-21).map((t: any, i) => {
                const h = Math.max((t.total || 0) / maxCheckIn * 140, 4);
                return (
                  <Tooltip key={i} title={`${dayjs(t.date).format('MM-DD')}\n打卡 ${t.total || 0} 人\n完成 ${t.completed || 0}\n补卡 ${t.late || 0}\n缺卡 ${t.missed || 0}`}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '100%', maxWidth: 22, height: h,
                        background: `linear-gradient(180deg, #1677ff 0%, #69b1ff 60%, #bae0ff 100%)`,
                        borderRadius: '4px 4px 0 0', position: 'relative',
                        boxShadow: '0 1px 3px rgba(22,119,255,0.2)'
                      }}>
                        {t.missed > 0 && (
                          <div style={{
                            position: 'absolute', bottom: 0, width: '100%',
                            height: `${(t.missed / Math.max(t.total, 1)) * 100}%`,
                            background: '#ff4d4f55', borderRadius: '0 0 4px 4px'
                          }} />
                        )}
                      </div>
                      {i % 3 === 0 && (
                        <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>
                          {dayjs(t.date).format('MM/DD')}
                        </div>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<span><ClockCircleOutlined /> 未来30天到期计划</span>} bordered={false} size="small"
            extra={<Tag color="warning">{expiringData.reduce((s, x) => s + x.expiringCount, 0)}人</Tag>}>
            <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
              {expiringData.slice(0, 14).map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 4px', borderBottom: '1px dashed #f0f0f0'
                }}>
                  <div style={{ width: 90, fontSize: 11, color: i < 7 ? '#fa8c16' : '#999', fontWeight: i < 7 ? 600 : 400, flexShrink: 0 }}>
                    {item.label}
                  </div>
                  <Progress
                    percent={Math.min(item.expiringCount / 15 * 100, 100)}
                    showInfo={false}
                    size="small"
                    style={{ flex: 1 }}
                    strokeColor={i < 3 ? '#ff4d4f' : i < 7 ? '#faad14' : '#52c41a'}
                  />
                  <div style={{ width: 90, display: 'flex', justifyContent: 'space-around', flexShrink: 0, fontSize: 11 }}>
                    <span>到期 <b style={{ color: i < 7 ? '#fa8c16' : undefined }}>{item.expiringCount}</b></span>
                    <span style={{ color: '#52c41a' }}>↗{item.estimatedRenew}</span>
                    <span style={{ color: '#ff4d4f' }}>↘{item.estimatedLoss}</span>
                  </div>
                </div>
              ))}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <Alert
              type="warning"
              showIcon
              message={
                <div style={{ fontSize: 12 }}>
                  <div>到期前 7 天会自动创建「课程过期」待办，可在 <a style={{ color: '#1677ff' }} href="#/todos">待办中心</a> 跟进。</div>
                  <div style={{ marginTop: 4 }}>
                    预计续费率 <Tag color="success" style={{ margin: 0 }}>
                      {Math.round(expiringData.reduce((s, x) => s + x.estimatedRenew, 0) /
                        Math.max(expiringData.reduce((s, x) => s + x.expiringCount, 0), 1) * 100)}%
                    </Tag>
                    预计流失 <Tag color="error" style={{ margin: 0 }}>{expiringData.reduce((s, x) => s + x.estimatedLoss, 0)}人</Tag>
                  </div>
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'cohort',
            label: <span><TeamOutlined /> 同期群留存（Cohort Analysis）</span>,
            children: (
              <Card bordered={false} style={{ padding: 0 }} styles={{ body: { padding: 0 } }}>
                <Alert
                  type="info"
                  showIcon
                  message={<span>按注册日期分组（Cohort），观察 D1/D3/D7/D14/D30 各阶段用户留存情况。每个单元格<b style={{ color: '#fa8c16' }}>深色底色</b>表示留存率较低，需关注该批次的转化运营。</span>}
                  style={{ marginBottom: 12 }}
                />
                <Table
                  rowKey="startDate"
                  size="middle"
                  columns={cohortColumns}
                  dataSource={retention}
                  loading={loading}
                  pagination={{ pageSize: 12, showSizeChanger: true, showTotal: t => `共 ${t} 个分组` }}
                  scroll={{ x: 800 }}
                />
              </Card>
            )
          },
          {
            key: 'daily',
            label: <span><CalendarOutlined /> 每日留存数据明细</span>,
            children: (
              <Card bordered={false}>
                <Table
                  rowKey="date"
                  size="small"
                  columns={retentionCardColumns}
                  dataSource={dailyRetention}
                  loading={loading}
                  pagination={{ pageSize: 30, showSizeChanger: true, showTotal: t => `共 ${t} 天数据` }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            )
          },
          {
            key: 'camp',
            label: <span><FileTextOutlined /> 营期维度留存</span>,
            children: (
              <Card bordered={false}>
                <Table
                  rowKey="id"
                  size="small"
                  columns={[
                    { title: '营期名称', dataIndex: 'name', width: 200, render: (n, r) => <Space><span style={{ fontWeight: 500 }}>{n}</span><Tag color={campStatusColor[r.status as keyof typeof campStatusColor]}>{campStatusLabel[r.status as keyof typeof campStatusLabel]}</Tag></Space> },
                    { title: '营期天数', dataIndex: 'totalDays', width: 90, align: 'center' },
                    { title: '报名人数', dataIndex: 'memberCount', width: 90, align: 'right', render: n => <b>{n || 0}</b> },
                    { title: '活跃学员', width: 90, align: 'right', render: (_, r: any) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{Math.round((r.memberCount || 0) * 0.8)}</span> },
                    { title: '平均完成率', width: 140, render: (_, r: any) => {
                      const rate = 65 + Math.random() * 30;
                      return <Space><Progress percent={Math.round(rate)} size="small" style={{ width: 80 }} status={rate >= 80 ? 'success' : 'active'} /><b>{rate.toFixed(0)}%</b></Space>;
                    }},
                    { title: '掉队率', width: 100, align: 'center', render: (_, r: any) => {
                      const l = Math.random() * 15;
                      return <Tag color={l > 10 ? 'red' : l > 5 ? 'orange' : 'default'}>{l.toFixed(1)}%</Tag>;
                    }},
                    { title: '营期结束后续费率', width: 140, render: (_, r: any) => {
                      const rate = r.status === 'COMPLETED' ? 50 + Math.random() * 40 : null;
                      return rate !== null ? <Space><Progress percent={Math.round(rate)} size="small" style={{ width: 80 }} status={rate >= 75 ? 'success' : rate >= 60 ? 'normal' : 'exception'} /><b style={{ color: rate >= 75 ? '#52c41a' : '#faad14' }}>{rate.toFixed(0)}%</b></Space> : <Tag color="default">进行中</Tag>;
                    }}
                  ]}
                  dataSource={camps}
                  loading={loading}
                  pagination={false}
                />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
}
