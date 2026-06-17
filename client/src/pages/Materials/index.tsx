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
  ColumnsType,
  TableRowSelection,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { materialApi, batchApi } from '@/api';
import {
  ApplicationMaterial,
  MaterialStatus,
  MaterialStatsDto,
  HarvestBatch,
  Guid,
  BatchOperationResultDto,
  BatchOperationFailedItem,
} from '@/types';
import {
  MATERIAL_STATUS_COLORS,
  MATERIAL_STATUS_NAMES,
} from '@/constants/mappings';

const { Option } = Select;
const { TextArea } = Input;

const columns: ColumnsType<ApplicationMaterial> = [
  {
    title: '批次号',
    key: 'batchNumber',
    width: 160,
    render: (_, record) => record.harvestBatch?.batchNumber || '-',
  },
  {
    title: '材料类型',
    dataIndex: 'materialType',
    key: 'materialType',
    width: 120,
  },
  {
    title: '材料名称',
    dataIndex: 'materialName',
    key: 'materialName',
    width: 140,
  },
  {
    title: '施用日期',
    dataIndex: 'applicationDate',
    key: 'applicationDate',
    width: 120,
    render: (v) => dayjs(v).format('YYYY-MM-DD'),
  },
  {
    title: '数量',
    key: 'qty',
    width: 100,
    render: (_, r) => `${r.quantity}${r.unit || ''}`,
  },
  {
    title: '施用人',
    dataIndex: 'applicator',
    key: 'applicator',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (v: MaterialStatus) => <Tag color={MATERIAL_STATUS_COLORS[v]}>{MATERIAL_STATUS_NAMES[v]}</Tag>,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    ellipsis: true,
    width: 150,
  },
  {
    title: '处理结果',
    dataIndex: 'processResult',
    key: 'processResult',
    ellipsis: true,
    width: 150,
  },
  {
    title: '提交时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
  },
  {
    title: '处理时间',
    key: 'processTime',
    width: 160,
    render: () => '-',
  },
];

const MATERIAL_TYPES = ['农药', '化肥', '有机肥', '生物菌剂', '生长调节剂', '其他'];

