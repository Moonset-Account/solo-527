import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Table,
  Tabs,
  Tag,
  List,
  message,
  Divider,
} from 'antd';
import {
  RiseOutlined,
  CalendarOutlined,
  UserOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { statisticsApi, storeClosureApi } from '../services/api';
import type {
  StatisticsDailyDto,
  CrossDepartmentReportDto,
  StoreClosureDto,
  AppointmentDto,
  AppointmentStatus,
  RefundStatus,
  ServiceItemStatsDto,
  WaitlistReminderDto,
} from '../types';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const statusMap: Record<AppointmentStatus, { text: string; color: string }> = {
  0: { text: '待确认', color: 'orange' },
  1: { text: '已确认', color: 'blue' },
  2: { text: '已到店', color: 'green' },
  3: { text: '已爽约', color: 'red' },
  4: { text: '已取消', color: 'default' },
  5: { text: '已完成(确认)', color: 'purple' },
};

const refundStatusMap: Record<RefundStatus, { text: string; color: string }> = {
  0: { text: '待处理', color: 'orange' },
  1: { text: '已通过', color: 'blue' },
  2: { text: '已拒绝', color: 'red' },
  3: { text: '已完成', color: 'green' },
};

function StatisticsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [dailyStats, setDailyStats] = useState<StatisticsDailyDto[]>([]);
  const [crossReport, setCrossReport] = useState<CrossDepartmentReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    checkedIn: 0,
    attendanceRate: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const statsRes = await statisticsApi.getByDateRange(startDate, endDate);
      if (statsRes.success && statsRes.data) {
        setDailyStats(statsRes.data);
        const total = statsRes.data.reduce((sum, d) => sum + d.totalAppointments, 0);
        const checkedIn = statsRes.data.reduce((sum, d) => sum + d.checkedInCount, 0);
        const revenue = statsRes.data.reduce((sum, d) => sum + d.revenue, 0);
        setSummary({
          total,
          checkedIn,
          attendanceRate: total > 0 ? (checkedIn / total) * 100 : 0,
          revenue,
        });
      }

      const crossRes = await statisticsApi.getCrossDepartmentReport(startDate, endDate);
      if (crossRes.success && crossRes.data) {
        setCrossReport(crossRes.data);
      }
    } catch (e: any) {
      message.error(e.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<StatisticsDailyDto> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '预约总数',
      dataIndex: 'totalAppointments',
      key: 'totalAppointments',
      width: 100,
    },
    {
      title: '到店数',
      dataIndex: 'checkedInCount',
      key: 'checkedInCount',
      width: 80,
      render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '爽约数',
      dataIndex: 'noShowCount',
      key: 'noShowCount',
      width: 80,
      render: (v) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: '取消数',
      dataIndex: 'cancelledCount',
      key: 'cancelledCount',
      width: 80,
    },
    {
      title: '到店率',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 100,
      render: (v) => (
        <span style={{ color: v >= 80 ? '#52c41a' : v >= 60 ? '#fa8c16' : '#ff4d4f', fontWeight: 600 }}>
          {v.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '营收',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 100,
      render: (v) => `¥${v.toFixed(2)}`,
    },
    {
      title: '退款笔数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 90,
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 100,
      render: (v) => `¥${v.toFixed(2)}`,
    },
  ];

  return (
    <div className="page-container">
      <h2 className="page-title">统计报表</h2>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 12 }}>统计日期：</span>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Statistic
                title={<span style={{ color: '#fff' }}>总预约数</span>}
                value={summary.total}
                valueStyle={{ color: '#fff' }}
                prefix={<CalendarOutlined style={{ color: '#fff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              <Statistic
                title={<span style={{ color: '#fff' }}>到店数</span>}
                value={summary.checkedIn}
                valueStyle={{ color: '#fff' }}
                prefix={<UserOutlined style={{ color: '#fff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Statistic
                title={<span style={{ color: '#fff' }}>到店率</span>}
                value={summary.attendanceRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#fff' }}
                prefix={<RiseOutlined style={{ color: '#fff' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <Statistic
                title={<span style={{ color: '#fff' }}>营收</span>}
                value={summary.revenue}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="daily">
        <TabPane tab="每日统计" key="daily">
          <Card>
            <Table
              columns={columns}
              dataSource={dailyStats}
              rowKey="date"
              loading={loading}
              pagination={false}
              scroll={{ x: 900 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="跨部门核对" key="cross">
          <Card title="跨部门核对数据" loading={loading}>
            {crossReport && (
              <>
                <Row gutter={24} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card style={{ background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' }}>
                      <Statistic
                        title={<span style={{ color: '#fff' }}>整体到店率(确认后)</span>}
                        value={crossReport.overallAttendanceRate}
                        precision={2}
                        suffix="%"
                        valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="总预约数" value={crossReport.totalAppointments} prefix={<CalendarOutlined />} />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                        已确认完成: <b style={{ color: '#722ed1' }}>{crossReport.totalCompleted}</b>
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        已到店待确认: <b style={{ color: '#52c41a' }}>{crossReport.totalCheckedIn}</b>
                      </div>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="营收"
                        value={crossReport.totalRevenue}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic
                        title="退款总额"
                        value={crossReport.totalRefundAmount}
                        precision={2}
                        prefix="¥"
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                        退款笔数: <b>{crossReport.refundSummary?.totalRefundCount || 0}</b>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={24} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                      <Statistic
                        title="爽约数"
                        value={crossReport.totalNoShow}
                        valueStyle={{ color: '#d46b08' }}
                        prefix={<ExclamationCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                      <Statistic
                        title="退款(待处理)"
                        value={crossReport.refundSummary?.pendingCount || 0}
                        valueStyle={{ color: '#389e0d' }}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                      <Statistic
                        title="候补队列"
                        value={crossReport.waitlistReminders?.length || 0}
                        valueStyle={{ color: '#096dd9' }}
                        prefix={<TeamOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ background: '#f9f0ff', border: '1px solid #d3adf7' }}>
                      <Statistic
                        title="服务项目"
                        value={crossReport.serviceItems?.length || 0}
                        valueStyle={{ color: '#531dab' }}
                        prefix={<AppstoreOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider orientation="left">
                  <DollarOutlined /> 退款明细
                </Divider>
                <Card size="small" style={{ marginBottom: 16 }}>
                  {crossReport.refundRecords && crossReport.refundRecords.length > 0 ? (
                    <Table
                      size="small"
                      dataSource={crossReport.refundRecords}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        { title: '退款单号', dataIndex: 'id', width: 80 },
                        { title: '预约号', dataIndex: 'appointmentNo', width: 120 },
                        { title: '客户', dataIndex: 'clientName', width: 100 },
                        {
                          title: '金额',
                          dataIndex: 'amount',
                          width: 100,
                          render: (v) => `¥${v.toFixed(2)}`,
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          width: 100,
                          render: (v) => (
                            <Tag color={refundStatusMap[v as RefundStatus].color}>
                              {refundStatusMap[v as RefundStatus].text}
                            </Tag>
                          ),
                        },
                        { title: '原因', dataIndex: 'reason' },
                        {
                          title: '申请时间',
                          dataIndex: 'createdAt',
                          width: 160,
                          render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
                        },
                      ]}
                    />
                  ) : (
                    <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>该时段无退款记录</p>
                  )}
                </Card>

                <Divider orientation="left">
                  <AppstoreOutlined /> 服务项目统计
                </Divider>
                <Card size="small" style={{ marginBottom: 16 }}>
                  {crossReport.serviceItemStats && crossReport.serviceItemStats.length > 0 ? (
                    <Table
                      size="small"
                      dataSource={crossReport.serviceItemStats}
                      rowKey="serviceItemId"
                      pagination={false}
                      columns={[
                        { title: '服务项目', dataIndex: 'serviceItemName' },
                        { title: '预约数', dataIndex: 'appointmentCount', width: 80 },
                        {
                          title: '完成数',
                          dataIndex: 'completedCount',
                          width: 80,
                          render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span>,
                        },
                        {
                          title: '营收',
                          dataIndex: 'revenue',
                          width: 100,
                          render: (v) => `¥${v.toFixed(2)}`,
                        },
                        { title: '候补人数', dataIndex: 'waitlistCount', width: 100 },
                      ]}
                    />
                  ) : (
                    <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无服务项目数据</p>
                  )}
                </Card>

                <Divider orientation="left">
                  <TeamOutlined /> 候补队列提醒
                </Divider>
                <Card size="small" style={{ marginBottom: 16 }}>
                  {crossReport.waitlistReminders && crossReport.waitlistReminders.length > 0 ? (
                    <Table
                      size="small"
                      dataSource={crossReport.waitlistReminders}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        { title: '编号', dataIndex: 'id', width: 60 },
                        { title: '客户', dataIndex: 'clientName', width: 100 },
                        { title: '服务项目', dataIndex: 'serviceItemName', width: 120 },
                        { title: '加入原因', dataIndex: 'reason' },
                        { title: '优先级', dataIndex: 'priority', width: 80 },
                        {
                          title: '通知状态',
                          dataIndex: 'notified',
                          width: 100,
                          render: (v) => (v ? <Tag color="green">已通知</Tag> : <Tag color="orange">待通知</Tag>),
                        },
                        {
                          title: '加入时间',
                          dataIndex: 'createdAt',
                          width: 160,
                          render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
                        },
                      ]}
                    />
                  ) : (
                    <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无候补提醒</p>
                  )}
                </Card>

                <Divider orientation="left">
                  <ShopOutlined /> 临时关店 & <FileTextOutlined /> 最近处理记录
                </Divider>
                <Row gutter={24}>
                  <Col span={12}>
                    <Card title={<span><ShopOutlined /> 临时关店记录</span>} size="small">
                      {crossReport.storeClosures.length > 0 ? (
                        <List
                          size="small"
                          dataSource={crossReport.storeClosures}
                          renderItem={(item: StoreClosureDto) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                                title={
                                  <span>
                                    {dayjs(item.closureDate).format('YYYY-MM-DD')}
                                    <Tag color="orange" style={{ marginLeft: 8 }}>
                                      {item.isFullDay ? '全天' : `${item.startTime?.slice(0, 5)}-${item.endTime?.slice(0, 5)}`}
                                    </Tag>
                                  </span>
                                }
                                description={item.reason}
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                          该时段无临时关店记录
                        </p>
                      )}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title={<span><FileTextOutlined /> 最近处理记录</span>} size="small">
                      {crossReport.recentProcessedRecords.length > 0 ? (
                        <List
                          size="small"
                          dataSource={crossReport.recentProcessedRecords.slice(0, 10)}
                          renderItem={(item: AppointmentDto) => (
                            <List.Item>
                              <List.Item.Meta
                                title={
                                  <span>
                                    {item.appointmentNo}
                                    <Tag
                                      color={statusMap[item.status].color}
                                      style={{ marginLeft: 8 }}
                                    >
                                      {statusMap[item.status].text}
                                    </Tag>
                                  </span>
                                }
                                description={`${item.clientName} - ${item.serviceItemName} - ${dayjs(item.appointmentDate).format('MM-DD')} ${item.startTime?.slice(0, 5)}`}
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                          暂无处理记录
                        </p>
                      )}
                    </Card>
                  </Col>
                </Row>

                <Divider orientation="left">每日明细</Divider>
                <Table
                  columns={columns}
                  dataSource={crossReport.dailyStatistics}
                  rowKey="date"
                  size="small"
                  pagination={false}
                  scroll={{ x: 900 }}
                />
              </>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default StatisticsPage;
