import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Alert,
  Radio,
  Tag,
  Typography,
  message,
  Space,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import { counselorApi, timeSlotApi, appointmentApi } from '../../services/api.js';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PRIVACY_NOTICE = `
隐私保护声明：
1. 您提供的个人信息仅用于心理咨询预约服务，不会用于其他商业用途；
2. 所有咨询记录将严格保密，仅咨询师本人可见；
3. 您有权随时查询、更正或删除您的个人信息；
4. 我们将采取加密存储、访问控制等措施保护您的信息安全；
5. 未经您的同意，我们不会向任何第三方披露您的咨询内容。
`;

export default function ClientBooking() {
  const [form] = Form.useForm();
  const [counselors, setCounselors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadCounselors();
  }, []);

  useEffect(() => {
    if (selectedCounselor && selectedDate) {
      loadTimeSlots(selectedCounselor, selectedDate);
    } else {
      setTimeSlots([]);
    }
  }, [selectedCounselor, selectedDate]);

  const loadCounselors = async () => {
    try {
      const res = await counselorApi.list({ active: true });
      if (res.success) setCounselors(res.data);
    } catch (e) {
      message.error('加载咨询师列表失败');
    }
  };

  const loadTimeSlots = async (counselorId, date) => {
    try {
      const res = await timeSlotApi.list({
        counselorId,
        date: dayjs(date).format('YYYY-MM-DD'),
        active: true,
      });
      if (res.success) setTimeSlots(res.data);
    } catch (e) {
      message.error('加载时段失败');
    }
  };

  const handleSubmit = async (values) => {
    if (!privacyAgreed) {
      message.warning('请先阅读并同意隐私保护声明');
      return;
    }
    setSubmitting(true);
    try {
      const res = await appointmentApi.create({
        timeSlotId: values.timeSlotId,
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        clientEmail: values.clientEmail,
        reason: values.reason,
      });
      if (res.success) {
        setSuccess(res);
        message.success(res.message || '预约成功');
        form.resetFields();
        setSelectedCounselor(null);
        setSelectedDate(null);
      }
    } catch (e) {
      message.error(e.message || '预约失败');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = timeSlots.filter((s) => s.available > 0);
  const waitlistSlots = timeSlots.filter((s) => s.available <= 0);

  if (success) {
    return (
      <div className="page-container" style={{ padding: 48, maxWidth: 600 }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Title level={3} type="success">✓ {success.message}</Title>
            <Paragraph type="secondary">
              {success.data?.isWaitlisted
                ? '因当前时段已满，您已加入候补名单。如有空位我们将尽快与您联系。'
                : '预约已提交成功，请按时到店咨询。'}
            </Paragraph>
            <Divider />
            <Space direction="vertical" style={{ width: '100%', textAlign: 'left' }}>
              <Text>预约编号：<strong>#{success.data?.id}</strong></Text>
              <Text>来访人：{success.data?.clientName}</Text>
              <Text>联系电话：{success.data?.clientPhone}</Text>
              <Text>状态：
                <Tag color={success.data?.isWaitlisted ? 'orange' : 'green'}>
                  {success.data?.isWaitlisted ? '候补中' : '已确认'}
                </Tag>
              </Text>
            </Space>
            <Divider />
            <Button type="primary" onClick={() => setSuccess(null)}>继续预约</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card className="privacy-notice" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5} style={{ margin: 0, color: '#d48806' }}>🔒 隐私保护提醒</Title>
          <Paragraph style={{ whiteSpace: 'pre-line', margin: '8px 0', fontSize: 13 }}>{PRIVACY_NOTICE}</Paragraph>
          <Radio checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)}>
            我已阅读并同意以上隐私保护声明
          </Radio>
        </Space>
      </Card>

      <Card title="预约心理咨询">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!privacyAgreed}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="选择咨询师"
                name="counselorId"
                rules={[{ required: true, message: '请选择咨询师' }]}
              >
                <Select
                  placeholder="请选择咨询师"
                  onChange={(val) => setSelectedCounselor(val)}
                  options={counselors.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.title ? ` · ${c.title}` : ''}${c.specialty ? `（${c.specialty}）` : ''}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="选择咨询日期"
                name="date"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(d) => d && (d.isBefore(dayjs().startOf('day')) || d.isAfter(dayjs().add(30, 'day')))}
                  onChange={(val) => setSelectedDate(val)}
                  placeholder="请选择咨询日期"
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedCounselor && selectedDate && (
            <Form.Item
              label="选择时段"
              name="timeSlotId"
              rules={[{ required: true, message: '请选择时段' }]}
            >
              <Radio.Group>
                <Space wrap>
                  {availableSlots.map((slot) => (
                    <Radio.Button key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime}
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        剩余 {slot.available}/{slot.capacity}
                      </Tag>
                    </Radio.Button>
                  ))}
                  {waitlistSlots.map((slot) => (
                    <Radio.Button key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime}
                      <Tag color="orange" style={{ marginLeft: 8 }}>候补</Tag>
                    </Radio.Button>
                  ))}
                  {timeSlots.length === 0 && (
                    <Alert type="info" message="当日暂无可用时段，请选择其他日期" showIcon />
                  )}
                </Space>
              </Radio.Group>
            </Form.Item>
          )}

          <Divider orientation="left">来访人信息</Divider>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="姓名"
                name="clientName"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入您的姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="手机号码"
                name="clientPhone"
                rules={[
                  { required: true, message: '请输入手机号码' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="邮箱（选填）" name="clientEmail">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="来访原因"
            name="reason"
            rules={[{ required: true, message: '请简要描述来访原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请简要描述您希望咨询的问题，我们将为您匹配合适的咨询师。内容将严格保密。"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                提交预约
              </Button>
              <Text type="secondary" style={{ fontSize: 12 }}>
                提交即表示您同意我们的服务条款和隐私政策
              </Text>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
