import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  DatePicker,
  InputNumber,
  message,
  Steps,
  Space,
  Radio,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  createConsultation,
  fetchTreatmentItems,
} from '../../store/slices/consultationsSlice';
import { fetchCustomers } from '../../store/slices/leadsSlice';
import { fetchUsers } from '../../store/slices/commonSlice';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const ConsultationCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { treatmentItems } = useSelector(state => state.consultations);
  const { customers } = useSelector(state => state.leads);
  const { users } = useSelector(state => state.common);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    dispatch(fetchTreatmentItems());
    dispatch(fetchCustomers({ page_size: 50 }));
    dispatch(fetchUsers());
  }, [dispatch]);

  const steps = [
    { title: '基本信息' },
    { title: '诊疗信息' },
    { title: '完成' },
  ];

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.error('请填写必填项');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = await dispatch(createConsultation(values));
      if (createConsultation.fulfilled.match(result)) {
        setCurrentStep(2);
        message.success('咨询记录创建成功');
      }
    } catch (error) {
      message.error('创建失败');
    }
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
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="customer"
                  label="选择客户"
                  rules={[{ required: true, message: '请选择客户' }]}
                >
                  <Select
                    showSearch
                    placeholder="搜索并选择客户"
                    optionFilterProp="children"
                  >
                    {customers.map(customer => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="consultation_type"
                  label="咨询类型"
                  rules={[{ required: true, message: '请选择咨询类型' }]}
                  initialValue="initial"
                >
                  <Select>
                    <Option value="initial">初诊咨询</Option>
                    <Option value="followup">复诊咨询</Option>
                    <Option value="treatment">方案咨询</Option>
                    <Option value="price">价格咨询</Option>
                    <Option value="other">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="intention_level"
                  label="意向等级"
                  initialValue="medium"
                >
                  <Radio.Group>
                    <Radio value="high">高</Radio>
                    <Radio value="medium">中</Radio>
                    <Radio value="low">低</Radio>
                    <Radio value="none">无</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="consultation_doctor" label="咨询医生">
                  <Select
                    showSearch
                    placeholder="请选择"
                    optionFilterProp="children"
                    allowClear
                  >
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
                  <Select
                    showSearch
                    placeholder="请选择"
                    optionFilterProp="children"
                    allowClear
                  >
                    {users.map(user => (
                      <Option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="duration_minutes" label="咨询时长(分钟)" initialValue={30}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form form={form} layout="vertical">
            <Form.Item name="chief_complaint" label="主诉">
              <TextArea rows={2} placeholder="请描述客户主诉" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dental_history" label="牙科病史">
                  <TextArea rows={3} placeholder="请描述牙科病史" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="oral_examination" label="口腔检查">
                  <TextArea rows={3} placeholder="请描述口腔检查结果" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="diagnosis" label="诊断结果">
              <TextArea rows={2} placeholder="请填写诊断结果" />
            </Form.Item>
            <Form.Item name="treatment_plan" label="治疗方案">
              <TextArea rows={3} placeholder="请描述治疗方案" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="estimated_price" label="预估价格">
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="¥"
                    min={0}
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="patient_concerns" label="患者顾虑">
                  <Input placeholder="患者主要顾虑" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="next_consultation_at" label="下次复诊">
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="next_action" label="下一步行动">
              <TextArea rows={2} placeholder="下一步行动计划" />
            </Form.Item>
            <Form.Item name="notes" label="备注">
              <TextArea rows={2} placeholder="其他备注信息" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                <Button type="primary" onClick={handleSubmit}>
                  提交
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}>✓</div>
            <h3>咨询记录创建成功！</h3>
            <p style={{ color: '#999', marginBottom: 24 }}>
              您可以继续添加治疗项目或查看详情
            </p>
            <Space>
              <Button onClick={() => navigate('/consultations')}>返回列表</Button>
              <Button type="primary">查看详情</Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ConsultationCreate;
