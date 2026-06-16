import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Input,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
  Tooltip,
  App as AntdApp,
  Dropdown,
  Progress,
  Drawer,
  List,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  DownOutlined,
  EyeOutlined,
  WarningOutlined,
  FileTextOutlined,
  TagOutlined,
  StockOutlined,
  AuditOutlined,
  WarningTwoTone,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { batchOpApi, exportApi, userApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtDateTime,
  parsePagination,
} from '@/utils/format.js';
import { BATCH_OP_STATUS, BATCH_OP_TYPES } from '@/utils/constants.js';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TYPE_ICONS = {
  PRICE_UPDATE: <TagOutlined />,
  BATCH_STATUS_UPDATE: <ClockCircleOutlined />,
  STOCK_ADJUST: <StockOutlined />,
  STOCKTAKE_CONFIRM: <AuditOutlined />,
  REASSIGN_SUPPLIER: <FileTextOutlined />,
  BATCH_CREATE_EXCEPTION: <WarningOutlined />,
  SUPPLIER_RATE_BATCH: <StarOutlined />,
};

export default function BatchOpList() {
  const { message: msg, modal } = AntdApp.useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({});
  const [stats, setStats] = useState({ processing: 0, pending: 0, success: 0, failed: 0 });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState(null);
  const [createForm] = Form.useForm();
  const [modalLoading, setModalLoading] = useState(false);

  const [failDrawerOpen, setFailDrawerOpen] = useState(false);
  const [failItems, setFailItems] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(null);

  const [creatorOptions, setCreatorOptions] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await batchOpApi.list({ page: 1, pageSize: 1000 });
      const data = res.data?.list || res.data?.records || [];
      const stats = {
        processing: data.filter((d) => d.status === 'PROCESSING').length,
        pending: data.filter((d) => d.status === 'PENDING_CONFIRM').length,
        success: data.filter((d) => d.status === 'COMPLETED' || d.status === 'PARTIAL_SUCCESS').length,
        failed: data.filter((d) => d.status === 'FAILED').length,
      };
      setStats(stats);
    } catch (e) {}
  };

  const fetchList = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = { page, pageSize, ...filters };
      const res = await batchOpApi.list(params);
      const data = res.data?.list || res.data?.records || [];
      setList(data);
      setPagination(parsePagination(res.data));
    } catch (e) {
      msg.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const res = await userApi.list({ page: 1, pageSize: 100 });
      setCreatorOptions(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStats();
    fetchCreators();
  }, []);

  useEffect(() => {
    fetchList(pagination.current, pagination.pageSize);
  }, [filters]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    fetchList(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({});
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize);
  };

  const handleCreate = (type) => {
    setCreateType(type);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setModalLoading(true);
      await batchOpApi.create({ ...values, opType: createType });
      msg.success('创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchList(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (e) {
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancel = (record) => {
    modal.confirm({
      title: '确认取消',
      content: `确定要取消批量操作「${record.title}」吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          msg.success('已取消');
          fetchList(pagination.current, pagination.pageSize);
          fetchStats();
        } catch (e) {}
      },
    });
  };

  const handleConfirm = (record) => {
    navigate(`/batch-ops/${record.id}/confirm`);
  };

  const openFailDrawer = async (record) => {
    setCurrentBatch(record);
    setFailItems(record.failedItems || []);
    setFailDrawerOpen(true);
  };

  const menuItems = useMemo(
    () =>
      Object.entries(BATCH_OP_TYPES).map(([key, val]) => ({
        key,
        label: val.label,
        icon: TYPE_ICONS[key] || <FileTextOutlined />,
        onClick: () => handleCreate(key),
      })),
    []
  );

  const columns = useMemo(
    () => [
      {
        title: '编号',
        dataIndex: 'batchNo',
        key: 'batchNo',
        width: 140,
        render: (v, r) => (
          <a onClick={() => navigate(`/batch-ops/${r.id}`)} style={{ fontWeight: 500 }}>
            {v}
          </a>
        ),
      },
      {
        title: '类型',
        dataIndex: 'opType',
        key: 'opType',
        width: 130,
        render: (v) => {
          const cfg = BATCH_OP_TYPES[v];
          return (
            <Tag color={cfg?.color || 'default'} icon={TYPE_ICONS[v]}>
              {cfg?.label || v}
            </Tag>
          );
        },
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        width: 200,
        ellipsis: true,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (v) => <StatusTag statusKey="BATCH_OP_STATUS" value={v} />,
      },
      {
        title: '总数',
        dataIndex: 'totalCount',
        key: 'totalCount',
        width: 90,
        align: 'right',
        render: (v) => fmtNum(v),
      },
      {
        title: '成功',
        dataIndex: 'successCount',
        key: 'successCount',
        width: 90,
        align: 'right',
        render: (v) => <Text type="success">{fmtNum(v)}</Text>,
      },
      {
        title: '失败',
        dataIndex: 'failedCount',
        key: 'failedCount',
        width: 90,
        align: 'right',
        render: (v, r) =>
          v > 0 ? (
            <a onClick={() => openFailDrawer(r)}>
              <Text type="danger">{fmtNum(v)}</Text>
            </a>
          ) : (
            <Text type="secondary">{fmtNum(v)}</Text>
          ),
      },
      {
        title: '进度',
        dataIndex: 'progress',
        key: 'progress',
        width: 150,
        render: (v, r) => {
          if (r.status === 'PENDING_CONFIRM' || r.status === 'FAILED') {
            return <Text type="secondary">-</Text>;
          }
          const percent = r.totalCount
            ? Math.round(((r.successCount || 0) + (r.failedCount || 0)) / r.totalCount * 100)
            : 0;
          return (
            <Progress
              percent={percent}
              size="small"
              status={r.status === 'PROCESSING' ? 'active' : r.status === 'FAILED' ? 'exception' : 'success'}
            />
          );
        },
      },
      {
        title: '创建人',
        dataIndex: 'creatorName',
        key: 'creatorName',
        width: 100,
        render: (v) => v || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: (v) => fmtDateTime(v),
      },
      {
        title: '确认时间',
        dataIndex: 'confirmedAt',
        key: 'confirmedAt',
        width: 150,
        render: (v) => v ? fmtDateTime(v) : '-',
      },
      {
        title: '完成时间',
        dataIndex: 'completedAt',
        key: 'completedAt',
        width: 150,
        render: (v) => v ? fmtDateTime(v) : '-',
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        fixed: 'right',
        render: (_, r) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => navigate(`/batch-ops/${r.id}`)}>
              详情
            </Button>
            {r.status === 'PENDING_CONFIRM' && (
              <Button type="primary" size="small" onClick={() => handleConfirm(r)}>
                确认
              </Button>
            )}
            {r.status === 'PENDING_CONFIRM' && (
              <Button type="link" size="small" danger onClick={() => handleCancel(r)}>
                取消
              </Button>
            )}
            {(r.failedCount || 0) > 0 && (
              <Button type="link" size="small" danger onClick={() => openFailDrawer(r)}>
                查看失败项
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="app-page">
      <Card
        title={<Title level={4} style={{ margin: 0 }}>批量操作</Title>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchList(); }}>
              刷新
            </Button>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight">
              <Button type="primary" icon={<PlusOutlined />}>
                新建批量操作 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="进行中"
                value={stats.processing}
                prefix={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="待确认"
                value={stats.pending}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="本月成功"
                value={stats.success}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="本月失败"
                value={stats.failed}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Card size="small" style={{ marginBottom: 16 }} variant="borderless">
          <Row gutter={[16, 12]}>
            <Col span={6}>
              <Input
                placeholder="关键词搜索"
                prefix={<SearchOutlined />}
                allowClear
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="操作类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.opType}
                onChange={(v) => setFilters({ ...filters, opType: v })}
              >
                {Object.entries(BATCH_OP_TYPES).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                allowClear
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(v) => setFilters({ ...filters, status: v })}
              >
                {Object.entries(BATCH_OP_STATUS).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="创建人"
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: '100%' }}
                value={filters.creatorId}
                onChange={(v) => setFilters({ ...filters, creatorId: v })}
              >
                {creatorOptions.map((u) => (
                  <Option key={u.id} value={u.id}>{u.name || u.username}</Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              />
            </Col>
            <Col span={2} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>重置</Button>
                <Button type="primary" icon={<FilterOutlined />} onClick={handleSearch}>
                  筛选
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
          onChange={handleTableChange}
          scroll={{ x: 1600 }}
          size="middle"
        />
      </Card>

      <Modal
        title={`新建${BATCH_OP_TYPES[createType]?.label || '批量操作'}`}
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        onOk={handleCreateSubmit}
        confirmLoading={modalLoading}
        okText="创建"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="title"
            label="操作标题"
            rules={[{ required: true, message: '请输入操作标题' }]}
          >
            <Input placeholder="请输入操作标题" maxLength={100} showCount />
          </Form.Item>
          <Form.Item name="description" label="操作说明">
            <Input.TextArea rows={3} placeholder="请输入操作说明（选填）" maxLength={500} showCount />
          </Form.Item>
          <Alert
            message="注意"
            description={
              <div>
                <p>1. 批量操作一经确认执行，将立即生效，请谨慎操作</p>
                <p>2. 创建后需要确认才能执行，您可以在确认前预览影响范围</p>
                <p>3. 执行过程中可能会出现部分失败的情况，请关注执行结果</p>
              </div>
            }
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <WarningTwoTone twoToneColor="#ff4d4f" />
            <span>失败项清单</span>
            <Tag color="red">{failItems.length} 条</Tag>
          </div>
        }
        placement="right"
        width={560}
        onClose={() => setFailDrawerOpen(false)}
        open={failDrawerOpen}
        extra={
          <Space>
            <Button size="small" onClick={() => navigate('/exceptions')}>
              查看异常
            </Button>
          </Space>
        }
      >
        {failItems.length > 0 ? (
          <List
            dataSource={failItems}
            renderItem={(item, idx) => (
              <List.Item key={item.id || idx}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.itemName || item.name || `第${idx + 1}项`}</Text>
                      {item.itemNo && <Tag>{item.itemNo}</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ color: '#ff4d4f', marginBottom: 4 }}>
                        失败原因：{item.failReason || '未知原因'}
                      </div>
                      <Space size="small">
                        <Button size="small" type="link">
                          生成异常
                        </Button>
                        <Button size="small" type="link">
                          重试
                        </Button>
                        <Button size="small" type="link">
                          跳过
                        </Button>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无失败项" />
        )}

        <Divider />

        <Alert
          message="失败项自动生成异常"
          description="系统已自动为所有失败项生成异常工单，您可以前往异常管理页面查看并处理。"
          type="info"
          showIcon
          action={
            <Button size="small" type="primary" onClick={() => navigate('/exceptions')}>
              去处理
            </Button>
          }
        />
      </Drawer>
    </div>
  );
}
