import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Form,
  Input,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Popconfirm,
} from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReadOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { request } from '../api/client';
import { DASHBOARD } from '../api/endpoints';
import { formatDateTime } from '../utils/format';
import useAuthStore from '../store/authStore';

const ALERT_TYPE_OPTIONS = [
  { value: 'info', label: '信息', color: 'blue' },
  { value: 'warning', label: '警告', color: 'gold' },
  { value: 'danger', label: '危险', color: 'red' },
  { value: 'success', label: '成功', color: 'green' },
];

const ALERT_SOURCE_OPTIONS = [
  { value: 'booking', label: '预约' },
  { value: 'payment', label: '支付' },
  { value: 'conversion', label: '转化' },
  { value: 'inventory', label: '库存' },
  { value: 'staff', label: '员工' },
  { value: 'system', label: '系统' },
];

const getAlertTypeColor = (type) => {
  const opt = ALERT_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? opt.color : 'default';
};

const getAlertTypeLabel = (type) => {
  const opt = ALERT_TYPE_OPTIONS.find((o) => o.value === type);
  return opt ? opt.label : type || '-';
};

const getSourceLabel = (source) => {
  const opt = ALERT_SOURCE_OPTIONS.find((o) => o.value === source);
  return opt ? opt.label : source || '-';
};