function Materials() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [materials, setMaterials] = useState<ApplicationMaterial[]>([]);
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [stats, setStats] = useState<MaterialStatsDto | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Guid[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ApplicationMaterial | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [operationResult, setOperationResult] = useState<BatchOperationResultDto | null>(null);
  const [batchRemark, setBatchRemark] = useState('');
  const [batchStatusModalOpen, setBatchStatusModalOpen] = useState(false);
  const [pendingBatchStatus, setPendingBatchStatus] = useState<MaterialStatus | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const [data, statsData, batchData] = await Promise.all([
        materialApi.getAll({
          status: values.status || undefined,
          materialType: values.materialType || undefined,
        }),
        materialApi.getStats(),
        batchApi.getAll(),
      ]);
      const filterBatch = values.batchNumber?.toLowerCase();
      const filtered = filterBatch
        ? data.filter((m) => m.harvestBatch?.batchNumber?.toLowerCase().includes(filterBatch))
        : data;
      setMaterials(filtered);
      setStats(statsData);
      setBatches(batchData);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => loadData();

  const handleReset = () => {
    form.resetFields();
    setSelectedRowKeys([]);
    loadData();
  };

  const openModal = (record?: ApplicationMaterial) => {
    setEditingRecord(record || null);
    if (record) {
      editForm.setFieldsValue({
        ...record,
        harvestBatchId: record.harvestBatchId,
        applicationDate: record.applicationDate ? dayjs(record.applicationDate) : null,
      });
    } else {
      editForm.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        applicationDate: values.applicationDate?.toISOString() || dayjs().toISOString(),
      };
      if (editingRecord) {
        await materialApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await materialApi.create(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败');
    }
  };

  const updateStatus = async (materialId: Guid, newStatus: MaterialStatus, remark?: string) => {
    try {
      await materialApi.update(materialId, { status: newStatus, processResult: remark });
      message.success('状态更新成功');
      loadData();
    } catch {
      message.error('状态更新失败');
    }
  };

  const openBatchStatusModal = (status: MaterialStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择材料');
      return;
    }
    setPendingBatchStatus(status);
    setBatchRemark('');
    setBatchStatusModalOpen(true);
  };

  const confirmBatchStatus = async () => {
    if (!pendingBatchStatus) return;
    try {
      const result = await materialApi.batchStatus(selectedRowKeys, pendingBatchStatus, batchRemark);
      setOperationResult(result);
      setResultModalOpen(true);
      setBatchStatusModalOpen(false);
      setPendingBatchStatus(null);
      setSelectedRowKeys([]);
      loadData();
    } catch {
      message.error('批量操作失败');
    }
  };

  const rowSelection: TableRowSelection<ApplicationMaterial> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as Guid[]),
  };

  const opColumns: ColumnsType<ApplicationMaterial> = [
    ...columns,
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
              编辑
            </Button>
          </Tooltip>
          {record.status !== MaterialStatus.Approved && (
            <Tooltip title="通过">
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => updateStatus(record.id, MaterialStatus.Approved)}>
                通过
              </Button>
            </Tooltip>
          )}
          {record.status === MaterialStatus.Submitted && (
            <Tooltip title="拒绝">
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => updateStatus(record.id, MaterialStatus.Rejected)}>
                拒绝
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const batchMenuItems = [
    {
      key: MaterialStatus.Submitted,
      label: <Space><ClockCircleOutlined style={{ color: '#1677ff' }} /> 批量提交</Space>,
    },
    {
      key: MaterialStatus.Approved,
      label: <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 批量通过</Space>,
    },
    {
      key: MaterialStatus.Rejected,
      label: <Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 批量拒绝</Space>,
    },
    {
      key: MaterialStatus.Missing,
      label: <Space><ExclamationCircleOutlined style={{ color: '#fa8c16' }} /> 标为缺失</Space>,
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="筛选条件">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="materialType" label="材料类型">
                  <Select placeholder="选择类型" allowClear>
                    {MATERIAL_TYPES.map((t) => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="status" label="状态">
                  <Select placeholder="选择状态" allowClear>
                    {Object.values(MaterialStatus).map((s) => (
                      <Option key={s} value={s}>{MATERIAL_STATUS_NAMES[s]}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={8}>
                <Form.Item name="batchNumber" label="批次号">
                  <Input.Search
                    placeholder="输入批次号"
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={handleSearch}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={18}>
            <Card
              title={
                <Space>
                  <span>申报材料列表</span>
                  {selectedRowKeys.length > 0 && (
                    <Dropdown
                      menu={{
                        items: batchMenuItems,
                        onClick: ({ key }) => openBatchStatusModal(key as MaterialStatus),
                      }}
                    >
                      <Button type="primary">
                        批量更新状态 ({selectedRowKeys.length}) ▼
                      </Button>
                    </Dropdown>
                  )}
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    新增
                  </Button>
                </Space>
              }
            >
              {materials.length === 0 ? (
                <Empty description="暂无材料数据" />
              ) : (
                <Table
                  rowKey="id"
                  columns={opColumns}
                  dataSource={materials}
                  rowSelection={rowSelection}
                  scroll={{ x: 1600 }}
                  pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card title="材料状态统计">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small">
                  <Statistic title="总计" value={stats?.totalCount || 0} />
                </Card>
                <Card size="small">
                  <Row align="middle" justify="space-between">
                    <Space>
                      <Tag color={MATERIAL_STATUS_COLORS.Missing} style={{ margin: 0 }}>
                        缺失
                      </Tag>
                    </Space>
                    <Statistic value={stats?.missingCount || 0} valueStyle={{ fontSize: 18 }} />
                  </Row>
                </Card>
                <Card size="small">
                  <Row align="middle" justify="space-between">
                    <Space>
                      <Tag color={MATERIAL_STATUS_COLORS.Submitted} style={{ margin: 0 }}>
                        已提交
                      </Tag>
                    </Space>
                    <Statistic value={stats?.submittedCount || 0} valueStyle={{ fontSize: 18 }} />
                  </Row>
                </Card>
                <Card size="small">
                  <Row align="middle" justify="space-between">
                    <Space>
                      <Tag color={MATERIAL_STATUS_COLORS.Approved} style={{ margin: 0 }}>
                        已通过
                      </Tag>
                    </Space>
                    <Statistic value={stats?.approvedCount || 0} valueStyle={{ fontSize: 18 }} />
                  </Row>
                </Card>
                <Card size="small">
                  <Row align="middle" justify="space-between">
                    <Space>
                      <Tag color={MATERIAL_STATUS_COLORS.Rejected} style={{ margin: 0 }}>
                        已拒绝
                      </Tag>
                    </Space>
                    <Statistic value={stats?.rejectedCount || 0} valueStyle={{ fontSize: 18 }} />
                  </Row>
                </Card>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑材料' : '新增材料'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose={true}
        width={600}
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item name="harvestBatchId" label="关联批次" rules={[{ required: true, message: '请选择批次' }]}>
                <Select showSearch optionFilterProp="children" placeholder="选择批次">
                  {batches.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.batchNumber} - {[b.plot?.greenhouseName, b.plot?.plotCode].filter(Boolean).join('-')}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="materialType" label="材料类型" rules={[{ required: true }]}>
                <Select>
                  {MATERIAL_TYPES.map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="materialName" label="材料名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="kg/L/瓶" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="applicationDate" label="施用日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="applicator" label="施用人">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {Object.values(MaterialStatus).map((s) => (
                    <Option key={s} value={s}>{MATERIAL_STATUS_NAMES[s]}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            {editingRecord && (
              <Col xs={24}>
                <Form.Item name="processResult" label="处理结果">
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>

      <Modal
        open={batchStatusModalOpen}
        title={`批量更新状态为【${pendingBatchStatus ? MATERIAL_STATUS_NAMES[pendingBatchStatus] : ''}】`}
        onCancel={() => { setBatchStatusModalOpen(false); setPendingBatchStatus(null); }}
        onOk={confirmBatchStatus}
        okText="确认批量更新"
      >
        <div style={{ marginBottom: 12 }}>
          已选择 <strong>{selectedRowKeys.length}</strong> 项材料
        </div>
        <Form.Item label="处理结果/备注">
          <TextArea
            rows={3}
            value={batchRemark}
            onChange={(e) => setBatchRemark(e.target.value)}
            placeholder="输入批量处理备注信息（可选）"
          />
        </Form.Item>
      </Modal>

      <Modal
        open={resultModalOpen}
        title="批量操作结果摘要"
        onCancel={() => setResultModalOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setResultModalOpen(false)}>确定</Button>]}
        width={600}
      >
        {operationResult && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small"><Statistic title="总数" value={operationResult.totalCount} /></Card>
              </Col>
              <Col span={8}>
                <Card size="small"><Statistic title="成功" value={operationResult.successCount} valueStyle={{ color: '#52c41a' }} /></Card>
              </Col>
              <Col span={8}>
                <Card size="small"><Statistic title="失败" value={operationResult.failedCount} valueStyle={{ color: '#ff4d4f' }} /></Card>
              </Col>
            </Row>
            {operationResult.summary && (
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <strong>摘要：</strong>{operationResult.summary}
              </div>
            )}
            {operationResult.failedItems && operationResult.failedItems.length > 0 && (
              <div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>失败项列表：</div>
                <Table
                  rowKey="entityId"
                  size="small"
                  columns={[
                    { title: 'ID', dataIndex: 'entityId', key: 'entityId', ellipsis: true },
                    { title: '类型', dataIndex: 'entityType', key: 'entityType' },
                    { title: '错误信息', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true },
                  ]}
                  dataSource={operationResult.failedItems as BatchOperationFailedItem[]}
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

export default Materials;
