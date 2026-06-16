import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Avatar,
  Drawer,
  Descriptions,
  Tabs,
  Popconfirm,
  Divider,
  Empty,
  List,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  refundsApi,
  RefundRule,
  RefundRequestListItem,
  campsApi,
  usersApi,
} from '../services/api';
import { refundStatusMap, formatDate, formatNumber } from '../lib/constants';

const { RangePicker } = DatePicker;

const RefundsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RefundRule | null>(null);

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<RefundRequestListItem | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<RefundRequestListItem | null>(null);

  const [ruleForm] = Form.useForm();
  const [processForm] = Form.useForm();

  const { data: camps } = useQuery({
    queryKey: ['camps', 'all'],
    queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
  });

  const { data: operators } = useQuery({
    queryKey: ['users', 'operators'],
    queryFn: usersApi.listOperators,
  });

  const { data: rules, refetch: refetchRules } = useQuery({
    queryKey: ['refunds', 'rules'],
    queryFn: () => refundsApi.listRules(),
  });

  const { data: requests, isLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['refunds', 'requests', page, pageSize, filters],
    queryFn: () => refundsApi.listRequests({ page, pageSize, ...filters }),
  });

  const ruleMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingRule) {
        return refundsApi.updateRule(editingRule.id, data);
      }
      return refundsApi.createRule(data);
    },
    onSuccess: () => {
      message.success(editingRule ? '规则已更新' : '规则已创建');
      setRuleModalOpen(false);
      setEditingRule(null);
      ruleForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['refunds', 'rules'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => refundsApi.removeRule(id),
    onSuccess: () => {
      message.success('规则已删除');
      queryClient.invalidateQueries({ queryKey: ['refunds', 'rules'] });
    },
  });

  const processMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      refundsApi.processRequest(id, data),
    onSuccess: () => {
      message.success('处理完成');
      setProcessModalOpen(false);
      setProcessingRequest(null);
      processForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['refunds', 'requests'] });
    },
  });

  const openDetail = async (id: string) => {
    try {
      const d = await refundsApi.getRequest(id);
      setDetail(d);
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.status) newFilters.status = values.status;
    if (values.campId) newFilters.campId = values.campId;
    if (values.processedBy) newFilters.processedBy = values.processedBy;
    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0]?.toISOString();
      newFilters.endDate = values.dateRange[1]?.toISOString();
    }
    setFilters(newFilters);
    setPage(1);
  };

  const requestColumns: ColumnsType<RefundRequestListItem> = [
    {
      title: '学员',
      dataIndex: 'userName',
      width: 140,
      render: (name, r) => (
        <Space>
          <Avatar style={{ backgroundColor: '#FA8C16' }}>{name?.slice(0, 1)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{r.memberNo}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '营期',
      dataIndex: 'campName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '适用规则',
      dataIndex: 'ruleName',
      width: 140,
      render: (n) => n || '—',
    },
    {
      title: '退款金额',
      dataIndex: 'amount',
      width: 120,
      render: (a) => <span style={{ fontWeight: 600, color: '#cf1322' }}>¥{formatNumber(a)}</span>,
    },
    {
      title: '退款原因',
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const map = refundStatusMap[s] || {};
        return <Tag color={map.color as any}>{map.label}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'requestedAt',
      width: 160,
      render: (d) => formatDate(d),
    },
    {
      title: '处理人',
      width: 100,
      render: (_, r) => {
        const op = operators?.find((o) => o.id === r.processedBy);
        return op?.name || '—';
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>
            详情
          </Button>
          {(r.status === 'pending' || r.status === 'approved') && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setProcessingRequest(r);
                processForm.setFieldsValue({ status: 'processed' });
                setProcessModalOpen(true);
              }}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const ruleColumns: ColumnsType<RefundRule> = [
    {
      title: '所属营期',
      dataIndex: 'campId',
      width: 200,
      render: (id) => camps?.items?.find((c: any) => c.id === id)?.name || id,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '入营天数内',
      dataIndex: 'daysFromJoin',
      width: 120,
      render: (d) => <Tag>{d} 天</Tag>,
    },
    {
      title: '退款比例',
      dataIndex: 'refundRate',
      width: 120,
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#FA8C16' }}>{formatNumber(r, 0)}%</span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '启用',
      dataIndex: 'isActive',
      width: 80,
      render: (a) => (a ? <Tag color="green">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (d) => formatDate(d),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRule(r);
              ruleForm.setFieldsValue(r);
              setRuleModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => deleteRuleMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = {
    total: requests?.total || 0,
    pending: requests?.items?.filter((i) => i.status === 'pending').length || 0,
    approved: requests?.items?.filter((i) => i.status === 'approved' || i.status === 'processed').length || 0,
    rejected: requests?.items?.filter((i) => i.status === 'rejected').length || 0,
  };

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'requests',
              label: `退款申请（${stats.total}）`,
              children: (
                <div>
                  <div className="filter-bar" style={{ padding: 0, marginBottom: 16, boxShadow: 'none' }}>
                    <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
                      <div className="filter-row">
                        <Form.Item name="status">
                          <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(refundStatusMap).map(([v, l]) => ({ value: v, label: l.label }))} />
                        </Form.Item>
                        <Form.Item name="campId">
                          <Select allowClear placeholder="营期" style={{ width: 180 }} options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))} />
                        </Form.Item>
                        <Form.Item name="processedBy">
                          <Select allowClear placeholder="处理人" style={{ width: 120 }} options={operators?.map((o) => ({ value: o.id, label: o.name }))} />
                        </Form.Item>
                        <Form.Item name="dateRange">
                          <RangePicker placeholder={['申请时间起', '止']} style={{ width: 240 }} />
                        </Form.Item>
                        <Form.Item>
                          <Space>
                            <Button type="primary" htmlType="submit">查询</Button>
                            <Button onClick={() => { setFilters({}); }}>重置</Button>
                          </Space>
                        </Form.Item>
                      </div>
                    </Form>
                  </div>
                  <Space style={{ marginBottom: 16 }}>
                    <Tag color="warning">待处理 {stats.pending}</Tag>
                    <Tag color="success">已完成 {stats.approved}</Tag>
                    <Tag color="error">已拒绝 {stats.rejected}</Tag>
                  </Space>
                  <Table<RefundRequestListItem>
                    rowKey="id"
                    loading={isLoading}
                    columns={requestColumns}
                    dataSource={requests?.items}
                    pagination={{
                      current: page,
                      pageSize,
                      total: requests?.total || 0,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                      showTotal: (t) => `共 ${t} 条`,
                    }}
                    scroll={{ x: 1300 }}
                  />
                </div>
              ),
            },
            {
              key: 'rules',
              label: `退款规则（${rules?.length || 0}）`,
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingRule(null);
                        ruleForm.resetFields();
                        ruleForm.setFieldsValue({ isActive: true, daysFromJoin: 7, refundRate: 100 });
                        setRuleModalOpen(true);
                      }}
                    >
                      新建规则
                    </Button>
                  </div>
                  <Table<RefundRule>
                    rowKey="id"
                    columns={ruleColumns}
                    dataSource={rules}
                    pagination={false}
                    scroll={{ x: 1100 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑退款规则' : '新建退款规则'}
        open={ruleModalOpen}
        onCancel={() => setRuleModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={ruleForm} layout="vertical" onFinish={(v) => ruleMutation.mutate(v)}>
          <Form.Item label="所属营期" name="campId" rules={[{ required: true }]}>
            <Select options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))} placeholder="请选择营期" />
          </Form.Item>
          <Form.Item label="规则名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="如：7天无理由退款" />
          </Form.Item>
          <Form.Item label="规则描述" name="description">
            <Input.TextArea rows={3} placeholder="描述退款适用范围和条件" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="入营天数内" name="daysFromJoin" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} addonAfter="天" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="退款比例" name="refundRate" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="是否启用" name="isActive" valuePropName="checked">
            <Select options={[{ value: true, label: '启用' }, { value: false, label: '禁用' }]} />
          </Form.Item>
          <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRuleModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={ruleMutation.isPending}>
                {editingRule ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理退款申请"
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        {processingRequest && (
          <div>
            <div style={{ padding: 12, background: '#FAFAFA', borderRadius: 8, marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="学员">{processingRequest.userName}（{processingRequest.memberNo}）</Descriptions.Item>
                <Descriptions.Item label="营期">{processingRequest.campName}</Descriptions.Item>
                <Descriptions.Item label="适用规则">{processingRequest.ruleName || '—'}</Descriptions.Item>
                <Descriptions.Item label="退款金额">
                  <span style={{ color: '#cf1322', fontWeight: 600 }}>¥{formatNumber(processingRequest.amount)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="退款原因">{processingRequest.reason}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{formatDate(processingRequest.requestedAt)}</Descriptions.Item>
              </Descriptions>
            </div>
            <Form form={processForm} layout="vertical" onFinish={(v) => processMutation.mutate({ id: processingRequest.id, data: v })}>
              <Form.Item label="处理结果" name="status" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'approved', label: <span style={{ color: '#1890ff' }}><CheckOutlined /> 同意退款</span> },
                    { value: 'rejected', label: <span style={{ color: '#ff4d4f' }}><CloseOutlined /> 拒绝</span> },
                    { value: 'processed', label: <span style={{ color: '#52c41a' }}>已完成退款</span> },
                  ]}
                />
              </Form.Item>
              <Form.Item label="处理备注" name="processComment">
                <Input.TextArea rows={3} placeholder="输入处理意见（可选）" />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setProcessModalOpen(false)}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={processMutation.isPending}>
                    提交
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Drawer title="退款申请详情" width={520} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {detail ? (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="会员编号">{detail.memberNo}</Descriptions.Item>
              <Descriptions.Item label="学员姓名">{detail.userName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.userPhone || '—'}</Descriptions.Item>
              <Descriptions.Item label="营期">{detail.campName}</Descriptions.Item>
              <Descriptions.Item label="适用规则">{detail.ruleName || '—'}</Descriptions.Item>
              {detail.ruleDays !== undefined && (
                <Descriptions.Item label="规则参数">
                  入营 {detail.ruleDays} 天内，退款 {formatNumber(detail.ruleRate as any, 0)}%
                </Descriptions.Item>
              )}
              <Descriptions.Item label="退款金额">
                <span style={{ color: '#cf1322', fontWeight: 600 }}>¥{formatNumber(detail.amount)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="退款原因">{detail.reason}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(refundStatusMap[detail.status] || {}).color as any}>
                  {(refundStatusMap[detail.status] || {}).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{formatDate(detail.requestedAt)}</Descriptions.Item>
              {detail.processedAt && (
                <>
                  <Descriptions.Item label="处理时间">{formatDate(detail.processedAt)}</Descriptions.Item>
                  <Descriptions.Item label="处理备注">{detail.processComment || '—'}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        ) : (
          <Empty />
        )}
      </Drawer>
    </div>
  );
};

export default RefundsPage;
