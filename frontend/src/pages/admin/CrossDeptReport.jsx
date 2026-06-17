import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Space,
  List,
  Avatar,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { statisticsApi } from '../../api';

const { RangePicker } = DatePicker;

function CrossDeptReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0]?.format('YYYY-MM-DD');
      const endDate = dateRange[1]?.format('YYYY-MM-DD');
      const data = await statisticsApi.getCrossDeptReport({ startDate, endDate });
      setReportData(data);
    } catch (error) {
      console.error('加载报告失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const overviewCards = reportData?.overview ? [
    {
      title: '总预约数',
      value: reportData.overview.totalAppointments,
      icon: <CalendarOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
      color: '#1890ff',
    },
    {
      title: '已完成',
      value: reportData.overview.completedCount,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
      color: '#52c41a',
    },
    {
      title: '爽约数',
      value: reportData.overview.noShowCount,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />,
      color: '#ff4d4f',
      trend: reportData.overview.noShowRate,
      trendIcon: <RiseOutlined />,
    },
    {
      title: '支付失败',
      value: reportData.overview.paymentFailedCount,
      icon: <DollarOutlined style={{ color: '#eb2f96', fontSize: 24 }} />,
      color: '#eb2f96',
      trend: reportData.overview.paymentFailRate,
      trendIcon: <FallOutlined />,
    },
    {
      title: '总退款',
      value: reportData.overview.totalRefunds,
      icon: <RiseOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
      color: '#722ed1',
    },
    {
      title: '待处理退款',
      value: reportData.overview.pendingRefundCount,
      icon: <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />,
      color: '#faad14',
    },
    {
      title: '候补总数',
      value: reportData.overview.totalWaitlist,
      icon: <ClockCircleOutlined style={{ color: '#13c2c2', fontSize: 24 }} />,
      color: '#13c2c2',
    },
    {
      title: '操作记录',
      value: reportData.overview.totalProcessingRecords,
      icon: <UserOutlined style={{ color: '#fa8c16', fontSize: 24 }} />,
      color: '#fa8c16',
    },
  ] : [];

  const counselorColumns = [
    { title: '咨询师', dataIndex: 'counselorName', key: 'counselorName', width: 120 },
    { title: '总预约', dataIndex: 'total', key: 'total' },
    { title: '已完成', dataIndex: 'completed', key: 'completed' },
    {
      title: '爽约',
      dataIndex: 'noShow',
      key: 'noShow',
      render: (v) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: '爽约率',
      dataIndex: 'noShowRate',
      key: 'noShowRate',
      render: (v) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: '已取消',
      dataIndex: 'cancelled',
      key: 'cancelled',
    },
    {
      title: '支付失败',
      dataIndex: 'paymentFailed',
      key: 'paymentFailed',
      render: (v) => v > 0 ? <Tag color="red">{v}次</Tag> : '-',
    },
  ];

  const waitlistColumns = [
    { title: '咨询师', dataIndex: 'counselorName', key: 'counselorName', width: 120 },
    { title: '总候补', dataIndex: 'total', key: 'total' },
    { title: '等待中', dataIndex: 'waiting', key: 'waiting' },
    { title: '已确认', dataIndex: 'confirmed', key: 'confirmed' },
    { title: '已取消', dataIndex: 'cancelled', key: 'cancelled' },
    { title: '已过期', dataIndex: 'expired', key: 'expired' },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (v) => <Tag color="green">{v}</Tag>,
    },
  ];

  return (
    <div>
      <Card
        title="跨部门核对报告"
        extra={
          <Space>
            <span style={{ color: '#999' }}>统计周期：</span>
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              allowClear={false}
            />
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {overviewCards.map((card, index) => (
            <Col span={6} key={index}>
              <Card>
                <div className="flex" style={{ alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: `${card.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Statistic
                      title={card.title}
                      value={card.value || 0}
                      valueStyle={{ fontSize: 22 }}
                    />
                    {card.trend && (
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {card.trendIcon} {card.trend}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={16}>
          <Col span={14}>
            <Card title="咨询师业绩统计" style={{ marginBottom: 16 }}>
              <Table
                columns={counselorColumns}
                dataSource={reportData?.counselorStats || []}
                rowKey="counselorId"
                size="small"
                pagination={false}
              />
            </Card>
            <Card title="候补队列统计">
              <Table
                columns={waitlistColumns}
                dataSource={reportData?.waitlistStats || []}
                rowKey="counselorId"
                size="small"
                pagination={false}
              />
            </Card>
          </Col>
          <Col span={10}>
            <Card title="退款原因分布">
              <List
                size="small"
                dataSource={reportData?.refundStats || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<DollarOutlined />} />}
                      title={
                        <span>
                          {{
                            client_cancel: '客户取消',
                            counselor_cancel: '咨询师取消',
                            no_show: '爽约退款',
                            service_issue: '服务问题',
                            other: '其他',
                          }[item.reason] || item.reason}
                        </span>
                      }
                      description={`${item.count} 笔 · ¥{item.totalamount || 0}`}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card title="最近处理记录" style={{ marginTop: 16 }}>
              <List
                size="small"
                dataSource={reportData?.recentRecords?.slice(0, 10) || []}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <span style={{ fontSize: 13 }}>
                          {{
                            appointment_create: '创建预约',
                            appointment_cancel: '取消预约',
                            appointment_complete: '完成预约',
                            waitlist_add: '加入候补',
                            waitlist_release: '候补释放',
                            refund_create: '申请退款',
                            refund_approve: '批准退款',
                            refund_reject: '拒绝退款',
                            schedule_update: '排班变更',
                            service_update: '服务变更',
                          }[item.type] || item.type}
                        </span>
                      }
                      description={
                        <span style={{ fontSize: 11, color: '#999' }}>
                          {item.operator?.name || '系统'} · {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Card title="关键指标说明" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ padding: '12px 16px', background: '#fffbe6', borderRadius: 6 }}>
                <div style={{ color: '#fa8c16', fontWeight: 600, marginBottom: 4 }}>
                  责任人定位
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  所有操作均记录操作人、操作时间，可追溯到具体责任人
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ padding: '12px 16px', background: '#bae7ff', borderRadius: 6 }}>
                <div style={{ color: '#1890ff', fontWeight: 600, marginBottom: 4 }}>
                  处理时间追踪
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  从申请到处理完成全流程时间节点完整记录
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ padding: '12px 16px', background: '#d9f7be', borderRadius: 6 }}>
                <div style={{ color: '#52c41a', fontWeight: 600, marginBottom: 4 }}>
                  跨部门数据
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  预约、支付、退款等数据一站式呈现，便于核对
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  );
}

export default CrossDeptReport;