const AlertPage = () => {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdminOrManager = hasRole('admin') || hasRole('manager');
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [sourceFilter, setSourceFilter] = useState(undefined);
  const [readFilter, setReadFilter] = useState(undefined);
  const [actionRequiredFilter, setActionRequiredFilter] = useState(undefined);
  const [resolvedFilter, setResolvedFilter] = useState(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [resolveForm] = Form.useForm();

  const { data: statsData } = useQuery({
    queryKey: ['alert-stats'],
    queryFn: () => request.get(`${DASHBOARD.ALERTS}stats/`),
    refetchInterval: 60000,
  });

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts', typeFilter, sourceFilter, readFilter, actionRequiredFilter, resolvedFilter],
    queryFn: () => {
      const params = {};
      if (typeFilter) params.alert_type = typeFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (readFilter !== undefined) params.is_read = readFilter;
      if (actionRequiredFilter !== undefined) params.is_action_required = actionRequiredFilter;
      if (resolvedFilter !== undefined) params.is_resolved = resolvedFilter;
      return request.get(DASHBOARD.ALERTS, params);
    },
    refetchInterval: 60000,
  });

  const alerts = alertsData?.results || alertsData || [];

  const markReadMutation = useMutation({
    mutationFn: (id) => request.patch(DASHBOARD.ALERT_DETAIL(id), { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id) => request.patch(DASHBOARD.ALERT_DETAIL(id), { is_read: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, ...data }) => request.post(`${DASHBOARD.ALERT_DETAIL(id)}resolve/`, data),
    onSuccess: () => {
      message.success('告警已处理');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      setResolveModalOpen(false);
      resolveForm.resetFields();
      setCurrentAlert(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => request.delete(DASHBOARD.ALERT_DETAIL(id)),
    onSuccess: () => {
      message.success('告警已删除');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    },
  });

  const batchMarkReadMutation = useMutation({
    mutationFn: (ids) => request.post(`${DASHBOARD.ALERTS}batch-mark-read/`, { ids }),
    onSuccess: () => {
      message.success('批量标记已读成功');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      setSelectedRowKeys([]);
    },
  });

  const batchResolveMutation = useMutation({
    mutationFn: (ids) => request.post(`${DASHBOARD.ALERTS}batch-resolve/`, { ids }),
    onSuccess: () => {
      message.success('批量处理成功');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      setSelectedRowKeys([]);
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids) => request.post(`${DASHBOARD.ALERTS}batch-delete/`, { ids }),
    onSuccess: () => {
      message.success('批量删除成功');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      setSelectedRowKeys([]);
    },
  });

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields();
      resolveMutation.mutate({ id: currentAlert.id, ...values });
    } catch {}
  };

  const handleExpand = useCallback((expanded, record) => {
    if (expanded && !record.is_read) {
      markReadMutation.mutate(record.id);
    }
  }, [markReadMutation]);

  const columns = [
    {
      title: '类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 80,
      render: (v) => <Tag color={getAlertTypeColor(v)}>{getAlertTypeLabel(v)}</Tag>,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 80,
      render: (v) => <Tag>{getSourceLabel(v)}</Tag>,
    },
    { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
    {
      title: '内容',
      dataIndex: 'message',
      key: 'message',
      width: 200,
      render: (v) => {
        if (!v) return '-';
        return v.length > 50 ? `${v.slice(0, 50)}...` : v;
      },
    },
    { title: '指派', dataIndex: 'assigned_to', key: 'assigned_to', width: 80, render: (v) => v?.name || v?.username || '-' },
    {
      title: '已读',
      dataIndex: 'is_read',
      key: 'is_read',
      width: 70,
      render: (v) => v ? <Tag color="blue">已读</Tag> : <Tag color="default">未读</Tag>,
    },
    {
      title: '需处理',
      dataIndex: 'is_action_required',
      key: 'is_action_required',
      width: 70,
      render: (v) => v ? <Tag color="orange">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '已解决',
      dataIndex: 'is_resolved',
      key: 'is_resolved',
      width: 70,
      render: (v) => v ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (v) => formatDateTime(v) },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => {
        const buttons = [];
        if (record.is_read) {
          buttons.push(
            <Button key="unread" size="small" icon={<EyeOutlined />} onClick={() => markUnreadMutation.mutate(record.id)}>
              未读
            </Button>
          );
        } else {
          buttons.push(
            <Button key="read" size="small" icon={<ReadOutlined />} onClick={() => markReadMutation.mutate(record.id)}>
              已读
            </Button>
          );
        }
        if (!record.is_resolved) {
          buttons.push(
            <Button
              key="resolve"
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => { setCurrentAlert(record); setResolveModalOpen(true); }}
            >
              处理
            </Button>
          );
        }
        if (isAdminOrManager) {
          buttons.push(
            <Popconfirm
              key="delete"
              title="确认删除该告警？"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          );
        }
        return <Space size="small" wrap>{buttons}</Space>;
      },
    },
  ];

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">告警提醒</div>
        <div className="page-description">查看系统告警与提醒</div>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总告警" value={statsData?.total ?? alerts.length} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="未读"
              value={statsData?.unread_count ?? alerts.filter((a) => !a.is_read).length}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="需处理"
              value={statsData?.action_required_count ?? alerts.filter((a) => a.is_action_required).length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已解决"
              value={statsData?.resolved_count ?? alerts.filter((a) => a.is_resolved).length}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="告警类型"
            allowClear
            style={{ width: 120 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={ALERT_TYPE_OPTIONS}
          />
          <Select
            placeholder="来源"
            allowClear
            style={{ width: 120 }}
            value={sourceFilter}
            onChange={setSourceFilter}
            options={ALERT_SOURCE_OPTIONS}
          />
          <Select
            placeholder="已读"
            allowClear
            style={{ width: 100 }}
            value={readFilter}
            onChange={setReadFilter}
            options={[{ value: true, label: '已读' }, { value: false, label: '未读' }]}
          />
          <Select
            placeholder="需处理"
            allowClear
            style={{ width: 100 }}
            value={actionRequiredFilter}
            onChange={setActionRequiredFilter}
            options={[{ value: true, label: '是' }, { value: false, label: '否' }]}
          />
          <Select
            placeholder="已解决"
            allowClear
            style={{ width: 100 }}
            value={resolvedFilter}
            onChange={setResolvedFilter}
            options={[{ value: true, label: '是' }, { value: false, label: '否' }]}
          />
        </Space>
      </Card>

      {hasSelected && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <Button size="small" icon={<ReadOutlined />} onClick={() => batchMarkReadMutation.mutate(selectedRowKeys)} loading={batchMarkReadMutation.isPending}>
              批量标记已读
            </Button>
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => batchResolveMutation.mutate(selectedRowKeys)} loading={batchResolveMutation.isPending}>
              批量处理
            </Button>
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 条告警？`}
              onConfirm={() => batchDeleteMutation.mutate(selectedRowKeys)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" danger icon={<DeleteOutlined />} loading={batchDeleteMutation.isPending}>
                批量删除
              </Button>
            </Popconfirm>
          </Space>
        </Card>
      )}

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={alerts}
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          expandable={{
            onExpand: handleExpand,
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 0' }}>
                <p><strong>完整内容：</strong>{record.message || '-'}</p>
                {record.related_info && (
                  <p><strong>相关信息：</strong>{typeof record.related_info === 'string' ? record.related_info : JSON.stringify(record.related_info)}</p>
                )}
                {record.assigned_to && <p><strong>指派人：</strong>{record.assigned_to?.name || record.assigned_to?.username || '-'}</p>}
                {record.resolved_by && <p><strong>处理人：</strong>{record.resolved_by?.name || record.resolved_by?.username || '-'}</p>}
                {record.resolved_at && <p><strong>处理时间：</strong>{formatDateTime(record.resolved_at)}</p>}
                {record.resolution_notes && <p><strong>处理备注：</strong>{record.resolution_notes}</p>}
              </div>
            ),
          }}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title="处理告警"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); resolveForm.resetFields(); setCurrentAlert(null); }}
        confirmLoading={resolveMutation.isPending}
        destroyOnClose
      >
        <Form form={resolveForm} layout="vertical" preserve={false}>
          <Form.Item name="resolution_notes" label="处理备注" rules={[{ required: true, message: '请输入处理备注' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertPage;
