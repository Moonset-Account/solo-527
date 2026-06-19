import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Descriptions, Divider, Form, Input, DatePicker, TimePicker, InputNumber, Select, message, Spin, Space as AntSpace, Result } from 'antd';
import { EnvironmentOutlined, TeamOutlined, CalendarOutlined, UserOutlined, PhoneOutlined, MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { spaceApi, appointmentApi } from '../../services/api';
import { spaceStatusLabels, spaceStatusColors, spaceTypeLabels } from '../../utils/enums';
import type { Space as SpaceEntity } from '../../types';

function SpaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [space, setSpace] = useState<SpaceEntity | null>(null);
  const [form] = Form.useForm();
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await spaceApi.detail(id!);
      if (res.success && res.data) {
        setSpace(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await appointmentApi.create({
        spaceId: id,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        customerCompany: values.customerCompany,
        viewingDate: values.viewingDate.toDate(),
        startTime: values.timeRange[0].format('HH:mm:00'),
        endTime: values.timeRange[1].format('HH:mm:00'),
        personCount: values.personCount,
        requirements: values.requirements,
        sourceChannel: '官网',
      });
      if (res.success) {
        setBooked(true);
        message.success('预约成功！我们会尽快与您联系确认');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  if (!space) {
    return <Result status="404" title="房源不存在" subTitle="请返回房源列表查看其他房源" extra={<Button type="primary" onClick={() => navigate('/spaces')}>返回列表</Button>} />;
  }

  if (booked) {
    return (
      <Result
        status="success"
        title="预约提交成功！"
        subTitle="我们的顾问会尽快与您联系确认看房时间，请保持电话畅通。"
        extra={[
          <Button type="primary" key="back" onClick={() => navigate('/spaces')}>
            继续浏览房源
          </Button>,
        ]}
      />
    );
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>
      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Card>
            <div style={{
              height: 280,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 80,
              marginBottom: 24,
            }}>
              🏢
            </div>
            <AntSpace style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{space.name}</h2>
              <Tag color={spaceStatusColors[space.status]} style={{ fontSize: 14, padding: '2px 12px' }}>
                {spaceStatusLabels[space.status]}
              </Tag>
              <Tag color="blue">{spaceTypeLabels[space.type]}</Tag>
            </AntSpace>

            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="房源编号">{space.code}</Descriptions.Item>
              <Descriptions.Item label="地址">
                <EnvironmentOutlined /> {space.address} · {space.building} {space.floor}
              </Descriptions.Item>
              <Descriptions.Item label="面积/容量">
                <TeamOutlined /> {space.area}㎡ · 容纳 {space.capacity} 人
              </Descriptions.Item>
              <Descriptions.Item label="房源介绍">{space.description || '暂无介绍'}</Descriptions.Item>
              <Descriptions.Item label="配套设施">{space.facilities || '暂无'}</Descriptions.Item>
              <Descriptions.Item label="房东信息">
                {space.landlordName || '-'} {space.landlordPhone ? `· ${space.landlordPhone}` : ''}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">价格信息</Divider>
            {space.prices.length > 0 ? (
              <Row gutter={16}>
                {space.prices.filter(p => p.isActive).map((p) => (
                  <Col key={p.id}>
                    <Card size="small" style={{ textAlign: 'center', minWidth: 160 }}>
                      <div style={{ color: '#f5222d', fontSize: 24, fontWeight: 'bold' }}>
                        ¥{p.unitPrice}
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>/ {p.unit}</div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {p.minimumCharge && <div>最低消费：¥{p.minimumCharge}</div>}
                        {p.depositAmount && <div>押金：¥{p.depositAmount}</div>}
                        <div>生效：{dayjs(p.effectiveDate).format('YYYY-MM-DD')}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ color: '#999' }}>暂无价格信息</div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={<span><CalendarOutlined /> 预约看房</span>}>
            <Form form={form} layout="vertical" onFinish={handleBook}>
              <Form.Item name="customerName" label="您的姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item name="customerPhone" label="联系电话" rules={[
                { required: true, message: '请输入电话' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}>
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
              </Form.Item>
              <Form.Item name="customerEmail" label="邮箱">
                <Input prefix={<MailOutlined />} placeholder="可选" />
              </Form.Item>
              <Form.Item name="customerCompany" label="公司名称">
                <Input placeholder="可选" />
              </Form.Item>
              <Form.Item name="viewingDate" label="看房日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))} />
              </Form.Item>
              <Form.Item name="timeRange" label="看房时间" rules={[{ required: true, message: '请选择时间段' }]}>
                <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" minuteStep={30} />
              </Form.Item>
              <Form.Item name="personCount" label="人数">
                <InputNumber min={1} max={50} style={{ width: '100%' }} placeholder="参观人数" />
              </Form.Item>
              <Form.Item name="requirements" label="看房需求">
                <Input.TextArea rows={3} placeholder="请描述您的具体需求（可选）" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block size="large">
                  <CheckCircleOutlined /> 立即预约看房
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SpaceDetail;
