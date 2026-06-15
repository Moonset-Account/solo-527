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
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createContract } from '../../store/slices/contractsSlice';
import { fetchCustomers } from '../../store/slices/leadsSlice';
import { fetchUsers } from '../../store/slices/commonSlice';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const ContractCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customers } = useSelector(state => state.leads);
  const { users } = useSelector(state => state.common);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [contractId, setContractId] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomers({ page_size: 50 }));
    dispatch(fetchUsers());
  }, [dispatch]);

  const steps = [
    { title: '基本信息' },
    { title: '合同详情' },
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
      const data = {
        ...values,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
      };
      const result = await dispatch(createContract(data));
      if (createContract.fulfilled.match(result)) {
        setContractId(result.payload.id);
        setCurrentStep(2);
        message.success('合同创建成功');
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
                  name="contract_type"
                  label="合同类型"
                  rules={[{ required: true, message: '请选择合同类型' }]}
                  initialValue="treatment"
                >
                  <Select>
                    <Option value="treatment">治疗合同</Option>
                    <Option value="orthodontics">正畸合同</Option>
                    <Option value="implant">种植合同</Option>
                    <Option value="cosmetic">美容合同</Option>
                    <Option value="comprehensive">综合合同</Option>
                    <Option value="other">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="lead" label="关联线索">
                  <Select
                    showSearch
                    placeholder="请选择"
                    optionFilterProp="children"
                    allowClear
                  >
                    {/* 这里应该加载线索列表 */}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="sales_person" label="销售">
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
                <Form.Item name="doctor" label="主治医生">
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
                <Form.Item name="consultation" label="关联咨询">
                  <Select
                    showSearch
                    placeholder="请选择"
                    optionFilterProp="children"
                    allowClear
                  >
                    {/* 这里应该加载咨询记录 */}
                  </Select>
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
            <Form.Item name="treatment_plan" label="治疗方案">
              <TextArea rows={3} placeholder="请描述治疗方案" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="treatment_cycle" label="治疗周期">
                  <Input placeholder="如：3-6个月" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="start_date" label="开始日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="end_date" label="结束日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="warranty_info" label="质保信息">
              <TextArea rows={2} placeholder="质保信息说明" />
            </Form.Item>
            <Divider />
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="discount_percent" label="折扣比例(%)" initialValue={0}>
                  <InputNumber min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item name="discount_reason" label="折扣理由">
                  <Input placeholder="请输入折扣申请理由" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="notes" label="备注">
              <TextArea rows={2} placeholder="其他备注信息" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                <Button type="primary" onClick={handleSubmit}>
                  创建合同
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}>✓</div>
            <h3>合同创建成功！</h3>
            <p style={{ color: '#999', marginBottom: 24 }}>
              您可以继续添加合同项目或提交审批
            </p>
            <Space>
              <Button onClick={() => navigate('/contracts')}>返回列表</Button>
              <Button type="primary" onClick={() => navigate(`/contracts/${contractId}`)}>
                查看详情
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ContractCreate;
