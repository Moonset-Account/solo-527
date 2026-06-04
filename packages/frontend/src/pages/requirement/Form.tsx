import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Steps, message, Space, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { requirementService } from '../../services/requirementService';
import { CustomerRequirement, TripType } from '../../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const tripTypeOptions: { value: TripType; label: string }[] = [
  { value: TripType.LEISURE, label: '休闲度假' },
  { value: TripType.BUSINESS, label: '商务出行' },
  { value: TripType.FAMILY, label: '家庭出游' },
  { value: TripType.HONEYMOON, label: '蜜月旅行' },
  { value: TripType.GROUP, label: '团队定制' },
];

export default function RequirementForm() {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: requirement } = useQuery(
    ['requirement', id],
    () => requirementService.getById(id!),
    { enabled: isEdit, onSuccess: (data) => form.setFieldsValue(data.data) }
  );

  const createMutation = useMutation((data: Partial<CustomerRequirement>) => requirementService.create(data), {
    onSuccess: () => {
      message.success('需求创建成功');
      queryClient.invalidateQueries('requirements');
      navigate('/requirements');
    },
    onError: () => message.error('创建失败'),
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CustomerRequirement> }) => requirementService.update(id, data),
    {
      onSuccess: () => {
        message.success('需求更新成功');
        queryClient.invalidateQueries(['requirement', id]);
        queryClient.invalidateQueries('requirements');
      },
      onError: () => message.error('更新失败'),
    }
  );

  const onFinish = async (values: any) => {
    const data = {
      ...values,
      startDate: values.startDate?.toISOString(),
    };

    if (isEdit) {
      updateMutation.mutate({ id: id!, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const steps = [
    { title: '基本信息', description: '客户和行程基本信息' },
    { title: '详细需求', description: '酒店、交通、景点等需求' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/requirements')}>
          返回列表
        </Button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          {isEdit ? '编辑需求' : '新建客户需求'}
        </span>
      </Space>

      <Card>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step) => (
            <Step key={step.title} title={step.title} description={step.description} />
          ))}
        </Steps>

        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ travelerCount: 2, adultCount: 2, childCount: 0 }}>
          {currentStep === 0 && (
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}>
                  <Input placeholder="请输入客户姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="customerEmail" label="邮箱">
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="customerCompany" label="公司名称">
                  <Input placeholder="请输入公司名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tripType" label="出行类型" rules={[{ required: true }]}>
                  <Select placeholder="请选择出行类型">
                    {tripTypeOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="destination" label="目的地" rules={[{ required: true }]}>
                  <Input placeholder="请输入目的地" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="travelerCount" label="总人数" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="adultCount" label="成人数量" rules={[{ required: true }]}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="childCount" label="儿童数量">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="startDate" label="预计出发日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="durationDays" label="行程天数" rules={[{ required: true }]}>
                  <InputNumber min={1} addonAfter="天" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="budgetRangeMin" label="预算下限">
                  <InputNumber min={0} addonBefore="¥" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="budgetRangeMax" label="预算上限">
                  <InputNumber min={0} addonBefore="¥" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {currentStep === 1 && (
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item name="hotelRequirements" label="酒店要求">
                  <TextArea rows={3} placeholder="例如：五星酒店、含早餐、市中心位置等" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="transportationNeeds" label="交通需求">
                  <TextArea rows={3} placeholder="例如：接送机、商务车、高铁等" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="attractions" label="想去的景点">
                  <TextArea rows={3} placeholder="请列出客户想去的景点" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="diningPreferences" label="餐饮偏好">
                  <TextArea rows={2} placeholder="例如：中餐、当地特色、忌口等" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="specialRequirements" label="特殊要求">
                  <TextArea rows={3} placeholder="其他特殊要求" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="internalNotes" label="内部备注">
                  <TextArea rows={2} placeholder="内部备注，不会显示给客户" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>上一步</Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={() => form.validateFields().then(() => setCurrentStep(currentStep + 1))}>
                  下一步
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="primary" htmlType="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
                  {isEdit ? '保存修改' : '创建需求'}
                </Button>
              )}
              <Button onClick={() => navigate('/requirements')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
