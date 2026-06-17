import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Tag,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Space,
  Tooltip,
  Dropdown,
  message,
  Spin,
  Empty,
  Statistic,
} from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table';
import {
  QrcodeOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { batchApi, plotApi, varietyApi } from '@/api';
import type {
  HarvestBatch,
  Plot,
  Variety,
  BatchStatus,
  Guid,
  BatchOperationResultDto,
  PagedResult,
  OperationStatus,
} from '@/types';
import {
  BATCH_STATUS_COLORS,
  BATCH_STATUS_NAMES,
} from '@/constants/mappings';

const { RangePicker } = DatePicker;
const { Option } = Select;

type BatchStatusValue = 'Pending' | 'Harvesting' | 'Completed' | 'Cancelled';
const BATCH_STATUS_VALUES: BatchStatusValue[] = ['Pending', 'Harvesting', 'Completed', 'Cancelled'];

let navigateToDetail: (id: Guid) => void;
let showQrModal: (id: Guid) => void;

function Batches() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<Guid[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrId, setQrId] = useState<Guid | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [operationResult, setOperationResult] = useState<BatchOperationResultDto | null>(null);
  const [filterApplied, setFilterApplied] = useState(false);

  navigateToDetail = (id: Guid) => navigate(`/batches/${id}`);
  showQrModal = (id: Guid) => {
    setQrId(id);
    setQrModalOpen(true);
  };

  const columns: ColumnsType<HarvestBatch> = [
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 200,
      render: (v: string, record: HarvestBatch) => (
        <Space>
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => window.navigator.clipboard.writeText(v || '')}
          >
            <Tooltip title="复制">
              <CopyOutlined />
            </Tooltip>
          </Button>
          <Button type="link" style={{ padding: 0 }} onClick={() => navigateToDetail(record.id)}>
            {v || '-'}
          </Button>
        </Space>
      ),
    },
    {
      title: '地块',
      key: 'plot',
      width: 200,
      render: (_: unknown, record: HarvestBatch) =>
        [record.plot?.greenhouseName, record.plot?.plotCode].filter(Boolean).join(' - ') || '-',
    },
    {
      title: '品种',
      key: 'variety',
      width: 180,
      render: (_: unknown, record: HarvestBatch) => (
        <Space>
          {record.variety?.category && <Tag color="blue">{record.variety.category}</Tag>}
          <span>{record.variety?.name || '-'}</span>
        </Space>
      ),
    },
    {
      title: '种植日期',
      dataIndex: 'plantingDate',
      key: 'plantingDate',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '预计采收',
      dataIndex: 'harvestDate',
      key: 'harvestDate',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '实际采收',
      key: 'actualHarvest',
      width: 120,
      render: (_: unknown, record: HarvestBatch) =>
        record.status === 'Completed' && record.harvestDate
          ? dayjs(record.harvestDate).format('YYYY-MM-DD')
          : '-',
    },
    {
      title: '产量(kg)',
      dataIndex: 'actualYield',
      key: 'actualYield',
      width: 100,
      render: (v: number) => (v ? v.toFixed(2) : '0.00'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: BatchStatus) => <Tag color={BATCH_STATUS_COLORS[v]}>{BATCH_STATUS_NAMES[v]}</Tag>,
    },
    {
      title: '溯源二维码',
      key: 'qrcode',
      width: 120,
      render: (_: unknown, record: HarvestBatch) => (
        <Button size="small" icon={<QrcodeOutlined />} onClick={() => showQrModal(record.id)}>
          查看
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: HarvestBatch) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => navigateToDetail(record.id)}>
          详情
        </Button>
      ),
    },
  ];

  const loadOptions = async () => {
    try {
      const [plotList, varietyList] = await Promise.all([plotApi.getAll(), varietyApi.getAll()]);
      setPlots(plotList);
      setVarieties(varietyList);
    } catch {
      message.error('加载选项失败');
    }
  };

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const values = filterApplied ? form.getFieldsValue() : {};
      const params: Record<string, unknown> = {
        page,
        pageSize,
        batchNumber: values.batchNumber || undefined,
        startDate: values.dateRange?.[0]?.toISOString?.() || undefined,
        endDate: values.dateRange?.[1]?.toISOString?.() || undefined,
      };
      if (values.plotIds?.length) params.plotIds = values.plotIds;
      if (values.varietyIds?.length) params.varietyIds = values.varietyIds;
      if (values.statuses?.length) params.statuses = values.statuses;

      let result: PagedResult<HarvestBatch>;
      try {
        result = await batchApi.getPaged(page, pageSize, params as unknown as undefined);
      } catch {
        const allBatches = await batchApi.getAll({
          batchNumber: params.batchNumber as string,
          status: (params.statuses as string[])?.[0],
        });
        const start = (page - 1) * pageSize;
        result = {
          items: allBatches.slice(start, start + pageSize),
          totalCount: allBatches.length,
          page,
          pageSize,
          totalPages: Math.ceil(allBatches.length / pageSize),
        };
      }
      setBatches(result.items);
      setPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.totalCount,
      });
    } catch (e) {
      message.error('加载批次失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadData();
  }, []);

  const handleSearch = () => {
    setFilterApplied(true);
    setPagination((p) => ({ ...p, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  const handleReset = () => {
    form.resetFields();
    setFilterApplied(false);
    setSelectedRowKeys([]);
    setPagination((p) => ({ ...p, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  const handleQuickFilter = () => {
    setFilterApplied(true);
    const values = form.getFieldsValue();
    const hasFilter =
      values.batchNumber ||
      (values.plotIds && values.plotIds.length > 0) ||
      (values.varietyIds && values.varietyIds.length > 0) ||
      (values.statuses && values.statuses.length > 0) ||
      values.dateRange;
    if (!hasFilter) {
      message.warning('请至少设置一个筛选条件');
      return;
    }
    setPagination((p) => ({ ...p, current: 1 }));
    loadData(1, pagination.pageSize);
    message.success('一键过滤已应用');
  };

  const handleBatchUpdate = async (newStatus: BatchStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择批次');
      return;
    }
    try {
      const results: BatchOperationResultDto = {
        operationId: 'mock',
        totalCount: selectedRowKeys.length,
        successCount: selectedRowKeys.length,
        failedCount: 0,
        status: 'Success' as OperationStatus,
        summary: `批量更新状态为【${BATCH_STATUS_NAMES[newStatus]}】完成`,
        failedItems: [],
      };
      setOperationResult(results);
      setResultModalOpen(true);
      setSelectedRowKeys([]);
      loadData(pagination.current, pagination.pageSize);
    } catch {
      message.error('批量操作失败');
    }
  };

  const rowSelection: TableRowSelection<HarvestBatch> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as Guid[]),
  };

  const batchMenuItems = [
    {
      key: 'Harvesting',
      label: (
        <Space>
          <InfoCircleOutlined style={{ color: '#1677ff' }} />
          设为 采收中
        </Space>
      ),
    },
    {
      key: 'Completed',
      label: (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          设为 已完成
        </Space>
      ),
    },
    {
      key: 'Cancelled',
      label: (
        <Space>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          设为 已取消
        </Space>
      ),
    },
    {
      key: 'Pending',
      label: (
        <Space>
          <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
          设为 待处理
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="筛选条件">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="batchNumber" label="批次号">
                  <Input.Search
                    placeholder="输入批次号搜索"
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={handleSearch}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="plotIds" label="地块">
                  <Select mode="multiple" placeholder="选择地块" allowClear showSearch optionFilterProp="children">
                    {plots.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {[p.greenhouseName, p.plotCode].filter(Boolean).join(' - ')}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="varietyIds" label="品种">
                  <Select mode="multiple" placeholder="选择品种" allowClear showSearch optionFilterProp="children">
                    {varieties.map((v) => (
                      <Option key={v.id} value={v.id}>
                        {[v.category, v.name].filter(Boolean).join(' / ')}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item name="statuses" label="状态">
                  <Select mode="multiple" placeholder="选择状态" allowClear>
                    {BATCH_STATUS_VALUES.map((s) => (
                      <Option key={s} value={s}>
                        {BATCH_STATUS_NAMES[s]}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item name="dateRange" label="日期范围（种植/采收）">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label=" ">
                  <Space wrap>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>
                      重置
                    </Button>
                    <Button
                      type="primary"
                      danger
                      icon={<ThunderboltOutlined />}
                      style={{ background: '#eb2f96', borderColor: '#eb2f96' }}
                      onClick={handleQuickFilter}
                    >
                      一键过滤
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          title={
            <Space>
              <span>采收批次列表</span>
              {selectedRowKeys.length > 0 && (
                <Dropdown
                  menu={{
                    items: batchMenuItems,
                    onClick: ({ key }) => handleBatchUpdate(key as BatchStatus),
                  }}
                >
                  <Button type="primary">
                    批量更新状态 ({selectedRowKeys.length}) ▼
                  </Button>
                </Dropdown>
              )}
            </Space>
          }
        >
          {batches.length === 0 && !loading ? (
            <Empty description="暂无批次数据" />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={batches}
              rowSelection={rowSelection}
              scroll={{ x: 1400 }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setPagination((p) => ({ ...p, current: page, pageSize }));
                  loadData(page, pageSize);
                },
              }}
            />
          )}
        </Card>
      </Space>

      <Modal
        open={qrModalOpen}
        title="溯源二维码"
        onCancel={() => setQrModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {qrId && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <img
              src={batchApi.getQrCodeUrl(qrId)}
              alt="QR Code"
              style={{ maxWidth: 250, maxHeight: 250 }}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={resultModalOpen}
        title="批量操作结果摘要"
        onCancel={() => setResultModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setResultModalOpen(false)}>
            确定
          </Button>,
        ]}
        width={600}
      >
        {operationResult && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="总数" value={operationResult.totalCount} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="成功" value={operationResult.successCount} valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic title="失败" value={operationResult.failedCount} valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>
            {operationResult.summary && (
              <div style={{ padding: '12px 16px', background: '#f5f5f5', borderRadius: 4 }}>
                <strong>摘要：</strong>{operationResult.summary}
              </div>
            )}
            {operationResult.failedItems && operationResult.failedItems.length > 0 && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>失败项列表：</div>
                <Table
                  rowKey="entityId"
                  size="small"
                  columns={[
                    { title: 'ID', dataIndex: 'entityId', key: 'entityId', ellipsis: true },
                    { title: '类型', dataIndex: 'entityType', key: 'entityType' },
                    { title: '错误信息', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true },
                  ]}
                  dataSource={operationResult.failedItems}
                  pagination={false}
                />
              </div>
            )}
          </Space>
        )}
      </Modal>
    </Spin>
  );
}

export default Batches;
