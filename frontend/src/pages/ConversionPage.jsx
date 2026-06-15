import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  Tag,
  Button,
  Badge,
  Avatar,
  Table,
  Select,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Col,
  message,
} from 'antd';
import {
  UserOutlined,
  RightOutlined,
  CrownOutlined,
  BellOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { request } from '../api/client';
import { CONVERSION, AUTH } from '../api/endpoints';
import {
  CONVERSION_STAGE,
  CONVERSION_STAGE_OPTIONS,
  CONVERSION_REMINDER_TYPE_OPTIONS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatDateTime } from '../utils/format';

const STAGE_COLOR_MAP = {
  booking: '#1677ff',
  arrival: '#13c2c2',
  service: '#52c41a',
  payment: '#faad14',
  membership: '#722ed1',
};

const STAGE_ORDER = [
  CONVERSION_STAGE.BOOKING,
  CONVERSION_STAGE.ARRIVAL,
  CONVERSION_STAGE.SERVICE,
  CONVERSION_STAGE.PAYMENT,
  CONVERSION_STAGE.MEMBERSHIP,
];

const FunnelKanban = () => {
  const queryClient = useQueryClient();
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [currentFunnel, setCurrentFunnel] = useState(null);
  const [memberForm] = Form.useForm();

  const { data: funnelsData, isLoading } = useQuery({
    queryKey: ['funnels'],
    queryFn: () => request.get(CONVERSION.FUNNELS),
    refetchInterval: 5 * 60 * 1000,
  });

  const funnels = funnelsData?.results || funnelsData || [];

  const grouped = {};
  STAGE_ORDER.forEach((s) => {
    grouped[s] = [];
  });
  funnels.forEach((f) => {
    const stage = f.current_stage || CONVERSION_STAGE.BOOKING;
    if (grouped[stage]) {
      grouped[stage].push(f);
    }
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id }) =>
      request.post(`${CONVERSION.FUNNEL_DETAIL(id)}advance_stage/`),
    onSuccess: () => {
      message.success('阶段推进成功');
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
    },
  });

  const convertMemberMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.post(`${CONVERSION.FUNNEL_DETAIL(id)}convert_member/`, data),
    onSuccess: () => {
      message.success('转会员成功');
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      setMemberModalOpen(false);
      memberForm.resetFields();
      setCurrentFunnel(null);
    },
  });

  const handleAdvance = (funnel) => {
    advanceMutation.mutate({ id: funnel.id });
  };

  const handleOpenMemberModal = (funnel) => {
    setCurrentFunnel(funnel);
    setMemberModalOpen(true);
  };

  const handleConvertMember = async () => {
    try {
      const values = await memberForm.validateFields();
      convertMemberMutation.mutate({
        id: currentFunnel.id,
        ...values,
      });
    } catch {}
  };

  const getNextStage = (stage) => {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx < STAGE_ORDER.length - 1) return STAGE_ORDER[idx + 1];
    return null;
  };

  return (
    <>
      <Row gutter={[12, 0]} style={{ overflowX: 'auto' }}>
        {STAGE_ORDER.map((stageKey) => {
          const stageOption = CONVERSION_STAGE_OPTIONS.find(
            (o) => o.value === stageKey
          );
          const items = grouped[stageKey] || [];
          const nextStage = getNextStage(stageKey);

          return (
            <Col
              span={Math.floor(24 / STAGE_ORDER.length)}
              key={stageKey}
              style={{ minWidth: 220 }}
            >
              <div
                style={{
                  borderTop: `3px solid ${STAGE_COLOR_MAP[stageKey] || '#1677ff'}`,
                  background: '#fafafa',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 400,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <Tag color={stageOption?.color}>{stageOption?.label}</Tag>
                  <Badge
                    count={items.length}
                    style={{ backgroundColor: '#999' }}
                  />
                </div>
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {items.length === 0 && (
                    <div
                      style={{
                        color: '#bbb',
                        textAlign: 'center',
                        padding: '40px 0',
                        fontSize: 13,
                      }}
                    >
                      暂无数据
                    </div>
                  )}
                  {items.map((item, idx) => (
                    <Card
                      key={item.id || idx}
                      size="small"
                      style={{
                        marginBottom: 8,
                        borderRadius: 6,
                        borderLeft: `3px solid ${STAGE_COLOR_MAP[stageKey]}`,
                      }}
                      bodyStyle={{ padding: '10px 12px' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <Avatar size="small" icon={<UserOutlined />} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {item.booking?.contact_name ||
                            item.customer_name ||
                            '-'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        {item.booking?.order_no && (
                          <div>单号: {item.booking.order_no}</div>
                        )}
                        {item.booking?.contact_phone && (
                          <div>电话: {item.booking.contact_phone}</div>
                        )}
                        {item.service_name && (
                          <div>服务: {item.service_name}</div>
                        )}
                        {item.created_at && (
                          <div>
                            进入时间: {formatDateTime(item.created_at)}
                          </div>
                        )}
                      </div>
                      {nextStage && (
                        <div
                          style={{
                            marginTop: 8,
                            display: 'flex',
                            gap: 4,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Popconfirm
                            title={`确认推进到「${getLabelByValue(CONVERSION_STAGE_OPTIONS, nextStage)}」？`}
                            onConfirm={() => handleAdvance(item)}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button
                              size="small"
                              type="primary"
                              icon={<RightOutlined />}
                              loading={advanceMutation.isPending}
                            >
                              推进
                            </Button>
                          </Popconfirm>
                          {stageKey === CONVERSION_STAGE.PAYMENT && (
                            <Button
                              size="small"
                              icon={<CrownOutlined />}
                              onClick={() => handleOpenMemberModal(item)}
                            >
                              转会员
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      <Modal
        title="转会员"
        open={memberModalOpen}
        onOk={handleConvertMember}
        onCancel={() => {
          setMemberModalOpen(false);
          memberForm.resetFields();
          setCurrentFunnel(null);
        }}
        confirmLoading={convertMemberMutation.isPending}
        destroyOnClose
        width={480}
      >
        <Form form={memberForm} layout="vertical" preserve={false}>
          <Form.Item
            name="conversion_amount"
            label="转化金额"
            rules={[{ required: true, message: '请输入转化金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="¥"
              placeholder="请输入转化金额"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const ReminderTab = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [completedFilter, setCompletedFilter] = useState(undefined);
  const [assignedFilter, setAssignedFilter] = useState(undefined);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [completeForm] = Form.useForm();

  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['conversion-reminders', typeFilter, completedFilter, assignedFilter],
    queryFn: () => {
      const params = {};
      if (typeFilter) params.reminder_type = typeFilter;
      if (completedFilter !== undefined && completedFilter !== null)
        params.is_completed = completedFilter;
      if (assignedFilter) params.assigned_to = assignedFilter;
      return request.get(CONVERSION.REMINDERS, params);
    },
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => request.get(AUTH.STAFF_PROFILES),
  });

  const reminders = remindersData?.results || remindersData || [];
  const staffList = staffData?.results || staffData || [];

  const completeMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.post(`${CONVERSION.REMINDER_DETAIL(id)}complete/`, data),
    onSuccess: () => {
      message.success('提醒已完成');
      queryClient.invalidateQueries({ queryKey: ['conversion-reminders'] });
      setCompleteModalOpen(false);
      completeForm.resetFields();
      setCurrentReminder(null);
    },
  });

  const markRemindedMutation = useMutation({
    mutationFn: ({ id }) =>
      request.post(`${CONVERSION.REMINDER_DETAIL(id)}mark_reminded/`),
    onSuccess: () => {
      message.success('已标记为已提醒');
      queryClient.invalidateQueries({ queryKey: ['conversion-reminders'] });
    },
  });

  const handleOpenComplete = (record) => {
    setCurrentReminder(record);
    setCompleteModalOpen(true);
  };

  const handleComplete = async () => {
    try {
      const values = await completeForm.validateFields();
      completeMutation.mutate({ id: currentReminder.id, ...values });
    } catch {}
  };

  const columns = [
    {
      title: '预约单号',
      dataIndex: ['booking', 'order_no'],
      key: 'booking_order_no',
      render: (v) => v || '-',
    },
    {
      title: '客户姓名',
      dataIndex: ['booking', 'contact_name'],
      key: 'customer_name',
      render: (v) => v || '-',
    },
    {
      title: '提醒类型',
      dataIndex: 'reminder_type',
      key: 'reminder_type',
      render: (v) => (
        <Tag color={getColorByValue(CONVERSION_REMINDER_TYPE_OPTIONS, v)}>
          {getLabelByValue(CONVERSION_REMINDER_TYPE_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (v) => v?.name || v?.username || '-',
    },
    {
      title: '计划时间',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      render: (v) => formatDateTime(v),
    },
    {
      title: '是否完成',
      dataIndex: 'is_completed',
      key: 'is_completed',
      render: (v) => (
        <Tag color={v ? 'green' : 'gold'}>{v ? '已完成' : '未完成'}</Tag>
      ),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (v) => v || '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {!record.is_completed && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleOpenComplete(record)}
              >
                完成
              </Button>
              <Popconfirm
                title="确认标记为已提醒？"
                onConfirm={() =>
                  markRemindedMutation.mutate({ id: record.id })
                }
                okText="确认"
                cancelText="取消"
              >
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  loading={markRemindedMutation.isPending}
                >
                  已提醒
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="提醒类型"
            allowClear
            style={{ width: 160 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={CONVERSION_REMINDER_TYPE_OPTIONS}
          />
          <Select
            placeholder="是否完成"
            allowClear
            style={{ width: 120 }}
            value={completedFilter}
            onChange={setCompletedFilter}
            options={[
              { value: true, label: '已完成' },
              { value: false, label: '未完成' },
            ]}
          />
          <Select
            placeholder="负责人"
            allowClear
            showSearch
            style={{ width: 160 }}
            value={assignedFilter}
            onChange={setAssignedFilter}
            filterOption={(input, option) =>
              (option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={staffList.map((s) => ({
              value: s.id,
              label: s.name || s.user?.username || String(s.id),
            }))}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reminders}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="完成提醒"
        open={completeModalOpen}
        onOk={handleComplete}
        onCancel={() => {
          setCompleteModalOpen(false);
          completeForm.resetFields();
          setCurrentReminder(null);
        }}
        confirmLoading={completeMutation.isPending}
        destroyOnClose
        width={480}
      >
        <Form form={completeForm} layout="vertical" preserve={false}>
          <Form.Item
            name="result"
            label="处理结果"
            rules={[{ required: true, message: '请输入处理结果' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入处理结果" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const ConversionPage = () => {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">到店转化</div>
        <div className="page-description">跟踪客户到店转化漏斗</div>
      </div>

      <Card>
        <Tabs
          defaultActiveKey="kanban"
          items={[
            {
              key: 'kanban',
              label: '转化看板',
              children: <FunnelKanban />,
            },
            {
              key: 'reminders',
              label: '转化提醒',
              children: <ReminderTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ConversionPage;
