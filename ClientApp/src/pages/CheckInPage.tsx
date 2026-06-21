import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Space,
  message,
  Modal,
  Select,
  Descriptions,
  Row,
  Col,
  Statistic,
  DatePicker,
} from 'antd';
import {
  CheckCircleOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { checkInApi, appointmentApi } from '../services/api';
import type { CheckInRecordDto, AppointmentDto, CheckInMethod, AppointmentStatus } from '../types';

const { confirm } = Modal;

const methodMap: Record<CheckInMethod, string> = {
  0: '手动核销',
  1: '扫码核销',
  2: '自助核销',
  3: '工作人员协助',
};

const statusMap: Record<AppointmentStatus, { text: string; color: string }> = {
  0: { text: '待确认', color: 'orange' },
  1: { text: '已确认', color: 'blue' },
  2: { text: '已到店', color: 'green' },
  3: { text: '已爽约', color: 'red' },
  4: { text: '已取消', color: 'default' },
  5: { text: '已完成', color: 'purple' },
};

function CheckInPage() {
  const [form] = Form.useForm();
  const [appointment, setAppointment] = useState<AppointmentDto | null>(null);
  const [todayRecords, setTodayRecords] = useState<CheckInRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [noShowForm] = Form.useForm();
  const [noShowModalVisible, setNoShowModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [stats, setStats] = useState({
    today: 0,
    checkedIn: 0,
    noShow: 0,
    pending: 0,
  });

  const handleSearch = async () => {
    const appointmentNo = form.getFieldValue('appointmentNo');
    if (!appointmentNo || appointmentNo.trim() === '') {
      message.warning('请输入预约单号');
      return;
    }

    setLoading(true);
    try {
      const res = await appointmentApi.getByNo(appointmentNo.trim());
      if (res.success && res.data) {
        setAppointment(res.data);
        message.success('找到预约信息');
      } else {
        setAppointment(null);
        message.warning(res.message || '未找到该预约号，请检查预约号是否正确');
      }
    } catch (e: any) {
      setAppointment(null);
      message.error(e.message || '查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!appointment) return;

    confirm({
      title: '确认到店核销',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: `确定要为 ${appointment.clientName} 的预约办理到店核销吗？`,
      okText: '确认核销',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await checkInApi.checkIn({
            appointmentNo: appointment.appointmentNo,
            checkInMethod: 0,
            remarks: '',
          });
          if (res.success) {
            message.success('到店核销成功！');
            setAppointment(null);
            form.resetFields();
            loadTodayRecords();
          } else {
            message.error(res.message || '核销失败');
          }
        } catch (e: any) {
          message.error(e.message || '核销失败');
        }
      },
    });
  };

  const handleMarkNoShow = (record: AppointmentDto) => {
    setSelectedAppointment(record);
    noShowForm.resetFields();
    setNoShowModalVisible(true);
  };

  const handleNoShowSubmit = async () => {
    if (!selectedAppointment) return;
    try {
      const values = await noShowForm.validateFields();
      const res = await checkInApi.markNoShow({
        appointmentId: selectedAppointment.id,
        reason: values.reason,
      });
      if (res.success) {
        message.success('已标记为爽约');
        setNoShowModalVisible(false);
        setSelectedAppointment(null);
        setAppointment(null);
        form.resetFields();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const loadTodayRecords = async () => {
    try {
      const res = await checkInApi.getByDate(dayjs().format('YYYY-MM-DD'));
      if (res.success && res.data) {
        setTodayRecords(res.data);
      }
    } catch (e: any) {
      message.error(e.message || '加载今日核销记录失败');
    }
  };

  useEffect(() => {
    loadTodayRecords();
    appointmentApi.getList({
      pageIndex: 1,
      pageSize: 100,
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    }).then((res) => {
      if (res.success && res.data) {
        const list = res.data.items || [];
        setStats({
          today: list.length,
          checkedIn: list.filter((a: AppointmentDto) => a.status === 2 || a.status === 5).length,
          noShow: list.filter((a: AppointmentDto) => a.status === 3).length,
          pending: list.filter((a: AppointmentDto) => a.status === 1).length,
        });
      }
    }).catch(() => {});
  }, []);

  const columns: ColumnsType<CheckInRecordDto> = [
    {
      title: '核销时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 170,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '预约ID',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
      width: 100,
    },
    {
      title: '核销方式',
      dataIndex: 'checkInMethod',
      key: 'checkInMethod',
      width: 120,
      render: (m: CheckInMethod) => methodMap[m] || '未知',
    },
    {
      title: '是否确认',
      dataIndex: 'isConfirmed',
      key: 'isConfirmed',
      width: 100,
      render: (v) => (v ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>),
    },
    {
      title: '确认人',
      dataIndex: 'confirmedBy',
      key: 'confirmedBy',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
    },
  ];

  return (
    <div className="page-container">
      <h2 className="page-title">到店核销</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="今日预约" value={stats.today} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已到店" value={stats.checkedIn} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待到店" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已爽约" value={stats.noShow} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={14}>
          <Card title="快速核销" style={{ marginBottom: 16 }}>
            <Form form={form} layout="inline" onFinish={handleSearch}>
              <Form.Item
                name="appointmentNo"
                label="预约单号"
                rules={[{ required: true, message: '请输入预约单号' }]}
                style={{ flex: 1, minWidth: 280 }}
              >
                <Input placeholder="请输入预约单号，如 APT20240101..." size="large" allowClear />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    htmlType="submit"
                    loading={loading}
                  >
                    查询
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            {appointment && (
              <Card
                style={{ marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
                title="预约信息"
                extra={
                  <Tag color={statusMap[appointment.status].color}>
                    {statusMap[appointment.status].text}
                  </Tag>
                }
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="预约号">{appointment.appointmentNo}</Descriptions.Item>
                  <Descriptions.Item label="来访者">{appointment.clientName}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{appointment.clientPhone}</Descriptions.Item>
                  <Descriptions.Item label="服务项目">{appointment.serviceItemName}</Descriptions.Item>
                  <Descriptions.Item label="咨询师">{appointment.counselorName}</Descriptions.Item>
                  <Descriptions.Item label="预约时间">
                    {dayjs(appointment.appointmentDate).format('YYYY-MM-DD')}{' '}
                    {appointment.startTime?.slice(0, 5)} - {appointment.endTime?.slice(0, 5)}
                  </Descriptions.Item>
                  <Descriptions.Item label="费用">¥{appointment.price}</Descriptions.Item>
                  <Descriptions.Item label="咨询原因">{appointment.reason}</Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Space>
                    {(appointment.status === 1) && (
                      <>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleMarkNoShow(appointment)}
                        >
                          标记爽约
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          icon={<CheckCircleOutlined />}
                          onClick={handleCheckIn}
                        >
                          确认到店
                        </Button>
                      </>
                    )}
                    {appointment.status === 2 && (
                      <Tag color="green" icon={<CheckOutlined />}>
                        已到店核销
                      </Tag>
                    )}
                    {appointment.status === 3 && (
                      <Tag color="red" icon={<ExclamationCircleOutlined />}>
                        已爽约
                      </Tag>
                    )}
                    {appointment.status === 4 && (
                      <Tag color="default">已取消</Tag>
                    )}
                  </Space>
                </div>
              </Card>
            )}
          </Card>
        </Col>

        <Col span={10}>
          <Card title="今日核销记录">
            <Table
              columns={columns}
              dataSource={todayRecords}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 360 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="标记爽约"
        open={noShowModalVisible}
        onOk={handleNoShowSubmit}
        onCancel={() => setNoShowModalVisible(false)}
        okText="确认标记"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          确定要将 <strong>{selectedAppointment?.clientName}</strong> 的预约标记为爽约吗？
        </p>
        <Form form={noShowForm}>
          <Form.Item
            name="reason"
            label="爽约原因"
            rules={[{ required: true, message: '请填写爽约原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请填写爽约原因，这对后续服务改进很重要" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CheckInPage;
