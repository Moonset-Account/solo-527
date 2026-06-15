import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  Radio,
  DatePicker,
  message,
  Steps,
  Space,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createLead,
  fetchLeadSources,
  fetchLeadStatuses,
  createCustomer,
} from '../../store/slices/leadsSlice';
import { fetchUsers } from '../../store/slices/commonSlice';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const LeadCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sources, statuses } = useSelector(state => state.leads);
  const { users } = useSelector(state => state.common);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    dispatch(fetchLeadSources());
    dispatch(fetchLeadStatuses());
    dispatch(fetchUsers());
  }, [dispatch]);

  const steps = [
    { title: '客户信息', description: '填写客户基本信息' },
    { title: '线索信息', description: '填写线索详情' },
    { title: '完成', description: '确认创建' },
  ];

  const handleCustomerSubmit = async (values) => {
    try {
      const result = await dispatch(createCustomer(values));
      if (createCustomer.fulfilled.match(result)) {
        setCustomerId(result.payload.id);
        setCurrentStep(1);
        form.setFieldsValue({ customer: result.payload.id });
        message.success('客户信息保存成功');
      }
    } catch (error) {
      message.error('创建客户失败');
    }
  };

  const handleLeadSubmit = async (values) => {
    try {
      const data = {
        ...values,
        customer: customerId,
      };
      const result = await dispatch(createLead(data));
      if (createLead.fulfilled.match(result)) {
        setCurrentStep(2);
        message.success('线索创建成功');
      }
    } catch (error) {
      message.error('创建线索失败');
    }
  };

  const handleFinish = () => {
    navigate('/leads');
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </Space>

      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

        {currentStep === 0 && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCustomerSubmit}
            initialValues={{ gender: 'other' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="name"
                  label="客户姓名"
                  rules={[{ required: true, message: '请输入客户姓名' }]}
                >
                  <Input placeholder="请输入客户姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="phone"
                  label="联系电话"
                  rules={[{ required: true, message: '请输入联系电话' }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="gender" label="性别">
                  <Radio.Group>
                    <Radio value="male">男</Radio>
                    <Radio value="female">女</Radio>
                    <Radio value="other">其他</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="age" label="年龄">
                  <InputNumber min={0} max={150} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="wechat" label="微信号">
                  <Input placeholder="请输入微信号" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="email" label="邮箱">
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="address" label="地址">
              <TextArea rows={2} placeholder="请输入地址" />
            </Form.Item>
            <Form.Item name="notes" label="备注">
              <TextArea rows={3} placeholder="请输入备注信息" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                下一步
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLeadSubmit}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="source"
                  label="线索来源"
                  rules={[{ required: true, message: '请选择线索来源' }]}
                >
                  <Select placeholder="请选择">
                    {sources.map(source => (
                      <Option key={source.id} value={source.id}>{source.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="assigned_to" label="负责人">
                  <Select placeholder="请选择">
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="consultant" label="咨询师">
                  <Select placeholder="请选择">
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="expected_amount" label="预计金额">
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    min={0}
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="budget" label="预算范围">
                  <Input placeholder="如：1-2万" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="urgency" label="紧迫程度">
                  <Select placeholder="请选择">
                    <Option value="urgent">非常紧急</Option>
                    <Option value="soon">近期考虑</Option>
                    <Option value="normal">一般</Option>
                    <Option value="not_urgent">不着急</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="dental_issues" label="牙齿问题描述">
              <TextArea rows={3} placeholder="请描述客户的牙齿问题..." />
            </Form.Item>
            <Form.Item name="treatment_plan" label="治疗方案意向">
              <TextArea rows={3} placeholder="请描述客户的治疗方案意向..." />
            </Form.Item>
            <Form.Item name="next_followup_at" label="下次跟进时间">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                <Button type="primary" htmlType="submit">
                  提交
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}>✓</div>
            <h3>线索创建成功！</h3>
            <p style={{ color: '#999', marginBottom: 24 }}>
              您可以继续添加跟进记录或查看线索详情
            </p>
            <Space>
              <Button onClick={handleFinish}>返回列表</Button>
              <Button type="primary" onClick={() => navigate(`/leads/${customerId}`)}>
                查看详情
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LeadCreate;
