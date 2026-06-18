import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Typography,
  Rate,
  Checkbox,
  message,
  Spin,
  Row,
  Col,
  Card,
} from 'antd';
import {
  PlusOutlined,
  StarOutlined,
  StarFilled,
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import request from '../../utils/request';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Appointment,
  Service,
  Pet,
  AppointmentStatus,
  AppointmentStatusLabels,
  AppointmentStatusColors,
  ReviewRating,
  BadReviewReason,
  BadReviewReasonLabels,
  PageResult,
  ApiResponse,
} from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

interface CreateAppointmentFormValues {
  serviceId: string;
  petId?: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petAge?: number;
  petGender?: string;
  dateTime: [Dayjs, Dayjs];
  notes?: string;
}

interface ReviewFormValues {
  reviewRating: ReviewRating;
  reviewComment?: string;
  badReviewReason?: BadReviewReason;
}

const AppointmentsPage = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);

  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm<CreateAppointmentFormValues>();
  const [createLoading, setCreateLoading] = useState(false);
  const [isNewPet, setIsNewPet] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [reviewForm] = Form.useForm<ReviewFormValues>();
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params: any = {
        customerId: user.id,
        page: 1,
        pageSize: 100,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: ApiResponse<PageResult<Appointment>> = await request.get('/appointments', { params });
      setAppointments(res.data?.data || []);
    } catch (error) {
      console.error('获取预约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res: ApiResponse<Service[]> = await request.get('/services/active/list');
      setServices(res.data || []);
    } catch (error) {
      console.error('获取服务列表失败:', error);
    }
  };

  const fetchPets = async () => {
    try {
      const res: ApiResponse<PageResult<Pet>> = await request.get('/pets', {
        params: { page: 1, pageSize: 100 },
      });
      setPets(res.data?.data || []);
    } catch (error) {
      console.error('获取宠物列表失败:', error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchPets();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateRange, user?.id]);

  useEffect(() => {
    const state = location.state as { preselectedServiceId?: string };
    if (state?.preselectedServiceId) {
      createForm.setFieldsValue({ serviceId: state.preselectedServiceId });
      setCreateModalVisible(true);
    }
  }, [location.state]);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      const dateTime = createForm.getFieldValue('dateTime');
      if (dateTime && dateTime[0]) {
        createForm.setFieldsValue({
          dateTime: [dateTime[0], dateTime[0].add(service.duration, 'minute')],
        });
      }
    }
  };

  const handleStartTimeChange = (start: Dayjs | null) => {
    if (!start) return;
    const serviceId = createForm.getFieldValue('serviceId');
    const service = services.find((s) => s.id === serviceId);
    const duration = service?.duration || 60;
    createForm.setFieldsValue({
      dateTime: [start, start.add(duration, 'minute')],
    });
  };

  const handleCreateSubmit = async (values: CreateAppointmentFormValues) => {
    if (!user?.id) {
      message.error('用户信息未获取到，请重新登录');
      return;
    }
    const service = services.find((s) => s.id === values.serviceId);
    if (!service) {
      message.error('请选择服务');
      return;
    }

    let petId = values.petId;
    if (!petId) {
      if (!values.petName || !values.petSpecies) {
        message.error('请填写宠物信息或选择已有宠物');
        return;
      }
      try {
        const newPetRes: ApiResponse<Pet> = await request.post('/pets', {
          name: values.petName,
          species: values.petSpecies,
          breed: values.petBreed || '',
          age: values.petAge || 0,
          gender: values.petGender || 'unknown',
          ownerId: user.id,
        });
        petId = newPetRes.data.id;
        setPets((prev) => [...prev, newPetRes.data]);
      } catch (error) {
        message.error('创建宠物信息失败');
        return;
      }
    }

    setCreateLoading(true);
    try {
      await request.post('/appointments', {
        startTime: values.dateTime[0].toISOString(),
        endTime: values.dateTime[1].toISOString(),
        petId,
        customerId: user.id,
        serviceId: values.serviceId,
        totalPrice: service.price,
        notes: values.notes,
      });
      message.success('预约创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      setIsNewPet(false);
      fetchAppointments();
    } catch (error) {
      console.error('创建预约失败:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenReview = (record: Appointment) => {
    setReviewingAppointment(record);
    reviewForm.resetFields();
    if (record.reviewRating) {
      reviewForm.setFieldsValue({
        reviewRating: record.reviewRating,
        reviewComment: record.reviewComment,
        badReviewReason: record.badReviewReason,
      });
    } else {
      reviewForm.setFieldsValue({ reviewRating: ReviewRating.FIVE });
    }
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values: ReviewFormValues) => {
    if (!reviewingAppointment) return;
    setReviewLoading(true);
    try {
      await request.put(`/appointments/${reviewingAppointment.id}/review`, values);
      message.success('评价提交成功');
      setReviewModalVisible(false);
      fetchAppointments();
    } catch (error) {
      console.error('提交评价失败:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter(undefined);
    setDateRange(null);
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: '宠物名',
      dataIndex: ['pet', 'name'],
      key: 'petName',
      width: 120,
    },
    {
      title: '服务名',
      dataIndex: ['service', 'name'],
      key: 'serviceName',
      width: 160,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '价格',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (v: number) => <Text strong style={{ color: '#f5222d' }}>¥{Number(v).toFixed(2)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: AppointmentStatus) => (
        <Tag color={AppointmentStatusColors[v]}>{AppointmentStatusLabels[v]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === AppointmentStatus.COMPLETED && (
            <Button type="link" size="small" onClick={() => handleOpenReview(record)}>
              {record.reviewRating ? '查看评价' : '评价'}
            </Button>
          )}
          {record.reviewRating && (
            <Rate
              disabled
              value={record.reviewRating}
              character={<StarFilled />}
              style={{ fontSize: 14 }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          我的预约
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          新建预约
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text type="secondary" style={{ marginRight: 8 }}>
              <FilterOutlined /> 状态筛选:
            </Text>
            <Select
              style={{ width: 140 }}
              allowClear
              placeholder="全部状态"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              {Object.values(AppointmentStatus).map((status) => (
                <Option key={status} value={status}>
                  {AppointmentStatusLabels[status]}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Space>
              <CalendarOutlined style={{ color: '#8c8c8c' }} />
              <RangePicker
                value={dateRange as any}
                onChange={(dates) => setDateRange(dates as any)}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Table<Appointment>
          columns={columns}
          dataSource={appointments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Spin>

      <Modal
        title="新建预约"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
          setIsNewPet(false);
        }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form<CreateAppointmentFormValues>
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ reviewRating: ReviewRating.FIVE }}
        >
          <Form.Item
            label="选择服务"
            name="serviceId"
            rules={[{ required: true, message: '请选择服务' }]}
          >
            <Select placeholder="请选择服务" onChange={handleServiceChange} showSearch optionFilterProp="children">
              {services.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name} - ¥{Number(s.price).toFixed(2)} ({s.duration}分钟)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Checkbox checked={isNewPet} onChange={(e) => setIsNewPet(e.target.checked)}>
              添加新宠物
            </Checkbox>
          </Form.Item>

          {!isNewPet ? (
            <Form.Item
              label="选择宠物"
              name="petId"
              rules={[{ required: !isNewPet, message: '请选择宠物或添加新宠物' }]}
            >
              <Select placeholder="请选择宠物" showSearch optionFilterProp="children">
                {pets.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name} ({p.species} - {p.breed})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="宠物名称"
                    name="petName"
                    rules={[{ required: isNewPet, message: '请输入宠物名称' }]}
                  >
                    <Input placeholder="请输入宠物名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="物种"
                    name="petSpecies"
                    rules={[{ required: isNewPet, message: '请输入物种' }]}
                  >
                    <Input placeholder="如: 猫、狗" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="品种" name="petBreed">
                    <Input placeholder="请输入品种" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="年龄(岁)" name="petAge">
                    <Input type="number" min={0} placeholder="请输入年龄" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="性别" name="petGender">
                <Select placeholder="请选择性别">
                  <Option value="male">公</Option>
                  <Option value="female">母</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item
            label="选择日期时间"
            name="dateTime"
            rules={[{ required: true, message: '请选择日期时间' }]}
          >
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              onChange={(dates) => {
                if (dates && dates[0]) {
                  handleStartTimeChange(dates[0] as Dayjs);
                }
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="请输入备注信息（选填）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  createForm.resetFields();
                  setIsNewPet(false);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                提交预约
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={reviewingAppointment?.reviewRating ? '查看评价' : '服务评价'}
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={480}
        destroyOnClose
      >
        {reviewingAppointment && (
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={4}>
              <Text>服务: {reviewingAppointment.service?.name}</Text>
              <Text type="secondary">
                时间: {dayjs(reviewingAppointment.startTime).format('YYYY-MM-DD HH:mm')}
              </Text>
            </Space>
          </div>
        )}
        <Form<ReviewFormValues> form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Form.Item
            label="服务评分"
            name="reviewRating"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate
              character={<StarOutlined />}
              characterRender={(node) => {
                return (
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <StarFilled style={{ position: 'absolute', color: '#fadb14', opacity: 0 }} />
                    {node}
                  </span>
                );
              }}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.reviewRating !== curr.reviewRating}>
            {({ getFieldValue }) => {
              const rating = getFieldValue('reviewRating') as ReviewRating;
              if (rating && rating <= ReviewRating.THREE) {
                return (
                  <Form.Item label="差评原因（选填）" name="badReviewReason">
                    <Select placeholder="请选择差评原因">
                      {Object.values(BadReviewReason).map((reason) => (
                        <Option key={reason} value={reason}>
                          {BadReviewReasonLabels[reason]}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item label="评价内容（选填）" name="reviewComment">
            <TextArea rows={4} placeholder="请分享您的服务体验..." />
          </Form.Item>

          {!reviewingAppointment?.reviewRating && (
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={reviewLoading}>
                  提交评价
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
