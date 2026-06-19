import { useState, useEffect } from 'react';
import {
  Descriptions, Tag, Card, Row, Col, Button, Modal, Form, Input,
  Select, DatePicker, TimePicker, InputNumber, List, Avatar, Space,
  Divider, Timeline, message, Spin, Result, Tabs,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, PhoneOutlined, MailOutlined,
  CalendarOutlined, EditOutlined, MessageOutlined, PlusOutlined,
  ExceptionOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentApi, authApi } from '../../services/api';
import { appointmentStatusLabels, appointmentStatusColors } from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, AppointmentStatus } from '../../types';
import type { Appointment, FollowUp, ConsultantDto } from '../../types';

function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [followModal, setFollowModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [consultants, setConsultants] = useState<ConsultantDto[]>([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [form] = Form.useForm();
  const [followForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const openAssignModal = async () => {
    setAssignModal(true);
    try {
      setConsultantsLoading(true);
      const res = await authApi.getConsultants();
      if (res.success) setConsultants(res.data || []);
    } finally {
      setConsultantsLoading(false);
    }
  };

  const canManage = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.ConsultantManager);
  const canHandle = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Consultant || user.role === UserRole.ConsultantManager);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.detail(id!);
      if (res.success && res.data) {
        setDetail(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (values: any) => {
    try {
      const res = await appointmentApi.updateStatus(id!, { status: values.status, remarks: values.remarks });
      if (res.success) {
        message.success('状态更新成功');
        setStatusModal(false);
        form.resetFields();
        fetchDetail();
      }
    } catch { }
  };

  const handleFollowUp = async (values: any) => {
    try {
      const res = await appointmentApi.addFollowUp(id!, {
        followUpType: values.followUpType,
        content: values.content,
        nextFollowUpTime: values.nextFollowUpTime?.toDate(),
        nextStep: values.nextStep,
        customerSatisfaction: values.customerSatisfaction,
      });
      if (res.success) {
        message.success('跟进记录已添加');
        setFollowModal(false);
        followForm.resetFields();
        fetchDetail();
      }
    } catch { }
  };

  const handleAssign = async (values: any) => {
    try {
      const res = await appointmentApi.assignConsultant(id!, { consultantId: values.consultantId });
      if (res.success) {
        message.success('顾问分配成功');
        setAssignModal(false);
        assignForm.resetFields();
        fetchDetail();
      }
    } catch { }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!detail) return <Result status="404" title="预约不存在" extra={<Button type="primary" onClick={() => navigate('/admin/appointments')}>返回列表</Button>} />;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/appointments')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card title={<Space><CalendarOutlined /> 预约基本信息</Space>} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="预约编号" span={2}>
                {detail.appointmentNo}
                <Tag color={appointmentStatusColors[detail.status]} style={{ marginLeft: 12 }}>
                  {appointmentStatusLabels[detail.status]}
                </Tag>
                {detail.hasNoShow && <Tag color="red" style={{ marginLeft: 8 }}>存在爽约记录</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="客户姓名">
                <UserOutlined /> {detail.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined /> {detail.customerPhone}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <MailOutlined /> {detail.customerEmail || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="公司">
                {detail.customerCompany || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="房源" span={2}>
                <EnvironmentOutlined /> {detail.spaceName}
              </Descriptions.Item>
              <Descriptions.Item label="看房时间" span={2}>
                {dayjs(detail.viewingDate).format('YYYY-MM-DD')} {detail.startTime.substring(0, 5)} - {detail.endTime.substring(0, 5)}
              </Descriptions.Item>
              <Descriptions.Item label="人数">{detail.personCount || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源渠道">{detail.sourceChannel || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户需求" span={2}>{detail.requirements || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail.remarks || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={<Space><MessageOutlined /> 跟进记录</Space>}
            extra={canHandle && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setFollowModal(true)}>添加跟进</Button>}
          >
            {detail.followUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无跟进记录</div>
            ) : (
              <Timeline
                items={detail.followUps.map((f: FollowUp) => ({
                  color: 'blue',
                  dot: <Avatar size="small" icon={<UserOutlined />} />,
                  children: (
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Space>
                          <strong>{f.consultantName}</strong>
                          <Tag color="blue">{f.followUpType}</Tag>
                          {f.customerSatisfaction && <span>满意度：{f.customerSatisfaction}分</span>}
                        </Space>
                        <span style={{ color: '#999' }}>{dayjs(f.followUpTime).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      <p style={{ margin: '4px 0' }}>{f.content}</p>
                      {f.nextStep && <p style={{ margin: 0, color: '#1677ff' }}>📌 下一步：{f.nextStep}</p>}
                      {f.nextFollowUpTime && <p style={{ margin: 0, color: '#fa8c16' }}>⏰ 下次跟进：{dayjs(f.nextFollowUpTime).format('YYYY-MM-DD HH:mm')}</p>}
                    </Card>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<Space><UserOutlined /> 顾问信息</Space>} style={{ marginBottom: 16 }}>
            {detail.consultantName ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>{detail.consultantName}</div>
              </Space>
            ) : (
              <div>
                <Tag color="orange">暂未分配顾问</Tag>
                {canManage && (
                  <Button type="primary" size="small" style={{ marginLeft: 8 }} onClick={openAssignModal}>
                    立即分配
                  </Button>
                )}
              </div>
            )}
          </Card>

          <Card title={<Space><EditOutlined /> 处理操作</Space>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {canManage && (
                <Button block onClick={openAssignModal} icon={<UserOutlined />}>
                  分配/更换顾问
                </Button>
              )}
              {canHandle && (
                <>
                  <Button type="primary" block onClick={() => setStatusModal(true)} icon={<EditOutlined />}>
                    更新预约状态
                  </Button>
                  <Button block onClick={() => setFollowModal(true)} icon={<MessageOutlined />}>
                    添加跟进记录
                  </Button>
                  <Button danger block onClick={() => {
                    Modal.confirm({
                      title: '确认标记为爽约？',
                      onOk: async () => {
                        const res = await appointmentApi.markNoShow(detail.id, '管理员标记');
                        if (res.success) {
                          message.success('已标记为爽约');
                          fetchDetail();
                        }
                      },
                    });
                  }} icon={<ExceptionOutlined />}>
                    标记为爽约
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal title="更新预约状态" open={statusModal} onCancel={() => setStatusModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item name="status" label="选择状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={Object.entries(appointmentStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="remarks" label="备注说明">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setStatusModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加跟进记录" open={followModal} onCancel={() => setFollowModal(false)} footer={null} width={500}>
        <Form form={followForm} layout="vertical" onFinish={handleFollowUp}>
          <Form.Item name="followUpType" label="跟进方式" rules={[{ required: true, message: '请选择跟进方式' }]}>
            <Select options={[
              { value: '电话', label: '电话' },
              { value: '微信', label: '微信' },
              { value: '面谈', label: '面谈' },
              { value: '邮件', label: '邮件' },
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请填写跟进内容' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述跟进情况" />
          </Form.Item>
          <Form.Item name="nextStep" label="下一步计划">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="nextFollowUpTime" label="下次跟进时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="customerSatisfaction" label="客户满意度（1-10分）">
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setFollowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="分配顾问" open={assignModal} onCancel={() => setAssignModal(false)} footer={null}>
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="consultantId" label="选择顾问" rules={[{ required: true, message: '请选择顾问' }]}>
            <Select
              loading={consultantsLoading}
              options={consultants.map(c => ({
                value: c.id,
                label: `${c.realName} (${c.userName}${c.department ? ' - ' + c.department : ''})`
              }))}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAssignModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认分配</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AppointmentDetail;
